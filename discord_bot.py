"""
Discord Bot Connector for Tim Shadow AI Brainstorming
Connects directly to ShadowBrain RAG Engine.
"""

import os
import sys
import logging
import re
import asyncio
from pathlib import Path

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass

from shadow_brain import agent, execute_safe_server_cmd

try:
    import discord
    from discord.ext import commands
except ImportError:
    print("Warning: discord.py belum terinstall. Jalankan: pip install discord.py")
    discord = None
    commands = None

logger = logging.getLogger("DiscordBot")

DISCORD_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "YOUR_DISCORD_BOT_TOKEN_HERE")

def run_discord_bot():
    if not discord or not commands:
        logger.error("Library discord.py tidak ditemukan.")
        return

    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    bot = commands.Bot(command_prefix="!shield ", intents=intents)

    @bot.event
    async def on_ready():
        logger.info(f"Discord Bot online sebagai {bot.user} (ID: {bot.user.id})")
        logger.info("Siap merespon Mas Hisyam & Mbak Salsa 24/7!")

    @bot.event
    async def on_message(message):
        if message.author == bot.user:
            return

        # Direct execution commands: !exec, !bash, !cmd
        content_stripped = message.content.strip()
        if content_stripped.startswith(("!exec ", "!bash ", "!cmd ")):
            prefix = content_stripped.split()[0]
            cmd = content_stripped[len(prefix):].strip()
            if not cmd:
                await message.channel.send("Silakan masukkan perintah bash/exec yang ingin dijalankan.")
                return

            async with message.channel.typing():
                res = execute_safe_server_cmd(cmd)
                reply = f"**Eksekusi Server (Shadow Agent):**\n```bash\n{res}\n```"

            if len(reply) > 1950:
                parts = [reply[i:i+1900] for i in range(0, len(reply), 1900)]
                for part in parts:
                    await message.channel.send(part)
            else:
                await message.channel.send(reply)
            return

        # Multi-angle trigger detection (supports mentions, plaintext names, replies, DMs, prefixes)
        is_dm = isinstance(message.channel, discord.DMChannel)
        is_mentioned_api = bot.user in message.mentions
        is_command = content_stripped.startswith(("!shield", "!shadow", "!ai", "!ask", "!bot"))
        
        # Check if replying to the bot
        is_reply_to_bot = False
        if message.reference:
            if message.reference.resolved and hasattr(message.reference.resolved, "author"):
                if message.reference.resolved.author == bot.user:
                    is_reply_to_bot = True
            elif message.reference.message_id:
                try:
                    ref_msg = await message.channel.fetch_message(message.reference.message_id)
                    if ref_msg.author == bot.user:
                        is_reply_to_bot = True
                except Exception:
                    pass

        # Check plaintext mention / keywords (e.g. '@Shadow AI Agent', 'shadow', 'agen rahasia', bot ID)
        content_lower = content_stripped.lower()
        bot_id_str = str(bot.user.id)
        is_text_called = (
            f"<@{bot_id_str}>" in content_stripped
            or f"<@!{bot_id_str}>" in content_stripped
            or "@shadow" in content_lower
            or "shadow ai" in content_lower
            or "shadow agent" in content_lower
            or "agen rahasia" in content_lower
            or content_lower.startswith("shadow")
            or content_lower.startswith("halo shadow")
            or content_lower.startswith("hai shadow")
        )

        should_respond = is_dm or is_mentioned_api or is_command or is_reply_to_bot or is_text_called

        if should_respond:
            logger.info(f"[TRIGGERED] Pesan dari {message.author.display_name}: {message.content!r}")
            
            # Clean mention tags and invocation prefixes
            clean_query = re.sub(rf"<@!?{bot_id_str}>", "", content_stripped, flags=re.IGNORECASE)
            clean_query = re.sub(r"@?shadow(\s*ai)?(\s*agent)?", "", clean_query, flags=re.IGNORECASE)
            clean_query = re.sub(r"agen\s*rahasia", "", clean_query, flags=re.IGNORECASE)
            clean_query = re.sub(r"^!(shield|shadow|ai|ask|bot)\s*", "", clean_query, flags=re.IGNORECASE)
            clean_query = clean_query.strip()

            # Process attachments if present
            if message.attachments:
                att_descs = []
                upload_dir = os.path.expanduser("~/shadow-agent/uploads")
                os.makedirs(upload_dir, exist_ok=True)
                for att in message.attachments:
                    save_dest = os.path.join(upload_dir, att.filename)
                    try:
                        await att.save(save_dest)
                        logger.info(f"Saved Discord attachment to {save_dest}")
                        att_info = f"[Lampiran berkas: {att.filename} ({att.size} bytes)]"
                        
                        ext = os.path.splitext(att.filename)[1].lower()
                        if ext in ['.txt', '.md', '.markdown', '.json', '.csv', '.log', '.yaml', '.yml', '.py', '.sh', '.html', '.css', '.js', '.ts', '.xml']:
                            try:
                                with open(save_dest, "r", encoding="utf-8", errors="ignore") as f:
                                    file_text = f.read(50000)
                                    att_info += f"\n\n--- ISI DOKUMEN LAMPIRAN ({att.filename}) ---\n{file_text}\n--- AKHIR DOKUMEN LAMPIRAN ---\n"
                            except Exception as fe:
                                logger.warning(f"Could not read text content of {att.filename}: {fe}")
                        att_descs.append(att_info)
                    except Exception as e:
                        logger.warning(f"Could not save attachment {att.filename}: {e}")
                        att_descs.append(f"[Lampiran berkas: {att.filename} (gagal diunduh)]")
                
                clean_query = f"{clean_query}\n\n" + "\n\n".join(att_descs) if clean_query else "\n\n".join(att_descs)

            # If user just mentioned the bot without specific query (e.g. "@Shadow AI Agent")
            if not clean_query.strip():
                clean_query = "Halo! Aku lagi menyapa kamu."

            try:
                async with message.channel.typing():
                    user_name = message.author.display_name
                    reply, attached_files = await asyncio.to_thread(agent.ask, "discord", user_name, clean_query)

                # Prepare discord.File attachments if files were created
                discord_files = []
                for fpath in attached_files:
                    if os.path.exists(fpath):
                        discord_files.append(discord.File(fpath))

                # Safeguard against empty reply to prevent Discord 50006 error
                if not reply or not reply.strip():
                    if discord_files:
                        file_list_str = "\n".join([f"• `{os.path.basename(fp)}`" for fp in attached_files if os.path.exists(fp)])
                        reply = (
                            f"Halo {message.author.display_name}! Berkas yang diminta telah berhasil diproduksi dan langsung terlampir di bawah ini ya:\n"
                            f"{file_list_str}\n\n"
                            f"Silakan diunduh dan dipelajari. Jika ada bagian yang ingin disesuaikan atau diperdalam, kabari aku kapan saja ya!"
                        )
                    else:
                        reply = f"Halo {message.author.display_name}! Permintaanmu sudah selesai diproses dengan baik."

                # Discord message length limit is 2000 chars
                if len(reply) > 1950:
                    parts = [reply[i:i+1900] for i in range(0, len(reply), 1900)]
                    for i, part in enumerate(parts):
                        if i == len(parts) - 1 and discord_files:
                            await message.channel.send(part, files=discord_files)
                        else:
                            await message.channel.send(part)
                else:
                    if discord_files:
                        await message.channel.send(reply, files=discord_files)
                    else:
                        await message.channel.send(reply)
            except Exception as e:
                logger.error(f"Error handling message: {e}", exc_info=True)
                await message.channel.send(f"⚠️ Maaf {message.author.display_name}, bot mengalami kendala: {str(e)[:100]}")

        await bot.process_commands(message)

    if DISCORD_TOKEN == "YOUR_DISCORD_BOT_TOKEN_HERE":
        print("\n[PERHATIAN] DISCORD_BOT_TOKEN belum disetel di environment variables.")
        print("Setel token dengan: export DISCORD_BOT_TOKEN='token_bot_anda'\n")
    else:
        bot.run(DISCORD_TOKEN)

if __name__ == "__main__":
    run_discord_bot()
