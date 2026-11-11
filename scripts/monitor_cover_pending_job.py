"""Print live cover pending job progress (run periodically)."""
from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "data" / "covers_86k.sqlite"
LOG = ROOT / "logs" / "cover_pending_all.log"
STATUS = ROOT / "data" / "cover_worker" / "status.json"


def main() -> None:
    con = sqlite3.connect(DB)
    totals = dict(con.execute("select status, count(*) from covers group by status"))
    recent = con.execute(
        """
        select catalog_num, status, source, cover_url
        from covers
        where updated_at >= ?
        order by updated_at desc
        limit 8
        """,
        (time.time() - 300,),
    ).fetchall()
    con.close()
    print("totals", totals)
    print("recent_5min", len(recent))
    for r in recent:
        print(r)
    if STATUS.exists():
        try:
            print("worker_status", json.loads(STATUS.read_text(encoding="utf-8")))
        except Exception as e:
            print("worker_status_error", e)
    if LOG.exists():
        lines = LOG.read_text(encoding="utf-8", errors="replace").splitlines()
        print("log_tail:")
        for line in lines[-12:]:
            print(line)


if __name__ == "__main__":
    main()
