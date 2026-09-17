import React, { useState, FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  HeartHandshake,
  History,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";

interface AuthPageProps {
  mode: "login" | "register";
  onLoginSuccess?: (user: any) => void;
}

export default function AuthPage({ mode, onLoginSuccess }: AuthPageProps) {
  const [, setLocation] = useLocation();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      let user;
      if (isRegister) {
        if (!consent) {
          throw new Error("Anda perlu menyetujui klausul privasi data untuk melanjutkan.");
        }
        user = await authService.register(name.trim(), email.trim(), password, consent);
      } else {
        user = await authService.login(email.trim(), password);
      }

      setSuccess(true);
      if (onLoginSuccess) onLoginSuccess(user);

      // Short delay for visual feedback before redirect
      setTimeout(() => setLocation("/app"), 400);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses permintaan autentikasi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9f5] text-[#143e32]">
      {/* Top Header */}
      <header className="border-b border-[#e1ece1] bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#173f34] text-[#bceecb]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="font-semibold tracking-tight text-[#173f34]">NutriShield</p>
              <p className="text-[10px] uppercase tracking-[.18em] text-[#667c70]">Family Intelligence</p>
            </div>
          </Link>
          <Link href="/" className="text-sm font-semibold text-[#256c4d] hover:underline flex items-center gap-1.5">
            <ArrowLeft size={15} /> Kembali
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1100px] flex-col items-center justify-center px-5 py-10 lg:py-16">
        <div className="grid w-full gap-0 overflow-hidden rounded-[28px] border border-[#dce6dc] bg-white shadow-xl lg:grid-cols-[1.1fr_.9fr]">
          {/* Left Column: Brand */}
          <div className="flex flex-col justify-between bg-[#123f33] p-8 text-white sm:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#bceecb]">Ruang Catatan Keluarga Aman</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                {isRegister
                  ? "Catatan keluarga mandiri, dalam kendali penuh Anda."
                  : "Selamat datang kembali di NutriShield."}
              </h1>
              <p className="mt-4 text-sm leading-6 text-[#bdd4c7]">
                {isRegister
                  ? "Buat akun keluarga untuk menyimpan riwayat pertumbuhan anak, mencatat timbangan secara berkala, dan berkonsultasi dengan asisten AI berbasis aturan deterministik."
                  : "Masuk untuk melanjutkan pemantauan tumbuh kembang ananda, mengevaluasi asupan menu lokal, dan memeriksa jejak proses agen."}
              </p>

              <div className="mt-10 space-y-4 text-xs text-[#d3e5db]">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-[#bceecb]">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Terpisah Per Akun</strong>
                    <span>Data anak dan timbangan disimpan eksklusif pada sesi keluarga Anda.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-[#bceecb]">
                    <History size={14} />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Transparansi Audit Agen</strong>
                    <span>Setiap rekomendasi agen AI menyertakan alasan kebijakan keselamatan dan rujukan data pangan nyata.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-[#bceecb]">
                    <HeartHandshake size={14} />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Batas yang Bertanggung Jawab</strong>
                    <span>Bukan alat diagnosis medis dan tidak memberikan takaran obat/suplemen tanpa supervisi klinis.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/15 pt-6 text-[11px] text-[#97baa4]">
              NutriShield v2 · Box-Cox LMS WHO 2006 & TKPI Kemenkes RI 2020
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#153a2f]">
                {isRegister ? "Buat Akun Keluarga" : "Masuk ke Akun Anda"}
              </h2>
              <p className="mt-1.5 text-sm text-[#627a6d]">
                {isRegister
                  ? "Isi formulir singkat di bawah untuk memulai pencatatan tumbuh kembang."
                  : "Gunakan email dan kata sandi yang telah Anda daftarkan."}
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#b3e2c5] bg-[#eef8f1] p-4 text-sm text-[#1a6b3f]">
                <Check size={18} className="shrink-0" />
                <span className="font-medium">
                  {isRegister ? "Akun berhasil dibuat! Mengalihkan ke dashboard…" : "Berhasil masuk! Mengalihkan…"}
                </span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !success && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#f0c2bd] bg-[#fdf3f2] p-4 text-sm text-[#9c3024]">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-[#305342]">Nama Sapaan Anda</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Bunda Rani"
                    className="mt-2 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3.5 text-sm text-[#163e31] placeholder:text-[#a3b5a8] focus:border-[#173f34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173f34]/15 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#305342]">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bunda@email.com"
                  className="mt-2 w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3.5 text-sm text-[#163e31] placeholder:text-[#a3b5a8] focus:border-[#173f34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173f34]/15 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-[#305342]">Kata Sandi</label>
                </div>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={isRegister ? 6 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegister ? "Minimal 6 karakter" : "Kata sandi Anda"}
                    className="w-full rounded-xl border border-[#cddccd] bg-[#fbfdfb] px-4 py-3.5 pr-12 text-sm text-[#163e31] placeholder:text-[#a3b5a8] focus:border-[#173f34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173f34]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-[#7a9485] hover:bg-[#eef3ee] hover:text-[#173f34] transition-colors"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <label className="flex items-start gap-3 pt-1 text-sm leading-6 text-[#546e60] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-[#bdcfbe] text-[#173f34] focus:ring-[#173f34] cursor-pointer"
                  />
                  <span>
                    Saya menyetujui pemrosesan data penimbangan balita untuk keperluan pemantauan tumbuh kembang keluarga. Saya memahami NutriShield bukan pengganti diagnosis dokter.
                  </span>
                </label>
              )}

              <Button
                type="submit"
                disabled={loading || success}
                className="mt-3 w-full rounded-xl bg-[#173f34] py-4 text-base font-semibold text-white shadow-lg hover:bg-[#225647] hover:shadow-xl disabled:opacity-60 transition-all min-h-[52px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2.5">
                    <LoaderCircle size={18} className="animate-spin" /> Memproses…
                  </span>
                ) : success ? (
                  <span className="flex items-center gap-2">
                    <Check size={18} /> Berhasil!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isRegister ? "Daftar Akun Keluarga" : "Masuk ke Dashboard"} <ArrowRight size={18} />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-7 flex flex-col gap-3 text-center">
              <p className="text-sm text-[#647c6f]">
                {isRegister ? "Sudah memiliki akun keluarga?" : "Belum memiliki akun?"}{" "}
                <Link
                  href={isRegister ? "/login" : "/register"}
                  className="font-semibold text-[#1c6e48] hover:underline"
                >
                  {isRegister ? "Masuk di sini" : "Daftar sekarang"}
                </Link>
              </p>

              <div className="my-1 border-t border-[#e8efe8]" />

              <p className="text-xs text-[#7c8f84]">
                Petugas / Kader Posyandu?{" "}
                <Link href="/kader" className="font-semibold text-[#173f34] hover:underline">
                  Buka Portal Kerja Kader →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
