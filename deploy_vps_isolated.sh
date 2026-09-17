#!/bin/bash
# ==============================================================================
# Script Instalasi Terisolasi: Shadow Brain Agent (OpenClaw + 9Router + Discord/Telegram)
# Khusus Tim Shadow AI (Muhammad Hisyam Alfaris & Salsabila Putri Halimi)
# Server Target: mmm@mymakara (103.226.139.86)
# ==============================================================================

set -e

echo "🛡️ Memulai Instalasi Terisolasi Shadow Brain Agent..."

TARGET_DIR="/home/mmm/shadow-agent"
mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/knowledge_base"

cd "$TARGET_DIR"

echo "📦 Menyiapkan Python Virtual Environment terisolasi..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install discord.py requests

# Cek apakah npm/node tersedia untuk 9router
if command -v npm &> /dev/null; then
    echo "⚡ Menginstall / Memperbarui 9Router via npm..."
    npm install -g 9router || npm install 9router
else
    echo "ℹ️ Node/NPM tidak terpasang secara global. 9Router mode python gateway aktif."
fi

# Buat file environment jika belum ada
if [ ! -f ".env" ]; then
    cat << 'EOF' > .env
# Kredensial Bot Tim Shadow AI
DISCORD_BOT_TOKEN="YOUR_DISCORD_BOT_TOKEN_HERE"
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN_HERE"

# 9Router Configuration
ROUTER_BASE_URL="http://127.0.0.1:20128/v1"
ROUTER_API_KEY="shadow-secret-key"
DEFAULT_MODEL="nemotron-mini"

# Optional Upstream Keys (bisa dikosongkan jika pakai model lokal)
OPENAI_API_KEY=""
GROQ_API_KEY=""
EOF
    echo "✅ File .env berhasil dibuat di $TARGET_DIR/.env"
fi

echo "======================================================================"
echo "🎉 Instalasi Direktori Terisolasi Selesai di: $TARGET_DIR"
echo "======================================================================"
echo "Langkah selanjutnya:"
echo "1. Edit file .env untuk memasukkan token bot Discord/Telegram:"
echo "   nano $TARGET_DIR/.env"
echo ""
echo "2. Jalankan engine Shadow Brain RAG:"
echo "   cd $TARGET_DIR && source venv/bin/activate"
echo "   python3 shadow_brain.py"
echo ""
echo "3. Jalankan Discord Bot:"
echo "   python3 discord_bot.py &"
echo ""
echo "4. Jalankan Telegram Bot (terhubung ke 9Router):"
echo "   python3 telegram_bot.py &"
echo "======================================================================"
