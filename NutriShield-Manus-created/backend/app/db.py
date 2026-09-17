from __future__ import annotations

import contextlib
import sqlite3
from pathlib import Path
from typing import Iterator

from .config import BASE_DIR, settings


def connect(path: Path | str | None = None) -> sqlite3.Connection:
    db_path = Path(path or settings.db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=5.0, isolation_level=None, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA trusted_schema=OFF")
    return conn


def initialize_database(path: Path | str | None = None) -> None:
    conn = connect(path)
    try:
        schema = (BASE_DIR / "schema.sql").read_text(encoding="utf-8")
        # FTS triggers use a virtual table and therefore require trusted_schema while schema is installed.
        conn.execute("PRAGMA trusted_schema=ON")
        conn.executescript(schema)
        conn.execute("PRAGMA trusted_schema=OFF")
        violations = conn.execute("PRAGMA foreign_key_check").fetchall()
        if violations:
            raise RuntimeError(f"foreign key violations: {violations!r}")
    finally:
        conn.close()


@contextlib.contextmanager
def transaction(path: Path | str | None = None, *, immediate: bool = False) -> Iterator[sqlite3.Connection]:
    conn = connect(path)
    try:
        conn.execute("BEGIN IMMEDIATE" if immediate else "BEGIN")
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def dict_row(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row is not None else None
