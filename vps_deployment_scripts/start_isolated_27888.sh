#!/bin/bash
# 1. Kill any existing process on port 27888
fuser -k 27888/tcp 2>/dev/null || true

# 2. Setup isolated directory
mkdir -p /home/mmm/shadow-agent/.9router
mkdir -p /home/mmm/shadow-agent/run

# 3. Test running 9router with isolated DATA_DIR and port 27888
export DATA_DIR="/home/mmm/shadow-agent/.9router"
export INITIAL_PASSWORD="KFd7ViYm85vKg.d"

# We use python to spawn it cleanly with stdin closed / newline sent
python3 << 'EOF'
import subprocess
import os
import time
import socket

env = os.environ.copy()
env["DATA_DIR"] = "/home/mmm/shadow-agent/.9router"
env["INITIAL_PASSWORD"] = "KFd7ViYm85vKg.d"

log_file = open("/home/mmm/shadow-agent/run/9router_27888.log", "w")

p = subprocess.Popen(
    ["/usr/local/bin/9router", "-H", "0.0.0.0", "-p", "27888", "-n", "--skip-update"],
    stdin=subprocess.PIPE,
    stdout=log_file,
    stderr=subprocess.STDOUT,
    env=env,
    preexec_fn=os.setpgrp
)

try:
    p.stdin.write(b"\n")
    p.stdin.flush()
except Exception:
    pass

# Check if listening on 27888
for i in range(10):
    time.sleep(1)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        if s.connect_ex(("127.0.0.1", 27888)) == 0:
            print(f"SUCCESS: Port 27888 is listening! PID={p.pid}")
            break
else:
    print("FAILED: Port 27888 did not open within 10s")

EOF

echo "=== CHECK PORT 27888 ==="
ss -tulpn | grep 27888 || true

echo "=== RECENT LOGS OF 27888 ==="
tail -n 25 /home/mmm/shadow-agent/run/9router_27888.log
