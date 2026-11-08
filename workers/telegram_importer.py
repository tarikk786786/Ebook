"""
AnonTrove — Autonomous Telegram Archive Importer & Processing Worker
Crawls authorized Telegram channels, validates ebooks, extracts covers with PyMuPDF,
deduplicates via SHA-256, tracks state in SQLite, and uploads directly to Backblaze B2 / Local Vault.
"""

import os
import sys
import re
import json
import sqlite3
import hashlib
import asyncio
import argparse
from pathlib import Path
from datetime import datetime

# Optional PyMuPDF for high-res cover rendering
try:
    import fitz
except ImportError:
    fitz = None

# Optional Telethon
try:
    from telethon import TelegramClient
    from telethon.tl.types import InputMessagesFilterDocument, DocumentAttributeFilename
    from telethon.errors import FloodWaitError
except ImportError:
    TelegramClient = None

# Optional Boto3 for S3/B2 direct uploads
try:
    import boto3
    from botocore.config import Config as BotoConfig
except ImportError:
    boto3 = None

# Resolve workspace paths
WORKER_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = WORKER_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
PUBLIC_COVERS = PROJECT_ROOT / "public" / "covers"
PRIVATE_STORAGE = PROJECT_ROOT / "private_storage"
DB_PATH = DATA_DIR / "import_state.db"
REGISTRY_FILE = DATA_DIR / "books_registry.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_COVERS.mkdir(parents=True, exist_ok=True)
PRIVATE_STORAGE.mkdir(parents=True, exist_ok=True)

# Whitelisted Channels / Archive Sources (From appinfo11.txt)
CONFIGURED_SOURCES = [
    {"id": -1003085497339, "name": "DollarPremium Answer 2"},
    {"id": -1002420485294, "name": "DollarPremium File Answer 1"},
    {"id": -1002171451661, "name": "International Premium Answer"},
    {"id": -1002398249208, "name": "Zebra Learn Book & Course"},
    {"id": -1002106541973, "name": "DollarPremium Answar"},
]

SUPPORTED_EXTENSIONS = {
    ".pdf", ".epub", ".mobi", ".azw", ".azw3", ".cbz", ".docx"
}

def init_sqlite_db():
    """Initializes local SQLite database for resume checkpoints & deduplication."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS imported_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sha256 TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        filesize INTEGER NOT NULL,
        format TEXT NOT NULL,
        channel_id INTEGER,
        message_id INTEGER,
        cover_path TEXT,
        storage_provider TEXT DEFAULT 'local',
        storage_key TEXT,
        page_count INTEGER,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scan_checkpoints (
        channel_id INTEGER PRIMARY KEY,
        channel_name TEXT,
        last_message_id INTEGER DEFAULT 0,
        total_found INTEGER DEFAULT 0,
        total_imported INTEGER DEFAULT 0,
        last_scan_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    return conn

def get_s3_client():
    """Initializes Boto3 S3 client for Backblaze B2 if configured in env."""
    if not boto3:
        return None
    endpoint = os.getenv("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com")
    key_id = os.getenv("B2_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID")
    app_key = os.getenv("B2_APPLICATION_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY")
    if not key_id or not app_key:
        return None

    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=key_id,
        aws_secret_access_key=app_key,
        config=BotoConfig(signature_version="s3v4", s3={"addressing_style": "path"})
    )

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")[:80]

def compute_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def extract_pdf_cover(pdf_path: Path, output_image_path: Path) -> int:
    """Renders page 0 of PDF as high-res 300 DPI JPEG. Returns total page count."""
    if not fitz:
        return 0
    try:
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        if page_count > 0:
            page = doc[0]
            # 2.0 zoom factor gives crisp 150-300 DPI cover thumbnail
            matrix = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            pix.save(str(output_image_path))
        doc.close()
        return page_count
    except Exception as e:
        print(f"  [Warning] Cover extraction failed for {pdf_path.name}: {e}")
        return 0

def upload_to_b2_or_local(filepath: Path, sha256: str, ext: str, s3_client=None) -> tuple[str, str]:
    """Uploads file to Backblaze B2 or stages in local storage vault."""
    bucket = os.getenv("B2_BUCKET_NAME", "anontrove-private-vault")
    key = f"books/{ext.lstrip('.')}/{sha256}{ext}"

    if s3_client:
        try:
            print(f"  [S3] Uploading to B2 bucket {bucket} -> {key}...")
            s3_client.upload_file(
                str(filepath),
                bucket,
                key,
                ExtraArgs={"ContentType": "application/pdf" if ext == ".pdf" else "application/octet-stream"}
            )
            return "b2", key
        except Exception as e:
            print(f"  [Error] S3 upload failed, falling back to local storage: {e}")

    # Fallback to local storage vault
    local_target = PRIVATE_STORAGE / filepath.name
    if not local_target.exists():
        import shutil
        shutil.copy2(filepath, local_target)
    return "local", filepath.name

def print_report():
    """Prints ingestion metrics and database status."""
    conn = init_sqlite_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*), SUM(filesize) FROM imported_files")
    count, total_size = c.fetchone()
    total_size = total_size or 0
    gb = total_size / (1024 ** 3)

    c.execute("SELECT format, COUNT(*) FROM imported_files GROUP BY format")
    formats = c.fetchall()

    print("\n" + "=" * 55)
    print("        ANONTROVE ARCHIVE INGESTION REPORT        ")
    print("=" * 55)
    print(f"Total Unique Ebooks Stored : {count:,}")
    print(f"Total Vault Capacity Used  : {gb:.2f} GB")
    print("-" * 55)
    print("Formats Distribution:")
    for fmt, num in formats:
        print(f"  - {fmt.upper():<8} : {num:,} books")
    print("-" * 55)
    c.execute("SELECT channel_name, last_message_id, total_imported FROM scan_checkpoints")
    checkpoints = c.fetchall()
    print("Monitored Channels Checkpoints:")
    for name, last_id, imported in checkpoints:
        print(f"  - {name:<30} | Last Msg: {last_id} | Imported: {imported}")
    print("=" * 55 + "\n")
    conn.close()

async def run_scan(limit: int = 50, dry_run: bool = False):
    """Executes a scan over all configured Telegram channels."""
    if not TelegramClient:
        print("[Error] Telethon is not installed. Please run: pip install telethon")
        return

    # Telegram Credentials
    api_id = int(os.getenv("TELEGRAM_API_ID", "38662741"))
    api_hash = os.getenv("TELEGRAM_API_HASH", "87222916d5e2144b450aec70f9651a76")
    session_path = os.getenv(
        "TELEGRAM_SESSION_PATH",
        r"C:\Users\tarik\.gemini\antigravity\brain\8c67d06c-2a53-4ba4-99b5-f516cf939ed0\scratch\my_session"
    )

    conn = init_sqlite_db()
    s3_client = get_s3_client()
    print(f"[Worker] Initialized. Storage provider: {'Backblaze B2 (S3)' if s3_client else 'Local Vault'}")

    async with TelegramClient(session_path, api_id, api_hash) as client:
        print("[Worker] Connected to Telegram MTProto.")

        for source in CONFIGURED_SOURCES:
            ch_id = source["id"]
            ch_name = source["name"]
            print(f"\n[Source] Scanning '{ch_name}' ({ch_id})...")

            c = conn.cursor()
            c.execute("SELECT last_message_id FROM scan_checkpoints WHERE channel_id = ?", (ch_id,))
            row = c.fetchone()
            last_msg_id = row[0] if row else 0

            new_last_id = last_msg_id
            processed_count = 0

            try:
                entity = await client.get_entity(ch_id)
                async for message in client.iter_messages(entity, limit=limit, filter=InputMessagesFilterDocument):
                    if message.id <= last_msg_id and last_msg_id > 0:
                        continue
                    if message.id > new_last_id:
                        new_last_id = message.id

                    if not message.file or not message.file.name:
                        continue

                    filename = message.file.name
                    ext = Path(filename).suffix.lower()
                    if ext not in SUPPORTED_EXTENSIONS:
                        continue

                    filesize = message.file.size or 0
                    print(f" -> Found: {filename} ({filesize / (1024*1024):.1f} MB)")

                    if dry_run:
                        processed_count += 1
                        continue

                    # Download to temporary staging
                    temp_dir = DATA_DIR / "temp_download"
                    temp_dir.mkdir(exist_ok=True)
                    temp_file = temp_dir / filename

                    await message.download_media(file=str(temp_file))

                    # Compute SHA-256 for CAS deduplication
                    file_sha = compute_sha256(temp_file)

                    # Check duplicate in SQLite
                    c.execute("SELECT id FROM imported_files WHERE sha256 = ?", (file_sha,))
                    if c.fetchone():
                        print(f"    [Skip] Duplicate file hash {file_sha[:12]} already in vault.")
                        temp_file.unlink(missing_ok=True)
                        continue

                    # Extract cover
                    title = Path(filename).stem
                    slug = slugify(title)
                    cover_filename = f"{slug}.jpg"
                    cover_path = PUBLIC_COVERS / cover_filename
                    page_count = 0

                    if ext == ".pdf":
                        page_count = extract_pdf_cover(temp_file, cover_path)

                    # Upload to B2 / Local
                    provider, storage_key = upload_to_b2_or_local(temp_file, file_sha, ext, s3_client)

                    # Record in SQLite
                    c.execute("""
                    INSERT INTO imported_files (
                        sha256, title, slug, original_filename, filesize, format,
                        channel_id, message_id, cover_path, storage_provider, storage_key, page_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        file_sha, title, slug, filename, filesize, ext.lstrip('.'),
                        ch_id, message.id, f"/covers/{cover_filename}" if cover_path.exists() else None,
                        provider, storage_key, page_count
                    ))
                    conn.commit()

                    processed_count += 1
                    temp_file.unlink(missing_ok=True)

            except FloodWaitError as e:
                print(f"[RateLimit] Telegram FloodWaitError: sleeping {e.seconds} seconds...")
                await asyncio.sleep(e.seconds)
            except Exception as e:
                print(f"[Error] Failed scanning {ch_name}: {e}")

            # Update checkpoint
            c.execute("""
            INSERT INTO scan_checkpoints (channel_id, channel_name, last_message_id, total_imported, last_scan_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(channel_id) DO UPDATE SET
                last_message_id = max(last_message_id, excluded.last_message_id),
                total_imported = total_imported + excluded.total_imported,
                last_scan_at = CURRENT_TIMESTAMP
            """, (ch_id, ch_name, new_last_id, processed_count))
            conn.commit()

    conn.close()
    print_report()

def main():
    parser = argparse.ArgumentParser(description="AnonTrove Telegram Archive Importer Worker")
    parser.add_argument("--mode", choices=["scan", "daemon", "report"], default="report", help="Worker operation mode")
    parser.add_argument("--limit", type=int, default=20, help="Maximum messages to scan per channel")
    parser.add_argument("--dry-run", action="store_true", help="Inspect messages without downloading")
    args = parser.parse_args()

    if args.mode == "report":
        print_report()
    elif args.mode == "scan":
        asyncio.run(run_scan(limit=args.limit, dry_run=args.dry_run))
    elif args.mode == "daemon":
        print("[Worker] Daemon mode started. Polling every 15 minutes...")
        while True:
            asyncio.run(run_scan(limit=args.limit, dry_run=args.dry_run))
            asyncio.sleep(900)

if __name__ == "__main__":
    main()
