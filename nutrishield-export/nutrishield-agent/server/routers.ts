import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { analyzeGrowth, buildWeeklyPlan, foodCatalog, runAgentCycle, runGuardrails } from "./nutritionEngine";
import { channelBlueprints, createChannelReply } from "./channelCore";
import { runChannelAgent } from "./channelAgent";

const childInput = z.object({ name: z.string().min(1).max(80), ageMonths: z.number().int().min(0).max(60), allergy: z.string().max(120).default(""), budget: z.number().int().min(5000).max(200000).default(20000), region: z.string().max(60).default("Jawa Barat") });
const measurementInput = z.array(z.object({ month: z.string().min(1).max(20), ageMonths: z.number().int().min(0).max(60), weightKg: z.number().min(1).max(40), heightCm: z.number().min(30).max(150) })).max(36);

const sampleMeasurements = [
  { month: "Mei", ageMonths: 15, weightKg: 8.4, heightCm: 74.2 },
  { month: "Jun", ageMonths: 16, weightKg: 8.7, heightCm: 75.1 },
  { month: "Jul", ageMonths: 17, weightKg: 8.9, heightCm: 76.0 },
  { month: "Agu", ageMonths: 18, weightKg: 9.2, heightCm: 77.1 },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  dashboard: router({
    overview: publicProcedure.input(childInput).query(({ input }) => {
      const guardrails = runGuardrails(input);
      const plan = buildWeeklyPlan(input);
      const growth = analyzeGrowth(sampleMeasurements);
      return {
        greeting: `Selamat datang, keluarga ${input.name}`,
        guardrails,
        today: plan.days[0],
        growth,
        completion: 72,
        streak: 6,
        tasks: [
          { id: 1, label: "Catat porsi makan siang", time: "12.30", done: false, priority: "normal" },
          { id: 2, label: "Tawarkan air putih", time: "14.00", done: true, priority: "normal" },
          { id: 3, label: "Siapkan protein untuk besok", time: "19.00", done: false, priority: "normal" },
        ],
      };
    }),
  }),
  planner: router({
    weekly: publicProcedure.input(childInput).query(({ input }) => buildWeeklyPlan(input)),
  }),
  growth: router({
    analyze: publicProcedure.input(z.object({ measurements: measurementInput })).query(({ input }) => analyzeGrowth(input.measurements)),
    sample: publicProcedure.query(() => sampleMeasurements),
  }),
  agent: router({
    inspect: publicProcedure.input(childInput).query(({ input }) => {
      const guardrails = runGuardrails(input);
      return { child: input, guardrails, selected: guardrails.safeFoods.slice(0, 5), sourceNote: "Snapshot sumber dicatat dengan provenance. Sistem ini adalah pendamping edukasi, bukan diagnosis." };
    }),
    runCycle: publicProcedure.input(z.object({ profile: childInput, measurements: measurementInput.default(sampleMeasurements) })).mutation(({ input }) => runAgentCycle(input.profile, input.measurements)),
    coach: publicProcedure.input(childInput.extend({ question: z.string().min(3).max(500) })).mutation(async ({ input }) => {
      const guardrails = runGuardrails(input);
      const context = guardrails.safeFoods.slice(0, 6).map(item => `${item.name} (${item.role})`).join(", ");
      try {
        const result = await invokeLLM({ messages: [
          { role: "system", content: "Kamu NutriShield Family Coach. Jawab singkat dalam Bahasa Indonesia yang hangat dan sangat mudah dipahami. Gunakan hanya bahan yang lolos filter. Jangan mendiagnosis, jangan memberi dosis obat atau suplemen. Jika ada tanda bahaya atau pertanyaan klinis, arahkan ke tenaga kesehatan. Selalu sebutkan satu tindakan praktis berikutnya." },
          { role: "user", content: `Profil: ${input.name}, ${input.ageMonths} bulan, alergi ${input.allergy || "tidak dicatat"}, wilayah ${input.region}, anggaran harian Rp${input.budget}. Bahan lolos: ${context}. Pertanyaan: ${input.question}` },
        ], maxTokens: 500 });
        const content = result.choices?.[0]?.message?.content;
        return { answer: typeof content === "string" ? content : "Coba mulai dari satu menu sederhana yang sudah lolos pemeriksaan.", usedAI: true, checkedFoods: guardrails.safeFoods.length };
      } catch {
        return { answer: `Mulai dari kombinasi sederhana seperti ${context}. Pilih tekstur sesuai kemampuan makan anak dan konsultasikan kondisi khusus ke Posyandu.`, usedAI: false, checkedFoods: guardrails.safeFoods.length };
      }
    }),
  }),
  knowledge: router({
    sources: publicProcedure.query(() => ({
      stats: { records: 1646, officialIndex: 1146, packaged: 500, highConfidence: 1146 },
      sources: [
        { id: "TKPI-IFCT", name: "Tabel Komposisi Pangan Indonesia / Panganku", type: "Sumber resmi", records: 1146, confidence: "Tinggi", status: "Snapshot terverifikasi", url: "https://www.panganku.org/en-EN/semua_nutrisi", note: "Indeks pangan; detail komposisi perlu validasi per halaman sumber." },
        { id: "OFF-ID", name: "Open Food Facts Indonesia", type: "Database komunitas", records: 500, confidence: "Bervariasi", status: "Perlu cek label", url: "https://world.openfoodfacts.org", note: "Tidak dianggap terverifikasi independen; quality flags dipertahankan." },
        { id: "RULESET", name: "Aturan keselamatan NutriShield", type: "Deterministik", records: 12, confidence: "Dapat diaudit", status: "Versi demo", url: "#", note: "Aturan usia, alergi, tekstur, dan eskalasi. Wajib direview ahli sebelum produksi klinis." },
      ],
      catalog: foodCatalog,
    })),
  }),
  channels: router({
    status: publicProcedure.query(() => ({
      channels: channelBlueprints.map(channel => ({
        ...channel,
        connected: channel.id === "telegram"
          ? Boolean(process.env.TELEGRAM_BOT_TOKEN)
          : channel.id === "messenger"
            ? Boolean(process.env.META_PAGE_ACCESS_TOKEN && process.env.META_VERIFY_TOKEN && process.env.META_APP_SECRET)
            : channel.id === "discord"
              ? Boolean(process.env.DISCORD_PUBLIC_KEY)
              : Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      })),
      architecture: "Satu profil keluarga di web, banyak kanal privat, satu audit trail.",
    })),
    simulate: publicProcedure.input(z.object({
      channel: z.enum(["telegram", "messenger", "discord", "whatsapp"]),
      intent: z.enum(["start", "today_menu", "log_weight", "growth_check", "help"]),
    })).mutation(({ input }) => createChannelReply(input.channel, input.intent)),
    testAI: publicProcedure.input(z.object({
      channel: z.enum(["telegram", "messenger", "discord", "whatsapp"]),
      message: z.string().min(3).max(600),
      profile: childInput,
    })).mutation(({ input }) => runChannelAgent(input)),
  }),
});

export type AppRouter = typeof appRouter;
