import { describe, expect, it } from "vitest";
import { channelBlueprints, createChannelReply, inferIntent } from "./channelCore";

 describe("channel strategy", () => {
  it("defines distinct roles for four channels", () => {
    expect(channelBlueprints.map(item => item.id)).toEqual(["telegram", "messenger", "discord", "whatsapp"]);
    expect(channelBlueprints.find(item => item.id === "discord")?.recommendation).toContain("Bukan kanal utama");
    expect(channelBlueprints.find(item => item.id === "telegram")?.priority).toBe("Pilot pertama");
  });

  it("classifies common parent messages deterministically", () => {
    expect(inferIntent("menu hari ini apa?" )).toBe("today_menu");
    expect(inferIntent("mau catat berat 9,2 kg")).toBe("log_weight");
    expect(inferIntent("cek tumbuh anak")).toBe("growth_check");
  });

  it("produces a traceable response with safety checks", () => {
    const reply = createChannelReply("telegram", "today_menu");
    expect(reply.traceId).toMatch(/^CH-TEL-/);
    expect(reply.safetyChecks).toHaveLength(3);
    expect(reply.message).toContain("duri ikan");
  });
});
