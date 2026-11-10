#!/usr/bin/env python3
"""
Download permitted remote cover URLs already marked found into public/covers/{id}.jpg.

Skips rows that already have a good local file. Respects pause.flag.
"""
from __future__ import annotations

import argparse
import random
import sqlite3
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from cover_worker_control import is_paused, wait_if_paused, write_status  # noqa: E402

DB = ROOT / "data" / "covers_86k.sqlite"
COVERS = ROOT / "public" / "covers"
UA = "AnonTroveCoverRecovery/1.0 (mailto:apnix7@gmail.com)"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def http_bytes(url: str, timeout: float = 10) -> bytes | None:
    req = Request(url, headers={"User-Agent": UA})
    try:
        with urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            if not data or len(data) < 2500:
                return None
            if data[:3] in (b"GIF", b"gif") and len(data) < 8000:
                return None
            return data
    except Exception:
        return None


def save_jpeg(data: bytes, dest: Path, max_w: int = 600) -> bool:
    try:
        im = Image.open(BytesIO(data)).convert("RGB")
        w, h = im.size
        if w < 40 or h < 40:
            return False
        if w > max_w:
            nh = max(1, int(h * (max_w / float(w))))
            im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, format="JPEG", quality=85, optimize=True)
        return dest.exists() and dest.stat().st_size >= 2500
    except Exception:
        return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=500)
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    conn = sqlite3.connect(str(DB), timeout=60)
    rows = conn.execute(
        """
        SELECT catalog_num, slug, cover_url, local_path, source
        FROM covers
        WHERE status='found'
          AND cover_url IS NOT NULL AND cover_url != ''
          AND (
            local_path IS NULL OR local_path = ''
            OR cover_url LIKE 'http%'
          )
        ORDER BY catalog_num
        """
    ).fetchall()

    todo = []
    for catalog_num, slug, cover_url, local_path, source in rows:
        dest = COVERS / f"{catalog_num}.jpg"
        if dest.exists() and dest.stat().st_size >= 4000:
            continue
        if not cover_url or not str(cover_url).startswith("http"):
            continue
        todo.append((catalog_num, slug, cover_url, source))

    if args.limit > 0:
        todo = todo[: args.limit]
    print(f"remote thumbs to download: {len(todo)} workers={args.workers}", flush=True)
    write_status({"job": "download_remote_thumbs", "queued": len(todo), "running": True})

    def work(item):
        wait_if_paused()
        catalog_num, slug, cover_url, source = item
        time.sleep(random.uniform(0.05, 0.2))
        data = http_bytes(cover_url)
        dest = COVERS / f"{catalog_num}.jpg"
        ok = bool(data and save_jpeg(data, dest))
        if ok and slug:
            slug_dest = COVERS / f"{slug}.jpg"
            try:
                if not slug_dest.exists():
                    slug_dest.write_bytes(dest.read_bytes())
            except Exception:
                pass
        return {
            "catalog_num": catalog_num,
            "ok": ok,
            "local_path": f"public/covers/{catalog_num}.jpg" if ok else None,
            "error": None if ok else "download_failed",
            "source": source,
        }

    ok_n = fail_n = 0
    batch = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futs = [ex.submit(work, t) for t in todo]
        for i, fut in enumerate(as_completed(futs), start=1):
            if is_paused():
                wait_if_paused()
            res = fut.result()
            batch.append(res)
            if res["ok"]:
                ok_n += 1
            else:
                fail_n += 1
            if len(batch) >= 25:
                conn.executemany(
                    """
                    UPDATE covers
                    SET local_path=COALESCE(?, local_path),
                        cover_url=CASE WHEN ? IS NOT NULL THEN '/covers/' || catalog_num || '.jpg' ELSE cover_url END,
                        error=?,
                        updated_at=?
                    WHERE catalog_num=?
                    """,
                    [
                        (
                            b["local_path"],
                            b["local_path"],
                            b["error"],
                            time.time(),
                            b["catalog_num"],
                        )
                        for b in batch
                    ],
                )
                conn.commit()
                batch = []
            if i % 25 == 0:
                print(f"[{i}/{len(todo)}] ok={ok_n} fail={fail_n}", flush=True)
                write_status(
                    {
                        "job": "download_remote_thumbs",
                        "done": i,
                        "ok": ok_n,
                        "fail": fail_n,
                        "running": True,
                    }
                )

    if batch:
        conn.executemany(
            """
            UPDATE covers
            SET local_path=COALESCE(?, local_path),
                cover_url=CASE WHEN ? IS NOT NULL THEN '/covers/' || catalog_num || '.jpg' ELSE cover_url END,
                error=?,
                updated_at=?
            WHERE catalog_num=?
            """,
            [
                (b["local_path"], b["local_path"], b["error"], time.time(), b["catalog_num"])
                for b in batch
            ],
        )
        conn.commit()

    write_status({"job": "download_remote_thumbs", "ok": ok_n, "fail": fail_n, "running": False})
    print(f"DONE ok={ok_n} fail={fail_n}", flush=True)
    conn.close()


if __name__ == "__main__":
    main()
