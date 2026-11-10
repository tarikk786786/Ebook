#!/usr/bin/env python3
"""Initialize deduplication SQLite schema (safe, additive)."""
from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "data" / "dedupe_86k.sqlite"


def main() -> None:
    DB.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(DB))
    con.executescript(
        """
        PRAGMA journal_mode=WAL;

        CREATE TABLE IF NOT EXISTS file_assets (
          path TEXT PRIMARY KEY,
          size_bytes INTEGER,
          mtime REAL,
          sha256 TEXT,
          ext TEXT,
          hashed_at REAL,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_file_assets_sha ON file_assets(sha256);

        CREATE TABLE IF NOT EXISTS catalog_file_links (
          catalog_num INTEGER NOT NULL,
          path TEXT NOT NULL,
          file_name TEXT,
          title TEXT,
          author TEXT,
          slug TEXT,
          PRIMARY KEY (catalog_num, path)
        );
        CREATE INDEX IF NOT EXISTS idx_cfl_sha_join ON catalog_file_links(catalog_num);

        CREATE TABLE IF NOT EXISTS catalog_meta (
          catalog_num INTEGER PRIMARY KEY,
          title TEXT,
          author TEXT,
          subtitle TEXT,
          isbn10 TEXT,
          isbn13 TEXT,
          publisher TEXT,
          publication_year TEXT,
          edition TEXT,
          volume TEXT,
          language TEXT,
          format TEXT,
          pages INTEGER,
          cover_url TEXT,
          file_name TEXT,
          updated_at REAL
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_meta_isbn13 ON catalog_meta(isbn13);
        CREATE INDEX IF NOT EXISTS idx_catalog_meta_ta ON catalog_meta(title, author);

        CREATE TABLE IF NOT EXISTS duplicate_groups (
          group_id TEXT PRIMARY KEY,
          confidence TEXT NOT NULL,
          reason TEXT,
          canonical_catalog_num INTEGER,
          member_count INTEGER,
          total_bytes INTEGER,
          status TEXT NOT NULL DEFAULT 'open',
          auto_eligible INTEGER NOT NULL DEFAULT 0,
          estimated_recoverable_bytes INTEGER DEFAULT 0,
          created_at REAL,
          updated_at REAL
        );

        CREATE TABLE IF NOT EXISTS duplicate_members (
          group_id TEXT NOT NULL,
          catalog_num INTEGER NOT NULL,
          path TEXT,
          sha256 TEXT,
          title TEXT,
          author TEXT,
          file_name TEXT,
          edition TEXT,
          volume TEXT,
          isbn13 TEXT,
          cover_url TEXT,
          size_bytes INTEGER,
          is_canonical INTEGER DEFAULT 0,
          PRIMARY KEY (group_id, catalog_num)
        );

        CREATE TABLE IF NOT EXISTS merge_map (
          duplicate_catalog_num INTEGER PRIMARY KEY,
          canonical_catalog_num INTEGER NOT NULL,
          group_id TEXT,
          merged_at REAL,
          rolled_back_at REAL,
          backup_json TEXT
        );

        CREATE TABLE IF NOT EXISTS quarantine_files (
          path TEXT PRIMARY KEY,
          sha256 TEXT,
          moved_to TEXT,
          quarantined_at REAL,
          approved_delete_at REAL,
          deleted_at REAL,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT NOT NULL,
          payload_json TEXT,
          created_at REAL
        );

        CREATE TABLE IF NOT EXISTS cover_assets (
          path TEXT PRIMARY KEY,
          size_bytes INTEGER,
          sha256 TEXT,
          phash TEXT,
          hashed_at REAL,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_cover_sha ON cover_assets(sha256);
        CREATE INDEX IF NOT EXISTS idx_cover_phash ON cover_assets(phash);

        CREATE TABLE IF NOT EXISTS content_fingerprints (
          catalog_num INTEGER PRIMARY KEY,
          path TEXT,
          page_count INTEGER,
          text_fingerprint TEXT,
          structure_fingerprint TEXT,
          epub_identifier TEXT,
          extracted_at REAL,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_cfp_text ON content_fingerprints(text_fingerprint);
        """
    )

    # Additive migrations for older DBs
    cols = {r[1] for r in con.execute("PRAGMA table_info(duplicate_groups)")}
    if "auto_eligible" not in cols:
        con.execute("ALTER TABLE duplicate_groups ADD COLUMN auto_eligible INTEGER NOT NULL DEFAULT 0")
    if "estimated_recoverable_bytes" not in cols:
        con.execute(
            "ALTER TABLE duplicate_groups ADD COLUMN estimated_recoverable_bytes INTEGER DEFAULT 0"
        )

    mcols = {r[1] for r in con.execute("PRAGMA table_info(duplicate_members)")}
    for col, decl in (
        ("edition", "TEXT"),
        ("volume", "TEXT"),
        ("isbn13", "TEXT"),
        ("cover_url", "TEXT"),
        ("size_bytes", "INTEGER"),
    ):
        if col not in mcols:
            con.execute(f"ALTER TABLE duplicate_members ADD COLUMN {col} {decl}")

    ccols = {r[1] for r in con.execute("PRAGMA table_info(cover_assets)")}
    if "error" not in ccols:
        con.execute("ALTER TABLE cover_assets ADD COLUMN error TEXT")

    con.commit()
    con.close()
    print(f"Initialized {DB}")


if __name__ == "__main__":
    main()
