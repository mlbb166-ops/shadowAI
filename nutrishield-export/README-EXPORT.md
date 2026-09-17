# NutriShield Agent — Sandbox Export

Arsip ini berisi source proyek NutriShield versi sandbox terbaru, termasuk:

- React + Express + tRPC fullstack app
- Dashboard keluarga, planner, growth, agent center
- AI test console multi-skenario dengan guardrail dan trace ID
- Pusat kanal Telegram, Messenger, Discord, WhatsApp
- Telegram webhook server-side dan skrip konfigurasi BotFather
- Panduan visual pengguna untuk Telegram dan Facebook Messenger
- Unit test, dokumentasi sumber resmi, dan catatan verifikasi visual

## Yang sengaja tidak disertakan

Token BotFather, environment secrets, `node_modules`, hasil build `dist`, log dev, dan repository metadata tidak disertakan.

## Menjalankan lokal

1. Salin environment variables WebDev yang sesuai ke environment server.
2. Jalankan `pnpm install`.
3. Jalankan `pnpm check`, `pnpm test`, dan `pnpm build`.
4. Untuk Telegram, set `TELEGRAM_BOT_TOKEN` secara server-side. Jangan menaruh token dalam source atau commit.
5. Skrip `scripts/configure-telegram.sh` mengatur command dan webhook resmi. Gunakan hanya pada host HTTPS yang memang ingin menerima pesan.

## Status terakhir

- 13 test lulus.
- Production build lulus.
- Telegram `@NutriShieldAIBot` tervalidasi dan webhook sandbox aktif saat export dibuat.
- Domain utama belum disentuh.
