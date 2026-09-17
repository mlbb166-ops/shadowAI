import { describe, expect, it } from "vitest";
import { runChannelAgent } from "./channelAgent";

const profile={name:"Alya",ageMonths:18,allergy:"",budget:20000,region:"Jawa Barat"};

describe("channel AI safety pipeline",()=>{
  it("bypasses generative AI and escalates emergency terms",async()=>{
    const result=await runChannelAgent({channel:"telegram",message:"Anak saya kejang dan bibirnya biru",profile});
    expect(result.risk).toBe("darurat");
    expect(result.usedAI).toBe(false);
    expect(result.answer).toContain("Segera");
    expect(result.agentSteps.at(-1)?.name).toBe("Escalation Agent");
  });

  it("applies allergy filtering before generating or falling back",async()=>{
    const result=await runChannelAgent({channel:"telegram",message:"Buat ide menu murah",profile:{...profile,allergy:"ikan"}});
    expect(result.blocked).toEqual(expect.arrayContaining(["Ikan kembung","Ikan teri segar"]));
    expect(result.safetyChecks).toHaveLength(3);
    expect(result.traceId).toMatch(/^AI-TEL-/);
  });
});
