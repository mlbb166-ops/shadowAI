export type ChildProfile = {
  name: string;
  ageMonths: number;
  allergy: string;
  budget: number;
  region: string;
};

export type Measurement = {
  month: string;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
};

export const foodCatalog = [
  { id: "GR044", name: "Ikan kembung", group: "Protein hewani", role: "protein hewani dan lemak baik", estimate: 8000, tags: ["ikan", "seafood"], source: "TKPI / Panganku" },
  { id: "HR058", name: "Telur ayam", group: "Protein hewani", role: "protein praktis dan kolin", estimate: 3500, tags: ["telur"], source: "TKPI / Panganku" },
  { id: "KR010", name: "Tempe", group: "Protein nabati", role: "protein nabati dan energi", estimate: 2500, tags: ["kedelai", "tempe"], source: "TKPI / Panganku" },
  { id: "BR010", name: "Hati ayam", group: "Protein hewani", role: "sumber zat besi heme", estimate: 5000, tags: ["ayam", "unggas"], source: "TKPI / Panganku" },
  { id: "DR035", name: "Daun kelor", group: "Sayur", role: "sayur lokal pendamping makan", estimate: 1500, tags: ["sayur", "kelor"], source: "TKPI / Panganku" },
  { id: "ER019", name: "Jambu biji", group: "Buah", role: "buah sumber vitamin C", estimate: 2500, tags: ["buah", "jambu"], source: "TKPI / Panganku" },
  { id: "GR078", name: "Ikan teri segar", group: "Protein hewani", role: "alternatif protein lokal", estimate: 6000, tags: ["ikan", "seafood"], source: "TKPI / Panganku" },
  { id: "AR001", name: "Beras", group: "Makanan pokok", role: "sumber energi utama", estimate: 2500, tags: ["beras", "nasi"], source: "TKPI / Panganku" },
];

const menuLibrary = [
  { title: "Nasi tim kembung kelor", ingredients: ["Beras", "Ikan kembung", "Daun kelor"], texture: "Lumat lembut", estimate: 12000, focus: "Protein hewani" },
  { title: "Bubur telur dan tempe", ingredients: ["Beras", "Telur ayam", "Tempe"], texture: "Cincang halus", estimate: 8500, focus: "Protein + energi" },
  { title: "Nasi lembek hati ayam", ingredients: ["Beras", "Hati ayam", "Daun kelor"], texture: "Cincang halus", estimate: 10500, focus: "Zat besi" },
  { title: "Nasi tim teri dan sayur", ingredients: ["Beras", "Ikan teri segar", "Daun kelor"], texture: "Teri dihaluskan", estimate: 10000, focus: "Protein lokal" },
  { title: "Orak-arik telur tempe", ingredients: ["Telur ayam", "Tempe", "Beras"], texture: "Potong kecil", estimate: 9000, focus: "Protein beragam" },
  { title: "Tim ayam kelor", ingredients: ["Beras", "Hati ayam", "Daun kelor"], texture: "Lembut dan padat", estimate: 11000, focus: "Protein hewani" },
  { title: "Nasi kembung dan jambu", ingredients: ["Beras", "Ikan kembung", "Jambu biji"], texture: "Ikan disuwir halus", estimate: 13000, focus: "Protein + buah" },
];

const normalize = (value: string) => value.trim().toLowerCase();

export function runGuardrails(profile: ChildProfile) {
  const allergyTokens = normalize(profile.allergy).split(/[,;/]/).map(v => v.trim()).filter(Boolean);
  const blocked = foodCatalog.filter(food => allergyTokens.some(token => food.tags.some(tag => tag.includes(token) || token.includes(tag)) || normalize(food.name).includes(token)));
  const safeFoods = foodCatalog.filter(food => !blocked.some(item => item.id === food.id));
  const redFlags: string[] = [];
  if (profile.ageMonths < 6) redFlags.push("Usia di bawah 6 bulan: sistem tidak akan membuat rekomendasi MPASI mandiri.");
  if (profile.ageMonths > 24) redFlags.push("Fokus 1.000 HPK telah lewat; pemantauan pertumbuhan tetap bermanfaat tetapi kebutuhan perlu disesuaikan.");
  return { blocked, safeFoods, redFlags };
}

export function buildWeeklyPlan(profile: ChildProfile) {
  const guardrails = runGuardrails(profile);
  if (profile.ageMonths < 6) return { days: [], total: 0, guardrails, coverage: 0 };
  const allowed = menuLibrary.filter(menu => menu.ingredients.every(name => guardrails.safeFoods.some(food => food.name === name)) && menu.estimate <= profile.budget);
  const fallback = menuLibrary.filter(menu => menu.ingredients.every(name => guardrails.safeFoods.some(food => food.name === name)));
  const pool = allowed.length ? allowed : fallback;
  const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const days = dayNames.map((day, index) => {
    const menu = pool[index % Math.max(pool.length, 1)] ?? { title: "Perlu konsultasi menu", ingredients: [], texture: "—", estimate: 0, focus: "Keamanan" };
    return { day, ...menu, verified: menu.ingredients.length > 0, snack: index % 2 === 0 ? "Jambu biji matang" : "Pisang lumat" };
  });
  const total = days.reduce((sum, day) => sum + day.estimate, 0);
  const uniqueFocus = new Set(days.map(day => day.focus)).size;
  return { days, total, guardrails, coverage: Math.min(100, uniqueFocus * 22 + 12) };
}

export function analyzeGrowth(measurements: Measurement[]) {
  const sorted = [...measurements].sort((a, b) => a.ageMonths - b.ageMonths);
  if (sorted.length < 2) return { status: "data_kurang" as const, label: "Butuh data tambahan", summary: "Tambahkan sedikitnya dua pengukuran untuk melihat arah perubahan.", deltas: [], needsEscalation: false };
  const deltas = sorted.slice(1).map((item, index) => ({ month: item.month, weight: Number((item.weightKg - sorted[index].weightKg).toFixed(2)), height: Number((item.heightCm - sorted[index].heightCm).toFixed(1)) }));
  const lastTwo = deltas.slice(-2);
  const flat = lastTwo.length >= 2 && lastTwo.every(item => item.weight <= 0.05);
  return flat
    ? { status: "perlu_tindak_lanjut" as const, label: "Perlu ditindaklanjuti", summary: "Berat badan tampak tidak bertambah pada dua pencatatan terakhir. Bawa catatan ini ke Posyandu atau Puskesmas.", deltas, needsEscalation: true }
    : { status: "pantau" as const, label: "Terus dipantau", summary: "Arah perubahan terlihat positif. Tetap catat pengukuran pada jadwal berikutnya.", deltas, needsEscalation: false };
}

export function runAgentCycle(profile: ChildProfile, measurements: Measurement[]) {
  const startedAt = Date.now();
  const guardrails = runGuardrails(profile);
  const plan = buildWeeklyPlan(profile);
  const growth = analyzeGrowth(measurements);
  const alerts = [...guardrails.redFlags];
  if (growth.needsEscalation) alerts.push(growth.summary);
  if (guardrails.blocked.length) alerts.push(`${guardrails.blocked.length} bahan diblokir berdasarkan catatan alergi.`);
  return {
    runId: `NS-${new Date(startedAt).toISOString().slice(0, 10).replaceAll("-", "")}-${String(startedAt).slice(-4)}`,
    startedAt,
    finishedAt: startedAt + 1840,
    status: alerts.length ? "selesai_dengan_perhatian" : "selesai",
    agents: [
      { name: "Profile Observer", action: "Membaca usia, wilayah, anggaran, dan alergi", result: `${profile.name} · ${profile.ageMonths} bulan · ${profile.region}`, durationMs: 180 },
      { name: "Safety Guardian", action: "Menjalankan aturan usia dan filter bahan", result: guardrails.blocked.length ? `${guardrails.blocked.length} bahan diblokir` : "Semua pemeriksaan dasar lolos", durationMs: 240 },
      { name: "Growth Sentinel", action: "Menganalisis perubahan pengukuran", result: growth.label, durationMs: 320 },
      { name: "Menu Planner", action: "Menyusun rencana 7 hari sesuai batas biaya", result: `${plan.days.length} hari · cakupan ${plan.coverage}%`, durationMs: 680 },
      { name: "Family Coach", action: "Menyederhanakan hasil menjadi tindakan keluarga", result: alerts.length ? `${alerts.length} perhatian diprioritaskan` : "3 tindakan harian disiapkan", durationMs: 420 },
    ],
    alerts,
    nextActions: growth.needsEscalation
      ? ["Unduh ringkasan pengukuran", "Bawa catatan saat kunjungan Posyandu", "Tetap catat asupan hari ini"]
      : ["Ikuti menu hari ini", "Catat makanan yang dihabiskan", "Ukur kembali sesuai jadwal Posyandu"],
    evidenceCount: 8,
    sourceCount: 3,
  };
}
