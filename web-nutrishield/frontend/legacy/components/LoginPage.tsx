import React, { useState } from 'react';
import { authService, UserRole, UserSession } from '../services/authService';
import {
  Shield,
  Users,
  HeartHandshake,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  Building2,
  Database,
  Activity
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  onOpenReportModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onOpenReportModal }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'form'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickLogin = async (role: UserRole) => {
    try {
      const session = await authService.login(role + '@demo.nutrishield.id', 'demo123');
      onLoginSuccess(session);
    } catch { /* ignore */ }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Silakan masukkan email atau NIK.');
      return;
    }
    try {
      const session = await authService.login(email.trim(), password);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal.');
    }
  };

  const setDemoEmail = (role: UserRole) => {
    if (role === 'kader') {
      setEmail('rahmawati.kader@posyandu.depok.go.id');
      setPassword('kader123');
    } else if (role === 'parent') {
      setEmail('sarah.anindita@keluarga.id');
      setPassword('ibu123');
    } else {
      setEmail('dr.budi@puskesmas-depok.go.id');
      setPassword('dokter123');
    }
    setActiveTab('form');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-700 selection:text-white relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-teal-900/25 via-emerald-950/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-900/40">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">NutriShield</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                Sistem Klinis 1.000 HPK
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-800/50 hover:border-teal-700 bg-teal-950/40"
              >
                <span>Dokumen Standar Klinis</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">SQLite 3 WAL Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4 sm:my-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero & Explainer (Desktop) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950 border border-teal-800 text-teal-300 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>Full-Stack Care Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Akses Portal <span className="text-teal-400">NutriShield</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Platform terintegrasi pencegahan stunting 1.000 HPK berbasis standar antropometri 
              <strong className="text-white font-semibold"> WHO 2006</strong>, regulasi 
              <strong className="text-white font-semibold"> Permenkes No. 2/2020</strong>, dan 
              <strong className="text-white font-semibold"> 1.146 data gizi TKPI Kemenkes RI</strong>.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-teal-900/60 border border-teal-700 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white font-semibold">Alur Tiga Persona Lengkap:</strong> Pengalaman personal disesuaikan untuk Ibu Balita, Kader Posyandu, dan Petugas Puskesmas.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-teal-900/60 border border-teal-700 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white font-semibold">Database Riil &amp; AI Sentinel:</strong> Perhitungan Z-score deterministik Box-Cox LMS dan deteksi dini indikator 2T secara otonom.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-teal-900/60 border border-teal-700 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white font-semibold">Katalog Pangan &amp; Scanner BTP:</strong> Verifikasi keamanan pangan kemasan dan rekomendasi MP-ASI berbasis pangan lokal.
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Interactive Box */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Tab switch between Quick Access and Manual Form */}
            <div className="flex bg-slate-950 p-1.5 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('quick')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'quick'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pilih Peran Pengguna
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'form'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk dengan Akun / NIK
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* TAB 1: 3 ONE-CLICK STAKEHOLDER PORTALS */}
            {activeTab === 'quick' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Pilih Persona untuk Akses Langsung:
                  </span>
                  <span className="text-[11px] text-teal-400">1-Klik Langsung Aktif</span>
                </div>

                {/* 1. KADER POSYANDU */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('kader')}
                  className="w-full text-left p-4 rounded-xl border border-teal-800/70 bg-gradient-to-r from-teal-950/50 to-slate-900 hover:from-teal-900/50 hover:to-slate-800/80 transition group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-800/80 text-teal-200 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-teal-300 transition">
                          Kader Posyandu
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Ibu Rahmawati, S.K.M. • Posyandu Mawar III
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-teal-900 text-teal-300 border border-teal-700 flex items-center gap-1">
                      <span>Masuk</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-10.5">
                    Workspace input timbangan balita, kalkulasi Z-score WHO, deteksi 2T faltering, care tasks, dan kohort.
                  </p>
                </button>

                {/* 2. IBU & KELUARGA BALITA */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('parent')}
                  className="w-full text-left p-4 rounded-xl border border-amber-900/50 bg-gradient-to-r from-amber-950/30 to-slate-900 hover:from-amber-900/40 hover:to-slate-800/80 transition group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-900/80 text-amber-200 flex items-center justify-center font-bold">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                          Ibu &amp; Keluarga Balita
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Ibu Sarah Anindita • Ibu dari Adik Bintang (14 Bln)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                      <span>Masuk</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-10.5">
                    Tampilan ramah empati tanpa istilah rumit, pemantauan kurva anak, rekomendasi MP-ASI lokal padat gizi.
                  </p>
                </button>

                {/* 3. SUPERVISOR / DOKTER PUSKESMAS */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('supervisor')}
                  className="w-full text-left p-4 rounded-xl border border-indigo-900/50 bg-gradient-to-r from-indigo-950/30 to-slate-900 hover:from-indigo-900/40 hover:to-slate-800/80 transition group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-900/80 text-indigo-200 flex items-center justify-center font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition">
                          Supervisor Puskesmas
                        </div>
                        <div className="text-[11px] text-slate-400">
                          dr. Budi Santoso, Sp.A • Puskesmas Beji
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                      <span>Masuk</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-10.5">
                    Surveilans stunting tingkat kecamatan, audit kepatuhan posyandu, telaah kasus 2T dan stunting kronis.
                  </p>
                </button>

                <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-teal-400" />
                  <span>Sesi tersimpan lokal dan dapat berganti peran kapan saja dari header.</span>
                </div>
              </div>
            ) : (
              /* TAB 2: MANUAL FORM LOGIN */
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alamat Email atau NIK
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh: rahmawati.kader@posyandu.depok.go.id"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Quick Pre-fill Shortcuts */}
                <div className="pt-1 pb-1">
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    Gunakan Akun Simulasi Cepat:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDemoEmail('kader')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-teal-950 border border-teal-800 text-teal-300 hover:bg-teal-900 transition"
                    >
                      Kader Posyandu
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoEmail('parent')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-800 text-amber-300 hover:bg-amber-900 transition"
                    >
                      Ibu Balita
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoEmail('supervisor')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 hover:bg-indigo-900 transition"
                    >
                      Dokter Puskesmas
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-teal-950 flex items-center justify-center gap-2"
                >
                  <span>Masuk ke Dashboard NutriShield</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Institutional Standards Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            NutriShield v2.4 • Komputasi Antropometri WHO 2006 &amp; Permenkes No. 2/2020
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>TKPI Kemenkes RI (1.146 Pangan)</span>
            <span>•</span>
            <span>BTP BPOM No. 11/2019</span>
            <span>•</span>
            <span>100% Bebas AI Hallucination</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
