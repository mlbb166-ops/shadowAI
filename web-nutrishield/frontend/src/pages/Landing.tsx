import { Link } from "wouter";
import { ArrowRight, Bot, Check, Database, HeartPulse, Menu, Play, ShieldCheck, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const steps = [
  { no: "01", title: "Memahami keluarga", text: "Membaca usia, alergi, riwayat penimbangan, serta kondisi pangan lokal keluarga." },
  { no: "02", title: "Menyaring risiko", text: "Aturan deterministik Box-Cox LMS WHO 2006 bekerja sebelum AI menyusun saran atau menu." },
  { no: "03", title: "Menyusun tindakan", text: "Agen membuat rencana makan lokal 7 hari, memantau progres, dan menjelaskan alasannya." },
  { no: "04", title: "Menaikkan perhatian", text: "Ketika pola pertumbuhan perlu diperiksa, keluarga mendapat ringkasan untuk dibawa ke Posyandu." },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fbfcf8] text-[#153a2f]">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#173f34] text-[#bceecb]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-semibold tracking-tight">NutriShield</p>
              <p className="text-[10px] uppercase tracking-[.18em] text-[#667c70]">Family Intelligence</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-base font-medium text-[#526c60] md:flex">
            <Link href="/" className="text-[#173f34] font-semibold">Beranda</Link>
            <Link href="/panduan" className="hover:text-[#173f34]">Panduan</Link>
            <Link href="/architecture" className="hover:text-[#173f34]">Cara kerja</Link>
            <Link href="/sumber-data" className="hover:text-[#173f34]">Keamanan</Link>
          </nav>

          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/login">
              <Button variant="ghost" size="lg" className="h-12 text-sm font-semibold text-[#173f34] hover:bg-[#eff5eb]">
                Masuk
              </Button>
            </Link>
            <Link href="/login">
              <Button className="h-12 rounded-full bg-[#173f34] px-8 text-base font-semibold text-white shadow-md hover:bg-[#225647] hover:scale-105 transition-all">
                Mulai sekarang <ArrowRight size={17} className="ml-2" />
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-12 w-12 place-items-center rounded-xl bg-white/80 text-[#173f34] md:hidden shadow-sm"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mx-5 rounded-2xl border border-[#dce7dc] bg-white p-6 shadow-xl md:hidden">
            <nav className="flex flex-col gap-4 text-base font-medium text-[#3a5848]">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>Beranda</Link>
              <Link href="/panduan" onClick={() => setMobileMenuOpen(false)}>Panduan Kanal</Link>
              <Link href="/architecture" onClick={() => setMobileMenuOpen(false)}>Cara kerja</Link>
              <Link href="/sumber-data" onClick={() => setMobileMenuOpen(false)}>Keamanan & Sumber Data</Link>
              <div className="my-2 border-t border-[#edf3ed]" />
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Masuk ke Akun</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full h-12 rounded-full bg-[#173f34] text-white">
                  Mulai sekarang →
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section with Authentic Indonesian Hijabi Mother & Daughter Photo */}
        <section className="relative min-h-[820px] overflow-hidden bg-[#eef5ea]">
          <img
            src="/manus-storage/nutrishield-hero-family_8a162b14.jpg"
            alt="Ibu Indonesia mengenakan hijab dan balita perempuan menyiapkan makanan lokal bergizi"
            className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
          />
          {/* Soft Cream Gradient Overlay matching Image 2 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#eff5eb] via-[#eff5eb]/95 via-50% to-transparent" />

          <div className="relative mx-auto flex min-h-[820px] max-w-[1380px] items-center px-5 pt-28 sm:px-8">
            <div className="max-w-[660px]">
              <p className="text-sm font-semibold text-[#1d7952]">
                Pendamping keluarga dengan agent AI yang dapat diaudit
              </p>
              <h1 className="mt-6 text-[44px] font-semibold leading-[1.05] tracking-[-.055em] sm:text-[62px] lg:text-[76px] text-[#123f33]">
                Tumbuh sehat,<br />
                <span className="font-serif italic text-[#24855a]">tanpa menebak.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#4b695b] sm:text-lg">
                NutriShield membantu keluarga memilih pangan lokal, memantau pertumbuhan, dan memahami langkah berikutnya—dengan aturan keselamatan yang bekerja sebelum AI menjawab.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href="/login">
                  <Button className="h-14 rounded-full bg-[#173f34] px-8 text-base font-bold text-white shadow-xl hover:bg-[#225647] hover:scale-105 transition-all">
                    Masuk ke dashboard <ArrowRight size={19} className="ml-2.5" />
                  </Button>
                </Link>
                <Link href="/architecture">
                  <Button variant="outline" className="h-14 rounded-full border-2 border-[#b7cdbd] bg-white/90 px-8 text-base font-semibold text-[#173f34] hover:bg-white hover:border-[#173f34] hover:scale-105 transition-all">
                    <Play size={17} className="mr-2.5 fill-current text-[#1d7952]" /> Lihat cara kerja
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-[#496658]">
                <span className="flex items-center gap-2">
                  <Check size={15} className="text-[#278d5e]" /> Pangan pasar lokal
                </span>
                <span className="flex items-center gap-2">
                  <Check size={15} className="text-[#278d5e]" /> Jejak keputusan transparan
                </span>
                <span className="flex items-center gap-2">
                  <Check size={15} className="text-[#278d5e]" /> Bahasa mudah dipahami
                </span>
              </div>
            </div>
          </div>

          {/* Floating Agent Badge */}
          <div className="absolute bottom-6 right-6 hidden w-[320px] rounded-3xl border border-white/60 bg-white/85 p-5 shadow-[0_20px_60px_rgba(25,65,46,.16)] backdrop-blur-xl lg:block">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e3f4e7] text-[#1d8155]">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#143e32]">Agent baru selesai bekerja</p>
                <p className="mt-1 text-xs leading-5 text-[#627a6d]">4 bahan diperiksa · 7 menu disusun · tidak ada risiko baru</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#dae6dc] pt-3 text-[11px] text-[#698274]">
              <span>NS-20260916-2184</span>
              <span className="font-semibold text-[#218258]">1,8 detik</span>
            </div>
          </div>
        </section>

        {/* Statistics Band */}
        <section className="border-y border-[#e2ebe2] bg-white">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4 sm:px-8">
            <div>
              <p className="text-3xl font-bold tracking-tight text-[#173f34]">1.646</p>
              <p className="mt-1 text-xs text-[#627a6d]">record pangan bersumber</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-[#173f34]">8</p>
              <p className="mt-1 text-xs text-[#627a6d]">tahap koordinasi agen</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-[#173f34]">7 hari</p>
              <p className="mt-1 text-xs text-[#627a6d]">rencana menu lokal</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-[#173f34]">100%</p>
              <p className="mt-1 text-xs text-[#627a6d]">jejak proses transparan</p>
            </div>
          </div>
        </section>

        {/* How It Works Steps */}
        <section id="cara-kerja" className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#27875b]">Bukan chatbot biasa</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl text-[#123f33]">
                AI yang bekerja,<br />bukan sekadar menjawab.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#577062]">
                Setiap rekomendasi melewati rangkaian aturan keselamatan box-cox LMS WHO dan pangan lokal TKPI Kemenkes. Pengguna dapat memeriksa apa yang dianalisis, diblokir, atau diteruskan.
              </p>
              <Link href="/architecture" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d7952] hover:underline">
                Pelajari arsitektur data & audit agen →
              </Link>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[28px] border border-[#dfe9df] bg-[#dfe9df] sm:grid-cols-2">
              {steps.map((step) => (
                <div key={step.no} className="bg-white p-7">
                  <span className="font-mono text-xs font-bold text-[#238157]">{step.no}</span>
                  <h3 className="mt-6 text-lg font-semibold text-[#153e31]">{step.title}</h3>
                  <p className="mt-2.5 text-xs leading-6 text-[#5f786a]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="fitur" className="bg-[#123f33] py-24 text-white">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8dd2a7]">Satu rumah untuk kebutuhan keluarga</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">
                Dari dapur hari ini sampai kunjungan Posyandu berikutnya.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Feature
                icon={<HeartPulse />}
                title="Growth Sentinel"
                text="Melihat arah perubahan berat dan tinggi anak dengan Z-score WHO 2006, lalu menyiapkan ringkasan tindak lanjut."
              />
              <Feature
                icon={<Database />}
                title="Local Food Planner"
                text="Menyusun menu lokal 7 hari berbasis TKPI 2020 sesuai alergi, tekstur, dan ketersediaan pasar lokal."
              />
              <Feature
                icon={<UsersRound />}
                title="Mode Keluarga & Kader"
                text="Tampilan sederhana untuk orang tua, dengan modul kohort desa terpisah bagi kader pendamping."
              />
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section id="keamanan" className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <img
              src="/manus-storage/nutrishield-local-meal_bb9a48a3.jpg"
              alt="Bahan makanan lokal ramah anak"
              className="aspect-[4/3] w-full rounded-[32px] object-cover shadow-[0_24px_70px_rgba(30,73,50,.13)]"
            />
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3f4e7] text-[#207c54]">
                <ShieldCheck />
              </div>
              <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl text-[#123f33]">
                Keputusan AI dibatasi oleh aturan yang bisa diperiksa.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#577062]">
                NutriShield memisahkan fakta laboratorium, aturan klinis, dan penjelasan bahasa. Jika data belum cukup atau ada risiko darurat, sistem secara transparan mengarahkan ke faskes rujukan.
              </p>
              <Link href="/sumber-data">
                <Button variant="link" className="mt-5 px-0 font-semibold text-[#1c7d53]">
                  Buka sumber dan batasan data <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Professional Unified Footer */}
      <footer className="border-t border-[#dfe8df] bg-[#f7f9f5] pt-14 pb-10 text-xs text-[#5f796c]">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#173f34] text-[#bceecb]">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-base font-bold text-[#173f34]">NutriShield</span>
              </div>
              <p className="mt-3 leading-6 text-[#698275]">
                Pendamping keluarga cerdas untuk memantau pertumbuhan anak, memilih pangan bergizi lokal, dan menyiapkan langkah nyata pencegahan stunting.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#163e31] uppercase tracking-wider text-[11px]">Produk & Layanan</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/app" className="hover:text-[#173f34]">Dashboard Keluarga</Link></li>
                <li><Link href="/rencana" className="hover:text-[#173f34]">Rencana Makan 7 Hari</Link></li>
                <li><Link href="/pertumbuhan" className="hover:text-[#173f34]">Grafik Pertumbuhan WHO</Link></li>
                <li><Link href="/agent-center" className="hover:text-[#173f34]">Pusat Agen Mandiri</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#163e31] uppercase tracking-wider text-[11px]">Transparansi & Dukungan</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/architecture" className="hover:text-[#173f34]">Arsitektur & Audit Trail</Link></li>
                <li><Link href="/panduan" className="hover:text-[#173f34]">Panduan Kanal Bot</Link></li>
                <li><Link href="/sumber-data" className="hover:text-[#173f34]">Sumber Data TKPI & WHO</Link></li>
                <li><Link href="/kader" className="font-semibold text-[#1d7952] hover:underline">Portal Kader Posyandu</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#163e31] uppercase tracking-wider text-[11px]">Batasan Medis</h4>
              <p className="mt-3 leading-6 text-[#698275]">
                NutriShield adalah alat bantu pendamping keluarga dan kader, bukan alat diagnosis medis. Selalu konsultasikan kondisi klinis anak ke dokter atau Puskesmas terdekat.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#e2ece2] pt-6 sm:flex-row text-[11px] text-[#718a7c]">
            <p>© 2026 NutriShield (Shadow AI). Seluruh hak cipta dilindungi.</p>
            <div className="flex gap-4">
              <span>TKPI Kemenkes RI 2020</span>
              <span>•</span>
              <span>WHO Anthro 2006</span>
              <span>•</span>
              <span>Permenkes RI No. 2/2020</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[.06] p-7">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b9efcb] text-[#123f33]">{icon}</div>
      <h3 className="mt-8 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#b9d2c4]">{text}</p>
    </div>
  );
}
