import { invokeLLM } from "./_core/llm";
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
  const ageWarning = input.profile.ageMonths < 12 && normalized.includes("madu")
    ? "Madu disebut untuk anak di bawah 12 bulan; tolak dan jelaskan secara singkat."
    : "";

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "Kamu NutriShield Family Coach untuk orang tua Indonesia. Jawab dalam 3-6 kalimat yang hangat, sederhana, dan dapat dilakukan. Jangan mendiagnosis. Jangan memberi dosis obat atau suplemen. Hanya gunakan bahan yang tercantum sebagai aman. Jika data kurang, tanyakan satu hal terpenting. Akhiri dengan satu langkah praktis. Jangan mengklaim rekomendasi sebagai nasihat medis." },
        { role: "user", content: `Kanal: ${input.channel}. Profil anak: ${input.profile.name}, ${input.profile.ageMonths} bulan, alergi: ${input.profile.allergy || "belum dicatat"}, wilayah: ${input.profile.region}, anggaran: Rp${input.profile.budget}/hari. Bahan aman: ${safeFoods}. Bahan diblokir: ${blockedFoods}. Peringatan sistem: ${ageWarning || "tidak ada"}. Pesan orang tua: ${input.message}` },
      ],
      maxTokens: 520,
    });
    const content = result.choices?.[0]?.message?.content;
    const answer = typeof content === "string" ? content : "Saya belum bisa menyusun jawaban. Silakan coba kalimat yang lebih singkat.";
    return {
      traceId, intent, risk: flaggedTerms.length || guardrails.blocked.length ? "perhatian" as const : "rendah" as const,
      usedAI: true, answer,
      blocked: [...guardrails.blocked.map(food => food.name), ...flaggedTerms],
      safetyChecks: ["Profil anak dibaca", "Aturan usia dan alergi dijalankan", "Jawaban AI dibatasi konteks aman"],
      agentSteps: [...steps, { name: "Family Coach", detail: "AI menyusun bahasa ramah keluarga" }],
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return {
      traceId, intent, risk: "rendah" as const, usedAI: false,
      answer: `Untuk langkah aman sekarang, pilih satu bahan yang sudah lolos pemeriksaan seperti ${guardrails.safeFoods.slice(0, 3).map(food => food.name).join(", ")}. Sesuaikan tekstur dengan kemampuan makan anak dan konsultasikan keluhan kesehatan khusus ke Posyandu atau tenaga kesehatan.`,
      blocked: guardrails.blocked.map(food => food.name),
      safetyChecks: ["Profil anak dibaca", "Aturan keselamatan dijalankan", "Fallback aman digunakan"],
      agentSteps: [...steps, { name: "Safe Fallback", detail: "Layanan AI tidak tersedia; jawaban deterministik dipakai" }],
      latencyMs: Date.now() - startedAt,
    };
  }
}
