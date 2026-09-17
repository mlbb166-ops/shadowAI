from __future__ import annotations

import argparse
import signal
import time
from pathlib import Path

from .agent import BackgroundWorker, run_until_idle
from .config import settings
from .db import initialize_database


def main() -> None:
    parser = argparse.ArgumentParser(description="NutriShield allow-listed background agent worker")
    parser.add_argument("--db", type=Path, default=settings.db_path)
    parser.add_argument("--once", action="store_true", help="Process until queue is idle, then exit")
    args = parser.parse_args()
    initialize_database(args.db)
    if args.once:
        print(f"processed={run_until_idle(args.db)}")
        return
    worker = BackgroundWorker(args.db)
    signal.signal(signal.SIGTERM, lambda *_: worker.stop())
    signal.signal(signal.SIGINT, lambda *_: worker.stop())
    worker.start()
    print(f"NutriShield worker active for {args.db}", flush=True)
    try:
        while worker.thread and worker.thread.is_alive():
            time.sleep(0.5)
    finally:
        worker.stop()


if __name__ == "__main__":
    main()
