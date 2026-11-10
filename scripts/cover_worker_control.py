#!/usr/bin/env python3
"""
Shared pause/resume/status control for cover recovery workers.

Control files live under data/cover_worker/:
  - pause.flag          → workers should idle until removed
  - status.json         → last heartbeat / counters
  - command.json        → last admin command payload
"""
from __future__ import annotations

import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CTRL = ROOT / "data" / "cover_worker"
PAUSE_FLAG = CTRL / "pause.flag"
STATUS_PATH = CTRL / "status.json"
COMMAND_PATH = CTRL / "command.json"


def ensure_dir() -> None:
    CTRL.mkdir(parents=True, exist_ok=True)


def is_paused() -> bool:
    return PAUSE_FLAG.exists()


def pause(reason: str = "admin") -> None:
    ensure_dir()
    PAUSE_FLAG.write_text(reason or "paused", encoding="utf-8")
    write_status({"paused": True, "pause_reason": reason, "paused_at": time.time()})


def resume() -> None:
    ensure_dir()
    if PAUSE_FLAG.exists():
        PAUSE_FLAG.unlink()
    write_status({"paused": False, "resumed_at": time.time()})


def wait_if_paused(poll_s: float = 2.0) -> None:
    while is_paused():
        time.sleep(poll_s)


def write_status(patch: dict) -> None:
    ensure_dir()
    cur: dict = {}
    if STATUS_PATH.exists():
        try:
            cur = json.loads(STATUS_PATH.read_text(encoding="utf-8"))
        except Exception:
            cur = {}
    cur.update(patch)
    cur["updated_at"] = time.time()
    STATUS_PATH.write_text(json.dumps(cur, indent=2), encoding="utf-8")


def read_status() -> dict:
    ensure_dir()
    if not STATUS_PATH.exists():
        return {"paused": is_paused()}
    try:
        data = json.loads(STATUS_PATH.read_text(encoding="utf-8"))
    except Exception:
        data = {}
    data["paused"] = is_paused()
    return data


def write_command(cmd: dict) -> None:
    ensure_dir()
    payload = dict(cmd)
    payload["issued_at"] = time.time()
    COMMAND_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def read_command() -> dict | None:
    if not COMMAND_PATH.exists():
        return None
    try:
        return json.loads(COMMAND_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["pause", "resume", "status"])
    args = ap.parse_args()
    if args.action == "pause":
        pause("cli")
        print("paused")
    elif args.action == "resume":
        resume()
        print("resumed")
    else:
        print(json.dumps(read_status(), indent=2))
