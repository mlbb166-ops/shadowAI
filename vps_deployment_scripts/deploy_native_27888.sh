#!/bin/bash
set -e

# Stop any rogue process on 27888
fuser -k 27888/tcp 2>/dev/null || true

cat << 'EOF' > /tmp/shadow-9router.service
[Unit]
Description=Shadow AI 9Router Proxy Gateway (Port 27888 Isolated)
After=network.target

[Service]
Type=simple
User=mmm
WorkingDirectory=/usr/local/lib/node_modules/9router/app
Environment=DATA_DIR=/home/mmm/shadow-agent/.9router
Environment=PORT=27888
Environment=HOSTNAME=0.0.0.0
Environment=INITIAL_PASSWORD=KFd7ViYm85vKg.d
ExecStart=/usr/bin/node --dns-result-order=ipv4first --max-old-space-size=2048 /usr/local/lib/node_modules/9router/app/custom-server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "KFd7ViYm85vKg.d" | sudo -S cp /tmp/shadow-9router.service /etc/systemd/system/shadow-9router.service
echo "KFd7ViYm85vKg.d" | sudo -S systemctl daemon-reload
echo "KFd7ViYm85vKg.d" | sudo -S systemctl restart shadow-9router.service

sleep 4

echo "=== SERVICE STATUS ==="
systemctl status shadow-9router.service --no-pager | head -n 25

echo "=== TEST LOCAL CURL 27888 ==="
curl -I "http://127.0.0.1:27888/"
echo "=== BOTH PORTS 20128 & 27888 LISTENING ==="
ss -tulpn | grep -E '20128|27888'
