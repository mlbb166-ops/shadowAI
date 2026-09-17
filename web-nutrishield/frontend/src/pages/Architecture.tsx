import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Database,
  FileCheck2,
  LockKeyhole,
  Scale,
  ShieldCheck,
  TableProperties,
  Cpu,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { endpoints, asRecord, asList, text } from "@/api";

const domains = [
  {
    title: "1. Identitas & Privasi",
    icon: LockKeyhole,
    desc: "Sesi terenkripsi, profil anak terpisah per akun, dan rekaman persetujuan eksplisit.",
    tables: ["users", "sessions", "child_profiles", "consents", "channel_link_codes"],
  },
  {
    title: "2. Catatan Pertumbuhan Keluarga",
    icon: Scale,
    desc: "Pencatatan antropometri (BB, TB/PB, LK) riil berbasis standar WHO Anthro 2006.",
    tables: ["measurements", "growth_assessments", "care_tasks", "daily_logs"],
  },
  {
    title: "3. Danau Data Pangan Nusantara",
    icon: Database,
    desc: "Gudang data pangan lokal TKPI Kemenkes RI 2020, data BPOM BTP, dan Open Food Facts.",
    tables: ["tkpi_foods", "canonical_foods", "food_nutrients", "food_catalog", "normalization_issues"],
  },
  {
    title: "4. Eksekusi & Audit Agen AI",
    icon: Bot,
    desc: "Jejak audit penuh (correlation ID, latensi riil, model, versi kebijakan, dan status eksekusi).",
    tables: ["agent_jobs", "agent_runs", "agent_steps", "audit_events"],
  },
];

const stages = [
  { order: "01", name: "Observer", desc: "Membaca profil anak, usia, riwayat timbangan, dan persetujuan keluarga." },
  { order: "02", name: "Data Quality", desc: "Validasi keabsahan angka (rentang usia 0-60 bln, outlier, duplikasi)." },
  { order: "03", name: "Safety Policy", desc: "Pemeriksaan aturan keselamatan (peringatan tanda bahaya, alergen, usia)." },
  { order: "04", name: "Food Retriever", desc: "Pencarian pangan kanonikal lokal yang terverifikasi dan memenuhi syarat." },
  { order: "05", name: "Planner", desc: "Menyusun tindakan deterministik (rekomendasi menu lokal & jadwal ukur)." },
  { order: "06", name: "Family Explainer", desc: "Menerjemahkan hasil ke bahasa Indonesia yang hangat, ramah, dan jelas." },
  { order: "07", name: "Output Guard", desc: "Memeriksa agar output tidak memberikan diagnosis obat atau klaim medis keliru." },
  { order: "08", name: "Action Recorder", desc: "Menyimpan hasil ke database SQLite, memicu notifikasi, dan mencatat log audit." },
];

export default function Architecture() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    endpoints
      .publicFoodStats()
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfcf8] text-[#153a2f]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#e5ede5] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#173f34] text-[#bceecb]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="font-semibold tracking-tight text-[#173f34]">NutriShield</p>
              <p className="text-[10px] uppercase tracking-[.18em] text-[#667c70]">Family Intelligence</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#526c60] md:flex">
            <Link href="/" className="hover:text-[#173f34]">Beranda</Link>
            <Link href="/panduan" className="hover:text-[#173f34]">Panduan Kanal</Link>
            <Link href="/architecture" className="font-semibold text-[#173f34]">Arsitektur & Audit</Link>
            <Link href="/sumber-data" className="hover:text-[#173f34]">Sumber Data</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="h-11 px-5 rounded-xl text-sm font-semibold text-[#173f34] hover:bg-[#eff5eb]">
                Masuk
              </Button>
            </Link>
            <Link href="/app">
              <Button className="h-11 rounded-xl bg-[#173f34] px-6 text-sm font-bold text-white hover:bg-[#225647]">
                Dashboard <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
        {/* Hero Section */}
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wider text-[#1d7952]">Transparansi Sistem & Audit Trail</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Arsitektur yang dapat diperiksa, <br />
            <span className="font-serif italic text-[#25875c]">dari data mentah ke jawaban bertanggung jawab.</span>
          </h1>
          <p className="mt-4 text-base leading-7 text-[#577264] sm:text-lg">
            NutriShield menolak konsep "AI kotak hitam". Setiap rekomendasi dipandu oleh aturan deterministik Box-Cox LMS WHO 2006, database gizi resmi TKPI Kemenkes RI 2020, dan sistem koordinasi agen 8 tahapan dengan jejak audit nyata.
          </p>
        </div>

        {/* 4 Pipeline Stages */}
        <section className="mt-14">
          <div className="flex items-center justify-between border-b border-[#e1ece1] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1d7952]">Pipa Normalisasi Data Pangan</p>
              <h2 className="mt-1 text-2xl font-semibold">Broad In, Quality-Gated Out</h2>
            </div>
            {stats && (
              <div className="hidden text-right text-xs text-[#627a6d] sm:block">
                <span>{stats.total_records ?? "6.039"} data sumber</span> ·{" "}
                <span className="font-semibold text-[#1d7952]">{stats.canonical_records ?? "1.146"} pangan kanonikal</span>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-[#1d7952]">01</span>
              <h3 className="mt-3 text-lg font-semibold">Raw Records</h3>
              <p className="mt-2 text-xs leading-5 text-[#637d70]">
                Menyimpan data mentah dari TKPI Panganku, Open Food Facts Indonesia, dan regulasi BTP BPOM dengan integritas penuh.
              </p>
            </div>
            <div className="rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-[#1d7952]">02</span>
              <h3 className="mt-3 text-lg font-semibold">Normalisasi</h3>
              <p className="mt-2 text-xs leading-5 text-[#637d70]">
                Pembersihan unicode, standarisasi takaran gram/100g, deteksi alergen, dan klasifikasi jenis pangan olahan vs pangan segar.
              </p>
            </div>
            <div className="rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-[#1d7952]">03</span>
              <h3 className="mt-3 text-lg font-semibold">Canonical Foods</h3>
              <p className="mt-2 text-xs leading-5 text-[#637d70]">
                Penggabungan konservatif entitas pangan lokal bernutrisi tinggi (ikan kembung, hati ayam, tempe, kelor) tanpa manipulasi angka nol.
              </p>
            </div>
            <div className="rounded-2xl border border-[#bceecb] bg-[#f0f8f2] p-6 shadow-sm">
              <span className="font-mono text-xs font-bold text-[#1d7952]">04</span>
              <h3 className="mt-3 text-lg font-semibold text-[#123f33]">Eligibility Gate</h3>
              <p className="mt-2 text-xs leading-5 text-[#406856]">
                Pemberian label kelayakan: <em>Layak Perencanaan</em> (data makro/mikro lengkap), <em>Perbandingan</em>, atau <em>Penelusuran</em> saja.
              </p>
            </div>
          </div>
        </section>

        {/* 4 Database Domains */}
        <section className="mt-16">
          <div className="border-b border-[#e1ece1] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1d7952]">Arsitektur Penyimpanan SQLite 3 (WAL Mode)</p>
            <h2 className="mt-1 text-2xl font-semibold">Empat Domain Basis Data Terisolasi</h2>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {domains.map((dom) => {
              const Icon = dom.icon;
              return (
                <div key={dom.title} className="rounded-2xl border border-[#dfe8df] bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf4eb] text-[#1d7952]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{dom.title}</h3>
                      <p className="text-xs text-[#637d70]">{dom.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-[#f0f4f0]">
                    {dom.tables.map((tbl) => (
                      <span
                        key={tbl}
                        className="rounded-md border border-[#e1ebe1] bg-[#f7faf7] px-2.5 py-1 font-mono text-[11px] text-[#2d5241]"
                      >
                        {tbl}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 8-Stage Agent Coordinator Flow */}
        <section className="mt-16 rounded-3xl bg-[#123f33] p-8 text-white shadow-xl sm:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#bceecb]">
              Event-Driven Multi-Agent Pipeline
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Delapan Tahap Koordinasi Agen Mandiri
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#bdd4c7]">
              Sebelum model bahasa generatif menghasilkan teks sapaan ke keluarga, tujuh gerbang aturan keselamatan dan validasi data klinis telah selesai dieksekusi secara berurutan.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((st) => (
              <div
                key={st.order}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#bceecb]">{st.order}</span>
                  <ShieldCheck size={16} className="text-[#65ba8c]" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">{st.name}</h3>
                <p className="mt-2 text-xs leading-5 text-[#b9d2c4]">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/15 bg-black/20 p-4 text-xs text-[#cadad0]">
            <p className="font-semibold text-white">Prinsip Batas Keamanan & Audit:</p>
            <p className="mt-1">
              Agen tidak diperkenankan mengeksekusi shell atau kode Python arbitrary. Jika terdeteksi kata kunci darurat (sesak napas, kejang, dehidrasi berat) atau alergen berisiko tinggi, sistem segera menghentikan alur generatif dan menampilkan kontak rujukan Puskesmas/Rumah Sakit terdekat.
            </p>
          </div>
        </section>

        {/* CTA Bottom */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#dfe8df] bg-white p-8 sm:flex-row sm:px-12">
          <div>
            <h3 className="text-xl font-semibold">Ingin mencoba langsung catatan keluarga?</h3>
            <p className="mt-1 text-sm text-[#5f796c]">
              Daftarkan profil anak Anda dan rasakan kemudahan pemantauan tumbuh kembang berbasis sains.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/panduan">
              <Button variant="outline" className="h-13 rounded-xl border-2 border-[#c2d7c6] px-7 text-base font-bold text-[#173f34] hover:bg-[#eff5eb]">
                Panduan Kanal
              </Button>
            </Link>
            <Link href="/app">
              <Button className="h-13 rounded-xl bg-[#173f34] px-8 text-base font-bold text-white shadow-lg hover:bg-[#225647]">
                Buka Dashboard <ArrowRight size={17} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#e1e9e1] bg-[#f7f9f5] py-10 text-xs text-[#637d70]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <p>© 2026 NutriShield (Shadow AI). Prototipe sains dan panduan keluarga.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:underline">Beranda</Link>
            <Link href="/panduan" className="hover:underline">Panduan Kanal</Link>
            <Link href="/architecture" className="hover:underline">Arsitektur</Link>
            <Link href="/sumber-data" className="hover:underline">Sumber Data</Link>
            <Link href="/kader" className="text-[#1b764f] font-semibold hover:underline">Mode Posyandu</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
