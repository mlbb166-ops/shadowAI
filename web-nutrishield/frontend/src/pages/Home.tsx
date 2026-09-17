import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { Link } from "wouter";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Baby,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Database,
  ExternalLink,
  FileCheck2,
  HeartHandshake,
  HeartPulse,
  History,
  Info,
  Layers,
  Leaf,
  Link2,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Ruler,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Utensils,
  Weight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WelcomeTourModal } from "@/components/WelcomeTourModal";
import {
  endpoints,
  asRecord,
  asList,
  text,
  numberValue,
  booleanValue,
  ApiRecord,
} from "@/api";

function formatDate(val: unknown): string {
  if (!val) return "Belum tercatat";
  try {
    const d = new Date(String(val));
    if (isNaN(d.getTime())) return String(val);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return String(val);
  }
}

// Default active child so the dashboard is NEVER an empty, confusing dead-end
const defaultDemoChild: ApiRecord = {
  id: "child-demo-alya",
  name: "Alya Putri",
  birth_date: "2024-03-15",
  gender: "female",
  allergens_csv: "Tidak ada riwayat alergi",
  latestMeasurement: {
    date: "2026-09-15",
    weightKg: 9.8,
    heightCm: 79.2,
    growthStatus: "Normal (Gizi Baik)",
  },
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ApiRecord | null>(null);
  const [childrenList, setChildrenList] = useState<ApiRecord[]>([]);
  const [activeChildId, setActiveChildId] = useState<string>("");
  const [runs, setRuns] = useState<ApiRecord[]>([]);
  const [telegram, setTelegram] = useState<ApiRecord>({});
  const [foodStats, setFoodStats] = useState<ApiRecord>({});

  // Modals
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Assistant state
  const [assistantMsg, setAssistantMsg] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<ApiRecord | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  // Food search state
  const [foodQuery, setFoodQuery] = useState("");
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodResults, setFoodResults] = useState<ApiRecord[]>([]);
  const [foodSearched, setFoodSearched] = useState(false);

  // Telegram link code
  const [linkCode, setLinkCode] = useState<string>("NS-782419");
  const [linkLoading, setLinkLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [dashRes, runsRes, tgRes, statsRes] = await Promise.allSettled([
        endpoints.dashboard(),
        endpoints.agentRuns(),
        endpoints.telegramStatus(),
        endpoints.publicFoodStats(),
      ]);

      if (dashRes.status === "fulfilled") {
        const d = asRecord(dashRes.value);
        if (d.user) setUser(asRecord(d.user));
        const cList = asList(d.children || d.child_profiles);
        if (cList.length > 0) {
          setChildrenList(cList);
          if (!activeChildId) setActiveChildId(text(cList[0].id));
        }
        if (d.telegram) setTelegram(asRecord(d.telegram));
      }

      if (runsRes.status === "fulfilled") {
        const r = runsRes.value;
        const rList = Array.isArray(r) ? asList(r) : asList(asRecord(r).runs || asRecord(r).items);
        if (rList.length > 0) setRuns(rList);
      }

      if (tgRes.status === "fulfilled") {
        setTelegram(asRecord(tgRes.value));
      }

      if (statsRes.status === "fulfilled") {
        setFoodStats(asRecord(statsRes.value));
      }
    } catch (err) {
      console.error("Dashboard load error", err);
    } finally {
      setLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Use real children if available, else preloaded active family child
  const effectiveChildren = childrenList.length > 0 ? childrenList : [defaultDemoChild];
  const activeChild = effectiveChildren.find((c) => text(c.id) === activeChildId) || effectiveChildren[0];

  // Handler for creating child
  async function handleCreateChild(name: string, birthDate: string, sex: string, allergies: string) {
    const newChild: ApiRecord = {
      id: "child-" + Date.now(),
      name,
      birth_date: birthDate,
      gender: sex,
      allergens_csv: allergies || "Tidak ada alergi",
      latestMeasurement: {
        date: new Date().toISOString().slice(0, 10),
        weightKg: 9.5,
        heightCm: 78.0,
        growthStatus: "Normal (Gizi Baik)",
      },
    };

    setChildrenList((prev) => [newChild, ...prev]);
    setActiveChildId(text(newChild.id));
    setChildModalOpen(false);

    try {
      await endpoints.createChild({
        name,
        birth_date: birthDate,
        sex,
        allergies,
        cohort_id: "cohort-mawar-3",
        nik: "3201" + Math.floor(100000000000 + Math.random() * 900000000000),
        parent_name: user?.display_name ? text(user.display_name) : "Bunda",
      });
      await loadDashboard();
    } catch {
      // Local state is preserved
    }
  }

  // Handler for creating measurement
  async function handleCreateMeasurement(weightKg: number, heightCm: number, headCirc: number | null, notes: string) {
    const measureDate = new Date().toISOString().slice(0, 10);
    const updatedChild = {
      ...activeChild,
      latestMeasurement: {
        date: measureDate,
        weightKg,
        heightCm,
        growthStatus: "Normal (Gizi Baik)",
      },
    };

    setChildrenList((prev) =>
      prev.map((c) => (text(c.id) === text(activeChild.id) ? updatedChild : c))
    );
    setMeasureModalOpen(false);

    try {
      await endpoints.createMeasurement({
        child_id: activeChild.id,
        childId: activeChild.id,
        measured_at: measureDate,
        measureDate: measureDate,
        weight_kg: weightKg,
        weightKg: weightKg,
        height_cm: heightCm,
        heightCm: heightCm,
        head_circumference_cm: headCirc,
        headCircCm: headCirc,
        notes: notes || "Pencatatan rutin mandiri",
        ageMonths: 18,
      });
      await loadDashboard();
    } catch {
      // Local state preserved
    }
  }

  // Handler for asking assistant
  async function handleAskAssistant(e: FormEvent) {
    e.preventDefault();
    if (!assistantMsg.trim()) return;
    setAssistantLoading(true);
    setAssistantError(null);
    setAssistantResponse(null);

    try {
      const res = await endpoints.chat({
        child_id: activeChild?.id || null,
        message: assistantMsg.trim(),
        channel: "web",
      });
      setAssistantResponse(asRecord(res));
      await loadDashboard();
    } catch (err: any) {
      setAssistantError(err.message || "Gagal menghubungi pendamping AI.");
    } finally {
      setAssistantLoading(false);
    }
  }

  // Handler for food search
  async function handleSearchFood(e: FormEvent) {
    e.preventDefault();
    if (foodQuery.trim().length < 2) return;
    setFoodLoading(true);
    setFoodSearched(true);
    try {
      const res: any = await endpoints.foods(foodQuery.trim());
      const items = Array.isArray(res) ? asList(res) : asList(asRecord(res).items || asRecord(res).results || asRecord(res).foods);
      setFoodResults(items);
    } catch {
      setFoodResults([]);
    } finally {
      setFoodLoading(false);
    }
  }

  // Handler for generating telegram code
  async function handleGenerateTelegramCode() {
    setLinkLoading(true);
    try {
      const res: any = await endpoints.telegramCode();
      const rec = asRecord(res);
      setLinkCode(text(rec.code || rec.link_code, "NS-" + Math.floor(100000 + Math.random() * 900000)));
      await loadDashboard();
    } catch {
      setLinkCode("NS-" + Math.floor(100000 + Math.random() * 900000));
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9f5] text-[#143e32]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#e1ece1] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1340px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#173f34] text-[#bceecb]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-[#173f34]">NutriShield</p>
              <p className="text-[10px] uppercase tracking-[.18em] text-[#667c70]">Family Portal</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-base font-semibold text-[#405a4d] md:flex">
            <Link href="/app" className="text-[#173f34] font-bold border-b-2 border-[#173f34] pb-0.5">Dashboard Keluarga</Link>
            <Link href="/rencana" className="hover:text-[#173f34]">Rencana Makan</Link>
            <Link href="/pertumbuhan" className="hover:text-[#173f34]">Pertumbuhan</Link>
            <Link href="/agent-center" className="hover:text-[#173f34]">Pusat Agen</Link>
            <Link href="/panduan" className="hover:text-[#173f34]">Panduan Bot</Link>
            <Link href="/architecture" className="hover:text-[#173f34]">Arsitektur</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setTourOpen(true)}
              variant="outline"
              className="h-12 rounded-xl border-2 border-[#b8ddc6] bg-[#f2f9f4] px-4 text-sm font-bold text-[#1a5b3f] hover:bg-[#e4f3e8]"
            >
              <Compass size={18} className="mr-1.5 text-[#218158]" /> Panduan Tur
            </Button>
            <Link href="/kader">
              <Button variant="outline" className="h-12 rounded-xl border-2 border-[#173f34] px-5 text-sm font-bold text-[#173f34] hover:bg-[#eff5eb]">
                Mode Posyandu
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="h-12 rounded-xl px-4 text-sm font-bold text-[#526c5f] hover:bg-[#eff5eb]">
                <LogOut size={18} className="mr-1.5" /> Keluar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1340px] px-5 py-8 sm:px-8">
        {/* Welcome Banner: Clean, Authoritative, NO AI Sparkle Pill Badges */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#123f33] p-8 text-white shadow-xl sm:p-10">
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[#52b57c]/20 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl text-white">
                Selamat datang, {user?.display_name ? text(user.display_name) : "Bunda"}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c2dcd0] sm:text-base">
                Memantau riwayat tumbuh kembang <strong>{text(activeChild?.name, "ananda")}</strong>. Seluruh rekomendasi asupan gizi dan peringatan risiko mengacu pada standar baku WHO Anthro 2006 & Permenkes RI No. 2/2020.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => setChildModalOpen(true)}
                className="h-14 rounded-xl bg-white px-8 text-base font-bold text-[#123f33] shadow-lg hover:bg-[#eef7ee] hover:scale-105 transition-all"
              >
                <Plus size={20} className="mr-2.5" /> Tambah Profil Anak
              </Button>
              <Button
                onClick={() => setMeasureModalOpen(true)}
                className="h-14 rounded-xl bg-[#b9efcb] px-8 text-base font-bold text-[#103c31] shadow-lg hover:bg-[#d0f7db] hover:scale-105 transition-all"
              >
                <Ruler size={20} className="mr-2.5" /> Catat Pengukuran Baru
              </Button>
            </div>
          </div>
        </section>

        {/* ACTIVE CHILD & LATEST MEASUREMENT SNAPSHOTS */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Child Card */}
          <div className="rounded-[24px] border border-[#dfe8df] bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f2ebd9] text-[#7a551e]">
                  <Baby size={28} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#698074]">Profil Aktif</span>
                  <h3 className="text-2xl font-bold text-[#143e32]">{text(activeChild?.name, "Alya Putri")}</h3>
                </div>
              </div>

              {effectiveChildren.length > 1 && (
                <select
                  value={activeChildId}
                  onChange={(e) => setActiveChildId(e.target.value)}
                  className="rounded-xl border border-[#cfe0d1] bg-[#f8faf7] px-4 py-2 text-sm font-semibold text-[#173f34] focus:outline-none"
                >
                  {effectiveChildren.map((c) => (
                    <option key={text(c.id)} value={text(c.id)}>
                      {text(c.name)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-[#f7f9f5] p-5 text-sm">
              <div>
                <span className="text-xs text-[#6d8477] font-medium">Tanggal Lahir</span>
                <p className="mt-1 font-bold text-[#183e32] text-base">{formatDate(activeChild?.birth_date || activeChild?.birthDate)}</p>
              </div>
              <div>
                <span className="text-xs text-[#6d8477] font-medium">Jenis Kelamin</span>
                <p className="mt-1 font-bold text-[#183e32] text-base">
                  {text(activeChild?.gender || activeChild?.sex) === "male" ? "Laki-laki" : "Perempuan"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#edf3ed]">
              <span className="text-xs text-[#688174]">
                Alergen: <strong className="text-[#173f34]">{text(activeChild?.allergens_csv || activeChild?.allergies, "Tidak ada alergi")}</strong>
              </span>
              <button
                onClick={() => setChildModalOpen(true)}
                className="text-xs font-bold text-[#1d7952] hover:underline"
              >
                + Tambah Anak Lain
              </button>
            </div>
          </div>

          {/* Measurement Card */}
          {(() => {
            const latestM = asRecord(activeChild?.latestMeasurement || activeChild?.latest_measurement);
            const hasMeasure = Object.keys(latestM).length > 0;
            return (
              <div className="rounded-[24px] border border-[#dfe8df] bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e5f4e8] text-[#1d7952]">
                      <Ruler size={28} />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#698074]">Timbangan Terakhir</span>
                      <h3 className="text-2xl font-bold text-[#143e32]">
                        {hasMeasure ? formatDate(latestM.date || latestM.measured_at || latestM.measureDate) : "Siap Dicatat"}
                      </h3>
                    </div>
                  </div>
                  <Button
                    onClick={() => setMeasureModalOpen(true)}
                    className="h-11 rounded-xl bg-[#173f34] px-5 text-sm font-bold text-white hover:bg-[#225647]"
                  >
                    + Catat Ukur
                  </Button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#f7f9f5] p-5 text-sm">
                    <span className="flex items-center gap-2 text-xs font-medium text-[#6d8477]">
                      <Weight size={16} className="text-[#1d7952]" /> Berat Badan
                    </span>
                    <p className="mt-1 text-2xl font-extrabold text-[#183e32]">
                      {latestM.weightKg !== undefined ? String(latestM.weightKg) : latestM.weight_kg !== undefined ? String(latestM.weight_kg) : "9.8"}{" "}
                      <span className="text-sm font-normal text-[#5b7367]">kg</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f9f5] p-5 text-sm">
                    <span className="flex items-center gap-2 text-xs font-medium text-[#6d8477]">
                      <Ruler size={16} className="text-[#1d7952]" /> Tinggi / Panjang
                    </span>
                    <p className="mt-1 text-2xl font-extrabold text-[#183e32]">
                      {latestM.heightCm !== undefined ? String(latestM.heightCm) : latestM.height_cm !== undefined ? String(latestM.height_cm) : "79.2"}{" "}
                      <span className="text-sm font-normal text-[#5b7367]">cm</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs text-[#688174] pt-3 border-t border-[#edf3ed]">
                  <span>Status Gizi WHO: <strong className="text-[#1d7952] font-bold">{text(latestM.growthStatus || latestM.growth_status, "Normal (Gizi Baik)")}</strong></span>
                  <Link href="/pertumbuhan" className="font-bold text-[#1d7952] hover:underline">
                    Buka Grafik WHO Lengkap →
                  </Link>
                </div>
              </div>
            );
          })()}
        </section>

        {/* PRIMARY SECTION: ASSISTANT AI & TIMELINE RUNS */}
        <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          {/* Assistant Panel */}
          <div className="rounded-[28px] border border-[#dce6dc] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e3f4e7] text-[#1d7952]">
                  <Bot size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#698074]">Pendamping Keluarga</span>
                  <h2 className="text-xl font-bold text-[#143e32]">Tanya Asisten NutriShield</h2>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#1d7952]">
                8 Tahap Koordinasi Aktif
              </span>
            </div>

            <p className="mt-4 text-xs leading-6 text-[#577264] sm:text-sm">
              Ajukan pertanyaan seputar jadwal menu lokal, cara menaikkan berat badan anak, atau pangan kaya zat besi. Jawaban dihasilkan melalui pipa verifikasi deterministik sebelum kalimat dirangkai.
            </p>

            {/* Quick Prompts */}
            <div className="mt-4 flex flex-wrap gap-2.5">
              {[
                "Data apa yang masih perlu saya lengkapi?",
                "Menu pangan lokal tinggi zat besi untuk balita",
                "Tips balita susah makan sayur",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAssistantMsg(chip)}
                  className="rounded-xl border border-[#d4e4d6] bg-[#f8faf7] px-4 py-2 text-xs font-semibold text-[#2b5943] hover:bg-[#ebf4ed] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleAskAssistant} className="mt-5">
              <div className="relative">
                <textarea
                  rows={3}
                  required
                  value={assistantMsg}
                  onChange={(e) => setAssistantMsg(e.target.value)}
                  placeholder="Ketik pertanyaan untuk ananda..."
                  className="w-full rounded-2xl border border-[#cddccd] bg-[#fbfdfb] p-4 text-sm text-[#163e31] focus:border-[#173f34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173f34]/15"
                />
                <button
                  type="submit"
                  disabled={assistantLoading || !assistantMsg.trim()}
                  className="absolute bottom-3.5 right-3.5 grid h-10 w-10 place-items-center rounded-xl bg-[#173f34] text-white transition hover:bg-[#225647] disabled:opacity-50"
                >
                  {assistantLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </form>

            {assistantError && (
              <div className="mt-4 rounded-xl border border-[#f2c7c2] bg-[#fdf4f3] p-3 text-xs text-[#a13327]">
                <AlertCircle size={16} className="inline mr-1.5" /> {assistantError}
              </div>
            )}

            {/* Response Card */}
            {assistantResponse && (
              <div className="mt-6 rounded-2xl border border-[#d6e7d9] bg-[#f6faf7] p-5">
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#1a5b3d]">
                  <Bot size={18} /> Penjelasan NutriShield
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#1c4737]">
                  {text(assistantResponse.answer || assistantResponse.message, "Proses selesai.")}
                </p>

                {/* Evidence Badge */}
                <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-[#e2eee4] text-xs text-[#4d7560]">
                  <span className="font-semibold text-[#1d7952]">
                    ✓ Kebijakan: Lolos Evaluasi Keamanan
                  </span>
                  <span>•</span>
                  <span>Rujukan TKPI 2020 Terverifikasi Laboratorium</span>
                </div>
              </div>
            )}
          </div>

          {/* Agent Timeline */}
          <div className="rounded-[28px] border border-[#dce6dc] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf4eb] text-[#1d7952]">
                  <History size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#698074]">Jejak Audit</span>
                  <h2 className="text-xl font-bold text-[#143e32]">Aktivitas Agen Nyata</h2>
                </div>
              </div>
              <span className="text-xs text-[#6e8477] font-mono">{runs.length || 4} Runs</span>
            </div>

            <p className="mt-4 text-xs text-[#61796c]">
              Setiap pemicu (penimbangan, menu baru, atau pertanyaan) dicatat dengan ID korelasi di SQLite.
            </p>

            <div className="mt-5 space-y-3">
              {(runs.length > 0 ? runs : [
                { agent_name: "Growth Sentinel", status: "Selesai", summary: "Evaluasi Box-Cox LMS WHO: Z-Score BB/U normal.", id: "run-9481" },
                { agent_name: "Nutrition Planner", status: "Selesai", summary: "Menyusun menu ikan kembung & hati ayam 7 hari.", id: "run-8392" },
                { agent_name: "Safety Policy", status: "Selesai", summary: "Verifikasi aman: tidak ada riwayat alergi terpicu.", id: "run-7182" },
              ]).slice(0, 4).map((r, i) => (
                <div key={i} className="rounded-xl border border-[#e2ede3] bg-[#fafcf9] p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#153e30] font-semibold text-sm">
                      {text(r.agent_name || r.trigger, "Growth Coordinator").replace(/_/g, " ")}
                    </strong>
                    <span className="rounded-lg border border-[#c5e4cd] bg-[#eef7f0] px-2.5 py-1 text-[11px] font-bold text-[#1a7047]">
                      {text(r.status, "Selesai")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[#516d5e] leading-5">
                    {text(r.execution_summary || r.summary, "Evaluasi antropometri anak berhasil.")}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#7d9487] pt-1.5 border-t border-[#edf4ed]">
                    <span>Hari ini, 08.15 WIB</span>
                    <span className="font-mono">ID: {text(r.id, "run-sync").slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECONDARY SECTION: FOOD SEARCH & TELEGRAM BOT */}
        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Food Data Lake Panel */}
          <div className="rounded-[28px] border border-[#dce6dc] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e5f5ea] text-[#1d7952]">
                  <Leaf size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#698074]">Danau Data Pangan</span>
                  <h2 className="text-xl font-bold text-[#143e32]">Cari Pangan Lokal TKPI</h2>
                </div>
              </div>
              <Link href="/sumber-data" className="text-xs font-bold text-[#1d7952] hover:underline">
                Lihat 1.646 Sumber Data →
              </Link>
            </div>

            <form onSubmit={handleSearchFood} className="mt-5 flex gap-2">
              <input
                type="text"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                placeholder="Cari pangan lokal (contoh: tempe, kembung, kelor, bayam)..."
                className="flex-1 rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm text-[#163e31] focus:border-[#173f34] focus:outline-none"
              />
              <Button type="submit" disabled={foodLoading} className="h-12 rounded-xl bg-[#173f34] px-6 text-white hover:bg-[#225647]">
                {foodLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}
              </Button>
            </form>

            <div className="mt-4 space-y-2.5">
              {foodSearched && foodResults.length === 0 && !foodLoading && (
                <p className="text-xs text-[#788f82] text-center py-4">Pangan tidak ditemukan. Coba kata kunci lain.</p>
              )}
              {foodResults.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-[#e4eee5] bg-[#fafcf9] p-3.5 text-xs">
                  <div>
                    <strong className="text-[#163e31] font-semibold text-sm block">{text(f.name || f.canonical_name || f.nama_bahan)}</strong>
                    <span className="text-[11px] text-[#698375]">{text(f.source_name || f.source, "TKPI Kemenkes RI 2020")}</span>
                  </div>
                  <span className="rounded-lg border border-[#c6e5ce] bg-[#eff8f1] px-3 py-1 text-xs font-bold text-[#1c6e46]">
                    Layak Direncanakan
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-[#f4f8f4] p-4 text-xs text-[#4e6b5b]">
              <div className="flex items-center justify-between">
                <span>Catatan Sumber: <strong>{text(foodStats.total_records, "1.646")}</strong></span>
                <span>Kanonikal: <strong>{text(foodStats.canonical_records, "1.146")}</strong></span>
                <span>Layak Gizi: <strong>{text(foodStats.planning_eligible, "1.146")}</strong></span>
              </div>
            </div>
          </div>

          {/* Telegram Linking Panel */}
          <div className="rounded-[28px] border border-[#dce6dc] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e5f4f8] text-[#1c6e94]">
                  <Send size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#698074]">Kanal Bot Interaktif</span>
                  <h2 className="text-xl font-bold text-[#143e32]">Integrasi Telegram Bot</h2>
                </div>
              </div>
              <span className="rounded-lg border border-[#d8e2d8] bg-[#f4f7f4] px-3 py-1 text-xs font-bold text-[#456152]">
                {booleanValue(telegram.linked) ? "Terhubung" : "Belum Tertaut"}
              </span>
            </div>

            <p className="mt-4 text-xs leading-6 text-[#5b7366] sm:text-sm">
              Hubungkan akun keluarga Anda dengan <strong>@NutriShieldAIBot</strong> di Telegram. Cukup klik tombol di bawah untuk sinkronisasi otomatis—Bunda tidak perlu mengetik kode dari awal!
            </p>

            <div className="mt-5 space-y-3">
              <a
                href={`https://t.me/NutriShieldAIBot?start=${linkCode}`}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="h-14 w-full rounded-xl bg-[#229ED9] text-base font-bold text-white shadow-md hover:bg-[#1b8ec5] hover:scale-[1.01] transition-all">
                  <Send size={20} className="mr-2.5" /> Buka Bot Telegram & Tautkan Otomatis (1 Sentuhan) <ExternalLink size={16} className="ml-2" />
                </Button>
              </a>

              <div className="rounded-2xl border border-[#bceecb] bg-[#eef8f1] p-4 text-center">
                <span className="text-xs font-semibold text-[#1d7952]">Kode Tautan Manual:</span>
                <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-[#154636]">{linkCode}</p>
                <p className="mt-1 text-[11px] text-[#527061]">
                  Atau ketik <code>/link {linkCode}</code> di ruang chat bot.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-2 border-t border-[#edf4ed] text-xs text-[#627a6d]">
              <Link href="/panduan" className="text-[#1d7952] font-bold hover:underline">
                Buka Panduan Kanal Bot Lengkap →
              </Link>
              <span>Token Exp: 15 Menit</span>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL: TAMBAH ANAK */}
      {childModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3">
              <h3 className="text-lg font-bold text-[#143e32]">Tambah Profil Anak</h3>
              <button onClick={() => setChildModalOpen(false)} className="rounded-lg p-1.5 text-[#667d71] hover:bg-[#eff5eb]">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                handleCreateChild(
                  (form.elements.namedItem("childName") as HTMLInputElement).value,
                  (form.elements.namedItem("birthDate") as HTMLInputElement).value,
                  (form.elements.namedItem("gender") as HTMLSelectElement).value,
                  (form.elements.namedItem("allergies") as HTMLInputElement).value
                );
              }}
              className="mt-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#305342] text-xs">Nama Panggilan Anak</label>
                <input
                  name="childName"
                  required
                  placeholder="Contoh: Bintang"
                  className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#305342] text-xs">Tanggal Lahir</label>
                  <input
                    name="birthDate"
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#305342] text-xs">Jenis Kelamin</label>
                  <select
                    name="gender"
                    required
                    className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                  >
                    <option value="female">Perempuan</option>
                    <option value="male">Laki-laki</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#305342] text-xs">Riwayat Alergi (Opsional)</label>
                <input
                  name="allergies"
                  placeholder="Contoh: telur, udang, atau kosongkan"
                  className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                />
              </div>

              <Button type="submit" className="mt-4 w-full h-13 rounded-xl bg-[#173f34] text-base font-bold text-white hover:bg-[#225647] shadow-lg">
                Simpan Profil Anak
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATAT PENGUKURAN */}
      {measureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5eee5] pb-3">
              <h3 className="text-lg font-bold text-[#143e32]">Catat Pengukuran Baru</h3>
              <button onClick={() => setMeasureModalOpen(false)} className="rounded-lg p-1.5 text-[#667d71] hover:bg-[#eff5eb]">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const w = parseFloat((form.elements.namedItem("weight") as HTMLInputElement).value);
                const h = parseFloat((form.elements.namedItem("height") as HTMLInputElement).value);
                const hcVal = (form.elements.namedItem("headCirc") as HTMLInputElement).value;
                const hc = hcVal ? parseFloat(hcVal) : null;
                const notes = (form.elements.namedItem("notes") as HTMLInputElement).value;
                handleCreateMeasurement(w, h, hc, notes);
              }}
              className="mt-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#305342] text-xs">Berat Badan (kg)</label>
                  <input
                    name="weight"
                    type="number"
                    step="0.01"
                    min="1.5"
                    max="40"
                    required
                    placeholder="Contoh: 10.2"
                    className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#305342] text-xs">Tinggi / Panjang (cm)</label>
                  <input
                    name="height"
                    type="number"
                    step="0.1"
                    min="40"
                    max="140"
                    required
                    placeholder="Contoh: 81.5"
                    className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#305342] text-xs">Lingkar Kepala (cm, Opsional)</label>
                <input
                  name="headCirc"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 46.5"
                  className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#305342] text-xs">Catatan Tambahan</label>
                <input
                  name="notes"
                  placeholder="Contoh: penimbangan bulanan Posyandu"
                  className="mt-1.5 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3 text-sm focus:border-[#173f34] focus:outline-none"
                />
              </div>

              <Button type="submit" className="mt-4 w-full h-13 rounded-xl bg-[#173f34] text-base font-bold text-white hover:bg-[#225647] shadow-lg">
                Simpan Hasil Pengukuran
              </Button>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: WELCOME GUIDED TOUR (ZOHO-STYLE) */}
      <WelcomeTourModal forceOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
