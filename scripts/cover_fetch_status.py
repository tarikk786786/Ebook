import sqlite3
import time
from pathlib import Path

db = Path("data/covers_86k.sqlite")
if not db.exists():
    print("DB missing")
    raise SystemExit(1)
conn = sqlite3.connect(db)
rows = dict(conn.execute("SELECT status, COUNT(*) FROM covers GROUP BY status").fetchall())
print("totals", rows)
recent = conn.execute(
    """
    SELECT catalog_num, status, source, substr(cover_url,1,80)
    FROM covers
    WHERE updated_at > ?
    ORDER BY updated_at DESC
    LIMIT 10
    """,
    (time.time() - 300,),
).fetchall()
print("recent_5min", len(recent))
for r in recent[:10]:
    print(r)
conn.close()
