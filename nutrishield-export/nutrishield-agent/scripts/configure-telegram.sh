#!/usr/bin/env bash
set -euo pipefail
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
BOT_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"
WEBHOOK_URL="${1:?Usage: configure-telegram.sh <https-webhook-url>}"
SECRET_TOKEN="$(printf '%s' "$TELEGRAM_BOT_TOKEN" | sha256sum | cut -d' ' -f1)"

curl -fsS "$BOT_API/getMe" > /tmp/nutrishield-telegram-getme.json
curl -fsS -X POST "$BOT_API/setMyCommands" \
  -H 'content-type: application/json' \
  --data '{"commands":[{"command":"start","description":"Mulai memakai NutriShield"},{"command":"menu","description":"Tanya ide menu keluarga"},{"command":"bantuan","description":"Lihat bantuan dan batasan bot"}]}' \
  > /tmp/nutrishield-telegram-commands.json
curl -fsS -X POST "$BOT_API/setWebhook" \
  -H 'content-type: application/json' \
  --data "$(printf '{\"url\":\"%s\",\"secret_token\":\"%s\",\"allowed_updates\":[\"message\"],\"drop_pending_updates\":true}' "$WEBHOOK_URL" "$SECRET_TOKEN")" \
  > /tmp/nutrishield-telegram-webhook-set.json
curl -fsS "$BOT_API/getWebhookInfo" > /tmp/nutrishield-telegram-webhook-info.json

node - <<'NODE'
const fs = require('fs');
const getMe = JSON.parse(fs.readFileSync('/tmp/nutrishield-telegram-getme.json', 'utf8'));
const commands = JSON.parse(fs.readFileSync('/tmp/nutrishield-telegram-commands.json', 'utf8'));
const webhookSet = JSON.parse(fs.readFileSync('/tmp/nutrishield-telegram-webhook-set.json', 'utf8'));
const webhookInfo = JSON.parse(fs.readFileSync('/tmp/nutrishield-telegram-webhook-info.json', 'utf8'));
if (!getMe.ok || !commands.ok || !webhookSet.ok || !webhookInfo.ok) process.exit(1);
console.log(JSON.stringify({
  bot: { id: getMe.result.id, username: getMe.result.username, name: getMe.result.first_name },
  commandsConfigured: commands.ok,
  webhookConfigured: webhookSet.ok,
  webhook: {
    url: webhookInfo.result.url,
    pendingUpdates: webhookInfo.result.pending_update_count,
    lastError: webhookInfo.result.last_error_message || null,
  },
}, null, 2));
NODE
