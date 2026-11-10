#!/usr/bin/env python3
"""
SHA-256 (+ simple perceptual hash) for public/covers assets.

Exact binary duplicates are reported; similar phash values are review candidates only.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import sys
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COVERS_DIR = ROOT / "public" / "covers"
DB = ROOT / "data" / "dedupe_86k.sqlite"
REPORT_DIR = ROOT / "data" / "reports"
CHUNK = 1024 * 1024

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def sha256_file(path: Path) -> tuple[str | None, int | None, str | None]:
    try:
        h = hashlib.sha256()
        size = 0
        with path.open("rb") as f:
            while True:
                chunk = f.read(CHUNK)
                if not chunk:
                    break
                h.update(chunk)
                size += len(chunk)
        return h.hexdigest(), size, None
    except Exception as e:
        return None, None, str(e)


def average_hash_hex(path: Path, size: int = 8) -> str | None:
    """Tiny dependency-free aHash using Pillow when available; else None."""
    try:
        from PIL import Image  # type: ignore
    except Exception:
        return None
    try:
        with Image.open(path) as im:
            im = im.convert("L").resize((size, size), Image.Resampling.LANCZOS)
            pixels = list(im.getdata())
        avg = sum(pixels) / len(pixels)
        bits = 0
        for i, px in enumerate(pixels):
            if px >= avg:
                bits |= 1 << i
        return f"{bits:016x}"
    except Exception:
        return None


def main() -> None:
    from dedupe_init_db import main as init_db

    if not DB.exists():
        init_db()

    con = sqlite3.connect(str(DB), timeout=60)
    con.execute("PRAGMA journal_mode=WAL")

    files = []
    if COVERS_DIR.exists():
        for p in COVERS_DIR.rglob("*"):
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}:
                files.append(p)

    hashed = 0
    errors = 0
    t0 = time.time()
    for i, path in enumerate(files, 1):
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        digest, size, err = sha256_file(path)
        phash = average_hash_hex(path) if digest else None
        if err or not digest:
            con.execute(
                """
                INSERT OR REPLACE INTO cover_assets(path, size_bytes, sha256, phash, hashed_at, error)
                VALUES(?,?,NULL,NULL,?,?)
                """,
                (rel, None, time.time(), err or "hash_failed"),
            )
            errors += 1
        else:
            con.execute(
                """
                INSERT OR REPLACE INTO cover_assets(path, size_bytes, sha256, phash, hashed_at, error)
                VALUES(?,?,?,?,?,NULL)
                """,
                (rel, size, digest, phash, time.time()),
            )
            hashed += 1
        if i % 500 == 0:
            con.commit()
            print(f"[{i}/{len(files)}] hashed={hashed} errors={errors}", flush=True)

    con.commit()

    by_sha: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for path, sha, size in con.execute(
        "SELECT path, sha256, coalesce(size_bytes,0) FROM cover_assets WHERE sha256 IS NOT NULL"
    ):
        by_sha[sha].append((path, int(size or 0)))

    exact_groups = {k: v for k, v in by_sha.items() if len(v) > 1}
    recoverable = 0
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    import csv

    with (REPORT_DIR / "duplicate_covers.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "sha256",
                "canonical_path",
                "duplicate_path",
                "size_bytes",
                "confidence",
                "reason",
            ]
        )
        for sha, members in exact_groups.items():
            members_sorted = sorted(members, key=lambda x: x[0])
            canon_path, canon_size = members_sorted[0]
            for dup_path, dup_size in members_sorted[1:]:
                recoverable += dup_size
                w.writerow([sha, canon_path, dup_path, dup_size, "HIGH", "exact_cover_sha256"])

    # Similar phash candidates (LOW) — hamming distance <= 5 on 64-bit aHash
    phash_rows = [
        (p, h)
        for p, h in con.execute("SELECT path, phash FROM cover_assets WHERE phash IS NOT NULL")
        if h and len(h) == 16
    ]
    similar = []
    # Bucket by first 4 hex chars to avoid O(n^2) full scan on huge sets
    buckets: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for path, hx in phash_rows:
        buckets[hx[:4]].append((path, int(hx, 16)))

    for bucket in buckets.values():
        for i in range(len(bucket)):
            for j in range(i + 1, len(bucket)):
                a_path, a_bits = bucket[i]
                b_path, b_bits = bucket[j]
                dist = (a_bits ^ b_bits).bit_count()
                if 0 < dist <= 5:
                    similar.append((a_path, b_path, dist))

    with (REPORT_DIR / "suspected_duplicate_covers.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["path_a", "path_b", "hamming_distance", "confidence", "reason"])
        for a, b, dist in similar[:50000]:
            w.writerow([a, b, dist, "LOW", "similar_cover_phash"])

    summary = {
        "cover_files": len(files),
        "hashed": hashed,
        "errors": errors,
        "exact_duplicate_cover_groups": len(exact_groups),
        "exact_duplicate_cover_files": sum(len(v) - 1 for v in exact_groups.values()),
        "similar_cover_pairs": len(similar),
        "estimated_recoverable_bytes": recoverable,
        "elapsed_sec": round(time.time() - t0, 1),
    }
    (REPORT_DIR / "dedupe_cover_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)
    con.close()


if __name__ == "__main__":
    main()
