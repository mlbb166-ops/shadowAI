import { describe, expect, it } from "vitest";

const token = process.env.TELEGRAM_BOT_TOKEN;

describe("Telegram BotFather credential", () => {
  it.skipIf(!token)("authenticates with Telegram getMe", async () => {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json() as { ok?: boolean; result?: { id?: number; is_bot?: boolean; username?: string }; description?: string };
    expect(response.ok, payload.description ?? "Telegram getMe failed").toBe(true);
    expect(payload.ok).toBe(true);
    expect(payload.result?.is_bot).toBe(true);
    expect(payload.result?.username?.length).toBeGreaterThan(3);
  }, 15_000);
});
