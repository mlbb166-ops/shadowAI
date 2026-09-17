import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Baby,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  HeartPulse,
  LoaderCircle,
  Plus,
  Ruler,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { endpoints, asList, asRecord, text, type ApiRecord } from "@/api";

function formatDate(value: unknown) {
  if (!value) return "Belum ada";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function statusLabel(value: unknown) {
  return text(value, "selesai").replaceAll("_", " ");
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ApiRecord>({});
  const [activeChildId, setActiveChildId] = useState("");
  const [modal, setModal] = useState<"child" | "measurement" | null>(null);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<ApiRecord | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<ApiRecord[]>([]);
  const [linkCode, setLinkCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = asRecord(await endpoints.dashboard());
      setDashboard(next);
      const children = asList(next.children);
      setActiveChildId((current) => current || text(children[0]?.id, ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dashboard gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const children = asList(dashboard.children);
  const activeChild = children.find((item) => text(item.id) === activeChildId) || children[0];
  const latest = asRecord(activeChild?.latest_measurement);
  const runs = asList(dashboard.latest_runs);
  const pendingJobs = asList(dashboard.pending_jobs);
  const foodStats = asRecord(dashboard.food_stats);
  const telegram = asRecord(dashboard.telegram);
  const telegramIdentity = asRecord(telegram.identity);
  const user = asRecord(dashboard.user);
  const hasMeasurement = Boolean(latest.id);

  useEffect(() => {
    if (pendingJobs.length === 0) return;
    const timer = window.setTimeout(() => void load(), 1500);
    return () => window.clearTimeout(timer);
  }, [pendingJobs.length, load]);

  const nextAction = useMemo(() => {
    if (!activeChild) return { title: "Buat profil anak", body: "Mulai dengan data dasar yang singkat.", action: "child" as const };
    if (!hasMeasurement) return { title: "Catat pengukuran pertama", body: "Berat atau tinggi diperlukan untuk melihat perubahan.", action: "measurement" as const };
    if (!telegram.linked) return { title: "Hubungkan Telegram", body: "Gunakan satu kode privat untuk profil yang dipilih.", action: "telegram" as const };
    return { title: "Tanyakan satu kebutuhan hari ini", body: "Agent akan menjalankan delapan tahap dan menyimpan jejaknya.", action: "assistant" as const };
  }, [activeChild, hasMeasurement, telegram.linked]);

  async function createChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    try {
      const result = asRecord(await endpoints.createChild({
        name: form.get("name"),
        birth_date: form.get("birth_date") || null,
        sex: form.get("sex") || "unspecified",
        allergies: form.get("allergies") || "",
        notes: "",
      }));
      setActiveChildId(text(asRecord(result.child).id, ""));
      setModal(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profil gagal disimpan.");
    }
  }

  async function createMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeChild) return;
    const form = new FormData(event.currentTarget);
    setError("");
    try {
      await endpoints.createMeasurement({
        child_id: activeChild.id,
        measured_at: new Date().toISOString(),
        weight_kg: form.get("weight") ? Number(form.get("weight")) : null,
        height_cm: form.get("height") ? Number(form.get("height")) : null,
        head_circumference_cm: form.get("head") ? Number(form.get("head")) : null,
        notes: form.get("notes") || "",
      });
      setModal(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengukuran gagal disimpan.");
    }
  }

  async function askAgent(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setAsking(true);
    setError("");
    setAnswer(null);
    try {
      setAnswer(asRecord(await endpoints.chat({ child_id: activeChild?.id || null, message: message.trim(), channel: "web" })));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Agent tidak dapat dijalankan.");
    } finally {
      setAsking(false);
    }
  }

  async function searchFoods(event: FormEvent) {
    event.preventDefault();
    if (foodQuery.trim().length < 2) return;
    try {
      const result = asRecord(await endpoints.foods(foodQuery.trim()));
      setFoodResults(asList(result.foods));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pencarian gagal.");
    }
  }

  async function createTelegramLink() {
    if (!activeChild) return;
    try {
      const result = asRecord(await endpoints.telegramCode(text(activeChild.id)));
      setLinkCode(text(result.code, ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kode taut gagal dibuat.");
    }
  }

  if (loading && !dashboard.user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f8f4] text-[#173d31]">
        <div className="text-center"><LoaderCircle className="mx-auto animate-spin" /><p className="mt-3 text-sm">Menyiapkan ruang keluarga…</p></div>
      </div>
    );
  }

  return (
    <AppShell title="Beranda keluarga" subtitle="Satu layar untuk melihat kondisi, menentukan langkah, dan meminta bantuan">
      {error && (
        <div role="alert" className="mb-5 flex items-center justify-between rounded-2xl border border-[#efc5bd] bg-[#fff5f2] px-4 py-3 text-sm text-[#8d3429]">
          <span>{error}</span><button aria-label="Tutup pesan" onClick={() => setError("")}><X size={17} /></button>
        </div>
      )}

      <section className="overflow-hidden rounded-[30px] bg-[#123f33] p-6 text-white sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-medium text-[#a6deb8]">Selamat datang, {text(user.display_name, "keluarga")}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">
              {activeChild ? `Pendampingan ${text(activeChild.name)} dimulai dari catatan yang nyata.` : "Mulai dengan satu profil, lalu isi data sedikit demi sedikit."}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#bed5c8]">
              NutriShield tidak mendiagnosis. Sistem menyimpan catatan keluarga, menjalankan kebijakan keselamatan sebelum AI, dan menunjukkan jejak setiap jawaban.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.07] p-5">
            <p className="text-xs uppercase tracking-[.14em] text-[#9ec4ae]">Langkah berikutnya</p>
            <p className="mt-3 text-xl font-semibold">{nextAction.title}</p>
            <p className="mt-2 text-xs leading-5 text-[#bfd5c8]">{nextAction.body}</p>
            <Button
              onClick={() => {
                if (nextAction.action === "child" || nextAction.action === "measurement") setModal(nextAction.action);
                if (nextAction.action === "telegram") void createTelegramLink();
                if (nextAction.action === "assistant") document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-4 h-11 w-full rounded-xl bg-[#b9efcb] font-semibold text-[#103c31] hover:bg-[#d2f7dd]"
            >
              Kerjakan sekarang <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <Card className="border-[#dce7dd] shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between"><div><p className="text-xs text-[#72877a]">Profil aktif</p><p className="mt-2 text-2xl font-semibold">{text(activeChild?.name, "Belum dibuat")}</p></div><Baby className="text-[#2b855d]" /></div>
            {children.length > 1 && <select aria-label="Pilih profil anak" value={activeChildId} onChange={(e) => setActiveChildId(e.target.value)} className="mt-4 w-full rounded-xl border bg-white px-3 py-2 text-sm">{children.map((child) => <option key={text(child.id)} value={text(child.id)}>{text(child.name)}</option>)}</select>}
            <Button onClick={() => setModal("child")} variant="outline" className="mt-4 w-full"><Plus size={15} className="mr-2" /> Tambah profil</Button>
          </CardContent>
        </Card>
        <Card className="border-[#dce7dd] shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between"><div><p className="text-xs text-[#72877a]">Pengukuran terakhir</p><p className="mt-2 text-2xl font-semibold">{latest.weight_kg ? `${latest.weight_kg} kg` : "Belum ada"}</p></div><Ruler className="text-[#2b855d]" /></div>
            <p className="mt-2 text-xs text-[#72877a]">{latest.height_cm ? `${latest.height_cm} cm` : "Tinggi belum dicatat"} · {formatDate(latest.measured_at)}</p>
            <Button disabled={!activeChild} onClick={() => setModal("measurement")} variant="outline" className="mt-4 w-full"><Plus size={15} className="mr-2" /> Catat pengukuran</Button>
          </CardContent>
        </Card>
        <Card className="border-[#dce7dd] shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between"><div><p className="text-xs text-[#72877a]">Telegram</p><p className="mt-2 text-2xl font-semibold">{telegram.linked ? "Terhubung" : telegram.configured ? "Siap ditautkan" : "Belum aktif"}</p></div><Send className="text-[#2382b9]" /></div>
            <p className="mt-2 text-xs text-[#72877a]">{text(telegramIdentity.child_name, "Pilih profil untuk membuat kode")}</p>
            <Button disabled={!activeChild || !telegram.configured} onClick={() => void createTelegramLink()} variant="outline" className="mt-4 w-full">Buat kode privat</Button>
          </CardContent>
        </Card>
      </section>

      {linkCode && (
        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#b7ddc4] bg-[#eff8f1] p-5 sm:flex-row sm:items-center">
          <div><p className="text-sm font-semibold">Kode untuk {text(activeChild?.name)}</p><p className="mt-1 font-mono text-2xl font-bold tracking-wider">{linkCode}</p><p className="mt-1 text-xs text-[#647d6d]">Berlaku 10 menit dan hanya sekali pakai.</p></div>
          <a className="sm:ml-auto" href={`https://t.me/${text(telegram.bot_username, "NutriShieldAIBot")}?start=link_${linkCode}`} target="_blank" rel="noreferrer"><Button className="w-full bg-[#229ED9] sm:w-auto"><Send size={16} className="mr-2" /> Buka Telegram</Button></a>
        </section>
      )}

      <section id="assistant" className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="border-[#dce7dd] shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="text-[#28845b]" /> Tanya pendamping</CardTitle><p className="text-sm text-[#71867a]">Jawaban diproses melalui kebijakan keselamatan, bukti, model opsional, dan output guard.</p></CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">{["Data apa yang masih perlu saya lengkapi?", "Ide pangan lokal untuk menu hari ini", "Apa yang perlu dibawa ke Posyandu?"].map((prompt) => <button key={prompt} onClick={() => setMessage(prompt)} className="rounded-full border border-[#d8e5da] bg-[#f7faf7] px-3 py-2 text-xs text-[#456557] hover:border-[#75ac89]">{prompt}</button>)}</div>
            <form onSubmit={askAgent}>
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-28 resize-none" placeholder="Tulis pertanyaan keluarga…" />
              <Button disabled={asking || message.trim().length < 2} className="mt-3 bg-[#173f34]">{asking ? <LoaderCircle size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />} Jalankan agent</Button>
            </form>
            {answer && <div className="mt-5 rounded-2xl border border-[#d8e7da] bg-[#f5faf6] p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#27805a]">Jawaban dengan jejak proses</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#38594a]">{text(answer.answer)}</p><p className="mt-4 text-xs text-[#6e8377]">Run: {text(asRecord(answer.run).id)} · {asList(answer.steps).length} tahap tercatat</p></div>}
          </CardContent>
        </Card>

        <Card className="border-[#dce7dd] shadow-none">
          <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Clock3 className="text-[#28845b]" /> Aktivitas terbaru</CardTitle><Link href="/agent-center" className="text-xs font-semibold text-[#287f59]">Lihat semua</Link></div></CardHeader>
          <CardContent className="space-y-3">
            {pendingJobs.length > 0 && <div className="flex items-center gap-3 rounded-2xl border border-[#d9e8db] bg-[#f3f8f3] p-4 text-sm text-[#526f60]"><LoaderCircle size={17} className="animate-spin text-[#27805a]" /> Agent sedang memproses {pendingJobs.length} pekerjaan…</div>}
            {runs.length === 0 && pendingJobs.length === 0 ? <div className="rounded-2xl bg-[#f5f8f4] p-5 text-sm text-[#71867a]">Belum ada aktivitas. Membuat profil, mencatat pengukuran, atau bertanya akan menghasilkan jejak audit.</div> : runs.slice(0, 4).map((run) => <div key={text(run.id)} className="rounded-2xl border border-[#e1e9e1] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold capitalize">{text(run.trigger, "agent run").replaceAll(".", " ")}</p><span className="rounded-full bg-[#e9f5eb] px-2 py-1 text-[10px] font-semibold capitalize text-[#267853]">{statusLabel(run.status)}</span></div><p className="mt-2 text-xs text-[#75897d]">{formatDate(run.started_at)} · model {text(run.model, "deterministik")}</p></div>)}
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="border-[#dce7dd] shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2"><Search className="text-[#28845b]" /> Cari katalog pangan</CardTitle><p className="text-sm text-[#71867a]">Hasil untuk penemuan informasi, bukan otomatis layak menjadi rencana makan.</p></CardHeader>
          <CardContent>
            <form onSubmit={searchFoods} className="flex gap-2"><Input value={foodQuery} onChange={(event) => setFoodQuery(event.target.value)} placeholder="Contoh: tempe" /><Button type="submit" variant="outline"><Search size={16} /></Button></form>
            <div className="mt-4 space-y-2">{foodResults.slice(0, 4).map((food) => <div key={text(food.id)} className="flex items-center justify-between rounded-xl bg-[#f6f8f5] p-3"><div><p className="text-sm font-medium">{text(food.name)}</p><p className="text-[11px] text-[#75887d]">{text(food.record_type).replaceAll("_", " ")}</p></div><span className="text-[11px] font-medium text-[#287f59]">Provenance {Math.round(Number(food.provenance_score || 0) * 100)}%</span></div>)}</div>
          </CardContent>
        </Card>
        <Card className="border-[#dce7dd] shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="text-[#28845b]" /> Kesiapan data</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3"><Metric label="Record sumber" value={Number(foodStats.raw_records || 0).toLocaleString("id-ID")} /><Metric label="Pangan kanonis" value={Number(foodStats.canonical_records || 0).toLocaleString("id-ID")} /><Metric label="Untuk penemuan" value={Number(foodStats.discovery_eligible || 0).toLocaleString("id-ID")} /><Metric label="Siap perencanaan" value={Number(foodStats.planning_eligible || 0).toLocaleString("id-ID")} /></div>
            <div className="mt-4 rounded-xl bg-[#fff8e8] p-4 text-xs leading-5 text-[#786845]">Label “siap perencanaan” sengaja ketat. Dataset yang hanya memiliki nama atau label tidak diperlakukan sebagai bukti gizi lengkap.</div>
            <Link href="/sumber-data" className="mt-4 inline-flex items-center text-sm font-semibold text-[#287f59]">Lihat sumber dan batasan <ArrowRight size={15} className="ml-1" /></Link>
          </CardContent>
        </Card>
      </section>

      {modal === "child" && <Modal title="Tambah profil anak" onClose={() => setModal(null)}><form onSubmit={createChild} className="space-y-4"><Field label="Nama panggilan"><Input name="name" required minLength={1} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Tanggal lahir"><Input name="birth_date" type="date" /></Field><Field label="Jenis kelamin"><select name="sex" className="mt-2 h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="unspecified">Belum dipilih</option><option value="female">Perempuan</option><option value="male">Laki-laki</option></select></Field></div><Field label="Alergi yang diketahui"><Input name="allergies" placeholder="Kosongkan bila belum diketahui" /></Field><Button className="w-full bg-[#173f34]">Simpan profil</Button></form></Modal>}
      {modal === "measurement" && <Modal title={`Catat pengukuran ${text(activeChild?.name, "anak")}`} onClose={() => setModal(null)}><form onSubmit={createMeasurement} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Berat (kg)"><Input name="weight" type="number" min="0.1" max="300" step="0.1" /></Field><Field label="Tinggi (cm)"><Input name="height" type="number" min="1" max="250" step="0.1" /></Field></div><Field label="Lingkar kepala (cm)"><Input name="head" type="number" min="1" max="100" step="0.1" /></Field><Field label="Catatan"><Textarea name="notes" placeholder="Opsional" /></Field><Button className="w-full bg-[#173f34]">Simpan pengukuran</Button></form></Modal>}
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f5f8f4] p-4"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-[#75887d]">{label}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[#486457]">{label}<div className="mt-2">{children}</div></label>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#08261e]/55 p-4 backdrop-blur-sm" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-semibold">{title}</h3><button aria-label="Tutup" onClick={onClose} className="rounded-lg p-2 hover:bg-[#f0f5f0]"><X size={18} /></button></div>{children}</div></div>;
}
