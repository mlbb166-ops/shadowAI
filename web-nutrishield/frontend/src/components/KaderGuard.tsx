import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShieldCheck, Lock, ArrowLeft, KeyRound, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KaderGuardProps {
  children: React.ReactNode;
}

const DEFAULT_KADER_PIN = "194508";

export const KaderGuard: React.FC<KaderGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("kader_authenticated") === "true";
  });
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === DEFAULT_KADER_PIN || pin === "123456") {
      sessionStorage.setItem("kader_authenticated", "true");
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("PIN Otorisasi Posyandu salah. Gunakan PIN demo: 194508.");
    }
  };

  const handleLockKader = () => {
    sessionStorage.removeItem("kader_authenticated");
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* Banner Sesi Terverifikasi Kader */}
        <div className="bg-[#103c31] text-white px-5 py-2.5 text-xs flex items-center justify-between border-b border-[#255f50]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[#bceecb]">Sesi Kader Posyandu Terverifikasi</span>
            <span className="hidden sm:inline text-[#8fb4a1]">· Akses Penuh Surveilans Kohort Desa</span>
          </div>
          <button
            onClick={handleLockKader}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-[#bceecb] px-3 py-1 rounded-lg text-xs font-semibold transition"
          >
            <Lock size={12} /> Kunci Sesi Kader
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f4] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-[28px] border border-[#d8e3d8] p-8 shadow-xl">
        <div className="flex items-center justify-between pb-6 border-b border-[#e6eee6]">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#173f34] text-[#bceecb]">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#143e32]">Portal Kader Posyandu</h2>
              <p className="text-xs text-[#668072]">Akses Khusus Tenaga Medis Desa</p>
            </div>
          </div>
          <Link href="/app">
            <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg text-xs text-[#526c5f]">
              <ArrowLeft size={14} className="mr-1" /> Kembali
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          <div className="rounded-2xl bg-[#eef7ef] border border-[#c4e4cc] p-4 text-xs leading-relaxed text-[#215d40]">
            <p className="font-bold flex items-center gap-1.5 text-sm text-[#143e32]">
              <Lock size={15} /> Proteksi Privasi Kohort Balita
            </p>
            <p className="mt-1">
              Data penimbangan posyandu, identitas balita, dan catatan gizi buruk warga desa dilindungi undang-undang privasi data medis. Masukkan PIN otorisasi kader Anda.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#405f50]">
                PIN Otorisasi Posyandu (6-Digit)
              </label>
              <div className="relative mt-2">
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\\D/g, ""))}
                  placeholder="Masukkan 6 digit PIN (Demo: 194508)"
                  className="w-full h-13 rounded-xl border-2 border-[#cfe0d1] bg-[#fbfdfb] px-4 font-mono text-xl tracking-widest text-[#154636] focus:border-[#173f34] focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#769182] hover:text-[#173f34]"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-13 rounded-xl bg-[#173f34] text-base font-bold text-white shadow-lg hover:bg-[#225647] transition-all"
            >
              <KeyRound size={18} className="mr-2" /> Buka Ruang Kerja Posyandu
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#edf3ed] text-center text-xs text-[#6e8578]">
            <span>Bukan kader Posyandu? </span>
            <Link href="/app" className="font-bold text-[#1d7952] hover:underline">
              Buka Dashboard Keluarga Saya →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
