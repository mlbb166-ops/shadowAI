export type ChannelName = "telegram" | "messenger" | "discord" | "whatsapp";
export type ChannelIntent = "start" | "today_menu" | "log_weight" | "growth_check" | "help";

export const channelBlueprints = [
  {
    id: "telegram" as const,
    label: "Telegram",
    audience: "Orang tua dan keluarga pilot",
    role: "Konsultasi pribadi, menu harian, pencatatan cepat, dan pengingat opt-in.",
    priority: "Pilot pertama",
    recommendation: "Direkomendasikan",
    privacy: "Percakapan privat dengan bot; tautkan profil memakai kode sekali pakai.",
    requirements: ["Bot token dari BotFather", "Webhook HTTPS", "Secret token webhook"],
    officialUrl: "https://core.telegram.org/bots/api",
  },
  {
    id: "messenger" as const,
    label: "Facebook Messenger",
    audience: "Orang tua pengguna Facebook Page",
    role: "Icebreaker sederhana, tanya menu, edukasi, dan rujukan ke dashboard.",
    priority: "Tahap kedua",
    recommendation: "Jangkauan keluarga",
    privacy: "Gunakan pesan privat Page, bukan komentar publik atau grup.",
    requirements: ["Meta App", "Facebook Page", "App Review untuk pengguna publik", "Page access token"],
    officialUrl: "https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks",
  },
  {
    id: "discord" as const,
    label: "Discord",
    audience: "Tim produk, kader terpilih, dan administrator",
    role: "Command operasional, notifikasi kasus anonim, review agent, dan audit teknis.",
    priority: "Internal",
    recommendation: "Bukan kanal utama orang tua",
    privacy: "Jangan kirim nama lengkap atau data kesehatan anak ke channel publik.",
    requirements: ["Discord Application", "Public key", "Interactions endpoint", "Slash commands"],
    officialUrl: "https://docs.discord.com/developers/interactions/receiving-and-responding",
  },
  {
    id: "whatsapp" as const,
    label: "WhatsApp",
    audience: "Keluarga umum setelah pilot tervalidasi",
    role: "Kanal paling familiar untuk pengingat, menu, dan tindak lanjut terstruktur.",
    priority: "Tahap lanjutan",
    recommendation: "Potensi adopsi tertinggi",
    privacy: "Wajib opt-in; pesan proaktif di luar service window memakai template yang disetujui.",
    requirements: ["Meta Business Portfolio", "WhatsApp Business Account", "Nomor bisnis", "Cloud API token"],
    officialUrl: "https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform",
  },
];

const replies: Record<ChannelIntent, { title: string; message: string; actions: string[] }> = {
  start: {
    title: "Mulai dengan aman",
    message: "Halo, Bunda. Saya NutriShield. Saya bisa membantu melihat menu hari ini, mencatat pertumbuhan, dan menyiapkan pertanyaan untuk Posyandu. Saya bukan pengganti tenaga kesehatan.",
    actions: ["Lihat menu hari ini", "Catat berat", "Cek pertumbuhan"],
  },
  today_menu: {
    title: "Menu hari ini",
    message: "Ide hari ini: nasi tim ikan kembung dan daun kelor, tekstur lumat lembut. Perkiraan bahan Rp12.000. Pastikan semua duri ikan sudah disisihkan.",
    actions: ["Lihat cara memasak", "Ganti bahan", "Sudah dimakan"],
  },
  log_weight: {
    title: "Catat berat dengan konfirmasi",
    message: "Ketik berat dalam kilogram, misalnya: 9,2. Saya akan mengulang angkanya untuk Bunda konfirmasi sebelum menyimpan ke profil anak.",
    actions: ["Masukkan berat", "Batal"],
  },
  growth_check: {
    title: "Ringkasan pertumbuhan",
    message: "Catatan terakhir bergerak positif. Tetap ukur sesuai jadwal Posyandu. Jika berat tidak bertambah pada dua pencatatan berurutan, bawa ringkasan ke tenaga kesehatan.",
    actions: ["Buka grafik", "Jadwal Posyandu", "Unduh ringkasan"],
  },
  help: {
    title: "Pilih bantuan",
    message: "Pilih kebutuhan Bunda. Untuk kondisi darurat, anak sangat lemas, sesak, kejang, atau tidak sadar, segera cari layanan kesehatan—jangan menunggu jawaban bot.",
    actions: ["Menu", "Pertumbuhan", "Alergi", "Hubungi layanan kesehatan"],
  },
};

export function createChannelReply(channel: ChannelName, intent: ChannelIntent) {
  const reply = replies[intent];
  return {
    channel,
    intent,
    ...reply,
    safetyChecks: ["Kanal privat diperiksa", "Tidak membuat diagnosis", "Tindakan berisiko diblokir"],
    traceId: `CH-${channel.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
  };
}

export function inferIntent(text: string): ChannelIntent {
  const normalized = text.trim().toLowerCase();
  if (normalized.includes("menu") || normalized.includes("makan")) return "today_menu";
  if (normalized.includes("berat") || normalized.includes("kg")) return "log_weight";
  if (normalized.includes("tumbuh") || normalized.includes("tinggi")) return "growth_check";
  if (normalized.includes("bantu") || normalized.includes("darurat") || normalized.includes("sakit")) return "help";
  return "start";
}

export function formatPlainReply(text: string, channel: Exclude<ChannelName, "whatsapp">) {
  const reply = createChannelReply(channel, inferIntent(text));
  return `${reply.message}\n\nPilihan: ${reply.actions.join(" · ")}\n\nID proses: ${reply.traceId}`;
}
