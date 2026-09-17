#!/usr/bin/env python3
"""
Service Manager for Shadow AI (SHIELD)
Starts 9Router on isolated port 27888 without interactive prompt hangs,
and manages Discord Bot / Brainstorming agent.
"""

import os
import sys
import time
import socket
import subprocess
import signal

BASE_DIR = os.path.expanduser("~/shadow-agent")
RUN_DIR = os.path.join(BASE_DIR, "run")
os.makedirs(RUN_DIR, exist_ok=True)

PORT = 27888

def is_port_open(host="127.0.0.1", port=PORT):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex((host, port)) == 0

def kill_port(port=PORT):
    print(f"🧹 Membersihkan port {port}...")
    try:
        cmd = f"fuser -k {port}/tcp 2>/dev/null || true"
        subprocess.run(cmd, shell=True, check=False)
    except Exception as e:
        print(f"Catatan: {e}")

def start_9router():
    kill_port(PORT)
    time.sleep(1)

    log_path = os.path.join(RUN_DIR, "9router_27888.log")
    log_file = open(log_path, "w")

    router_bin = "/usr/local/bin/9router"
    if not os.path.exists(router_bin):
        import shutil
        router_bin = shutil.which("9router") or "9router"

    print(f"🚀 Memulai 9Router pada port {PORT} (Isolasi Total)...")
    proc = subprocess.Popen(
        [router_bin, "-H", "0.0.0.0", "-p", str(PORT), "-n", "--skip-update"],
        stdin=subprocess.PIPE,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        preexec_fn=os.setpgrp
    )

    # Kirim newline otomatis untuk memilih opsi default 'Web UI' agar tidak hang
    try:
        proc.stdin.write(b"\n")
        proc.stdin.flush()
    except Exception:
        pass

    # Tunggu sampai port aktif (maksimal 15 detik)
    print("⏳ Menunggu 9Router listening...")
    for _ in range(15):
        time.sleep(1)
        if is_port_open("127.0.0.1", PORT):
            print(f"✅ 9Router BERHASIL AKTIF pada port {PORT}!")
            print(f"📄 Log tersimpan di: {log_path}")
            return proc

    print("⚠️ 9Router belum merespon dalam 15 detik. Periksa log:")
    subprocess.run(["tail", "-n", "20", log_path])
    return proc

def check_env():
    env_file = os.path.join(BASE_DIR, ".env")
    if not os.path.exists(env_file):
        print("📝 Membuat template file .env...")
        with open(env_file, "w") as f:
            f.write("""# Kredensial Shadow AI (SHIELD)
DISCORD_BOT_TOKEN="MASUKKAN_DISCORD_BOT_TOKEN_DISINI"
GEMINI_API_KEY=""
GROQ_API_KEY=""
OPENAI_API_KEY=""

# 9Router Config
ROUTER_BASE_URL="http://127.0.0.1:27888/v1/chat/completions"
ROUTER_API_KEY="shadow-secret-key"
DEFAULT_MODEL="gemini-2.0-flash"
""")
        print(f"✅ File .env dibuat di {env_file}")

if __name__ == "__main__":
    check_env()
    start_9router()
