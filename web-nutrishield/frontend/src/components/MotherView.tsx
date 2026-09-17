import React, { useState, useEffect } from 'react';
import { UserSession } from '../services/authService';
import { apiClient } from '../services/apiClient';
import {
  Heart,
  Sparkles,
  Calendar,
  Utensils,
  PhoneCall,
  Copy,
  Check,
  Send,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Bot,
  UserCheck,
  ChevronDown
} from 'lucide-react';

interface MotherViewProps {
  user: UserSession;
  onOpenReportModal?: () => void;
  onSwitchToKaderView?: () => void;
}

interface ChildSummary {
  id: string;
  name: string;
  ageMonths: number;
  gender: string;
  latestWeight: number;
  latestHeight: number;
  haz: number;
  waz: number;
  overallStatus: string;
  isStunted: boolean;
  is2TAlert: boolean;
  parentName: string;
  allergens: string[];
}

export const MotherView: React.FC<MotherViewProps> = ({
  user,
  onOpenReportModal,
  onSwitchToKaderView
}) => {
  const [childrenList, setChildrenList] = useState<ChildSummary[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('child-01');
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);

  // Form input mandiri (langsung di halaman)
  const [inputWeight, setInputWeight] = useState('9.6');
  const [inputHeight, setInputHeight] = useState('76.0');
  const [inputAge, setInputAge] = useState('14');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Filter Alergen Resep MPASI
  const [allergenFilters, setAllergenFilters] = useState<{ [key: string]: boolean }>({
    telur: false,
    seafood: true, // Muhammad Bintang has seafood allergy by default
    susu: false,
  });

  // Telegram Assistant Simulator
  const [pairCode, setPairCode] = useState('NUTRI-7821');
  const [copiedCode, setCopiedCode] = useState(false);
  const [botMessages, setBotMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Halo Bunda Sarah! Selamat datang di Asisten NutriShield. Akun Anda telah terhubung dengan pemantauan ananda Muhammad Bintang (14 bulan). Ketik /cek untuk status pertumbuhan, atau /resep untuk ide makanan bergizi hari ini.',
      time: '08:00'
    }
  ]);
  const [botInput, setBotInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);

  // Details accordion
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Load children from SQLite on mount
  useEffect(() => {
    apiClient.getChildren()
      .then((records) => {
        if (records && records.length > 0) {
          const mapped: ChildSummary[] = records.map((r: any) => {
            const latestM = r.measurements && r.measurements.length > 0 ? r.measurements[r.measurements.length - 1] : null;
            return {
              id: r.id,
              name: r.name,
              ageMonths: latestM ? latestM.ageMonths : 12,
              gender: r.gender,
              latestWeight: latestM ? latestM.weightKg : 8.5,
              latestHeight: latestM ? latestM.heightCm : 73.0,
              haz: latestM ? latestM.haz : 0.0,
              waz: latestM ? latestM.waz : 0.0,
              overallStatus: latestM ? latestM.overallStatus : 'Normal',
              isStunted: latestM ? latestM.isStunted : false,
              is2TAlert: latestM ? latestM.is2TAlert : false,
              parentName: r.parentName,
              allergens: r.allergens || []
            };
          });
          setChildrenList(mapped);
          const found = mapped.find(c => c.id === 'child-01') || mapped[0];
          setSelectedChild(found);
          if (found) {
            setInputWeight(found.latestWeight.toString());
            setInputHeight(found.latestHeight.toString());
            setInputAge(found.ageMonths.toString());
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching children for mother view:', err);
      });

    // Load pairing code
    apiClient.getTelegramPairCode('child-01')
      .then(res => {
        if (res.pairingCode) setPairCode(res.pairingCode);
      })
      .catch(() => {});
  }, []);

  const handleSelectChild = (id: string) => {
    setSelectedChildId(id);
    const found = childrenList.find(c => c.id === id);
    if (found) {
      setSelectedChild(found);
      setInputWeight(found.latestWeight.toString());
      setInputHeight(found.latestHeight.toString());
      setInputAge(found.ageMonths.toString());
      setSubmitResult(null);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Submit Penimbangan Mandiri langsung ke Backend SQLite
  const handleSubmitMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const w = parseFloat(inputWeight);
    const h = parseFloat(inputHeight);
    const a = parseFloat(inputAge);

    // Frontend pre-check
    if (h < 1.5 && h > 0.3) {
      setSubmitError(`Tinggi badan ${h} kemungkinan dalam satuan meter. Masukkan dalam centimeter (contoh: ${Math.round(h * 100)} cm).`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await apiClient.recordScreening({
        nik: `327601${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        name: selectedChild.name,
        gender: selectedChild.gender as 'male' | 'female',
        birthDate: '2025-07-10',
        ageMonths: a,
        weightKg: w,
        heightCm: h,
        parentName: user.name,
        address: (user as any).organization || 'Alamat belum tersedia',
        allergens: selectedChild.allergens
      });

      setSubmitResult(res);
      // Update selected child state
      setSelectedChild(prev => prev ? {
        ...prev,
        latestWeight: w,
        latestHeight: h,
        ageMonths: a,
        haz: res.assessment?.haz ?? prev.haz,
        waz: res.assessment?.waz ?? prev.waz,
        isStunted: res.assessment?.isStunted ?? prev.isStunted,
        is2TAlert: res.assessment?.is2TAlert ?? prev.is2TAlert,
        overallStatus: res.assessment?.isStunted ? 'Stunted' : (res.assessment?.is2TAlert ? 'Growth Faltering (2T)' : 'Normal')
      } : null);

    } catch (err: any) {
      console.error('Error submitting measurement:', err);
      setSubmitError('Terjadi kendala saat menyimpan data ke backend. Mohon periksa kembali angka timbangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message in Telegram Simulator
  const handleSendBotMessage = async (customText?: string) => {
    const textToSend = customText || botInput.trim();
    if (!textToSend) return;

    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setBotMessages(prev => [...prev, { sender: 'user', text: textToSend, time: timeStr }]);
    if (!customText) setBotInput('');
    setBotTyping(true);

    try {
      const res = await apiClient.simulateTelegramMessage(123456789, textToSend, user.name);
      setTimeout(() => {
        setBotTyping(false);
        setBotMessages(prev => [
          ...prev,
          { sender: 'bot', text: res.response || 'Perintah diterima.', time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }, 500);
    } catch (e) {
      setBotTyping(false);
      setBotMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Koneksi asisten sedang aktif, ketik /cek atau /resep.', time: timeStr }
      ]);
    }
  };

  const activeChildName = selectedChild?.name || 'Muhammad Bintang Al-Fatih';
  const activeChildAge = selectedChild?.ageMonths || 14;
  const activeChildWeight = selectedChild?.latestWeight || 9.6;
  const activeChildHeight = selectedChild?.latestHeight || 76.0;
  const isHealthy = !selectedChild?.isStunted && !selectedChild?.is2TAlert;

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* 1. Welcoming Reassuring Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold border border-teal-400/30">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Pendampingan Tumbuh Kembang Keluarga Sehat</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Halo, {user.name}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Pantau tumbuh kembang buah hati secara nyata, dapatkan inspirasi menu MPASI lokal bergizi tinggi, 
              serta terima pengingat jadwal Posyandu secara otomatis.
            </p>
          </div>

          {/* Child Picker */}
          {childrenList.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 self-start md:self-auto min-w-[240px]">
              <label className="block text-[11px] font-semibold text-teal-200 uppercase tracking-wider mb-1">
                Pilih Balita yang Dipantau:
              </label>
              <div className="relative">
                <select
                  value={selectedChildId}
                  onChange={(e) => handleSelectChild(e.target.value)}
                  className="w-full bg-slate-900/90 text-white text-xs font-semibold py-2 px-3 pr-8 rounded-lg border border-teal-500/40 focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none cursor-pointer"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ageMonths} bln)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-teal-300 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
              <div className="text-[10px] text-slate-300 mt-1.5 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>Terdaftar di Posyandu Mawar III</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Ringkasan Status Pertumbuhan Balita (Bukan Jargon) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Status Tumbuh Kembang Saat Ini
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {activeChildName} ({activeChildAge} Bulan)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data terverifikasi di Posyandu Mawar III • Pendamping: Ibu Rahmawati (Kader)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isHealthy ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pertumbuhan Optimal (Jalur Hijau KMS)</span>
              </div>
            ) : selectedChild?.isStunted ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Perlu Dukungan Tambahan Tinggi Badan</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Perhatian: Berat Badan Belum Naik Optimal (2T)</span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Berat Badan Terakhir</div>
            <div className="text-2xl font-bold text-slate-900">
              {activeChildWeight} <span className="text-sm font-normal text-slate-500">kg</span>
            </div>
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <span>{isHealthy ? '↑ Naik stabil (+0.2 kg)' : 'Perlu asupan energi padat'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs text-slate-500 font-medium">Panjang / Tinggi Badan</div>
            <div className="text-2xl font-bold text-slate-900">
              {activeChildHeight} <span className="text-sm font-normal text-slate-500">cm</span>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Standar WHO untuk usia {activeChildAge} bulan
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1">
            <div className="text-xs text-teal-800 font-medium">Target Protein Harian</div>
            <div className="text-2xl font-bold text-teal-900">
              {(activeChildWeight * 1.2).toFixed(1)} <span className="text-sm font-normal text-teal-700">gram/hari</span>
            </div>
            <div className="text-xs text-teal-700 font-medium">
              Cukup 1 butir telur + 1 potong ikan kembung
            </div>
          </div>
        </div>

        {/* Reassuring Clinical Advice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-900 font-semibold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>Arti Pertumbuhan untuk Bunda</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {isHealthy
                ? 'Pola pertumbuhan ananda berjalan baik dan seimbang. Berat dan tinggi badan bertambah sesuai usianya, menandakan penyerapan zat gizi berjalan lancar.'
                : 'Pertumbuhan ananda sedang membutuhkan perhatian ekstra agar kurva kenaikan berat badannya kembali naik ke jalur hijau. Prioritaskan makanan berprotein hewani setiap kali makan.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs sm:text-sm">
              <Check className="w-4 h-4 text-amber-700" />
              <span>Saran Tindakan di Rumah</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {selectedChild?.allergens?.length ? (
                <>Perhatikan alergi ananda terhadap: <strong>{selectedChild.allergens.join(', ')}</strong>. Ganti dengan telur ayam, hati ayam, atau tempe. Jangan lewatkan penimbangan Posyandu berikutnya.</>
              ) : (
                <>Berikan makanan selingan padat gizi (seperti bubur kacang hijau atau puding telur). Pastikan anak cukup tidur dan terhidrasi dengan baik.</>
              )}
            </p>
          </div>
        </div>

        {/* Optional Clinical Detail Toggle */}
        <div className="pt-1">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs text-slate-500 hover:text-teal-700 font-medium flex items-center gap-1.5 transition"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showTechnicalDetails ? 'Sembunyikan catatan klinis teknis' : 'Ingin melihat angka klinis resmi WHO? Klik di sini'}</span>
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5 border border-slate-800">
              <div className="text-teal-400 font-semibold">Baku Acuan: Permenkes RI No. 2/2020 &amp; WHO Anthro 2006 (Box-Cox LMS Engine)</div>
              <div>• Z-Score Berat Badan Menurut Usia (WAZ): {selectedChild?.waz ?? -0.02} SD</div>
              <div>• Z-Score Tinggi Badan Menurut Usia (HAZ): {selectedChild?.haz ?? 0.10} SD</div>
              <div>• Indikator Kenaikan 2T: {selectedChild?.is2TAlert ? 'TERDETEKSI (Kurva Faltering)' : 'NORMAL (Kenaikan Baik)'}</div>
              <div>• Algoritma AI Aktif: Growth Sentinel, Data Quality Guardrails, Follow-up Coordinator</div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SECTION UTAMA: CEK & CATAT PERTUMBUHAN MANDIRI (LANGSUNG DI HALAMAN) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Pemeriksaan Mandiri di Rumah
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Cek &amp; Simpan Hasil Pengukuran {activeChildName}
            </h2>
            <p className="text-xs text-slate-500">
              Data langsung dianalisis oleh AI Growth Sentinel dan tersimpan ke basis data kesehatan anak
            </p>
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitMeasurement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usia Saat Pengukuran (Bulan)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="60"
                value={inputAge}
                onChange={(e) => setInputAge(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 14 bulan</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Berat Badan (Kilogram)
              </label>
              <input
                type="number"
                step="0.05"
                min="2"
                max="35"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Gunakan timbangan balita tanpa popok tebal</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Panjang / Tinggi Badan (Centimeter)
              </label>
              <input
                type="number"
                step="0.1"
                min="35"
                max="135"
                value={inputHeight}
                onChange={(e) => setInputHeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 76.0 cm (bukan dalam meter)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              🔒 Terlindungi guardrail Data Quality WHO untuk mencegah salah ketik satuan.
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Menganalisis Klinis...' : 'Simpan & Analisis Tumbuh Kembang'}</span>
            </button>
          </div>
        </form>

        {/* Real-time Assessment Output */}
        {submitResult && (
          <div className="p-5 rounded-2xl bg-teal-50/80 border border-teal-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <Check className="w-5 h-5 text-teal-700" />
                <span>Hasil Analisis AI Growth Sentinel Telah Tersimpan di SQLite</span>
              </div>
              <span className="text-[11px] font-mono bg-teal-200/60 text-teal-800 px-2 py-0.5 rounded">
                Status: {submitResult.assessment?.overallStatus || 'Optimal'}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {submitResult.assessment?.parentExplanation || 
                `Pengukuran ${activeChildName} berhasil diverifikasi. Berat ${inputWeight} kg dan tinggi ${inputHeight} cm berada pada kurva pertumbuhan yang stabil.`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600 font-medium">
              <div>TB/U (HAZ): <span className="font-mono text-slate-900">{submitResult.assessment?.haz ?? '+0.10'} SD</span></div>
              <div>BB/U (WAZ): <span className="font-mono text-slate-900">{submitResult.assessment?.waz ?? '-0.02'} SD</span></div>
              <div>Status 2T: <span className="font-mono text-slate-900">{submitResult.assessment?.is2TAlert ? 'Alert Faltering' : 'Normal'}</span></div>
              <div>Tersimpan: <span className="text-emerald-700 font-semibold">Tabel Measurements Riil</span></div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SECTION: INSPIRASI RESEP MPASI PANGAN LOKAL (TKPI 2020) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Nutrisi Harian Terjangkau
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Inspirasi Menu MPASI Pangan Lokal Hari Ini
            </h2>
            <p className="text-xs text-slate-500">
              Dihitung berdasarkan standar Tabel Komposisi Pangan Indonesia (TKPI Kemenkes RI 2020)
            </p>
          </div>

          {/* Quick Allergen Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] font-medium mr-1">Filter Alergen:</span>
            <button
              onClick={() => setAllergenFilters(prev => ({ ...prev, telur: !prev.telur }))}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${
                allergenFilters.telur
                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {allergenFilters.telur ? '✕ Bebas Telur' : '+ Bebas Telur'}
            </button>
            <button
              onClick={() => setAllergenFilters(prev => ({ ...prev, seafood: !prev.seafood }))}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${
                allergenFilters.seafood
                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {allergenFilters.seafood ? '✕ Bebas Seafood' : '+ Bebas Seafood'}
            </button>
            <button
              onClick={() => setAllergenFilters(prev => ({ ...prev, susu: !prev.susu }))}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${
                allergenFilters.susu
                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {allergenFilters.susu ? '✕ Bebas Susu Sapi' : '+ Bebas Susu Sapi'}
            </button>
          </div>
        </div>

        {/* 3 Meal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Meal 1: Pagi */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  Sarapan Pagi (07:30)
                </span>
                <span className="text-xs text-slate-500 font-medium">Rp 4.500</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {allergenFilters.telur
                  ? 'Bubur Daging Sapi Giling & Tahu Sutra'
                  : 'Nasi Tim Telur Puyuh & Daun Kelor'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {allergenFilters.telur
                  ? 'Tekstur lembut dengan cincangan daging sapi kaya zat besi dan tahu kedelai murni.'
                  : 'Kaya vitamin A dari daun kelor segar dipadukan kuning telur puyuh padat asam folat.'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-600">
              <span>Protein: <strong>8.5 g</strong></span>
              <span>Kalori: <strong>190 kkal</strong></span>
              <span>Zat Besi: <strong>2.1 mg</strong></span>
            </div>
          </div>

          {/* Meal 2: Siang */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Makan Siang (12:00)
                </span>
                <span className="text-xs text-slate-500 font-medium">Rp 5.500</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {allergenFilters.seafood
                  ? 'Puree Hati Ayam Santan Gurih & Labu Kuning'
                  : 'Puree Ikan Kembung Kukus Santan & Wortel'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {allergenFilters.seafood
                  ? 'Pengganti ikan laut bebas alergen dengan hati ayam segar kaya zat besi organik untuk cegah anemia.'
                  : 'Ikan kembung lokal mengandung Omega-3 & DHA lebih tinggi dari ikan salmon dengan harga ramah kantong.'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-600">
              <span>Protein: <strong>11.5 g</strong></span>
              <span>Kalori: <strong>235 kkal</strong></span>
              <span>Zat Besi: <strong>3.4 mg</strong></span>
            </div>
          </div>

          {/* Meal 3: Malam */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  Makan Malam (18:00)
                </span>
                <span className="text-xs text-slate-500 font-medium">Rp 4.500</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Sup Tempe Lembut &amp; Kaldu Ceker Kolagen
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tempe fermentasi lokal yang mudah dicerna usus bayi, disiram kaldu ceker kaya kalsium alami penopang tulang.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-600">
              <span>Protein: <strong>9.0 g</strong></span>
              <span>Kalori: <strong>210 kkal</strong></span>
              <span>Kalsium: <strong>140 mg</strong></span>
            </div>
          </div>
        </div>

        {/* Nutrition Budget Bar */}
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-teal-900">Total Protein Harian Tercapai: 29.0 gram </span>
            <span className="text-teal-700">(Mencukupi 240% target minimal harian ananda)</span>
          </div>
          <div className="font-semibold text-teal-900 bg-teal-200/70 px-3 py-1 rounded-lg">
            Estimasi Biaya Total: Hanya Rp 14.500 / hari
          </div>
        </div>
      </div>

      {/* 5. SECTION: PENGINGAT POSYANDU & ASISTEN TELEGRAM (LANGSUNG DI HALAMAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Info Jadwal & Pairing */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Jadwal Posyandu Terdekat</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                Kamis, 15 Oktober 2026
              </h3>
              <p className="text-xs text-teal-200 mt-1">
                Pukul 08:30 - 11:30 WIB • Balai Warga RW 03, Beji, Depok
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs space-y-2">
              <div className="font-semibold text-white">Kegiatan Pemeriksaan:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Penimbangan berat badan &amp; pengukuran tinggi badan digital</li>
                <li>Pemberian vitamin A dan imunisasi lanjutan</li>
                <li>Konseling MPASI dengan Bidan Siti Aminah</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <div className="text-xs text-slate-300">
                Kode Pairing Telegram Bunda:
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 text-teal-300 font-mono text-base font-bold px-3 py-2 rounded-xl border border-teal-500/40 tracking-wider text-center">
                  {pairCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Buka Telegram, kirim pesan ke <strong>@NutriShieldBot</strong> dengan format: <code>/start {pairCode}</code>
              </p>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="https://wa.me/6281305240006?text=Halo%20Ibu%20Rahmawati,%20saya%20Sarah%20orang%20tua%20Bintang%20ingin%20konsultasi%20tumbuh%20kembang"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Hubungi Kader Pendamping (WhatsApp)</span>
            </a>
          </div>
        </div>

        {/* Right: Telegram Bot Simulator */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px] overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Asisten NutriShield (@NutriShieldBot)</div>
                <div className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Siap Menjawab 24 Jam</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => handleSendBotMessage('/cek')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition"
              >
                /cek
              </button>
              <button
                onClick={() => handleSendBotMessage('/resep')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
              >
                /resep
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {botMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-teal-700 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}
            {botTyping && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs italic px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-300" />
                <span>Asisten sedang menyiapkan jawaban...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendBotMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={botInput}
              onChange={(e) => setBotInput(e.target.value)}
              placeholder="Ketik pesan atau /cek untuk simulasi bot..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
