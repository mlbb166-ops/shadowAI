# Official Channel References

## Telegram

The official Telegram Bot API documents `setWebhook` for receiving incoming updates as HTTPS POST requests. A webhook can include a `secret_token`; Telegram then sends it in the `X-Telegram-Bot-Api-Secret-Token` header. Telegram also documents `getMe` as the lightweight method for validating bot authentication and `sendMessage` for sending private text replies. Source: https://core.telegram.org/bots/api (accessed 2026-09-16).

## Facebook Messenger

Meta Messenger webhooks can receive real-time Page messages and status updates. A server must support verification GET requests, respond to notifications with HTTP 200 within five seconds, and should validate `X-Hub-Signature-256` using the Meta App Secret. Public customer access requires an app, a Facebook Page, appropriate permissions, and Advanced Access/App Review. Source: https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks (updated 2026-05-05, accessed 2026-09-16).

## Discord

Discord interactions may be delivered to an HTTP interactions endpoint. The endpoint must verify Ed25519 request signatures, respond initially within three seconds, and may use follow-up interaction tokens for up to fifteen minutes. Discord is assigned to internal product, kader, and administrative workflows rather than as the main family channel. Source: https://docs.discord.com/developers/interactions/receiving-and-responding (accessed 2026-09-16).

## WhatsApp

Meta's WhatsApp Business Platform Cloud API supports text, rich media, interactive messages, and incoming/status webhooks. It requires a Business Portfolio, WhatsApp Business Account, and business phone number. User opt-in is required for template messages, and business-initiated messaging can be usage-priced. Source: https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform (updated 2026-08-04, accessed 2026-09-16).
