import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Facebook,
  LockKeyhole,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  UserRound,
  Check,
  Bot,
} from "lucide-react";
import { useState } from "react";

const telegramSteps = [
  {
    title: "Buka bot resmi NutriShield",
    text: "Tekan tautan dari website atau cari username bot resmi yang ditampilkan oleh NutriShield.",
    icon: <Search />,
  },
  {
    title: "Tekan tombol Start",
    text: "Bunda tidak perlu membuat bot, token, atau akun baru. Cukup mulai percakapan.",
    icon: <Send />,
  },
  {
    title: "Pilih kebutuhan",
    text: "Pilih Menu hari ini, Catat berat, Cek pertumbuhan, atau Bantuan.",
    icon: <MessageCircle />,
  },
  {
    title: "Konfirmasi sebelum menyimpan",
    text: "Bot akan mengulang data berat, tinggi, atau alergi agar tidak salah catat.",
    icon: <Check />,
  },
];

const facebookSteps = [
  {
    title: "Buka Facebook Page NutriShield",
    text: "Pengguna membuka Page resmi, bukan akun Facebook pribadi pengelola.",
    icon: <Facebook />,
  },
  {
    title: "Tekan Kirim Pesan",
    text: "Percakapan berlangsung privat melalui Messenger, bukan di kolom komentar.",
    icon: <MessageCircle />,
  },
  {
    title: "Ketik Mulai atau pilih menu",
    text: "Gunakan tombol singkat yang mudah dibaca untuk bertanya menu dan pertumbuhan.",
    icon: <Bot />,
  },
  {
    title: "Buka website untuk detail",
    text: "Grafik, profil anak, persetujuan data, dan laporan lengkap tetap dibuka di website.",
    icon: <Smartphone />,
  },
];

export default function BotGuide() {
  const [tab, setTab] = useState<"telegram" | "facebook">("telegram");
  const steps = tab === "telegram" ? telegramSteps : facebookSteps;

  return (
    <AppShell
      title="Panduan memakai bot"
      subtitle="Petunjuk sederhana untuk keluarga, tanpa istilah teknis"
    >
      <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="text-sm font-medium text-[#2b805a]">Panduan untuk orang tua</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">
            Tidak perlu membuat bot sendiri.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#6d8276]">
            Tim NutriShield mengelola satu bot resmi. Ibu cukup membuka bot, menekan Start, lalu
            memilih bantuan. Untuk Facebook, tim mengelola satu Facebook Page resmi; akun pribadi
            hanya dipakai admin untuk mengelola Page, bukan sebagai bot yang dilihat pengguna.
          </p>
          <a href="https://t.me/NutriShieldAIBot" target="_blank" rel="noreferrer">
            <Button className="mt-5 h-13 rounded-xl bg-[#173f34] px-8 text-base font-bold text-white shadow-md hover:bg-[#225647] hover:scale-105 transition-all">
              Buka @NutriShieldAIBot <ExternalLink size={18} className="ml-2" />
            </Button>
          </a>
          <div className="mt-6 grid gap-3">
            <div className="flex gap-3 rounded-2xl border border-[#dce7dd] bg-white p-4">
              <ShieldCheck className="shrink-0 text-[#278158]" />
              <div>
                <p className="text-sm font-semibold">Pastikan akun resmi</p>
                <p className="mt-1 text-xs leading-5 text-[#71857a]">
                  Masuk dari tautan website NutriShield. Jangan kirim data anak ke akun yang tidak
                  dikenal.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-[#efdcb7] bg-[#fff9ea] p-4">
              <LockKeyhole className="shrink-0 text-[#a87421]" />
              <div>
                <p className="text-sm font-semibold">Jangan bagikan data sensitif</p>
                <p className="mt-1 text-xs leading-5 text-[#776744]">
                  Bot tidak akan meminta NIK, foto kartu keluarga, kata sandi, atau kode OTP.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-[30px] border border-[#dce7dd] bg-white">
          <div className="grid grid-cols-2 border-b border-[#e1e9e1]">
            <button
              onClick={() => setTab("telegram")}
              className={`flex items-center justify-center gap-2 p-4 text-sm font-semibold ${
                tab === "telegram"
                  ? "border-b-2 border-[#25855a] bg-[#f2f8f3] text-[#21734e]"
                  : "text-[#71847a]"
              }`}
            >
              <Send size={18} /> Telegram
            </button>
            <button
              onClick={() => setTab("facebook")}
              className={`flex items-center justify-center gap-2 p-4 text-sm font-semibold ${
                tab === "facebook"
                  ? "border-b-2 border-[#3169c6] bg-[#f2f5fc] text-[#315da8]"
                  : "text-[#71847a]"
              }`}
            >
              <Facebook size={18} /> Facebook
            </button>
          </div>
          <div className="p-5 sm:p-7">
            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="grid grid-cols-[44px_1fr] gap-4 rounded-2xl bg-[#f8faf7] p-4"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[#278158] shadow-sm">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#2b805a]">LANGKAH {index + 1}</p>
                    <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#71857a]">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-3">
        <GuideCard
          icon={<UserRound />}
          title="Siapa yang membuat bot?"
          text="Hanya tim NutriShield. Pengguna tidak perlu membuka BotFather atau Meta Developer."
        />
        <GuideCard
          icon={<LockKeyhole />}
          title="Siapa yang melihat chat?"
          text="Pesan masuk ke sistem NutriShield. Data tidak boleh diteruskan ke grup atau komentar publik."
        />
        <GuideCard
          icon={<Smartphone />}
          title="Kapan kembali ke website?"
          text="Saat mengelola profil, melihat grafik, memberi persetujuan, atau mengunduh laporan."
        />
      </section>
    </AppShell>
  );
}

function GuideCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card className="border-[#dce7dd] shadow-none">
      <CardContent className="p-5">
        <div className="text-[#28815a]">{icon}</div>
        <h3 className="mt-5 text-base font-semibold">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-[#71857a]">{text}</p>
      </CardContent>
    </Card>
  );
}
