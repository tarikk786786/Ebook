#!/usr/bin/env python3
"""
Streaming SHA-256 for every accessible ebook file linked from catalog_file_map.json.

Never loads whole files into memory. Resumable via data/dedupe_86k.sqlite.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "data" / "catalog" / "catalog_file_map.json"
DB = ROOT / "data" / "dedupe_86k.sqlite"
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


def main() -> None:
    if not MAP_PATH.exists():
        print("Missing catalog_file_map.json — run build_catalog_file_map.py first")
        sys.exit(1)
    if not DB.exists():
        from dedupe_init_db import main as init

        init()

    payload = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    mapping = payload.get("map") or {}

    con = sqlite3.connect(str(DB), timeout=60)
    con.execute("PRAGMA journal_mode=WAL")

    # Unique paths + catalog links
    paths: dict[str, Path] = {}
    links = []
    for entry in mapping.values():
        catalog_num = int(entry["catalogNum"])
        for p in entry.get("localPaths") or ([] if not entry.get("localPath") else [entry["localPath"]]):
            if not p:
                continue
            paths[p] = Path(p)
            links.append(
                (
                    catalog_num,
                    p,
                    entry.get("fileName"),
                    entry.get("title"),
                    entry.get("author"),
                    entry.get("slug"),
                )
            )

    con.executemany(
        """
        INSERT OR REPLACE INTO catalog_file_links(catalog_num, path, file_name, title, author, slug)
        VALUES(?,?,?,?,?,?)
        """,
        links,
    )
    con.commit()
    print(f"unique paths={len(paths)} catalog links={len(links)}", flush=True)

    done = 0
    hashed = 0
    skipped = 0
    errors = 0
    t0 = time.time()

    for path_str, path in paths.items():
        done += 1
        row = con.execute(
            "SELECT sha256, size_bytes, mtime FROM file_assets WHERE path=?",
            (path_str,),
        ).fetchone()
        try:
            st = path.stat()
            mtime = st.st_mtime
            size = st.st_size
        except FileNotFoundError:
            con.execute(
                """
                INSERT OR REPLACE INTO file_assets(path, size_bytes, mtime, sha256, ext, hashed_at, error)
                VALUES(?,?,NULL,NULL,?,?,?)
                """,
                (path_str, None, path.suffix.lower(), time.time(), "missing"),
            )
            errors += 1
            continue

        if row and row[0] and row[1] == size and abs((row[2] or 0) - mtime) < 0.01:
            skipped += 1
            continue

        digest, hashed_size, err = sha256_file(path)
        if err or not digest:
            con.execute(
                """
                INSERT OR REPLACE INTO file_assets(path, size_bytes, mtime, sha256, ext, hashed_at, error)
                VALUES(?,?,?,?,?,?,?)
                """,
                (path_str, size, mtime, None, path.suffix.lower(), time.time(), err or "hash_failed"),
            )
            errors += 1
        else:
            con.execute(
                """
                INSERT OR REPLACE INTO file_assets(path, size_bytes, mtime, sha256, ext, hashed_at, error)
                VALUES(?,?,?,?,?,?,NULL)
                """,
                (path_str, hashed_size, mtime, digest, path.suffix.lower(), time.time()),
            )
            hashed += 1

        if done % 100 == 0:
            con.commit()
            print(
                f"[{done}/{len(paths)}] hashed={hashed} skipped={skipped} errors={errors} "
                f"elapsed={time.time()-t0:.0f}s",
                flush=True,
            )

    con.commit()
    unique_hashes = con.execute(
        "SELECT COUNT(DISTINCT sha256) FROM file_assets WHERE sha256 IS NOT NULL"
    ).fetchone()[0]
    dup_hash_groups = con.execute(
        """
        SELECT COUNT(*) FROM (
          SELECT sha256 FROM file_assets
          WHERE sha256 IS NOT NULL
          GROUP BY sha256 HAVING COUNT(*) > 1
        )
        """
    ).fetchone()[0]
    summary = {
        "unique_paths": len(paths),
        "hashed_now": hashed,
        "skipped_unchanged": skipped,
        "errors": errors,
        "unique_sha256": unique_hashes,
        "exact_duplicate_hash_groups": dup_hash_groups,
        "elapsed_sec": round(time.time() - t0, 1),
    }
    out = ROOT / "data" / "reports" / "dedupe_hash_summary.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)
    con.close()


if __name__ == "__main__":
    main()
