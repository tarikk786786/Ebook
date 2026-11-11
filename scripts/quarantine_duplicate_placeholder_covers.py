"""
Quarantine identical reused placeholder/synthetic cover JPEGs.

Many catalog nums share the exact same binary (same SHA-256). Those are not
real book covers — remove from public/covers, mark covers DB pending, and
record the quarantine list for recovery workers.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sqlite3
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COVERS = ROOT / "public" / "covers"
QUAR = ROOT / "data" / "quarantine" / "placeholder_covers"
DB = ROOT / "data" / "covers_86k.sqlite"
REPORT = ROOT / "data" / "reports" / "quarantined_placeholder_covers.json"

# Exact-duplicate clusters previously measured (size → dominant count).
# Any hash appearing on >= MIN_DUP files is treated as a placeholder template.
MIN_DUP = 15


def main() -> None:
    QUAR.mkdir(parents=True, exist_ok=True)
    by_hash: dict[str, list[Path]] = defaultdict(list)
    for f in COVERS.glob("*.jpg"):
        if not f.stem.isdigit():
            continue
        digest = hashlib.sha256(f.read_bytes()).hexdigest()
        by_hash[digest].append(f)

    bad_hashes = {h: paths for h, paths in by_hash.items() if len(paths) >= MIN_DUP}
    print(f"placeholder_hashes={len(bad_hashes)} files={sum(len(v) for v in bad_hashes.values())}")

    moved = []
    now = time.time()
    con = sqlite3.connect(DB) if DB.exists() else None

    for digest, paths in sorted(bad_hashes.items(), key=lambda kv: -len(kv[1])):
        # Keep one sample in quarantine root for forensics
        sample_dir = QUAR / digest[:16]
        sample_dir.mkdir(parents=True, exist_ok=True)
        if paths:
            sample = sample_dir / f"_sample_{paths[0].name}"
            if not sample.exists():
                shutil.copy2(paths[0], sample)

        for p in paths:
            dest = sample_dir / p.name
            try:
                if p.exists():
                    shutil.move(str(p), str(dest))
            except OSError as e:
                print("move_fail", p, e)
                continue
            catalog_num = int(p.stem)
            moved.append({"catalog_num": catalog_num, "sha256": digest, "from": str(p)})
            if con is not None:
                con.execute(
                    """
                    UPDATE covers
                    SET status='pending', source=NULL, cover_url=NULL, local_path=NULL,
                        error='quarantined_duplicate_placeholder', updated_at=?
                    WHERE catalog_num=?
                    """,
                    (now, catalog_num),
                )

    if con is not None:
        con.commit()
        status = dict(con.execute("select status, count(*) from covers group by status"))
        con.close()
    else:
        status = {}

    payload = {
        "quarantined": len(moved),
        "placeholder_hashes": {h: len(paths) for h, paths in bad_hashes.items()},
        "min_dup": MIN_DUP,
        "db_status_after": status,
        "items": moved[:5000],  # cap report size
        "items_truncated": len(moved) > 5000,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"quarantined": len(moved), "db_status_after": status, "report": str(REPORT)}, indent=2))


if __name__ == "__main__":
    main()
