#!/usr/bin/env python3
"""
Drain ALL remaining cover work:
  1) pending rows with full free-provider stack
  2) then retry not_found once

Usage:
  python -u scripts/run_cover_recovery_all.py --workers 16
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = sys.executable
BATCH = ROOT / "scripts" / "run_cover_recovery_batch.py"


def run(args: list[str]) -> int:
    print(">>", " ".join(args), flush=True)
    return subprocess.call(args, cwd=str(ROOT))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("--export-every", type=int, default=150)
    args = ap.parse_args()

    base = [
        PY,
        "-u",
        str(BATCH),
        "--pending-from-db",
        "--limit",
        "0",
        "--workers",
        str(args.workers),
        "--export-every",
        str(args.export_every),
    ]
    rc1 = run(base)
    print(f"pending pass exit={rc1}", flush=True)
    rc2 = run(base + ["--retry-not-found"])
    print(f"not_found retry exit={rc2}", flush=True)
    return 0 if rc1 == 0 and rc2 == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
