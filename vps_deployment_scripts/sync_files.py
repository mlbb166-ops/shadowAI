import os
import paramiko

HOST = "103.226.139.86"
PORT = 22
USER = "mmm"
PASS = "KFd7ViYm85vKg.d"

FILES = [
    ("C:\\Users\\DELL\\Downloads\\Shadow AI\\shadow_brain.py", "/home/mmm/shadow-agent/shadow_brain.py"),
    ("C:\\Users\\DELL\\Downloads\\Shadow AI\\discord_bot.py", "/home/mmm/shadow-agent/discord_bot.py"),
    ("C:\\Users\\DELL\\Downloads\\Shadow AI\\telegram_bot.py", "/home/mmm/shadow-agent/telegram_bot.py"),
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=10)
sftp = client.open_sftp()

for local_path, remote_path in FILES:
    print(f"Uploading {local_path} -> {remote_path}...")
    sftp.put(local_path, remote_path)
    print(f"Uploaded {os.path.basename(local_path)} successfully.")

sftp.close()
client.close()
print("All files synced!")
