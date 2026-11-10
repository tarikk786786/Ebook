#!/usr/bin/env python3
"""Export covers_86k.sqlite → data/catalog/cover_url_index_86k.json (atomic)."""
from __future__ import annotations

import json
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "data" / "covers_86k.sqlite"
EXPORT = ROOT / "data" / "catalog" / "cover_url_index_86k.json"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def main() -> None:
    conn = sqlite3.connect(str(DB), timeout=60)
    cols = {r[1] for r in conn.execute("pragma table_info(covers)")}
    conf_sel = "confidence" if "confidence" in cols else "NULL as confidence"
    rows = conn.execute(
        f"""
        SELECT catalog_num, slug, title, author, category, source, cover_url,
               ol_cover_id, local_path, {conf_sel}
        FROM covers
        WHERE status='found' AND cover_url IS NOT NULL AND cover_url != ''
        """
    ).fetchall()
    mapping = {}
    for catalog_num, slug, title, author, category, source, cover_url, ol_cover_id, local_path, confidence in rows:
        entry = {
            "catalogNum": catalog_num,
            "slug": slug,
            "title": title,
            "author": author,
            "category": category,
            "coverUrl": cover_url,
            "olCoverId": ol_cover_id,
            "coverSource": source,
            "localPath": local_path,
            "coverVerified": (confidence or "") == "HIGH",
            "coverConfidence": confidence,
            "coverImage": f"/covers/{catalog_num}.jpg" if local_path else cover_url,
        }
        mapping[f"ref:{catalog_num}"] = entry
        mapping[str(catalog_num)] = entry
        if slug:
            mapping[slug] = entry
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"map": mapping, "count": len(rows)}, separators=(",", ":"), ensure_ascii=False)
    tmp = EXPORT.with_suffix(".json.tmp")
    tmp.write_text(payload, encoding="utf-8")
    for attempt in range(8):
        try:
            tmp.replace(EXPORT)
            break
        except OSError as e:
            print(f"replace attempt {attempt+1} failed: {e}", flush=True)
            time.sleep(0.5 * (attempt + 1))
    else:
        print(f"WARN left temp at {tmp}", flush=True)
    totals = dict(conn.execute("SELECT status, COUNT(1) FROM covers GROUP BY status"))
    sources = list(
        conn.execute(
            "SELECT source, COUNT(1) FROM covers WHERE status='found' GROUP BY source ORDER BY 2 DESC"
        )
    )
    print(json.dumps({"exported": len(rows), "totals": totals, "sources": sources}, indent=2), flush=True)
    conn.close()


if __name__ == "__main__":
    main()
