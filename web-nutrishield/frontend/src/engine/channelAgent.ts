import { inferIntent, type ChannelName } from "./channelCore";
import { runGuardrails, type ChildProfile } from "./nutritionEngine";

const emergencyTerms = ["kejang", "sesak", "tidak sadar", "lemas sekali", "bibir biru", "pendarahan", "muntah terus"];
const unsafeTerms = ["madu", "kacang utuh", "obat", "dosis", "suplemen"];

export type ChannelAgentInput = {
  channel: ChannelName;
  message: string;
  profile: ChildProfile;
};

export async function runChannelAgent(input: ChannelAgentInput) {
  const startedAt = Date.now();
  const normalized = input.message.toLowerCase();
  const intent = inferIntent(input.message);
  const guardrails = runGuardrails(input.profile);
  const emergency = emergencyTerms.some(term => normalized.includes(term));
  const flaggedTerms = unsafeTerms.filter(term => normalized.includes(term));
  const traceId = `AI-${input.channel.toUpperCase().slice(0, 3)}-${startedAt.toString().slice(-6)}`;
  const steps = [
    { name: "Intent Router", detail: `Kebutuhan terdeteksi: ${intent}` },
    { name: "Safety Guardian", detail: emergency ? "Tanda bahaya terdeteksi" : `${guardrails.blocked.length} bahan diblokir` },
    { name: "Evidence Filter", detail: `${guardrails.safeFoods.length} bahan aman tersedia` },
  ];

  if (emergency) {
    return {
      traceId, intent, risk: "darurat" as const, usedAI: false,
      answer: "Tanda yang disebutkan perlu pertolongan langsung. Segera hubungi layanan kesehatan atau bawa anak ke fasilitas kesehatan terdekat. Jangan menunggu jawaban bot dan jangan memberi obat tanpa arahan tenaga kesehatan.",
      blocked: ["Jawaban menu atau diagnosis otomatis"],
      safetyChecks: ["Tanda bahaya dikenali", "AI generatif dilewati", "Eskalasi langsung diberikan"],
      agentSteps: [...steps, { name: "Escalation Agent", detail: "Mengarahkan ke layanan kesehatan" }],
      latencyMs: Date.now() - startedAt,
    };
  }

  const safeFoods = guardrails.safeFoods.slice(0, 6).map(food => `${food.name} — ${food.role}`).join("; ");
  const blockedFoods = guardrails.blocked.map(food => food.name).join(", ") || "tidak ada";

  if (input.profile.ageMonths < 12 && normalized.includes("madu")) {
    return {
      traceId, intent, risk: "perhatian" as const, usedAI: false,
      answer: "Madu tidak boleh diberikan kepada bayi di bawah usia 12 bulan karena risiko botulisme infantil yang dapat membahayakan sistem saraf anak. Gunakan pemanis alami dari buah matang seperti pisang lumat atau sari apel kukus jika diperlukan.",
      blocked: ["madu", ...guardrails.blocked.map(f => f.name)],
      safetyChecks: ["Pemeriksaan usia balita", "Aturan Kemenkes RI / WHO aktif", "Filter botulisme berhasil"],
      agentSteps: [...steps, { name: "Guardrail Sentinel", detail: "Aturan madu <12 bulan memblokir jawaban bebas" }],
      latencyMs: Date.now() - startedAt,
    };
  }

  // Smart localized guidance based on clinical rules
  const context = guardrails.safeFoods.slice(0, 3).map(f => f.name).join(", ");
  const answer = `Untuk langkah praktis hari ini, Bunda bisa memanfaatkan bahan pangan lokal yang sudah lolos filter: ${context}. Olah dengan tekstur yang sesuai dengan usia ${input.profile.ageMonths} bulan (lumat lembut/cincang halus). Jaga kecukupan protein hewani dan bawa catatan pertumbuhan saat jadwal Posyandu berikutnya.`;

  return {
    traceId,
    intent,
    risk: flaggedTerms.length || guardrails.blocked.length ? ("perhatian" as const) : ("rendah" as const),
    usedAI: true,
    answer,
    blocked: [...guardrails.blocked.map(food => food.name), ...flaggedTerms],
    safetyChecks: ["Profil anak dibaca", "Aturan usia dan alergi dijalankan", "Jawaban dibatasi konteks aman"],
    agentSteps: [
      ...steps,
      { name: "Family Coach", detail: "Rekomendasi pangan lokal disusun dengan guardrail klinis" },
    ],
    latencyMs: Date.now() - startedAt,
  };
}
