#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
APP_ROOT="/opt/nutrishield"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID"
CURRENT_LINK="$APP_ROOT/current"
ENV_FILE="/etc/nutrishield/nutrishield.env"
DATA_DIR="/var/lib/nutrishield"
PREVIOUS="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo bash deploy/install_vps.sh" >&2
  exit 2
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.example, set rotated secrets, and chmod 600 first." >&2
  exit 2
fi
if grep -Eq 'replace-with-|YOUR_|example' "$ENV_FILE"; then
  echo "Environment file still contains placeholder values." >&2
  exit 2
fi

id nutrishield >/dev/null 2>&1 || useradd --system --home "$APP_ROOT" --shell /usr/sbin/nologin nutrishield
install -d -o nutrishield -g nutrishield -m 0750 "$APP_ROOT/releases" "$DATA_DIR"
install -d -o root -g nutrishield -m 0750 /etc/nutrishield
chmod 0640 "$ENV_FILE"

mkdir -p "$RELEASE_DIR"
rsync -a --delete --exclude node_modules --exclude frontend/dist --exclude database/runtime --exclude database/legacy "$SOURCE_DIR/" "$RELEASE_DIR/web-nutrishield/"
python3 -m venv "$APP_ROOT/venv"
"$APP_ROOT/venv/bin/pip" install --disable-pip-version-check -r "$RELEASE_DIR/web-nutrishield/backend/requirements.txt"
(
  cd "$RELEASE_DIR/web-nutrishield"
  npm ci --ignore-scripts --no-audit --no-fund
  npm run build
)

if [[ ! -f "$DATA_DIR/nutrishield.sqlite3" ]]; then
  install -o nutrishield -g nutrishield -m 0600 "$RELEASE_DIR/web-nutrishield/database/seed/nutrishield-seed.sqlite3" "$DATA_DIR/nutrishield.sqlite3"
fi
chown -R nutrishield:nutrishield "$DATA_DIR"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK.new"
mv -Tf "$CURRENT_LINK.new" "$CURRENT_LINK"

install -m 0644 "$RELEASE_DIR/web-nutrishield/deploy/nutrishield-api.service" /etc/systemd/system/nutrishield-api.service
install -m 0644 "$RELEASE_DIR/web-nutrishield/deploy/nutrishield-agent.service" /etc/systemd/system/nutrishield-agent.service
systemctl daemon-reload
systemctl enable --now nutrishield-api.service nutrishield-agent.service
systemctl restart nutrishield-api.service nutrishield-agent.service

healthy=0
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8080/api/health | grep -q '"status":"ok"'; then
    healthy=1
    break
  fi
  sleep 1
done
if [[ $healthy -ne 1 ]]; then
  echo "Health check failed; rolling back current symlink." >&2
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    ln -sfn "$PREVIOUS" "$CURRENT_LINK.new"
    mv -Tf "$CURRENT_LINK.new" "$CURRENT_LINK"
    systemctl restart nutrishield-api.service nutrishield-agent.service || true
  fi
  exit 1
fi

echo "NutriShield release $RELEASE_ID is healthy."
