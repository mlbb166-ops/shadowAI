#!/bin/bash
sudo bash -c 'cat << "EOF" > /etc/systemd/system/shadow-discord.service
[Unit]
Description=Shadow AI Discord Bot Daemon
After=network.target shadow-9router.service

[Service]
Type=simple
User=mmm
WorkingDirectory=/home/mmm/shadow-agent
EnvironmentFile=/home/mmm/shadow-agent/.env
ExecStart=/home/mmm/shadow-agent/venv/bin/python /home/mmm/shadow-agent/discord_bot.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable shadow-discord.service
echo "shadow-discord.service created and enabled!"
