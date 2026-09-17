#!/bin/bash
# ==============================================================================
# Self-Contained Installer: Shadow Brain (OpenClaw + 9Router + Discord/Telegram + RAG)
# Target: mmm@mymakara (103.226.139.86)
# ==============================================================================

set -e

INSTALL_DIR="/home/mmm/shadow-agent"
echo "🚀 Mempersiapkan direktori terisolasi di $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR/knowledge_base"

cd "$INSTALL_DIR"

# 1. SETUP VIRTUAL ENVIRONMENT
if [ ! -d "venv" ]; then
    echo "📦 Membuat isolated Python virtualenv..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install discord.py requests > /dev/null 2>&1
echo "✅ Python isolated environment siap."

# 2. INSTALL 9ROUTER (NPM)
if command -v npm &> /dev/null; then
    echo "⚡ Memeriksa 9Router via npm..."
    npm install -g 9router > /dev/null 2>&1 || true
fi

# 3. BUAT FILE KONFIGURASI 9ROUTER
cat << 'EOF' > 9router.config.json
{
  "server": {
    "host": "127.0.0.1",
    "port": 20128
  },
  "cache": { "enabled": true, "ttl_seconds": 3600 },
  "compression": { "enabled": true, "strategy": "rtk_token_saver" },
  "providers": [
    {
      "name": "local_nemotron",
      "type": "openai_compatible",
      "base_url": "http://127.0.0.1:11434/v1",
      "models": ["nemotron-mini:latest", "nemotron:latest"],
      "priority": 1
    },
    {
      "name": "groq_free_tier",
      "type": "openai_compatible",
      "base_url": "https://api.groq.com/openai/v1",
      "api_key": "${GROQ_API_KEY}",
      "models": ["llama-3.3-70b-versatile"],
      "priority": 2
    }
  ]
}
EOF

# 4. BUAT OPENCLAW CONFIG
cat << 'EOF' > openclaw.config.json
{
  "name": "shadow-brainstorm-agent",
  "version": "1.0.0",
  "gateway": { "host": "127.0.0.1", "port": 20128, "provider": "9router" },
  "channels": {
    "discord": { "enabled": true, "command_prefix": "!shield" },
    "telegram": { "enabled": true, "route_via": "9router" }
  },
  "isolation": { "sandbox": true, "max_memory_mb": 1536 }
}
EOF

# 5. BUAT FILE ENVIRONMENT
if [ ! -f ".env" ]; then
cat << 'EOF' > .env
# Kredensial Bot Tim Shadow AI
DISCORD_BOT_TOKEN="MASUKKAN_TOKEN_DISCORD_DISINI"
TELEGRAM_BOT_TOKEN="MASUKKAN_TOKEN_TELEGRAM_DISINI"

ROUTER_BASE_URL="http://127.0.0.1:20128/v1"
ROUTER_API_KEY="shadow-secret-key"
DEFAULT_MODEL="nemotron-mini"
EOF
echo "✅ File .env berhasil dibuat."
fi

echo "🎉 Seluruh modul terisolasi telah siap di $INSTALL_DIR!"
