#!/bin/bash
cat << 'EOF' > /home/mmm/shadow-agent/.env
# ==============================================================================
# Tim Shadow AI (SHIELD) Environment Config
# ==============================================================================

# 9Router Dedicated Gateway (Port 27888 Terisolasi)
ROUTER_BASE_URL="http://127.0.0.1:27888/api/v1/chat/completions"
ROUTER_API_KEY="sk-41beb93f16a13566-45tqek-5afda639"
DEFAULT_MODEL="ag/gemini-3.8-flash-high"

# Bot Credentials
DISCORD_BOT_TOKEN="MTU0NjgxNDQzNTU2MDAwNTY0Mg.G0gpIk.FU3x0-sLJ8t6lImRqypiGp2QUAPRT2hiaP21QA"
TELEGRAM_BOT_TOKEN="MASUKKAN_TELEGRAM_BOT_TOKEN_DISINI"
EOF

chmod 600 /home/mmm/shadow-agent/.env
echo ".env updated successfully!"
