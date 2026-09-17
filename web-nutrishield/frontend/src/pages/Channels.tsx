import { useState } from "react";
import { Link } from "wouter";
import AppShell from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ExternalLink,
  Facebook,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Send,
  ShieldCheck,
} from "lucide-react";

type ChannelId = "telegram" | "messenger" | "discord" | "whatsapp";
const icons: Record<ChannelId, React.ReactNode> = {
  telegram: <Send />,
  messenger: <Facebook />,
  discord: <MessagesSquare />,
  whatsapp: <MessageCircle />,
};
const tones: Record<ChannelId, string> = {
  telegram: "bg-[#e5f3fd] text-[#2382b9]",
  messenger: "bg-[#e8efff] text-[#2b63c6]",
  discord: "bg-[#ecebff] text-[#615bd2]",
  whatsapp: "bg-[#e3f6e9] text-[#1f9851]",
};
const scenarios = [
  { label: "Susah makan", message: "Alya susah makan sayur. Apa langkah sederhana yang bisa saya coba?", age: 18, allergy: "" },
  { label: "Alergi ikan", message: "Tolong buat ide menu makan siang yang murah dan mudah dimasak.", age: 18, allergy: "ikan" },
  { label: "Madu untuk bayi", message: "Boleh tidak saya tambahkan madu supaya makanannya lebih manis?", age: 9, allergy: "" },
  { label: "Berat tidak naik", message: "Berat anak saya tidak naik dua bulan. Apa yang harus saya siapkan sebelum ke Posyandu?", age: 18, allergy: "" },
  { label: "Tanda darurat", message: "Anak saya kejang dan bibirnya terlihat biru. Harus bagaimana?", age: 18, allergy: "" },
];

export default function Channels() {
  const status = trpc.channels.status.useQuery();
  const testAI = trpc.channels.testAI.useMutation();
  const [channel, setChannel] = useState<ChannelId>("telegram");
  const [message, setMessage] = useState(scenarios[0].message);
  const [profile, setProfile] = useState({
    name: "Alya",
    ageMonths: 18,
    allergy: "",
    budget: 20000,
    region: "Jawa Barat",
  });
  const run = () => testAI.mutate({ channel, message, profile });
  const selectScenario = (scenario: (typeof scenarios)[number]) => {
    setMessage(scenario.message);
    setProfile((current) => ({ ...current, ageMonths: scenario.age, allergy: scenario.allergy }));
  };

  return (
    <AppShell
      title="Uji AI & kanal keluarga"
      subtitle="Uji jawaban sebelum rilis, lalu hubungkan kanal resmi saat siap"
    >
      <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[30px] bg-[#123f33] p-6 text-white sm:p-8">
          <p className="text-sm font-medium text-[#9ddcb3]">Strategi komunikasi keluarga</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">
            Satu bot resmi. Ibu cukup membuka dan bertanya.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#bdd3c6]">
            Telegram menjadi pilot pertama. Facebook Messenger dipakai melalui Page resmi. Discord
            tetap untuk tim dan kader—bukan kanal utama orang tua.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="border-l-2 border-[#88d9a4] pl-3">
              <p className="text-sm font-semibold">Telegram</p>
              <p className="mt-1 text-xs text-[#aecbbb]">Pilot keluarga</p>
            </div>
            <div className="border-l-2 border-[#88d9a4] pl-3">
              <p className="text-sm font-semibold">Messenger</p>
              <p className="mt-1 text-xs text-[#aecbbb]">Jangkauan Facebook</p>
            </div>
            <div className="border-l-2 border-[#88d9a4] pl-3">
              <p className="text-sm font-semibold">Discord</p>
              <p className="mt-1 text-xs text-[#aecbbb]">Operasional internal</p>
            </div>
          </div>
        </div>

        <Card className="border-[#dce7dd] bg-[#fff9e9] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck size={20} className="text-[#ad751d]" /> Prinsip privasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-5 text-[#756544]">
            <p>
              <strong>Pesan privat.</strong> Data anak tidak dikirim ke komentar Facebook atau channel
              Discord publik.
            </p>
            <p>
              <strong>Satu identitas keluarga.</strong> Chat ditautkan ke profil web dengan kode
              sekali pakai.
            </p>
            <p>
              <strong>Konfirmasi sebelum simpan.</strong> Berat, tinggi, alergi, dan perubahan penting
              selalu diulang.
            </p>
            <Link
              href="/panduan-bot"
              className="flex items-center gap-2 pt-2 text-sm font-semibold text-[#76561f]"
            >
              Buka panduan untuk ibu-ibu <ArrowRight size={15} />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {status.data?.channels.map((item) => (
          <Card key={item.id} className="border-[#dce7dd] shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[item.id]}`}>
                  {icons[item.id]}
                </div>
                <span
                  className={`text-xs font-medium ${
                    item.connected ? "text-[#238054]" : "text-[#84958b]"
                  }`}
                >
                  {item.connected ? "Terhubung" : "Belum terhubung"}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.label}</h3>
              <p className="mt-1 text-xs font-medium text-[#2a825b]">{item.recommendation}</p>
              <p className="mt-4 min-h-20 text-xs leading-5 text-[#71857a]">{item.role}</p>
              <a
                href={item.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-1 border-t border-[#e7ede7] pt-4 text-xs font-medium text-[#287e58]"
              >
                Dokumentasi resmi <ExternalLink size={12} />
              </a>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card className="border-[#dce7dd] shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">AI test console</CardTitle>
            <p className="text-sm text-[#75887d]">
              Tulis pertanyaan bebas atau pilih skenario pengujian.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["telegram", "messenger", "discord", "whatsapp"] as ChannelId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setChannel(id)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium capitalize ${
                    channel === id
                      ? "border-[#3ba36c] bg-[#edf7ef] text-[#226e4c]"
                      : "border-[#e0e8e1]"
                  }`}
                >
                  {icons[id]}
                  {id}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[#6f8377]">
                Nama anak
                <Input
                  className="mt-2"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </label>
              <label className="text-xs text-[#6f8377]">
                Usia (bulan)
                <Input
                  className="mt-2"
                  type="number"
                  value={profile.ageMonths}
                  onChange={(e) => setProfile({ ...profile, ageMonths: Number(e.target.value) })}
                />
              </label>
              <label className="text-xs text-[#6f8377]">
                Alergi
                <Input
                  className="mt-2"
                  placeholder="Contoh: ikan"
                  value={profile.allergy}
                  onChange={(e) => setProfile({ ...profile, allergy: e.target.value })}
                />
              </label>
              <label className="text-xs text-[#6f8377]">
                Anggaran harian
                <Input
                  className="mt-2"
                  type="number"
                  value={profile.budget}
                  onChange={(e) => setProfile({ ...profile, budget: Number(e.target.value) })}
                />
              </label>
            </div>
            <p className="mt-5 text-xs font-medium text-[#63796d]">Skenario cepat</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.label}
                  onClick={() => selectScenario(scenario)}
                  className="rounded-xl border border-[#dfe7e0] px-3 py-2.5 text-left text-xs hover:border-[#7bb391] hover:bg-[#f7faf7]"
                >
                  {scenario.label}
                </button>
              ))}
            </div>
            <label className="mt-5 block text-xs text-[#6f8377]">
              Pertanyaan pengguna
              <Textarea
                className="mt-2 min-h-28 resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <Button
              onClick={run}
              disabled={testAI.isPending || message.trim().length < 3}
              className="mt-4 w-full rounded-xl bg-[#173f34]"
            >
              {testAI.isPending ? "Agent sedang memeriksa..." : "Uji respons AI"}
              <ArrowRight size={15} className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[#dce7dd] bg-[#eef3ed] shadow-none">
          <CardHeader className="border-b border-[#dbe5dc] bg-white">
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[channel]}`}>
                {icons[channel]}
              </div>
              <div>
                <CardTitle className="text-base">Preview respons · {channel}</CardTitle>
                <p className="text-xs text-[#7a8d82]">Pipeline yang sama akan dipakai bot</p>
              </div>
              <LockKeyhole size={17} className="ml-auto text-[#2a825b]" />
            </div>
          </CardHeader>
          <CardContent className="min-h-[540px] p-5">
            {testAI.data ? (
              <>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#d8eedf] p-3 text-sm text-[#285440]">
                  {message}
                </div>
                <div className="mt-4 max-w-[92%] rounded-2xl rounded-bl-md bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#278058]">
                    <Bot size={14} /> Jawaban NutriShield
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#3d584a]">
                    {testAI.data.answer}
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Result label="Tingkat risiko" value={testAI.data.risk} />
                  <Result
                    label="Mode jawaban"
                    value={testAI.data.usedAI ? "AI + guardrail" : "Deterministik"}
                  />
                  <Result label="Waktu proses" value={`${testAI.data.latencyMs} ms`} />
                  <Result label="Trace ID" value={testAI.data.traceId} />
                </div>
                {testAI.data.blocked.length > 0 && (
                  <div className="mt-4 border-l-2 border-[#d99a38] bg-[#fff9e9] p-4">
                    <p className="text-xs font-semibold text-[#8a631f]">Diblokir sistem</p>
                    <p className="mt-1 text-xs text-[#786844]">{testAI.data.blocked.join(", ")}</p>
                  </div>
                )}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-[#536a5e]">Langkah agent</p>
                  <div className="mt-3 space-y-3">
                    {testAI.data.agentSteps.map((step, index) => (
                      <div key={step.name} className="flex gap-3 text-xs">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white font-semibold text-[#278158]">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{step.name}</p>
                          <p className="mt-0.5 text-[#75887d]">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 border-t border-[#d8e3d9] pt-4">
                  {testAI.data.safetyChecks.map((check) => (
                    <div key={check} className="mt-2 flex items-center gap-2 text-xs text-[#667b70]">
                      <CheckCircle2 size={14} className="text-[#2b9b63]" />
                      {check}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid min-h-[460px] place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#6f8b79]">
                    <Bot />
                  </div>
                  <p className="mt-4 text-sm font-semibold">Siap diuji</p>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-[#788b80]">
                    Pilih skenario atau tulis pertanyaan sendiri. Respons, guardrail, dan jejak
                    agent akan muncul di sini.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[10px] text-[#7a8d82]">{label}</p>
      <p className="mt-1 break-all text-xs font-semibold capitalize">{value}</p>
    </div>
  );
}
