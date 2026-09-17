"""
Telegram Bot Connector for Tim Shadow AI Brainstorming
Connects via python-telegram-bot or direct polling to ShadowBrain RAG Engine (routed via 9Router).
"""

import os
import sys
import time
import json
import logging
import urllib.request
import urllib.parse
from shadow_brain import agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TelegramBot")

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN_HERE")

class LightweightTelegramBot:
    """Zero-dependency asynchronous/polling telegram bot client"""
    def __init__(self, token: str):
        self.token = token
        self.base_url = f"https://api.telegram.org/bot{token}"
        self.offset = 0

    def get_updates(self):
        url = f"{self.base_url}/getUpdates?offset={self.offset}&timeout=20"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("result", [])
        except Exception as e:
            logger.debug(f"Polling update: {e}")
            return []

    def send_message(self, chat_id: int, text: str):
        url = f"{self.base_url}/sendMessage"
        # Telegram max length is 4096
        chunks = [text[i:i+4000] for i in range(0, len(text), 4000)]
        for chunk in chunks:
            payload = {
                "chat_id": chat_id,
                "text": chunk
            }
            try:
                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
                urllib.request.urlopen(req, timeout=10)
            except Exception as e:
                logger.error(f"Error sending message to telegram: {e}")

    def send_document(self, chat_id: int, file_path: str):
        if not os.path.exists(file_path):
            return
        import mimetypes
        url = f"{self.base_url}/sendDocument"
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        filename = os.path.basename(file_path)
        mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        
        try:
            with open(file_path, "rb") as f:
                file_data = f.read()

            body = (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="chat_id"\r\n\r\n'
                f"{chat_id}\r\n"
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="document"; filename="{filename}"\r\n'
                f"Content-Type: {mime_type}\r\n\r\n"
            ).encode("utf-8") + file_data + f"\r\n--{boundary}--\r\n".encode("utf-8")

            headers = {
                "Content-Type": f"multipart/form-data; boundary={boundary}"
            }
            req = urllib.request.Request(url, data=body, headers=headers)
            urllib.request.urlopen(req, timeout=30)
            logger.info(f"Successfully sent telegram document: {filename}")
        except Exception as e:
            logger.error(f"Error sending document to telegram: {e}")

    def start_polling(self):
        logger.info("Telegram Bot Polling started...")
        while True:
            updates = self.get_updates()
            for u in updates:
                self.offset = u["update_id"] + 1
                msg = u.get("message")
                if not msg:
                    continue
                
                chat_id = msg["chat"]["id"]
                user_id = str(msg["from"]["id"])
                user_name = msg["from"].get("first_name", "Member")
                text = msg.get("text", "").strip()

                if not text:
                    continue

                if text.startswith("/start"):
                    welcome = (
                        f"Halo {user_name}! Saya Shadow Co-Pilot untuk Tim Shadow AI.\n"
                        "Saya siap membantu Mas Hisyam dan Mbak Salsa dalam pengembangan & brainstorming platform NutriShield "
                        "(Digital Safety & Stunting Prevention) untuk AI HackFest 2026.\n\n"
                        "Silakan ketik pertanyaan atau ide yang ingin dibahas!"
                    )
                    self.send_message(chat_id, welcome)
                    continue

                logger.info(f"Telegram query from {user_name} ({user_id}): {text[:50]}...")
                reply, attached_files = agent.ask("telegram", user_name, text)
                self.send_message(chat_id, reply)
                for fpath in attached_files:
                    if os.path.exists(fpath):
                        self.send_document(chat_id, fpath)

            time.sleep(1)

def run_telegram_bot():
    if TELEGRAM_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        print("\n[PERHATIAN] TELEGRAM_BOT_TOKEN belum disetel di environment variables.")
        print("Setel token dengan: export TELEGRAM_BOT_TOKEN='token_bot_anda'\n")
        return

    bot = LightweightTelegramBot(TELEGRAM_TOKEN)
    bot.start_polling()

if __name__ == "__main__":
    run_telegram_bot()
