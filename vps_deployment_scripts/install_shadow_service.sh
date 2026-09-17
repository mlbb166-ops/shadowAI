#!/bin/bash
set -e

echo "=== CREATING ISOLATED SHADOW 9ROUTER SERVICE ==="
mkdir -p /home/mmm/shadow-agent/.9router
mkdir -p /home/mmm/shadow-agent/run
chown -R mmm:mmm /home/mmm/shadow-agent/.9router

cat << 'EOF' > /tmp/shadow-9router.service
[Unit]
Description=Shadow AI 9Router Proxy Gateway (Port 27888 Isolated)
After=network.target

[Service]
Type=simple
User=mmm
WorkingDirectory=/home/mmm/shadow-agent
Environment=DATA_DIR=/home/mmm/shadow-agent/.9router
Environment=INITIAL_PASSWORD=KFd7ViYm85vKg.d
ExecStart=/usr/local/bin/9router -H 0.0.0.0 -p 27888 -n -l --skip-update
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "KFd7ViYm85vKg.d" | sudo -S cp /tmp/shadow-9router.service /etc/systemd/system/shadow-9router.service
echo "KFd7ViYm85vKg.d" | sudo -S systemctl daemon-reload
echo "KFd7ViYm85vKg.d" | sudo -S systemctl enable shadow-9router.service
echo "KFd7ViYm85vKg.d" | sudo -S systemctl restart shadow-9router.service

sleep 4

echo "=== SERVICE STATUS ==="
systemctl status shadow-9router.service --no-pager | head -n 20

echo "=== PORTS STATUS ==="
ss -tulpn | grep -E '20128|27888'

echo "=== TEST LOCAL CURL TO 27888 ==="
curl -I -s "http://127.0.0.1:27888/" || true
