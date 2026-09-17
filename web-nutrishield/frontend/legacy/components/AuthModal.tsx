import React, { useState } from 'react';
import { authService, UserRole, UserSession } from '../services/authService';
import { Shield, Users, HeartHandshake, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'demo' | 'form'>('demo');

  if (!isOpen) return null;

  const handleDemoLogin = async (role: UserRole) => {
    try {
      const session = await authService.login(role + '@demo.nutrishield.id', 'demo123');
      onLoginSuccess(session);
      onClose();
    } catch { /* ignore */ }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const session = await authService.login(email, password);
      onLoginSuccess(session);
      onClose();
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal-800 text-white flex items-center justify-center mx-auto mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Portal Masuk NutriShield</h3>
          <p className="text-xs text-slate-400 mt-1">
            Sistem Pemantauan Kohort 1.000 HPK &amp; Skrining Pertumbuhan Balita
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'demo'
                ? 'bg-teal-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Akses Cepat Uji Coba
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'form'
                ? 'bg-teal-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk Manual
          </button>
        </div>

        {activeTab === 'demo' ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 mb-2">
              Pilih Peran Evaluasi:
            </div>

            {/* Role 1: Kader Posyandu */}
            <button
              onClick={() => handleDemoLogin('kader')}
              className="w-full text-left p-4 rounded-xl border border-teal-800/60 bg-teal-950/40 hover:bg-teal-900/40 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-white group-hover:text-teal-300 text-sm">
                    Kader Posyandu
                  </span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  Akses Penuh
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ibu Rahmawati, S.K.M. — Posyandu Mawar III, Kel. Beji, Depok
              </p>
              <p className="text-[11px] text-teal-400 mt-1.5">
                Manajemen data kohort, input penimbangan balita, deteksi indikator 2T, unduh CSV.
              </p>
            </button>

            {/* Role 2: Orang Tua Balita */}
            <button
              onClick={() => handleDemoLogin('parent')}
              className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-950/60 hover:bg-slate-800/60 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white group-hover:text-amber-300 text-sm">
                    Ibu &amp; Keluarga Balita
                  </span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Wajah Ramah
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ibu Sarah Anindita — Ibu dari Adik Bintang (14 Bulan)
              </p>
              <p className="text-[11px] text-amber-400 mt-1.5">
                Bahasa ramah tanpa jargon medis, inspirasi resep MPASI, bot Telegram, kontak kader.
              </p>
            </button>

            {/* Role 3: Supervisor Puskesmas */}
            <button
              onClick={() => handleDemoLogin('supervisor')}
              className="w-full text-left p-4 rounded-xl border border-purple-900/60 bg-purple-950/40 hover:bg-purple-900/40 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-white group-hover:text-purple-300 text-sm">
                    Supervisor / Dokter Puskesmas
                  </span>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Supervisi Klinis
                </span>
              </div>
              <p className="text-xs text-slate-300">
                dr. Budi Santoso, Sp.A — Puskesmas Kecamatan Beji
              </p>
              <p className="text-[11px] text-purple-300 mt-1.5">
                Audit kohort lintas wilayah, evaluasi kasus 2T &amp; stunting berat, pengawasan integritas data.
              </p>
            </button>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 mt-4 text-center">
              Tiga persona sistem (Ibu, Kader, Supervisor) dapat dialihkan kapan saja untuk kemudahan evaluasi.
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Alamat Email atau NIK
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@posyandu.depok.go.id"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-xl text-sm transition"
            >
              Masuk ke Sistem
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
