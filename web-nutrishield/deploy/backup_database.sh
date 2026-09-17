#!/usr/bin/env bash
set -euo pipefail

DB="${NUTRISHIELD_DB_PATH:-/var/lib/nutrishield/nutrishield.sqlite3}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nutrishield}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ ! -f "$DB" ]]; then
  echo "Database not found: $DB" >&2
  exit 2
fi
install -d -m 0700 "$BACKUP_DIR"
sqlite3 "$DB" ".timeout 10000" ".backup '$BACKUP_DIR/nutrishield-$STAMP.sqlite3'"
sha256sum "$BACKUP_DIR/nutrishield-$STAMP.sqlite3" > "$BACKUP_DIR/nutrishield-$STAMP.sqlite3.sha256"
chmod 0600 "$BACKUP_DIR/nutrishield-$STAMP.sqlite3" "$BACKUP_DIR/nutrishield-$STAMP.sqlite3.sha256"
find "$BACKUP_DIR" -type f -name 'nutrishield-*.sqlite3*' -mtime +14 -delete
printf 'backup=%s\n' "$BACKUP_DIR/nutrishield-$STAMP.sqlite3"
