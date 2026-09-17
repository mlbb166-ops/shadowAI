import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "103.226.139.86"
PORT = 22
USER = "mmm"
PASS = "gCPHPM_FLNFpq65"

def run_remote_script(script_text):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=10)
        # We invoke bash -s to execute the script directly from stdin
        stdin, stdout, stderr = client.exec_command("bash -s", get_pty=False)
        stdin.write(script_text)
        stdin.channel.shutdown_write()
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
        print("=== STDOUT ===")
        print(out)
        if err.strip():
            print("=== STDERR ===")
            print(err)
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "-f":
        with open(sys.argv[2], "r") as f:
            script = f.read()
    elif len(sys.argv) > 1 and sys.argv[1] == "-c":
        script = sys.argv[2]
    else:
        script = sys.stdin.read()
    run_remote_script(script)
