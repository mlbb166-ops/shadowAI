import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function caller() {
  const ctx: TrpcContext = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

const profile = { name: "Alya", ageMonths: 18, allergy: "", budget: 20000, region: "Jawa Barat" };
const measurements = [
  { month: "Mei", ageMonths: 15, weightKg: 8.4, heightCm: 74.2 },
  { month: "Jun", ageMonths: 16, weightKg: 8.7, heightCm: 75.1 },
  { month: "Jul", ageMonths: 17, weightKg: 8.9, heightCm: 76.0 },
  { month: "Agu", ageMonths: 18, weightKg: 9.2, heightCm: 77.1 },
];

describe("safety and planning", () => {
  it("blocks foods that match a recorded allergy", async () => {
    const result = await caller().agent.inspect({ ...profile, allergy: "ikan" });
    expect(result.guardrails.blocked.map(food => food.name)).toEqual(expect.arrayContaining(["Ikan kembung", "Ikan teri segar"]));
    expect(result.selected.map(food => food.name)).not.toContain("Ikan kembung");
    expect(result.sourceNote).toContain("provenance");
  });

  it("does not create an MPASI plan for a child under six months", async () => {
    const result = await caller().planner.weekly({ ...profile, ageMonths: 4 });
    expect(result.days).toHaveLength(0);
    expect(result.guardrails.redFlags[0]).toContain("di bawah 6 bulan");
  });

  it("keeps each selected menu under the configured daily budget when options exist", async () => {
    const result = await caller().planner.weekly({ ...profile, budget: 10000 });
    expect(result.days).toHaveLength(7);
    expect(result.days.every(day => day.estimate <= 10000)).toBe(true);
    expect(result.coverage).toBeGreaterThan(0);
  });
});

describe("growth sentinel", () => {
  it("detects two consecutive flat weight records and escalates", async () => {
    const result = await caller().growth.analyze({ measurements: [
      { month: "Jun", ageMonths: 16, weightKg: 8.7, heightCm: 75 },
      { month: "Jul", ageMonths: 17, weightKg: 8.7, heightCm: 75.6 },
      { month: "Agu", ageMonths: 18, weightKg: 8.7, heightCm: 76.2 },
    ] });
    expect(result.needsEscalation).toBe(true);
    expect(result.status).toBe("perlu_tindak_lanjut");
  });
});

describe("autonomous agent cycle", () => {
  it("orchestrates five specialized agents and produces auditable next actions", async () => {
    const result = await caller().agent.runCycle({ profile, measurements });
    expect(result.agents).toHaveLength(5);
    expect(result.agents.map(agent => agent.name)).toEqual(["Profile Observer", "Safety Guardian", "Growth Sentinel", "Menu Planner", "Family Coach"]);
    expect(result.nextActions).toHaveLength(3);
    expect(result.runId).toMatch(/^NS-/);
    expect(result.evidenceCount).toBeGreaterThan(0);
  });

  it("returns a safe AI response or deterministic fallback without exposing credentials", async () => {
    const result = await caller().agent.coach({ ...profile, question: "Apa langkah kecil saat anak susah makan sayur?" });
    expect(result.answer.length).toBeGreaterThan(20);
    expect(result.checkedFoods).toBeGreaterThan(0);
    expect(result.answer).not.toContain("BUILT_IN_FORGE_API_KEY");
  });
});
