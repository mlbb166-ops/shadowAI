from __future__ import annotations

import argparse
from pathlib import Path

from app.db import initialize_database


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize NutriShield SQLite database")
    parser.add_argument("--db", type=Path, required=True)
    args = parser.parse_args()
    initialize_database(args.db)
    print(f"initialized={args.db}")


if __name__ == "__main__":
    main()
