from __future__ import annotations

import contextlib
import os
import re
import shutil
import sqlite3
from pathlib import Path
from typing import Any, Iterator

from .config import WEB_DIR, settings


_PG_TABLES_WITH_ID = {
    "consents", "channel_identities", "food_sources", "raw_food_records", "canonical_foods",
    "food_aliases", "food_nutrients", "food_prices", "normalization_issues", "agent_steps",
    "agent_actions", "audit_events", "inbound_events",
}


def _pg_sql(sql: str) -> str:
    sql = sql.replace("BEGIN IMMEDIATE", "BEGIN")
    sql = re.sub(r"\bINSERT\s+OR\s+IGNORE\s+INTO", "INSERT INTO", sql, flags=re.I)
    sql = re.sub(r"\bINSERT\s+OR\s+REPLACE\s+INTO", "INSERT INTO", sql, flags=re.I)
    sql = sql.replace("group_concat(", "string_agg(")
    sql = sql.replace("coalesce((SELECT string_agg(a.alias, ' ') FROM food_aliases a WHERE a.canonical_food_id=c.id),'')", "coalesce((SELECT string_agg(a.alias, ' ') FROM food_aliases a WHERE a.canonical_food_id=c.id),'')")
    sql = sql.replace("LIMIT ?", "LIMIT %s")
    return sql.replace("?", "%s")


class _PGCursor:
    def __init__(self, cursor: Any):
        self._cursor = cursor
        self.lastrowid: int | None = None
        self.rowcount = cursor.rowcount

    def execute(self, sql: str, params: tuple[Any, ...] = ()) -> "_PGCursor":
        statement = _pg_sql(sql)
        # SQLite's implicit integer IDs are represented by identity columns in PostgreSQL.
        # Return the generated ID for the small set of legacy call sites that use lastrowid.
        match = re.match(r"\s*INSERT\s+INTO\s+(\w+)\s*\(([^)]*)\)", sql, re.I | re.S)
        if match and match.group(1).lower() in _PG_TABLES_WITH_ID and "id" not in {x.strip().lower() for x in match.group(2).split(",") }:
            statement += " RETURNING id"
        self._cursor.execute(statement, params)
        self.rowcount = self._cursor.rowcount
        if statement.upper().endswith("RETURNING ID"):
            row = self._cursor.fetchone()
            self.lastrowid = (row.get("id") if isinstance(row, dict) else row[0]) if row else None
        return self

    def executemany(self, sql: str, seq: Any) -> "_PGCursor":
        self._cursor.executemany(_pg_sql(sql), seq)
        self.rowcount = self._cursor.rowcount
        return self

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()


class _CompatRow(dict):
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)


def _pg_row_factory(cursor, row):
    return _CompatRow(zip((column.name for column in cursor.description), row))


class _PGConnection:
    def __init__(self, raw: Any):
        self.raw = raw

    def execute(self, sql: str, params: tuple[Any, ...] = ()) -> _PGCursor:
        return _PGCursor(self.raw.cursor()).execute(sql, params)

    def commit(self):
        self.raw.commit()

    def rollback(self):
        self.raw.rollback()

    def close(self):
        self.raw.close()

    def executescript(self, script: str):
        for statement in re.split(r";\s*(?:\n|$)", script):
            statement = statement.strip()
            if statement and not statement.startswith("PRAGMA"):
                self.execute(statement)


def using_postgres() -> bool:
    return bool(os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL"))


try:
    from psycopg import IntegrityError as _PGIntegrityError
except ImportError:
    _PGIntegrityError = sqlite3.IntegrityError

IntegrityError = (_PGIntegrityError, sqlite3.IntegrityError)


def connect(path: Path | str | None = None):
    if using_postgres():
        try:
            import psycopg
        except ImportError as exc:
            raise RuntimeError("DATABASE_URL requires psycopg[binary] in backend requirements") from exc
        raw = psycopg.connect(os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL"), row_factory=_pg_row_factory, autocommit=False)
        return _PGConnection(raw)
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
    if using_postgres():
        # Supabase migrations own the production schema. API startup must never mutate it.
        return
    db_path = Path(path or settings.db_path)
    seed_path = WEB_DIR / "database" / "seed" / "nutrishield-seed.sqlite3"
    if not db_path.exists() and db_path == settings.db_path and seed_path.is_file():
        db_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = db_path.with_suffix(db_path.suffix + ".bootstrap")
        shutil.copy2(seed_path, temporary)
        temporary.replace(db_path)
    conn = connect(db_path)
    try:
        schema = (WEB_DIR / "database" / "schema.sql").read_text(encoding="utf-8")
        conn.execute("PRAGMA trusted_schema=ON")
        conn.executescript(schema)
        channel_columns = {row[1] for row in conn.execute("PRAGMA table_info(channel_identities)")}
        if "active_child_id" not in channel_columns:
            conn.execute("ALTER TABLE channel_identities ADD COLUMN active_child_id TEXT REFERENCES child_profiles(id) ON DELETE SET NULL")
        code_columns = {row[1] for row in conn.execute("PRAGMA table_info(channel_link_codes)")}
        if "child_id" not in code_columns:
            conn.execute("ALTER TABLE channel_link_codes ADD COLUMN child_id TEXT REFERENCES child_profiles(id) ON DELETE CASCADE")
        conn.execute("PRAGMA trusted_schema=OFF")
        violations = conn.execute("PRAGMA foreign_key_check").fetchall()
        if violations:
            raise RuntimeError(f"foreign key violations: {violations!r}")
    finally:
        conn.close()


@contextlib.contextmanager
def transaction(path: Path | str | None = None, *, immediate: bool = False) -> Iterator[Any]:
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


def dict_row(row):
    return dict(row) if row is not None else None
