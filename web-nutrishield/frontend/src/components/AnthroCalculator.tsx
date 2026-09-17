import React, { useState } from 'react';
import { calculateChildGrowth, AnthroInput, AnthroResult } from '../utils/whoAnthroCalculator';
import { Scale, Activity, Heart, ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, Utensils, Info } from 'lucide-react';

export const AnthroCalculator: React.FC = () => {
  const [formData, setFormData] = useState<AnthroInput>({
    childName: 'Adik Bintang',
    gender: 'male',
    ageMonths: 12,
    weightKg: 8.2,
    heightCm: 71.5,
  });

  const [result, setResult] = useState<AnthroResult>(() => calculateChildGrowth(formData));

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = calculateChildGrowth(formData);
    setResult(res);
  };

  const loadPreset = (type: 'normal' | 'stunting-risk' | 'toddler-1yr') => {
    let preset: AnthroInput;
    if (type === 'toddler-1yr') {
      preset = {
        childName: 'Ananda Rizky (1 Tahun)',
        gender: 'male',
        ageMonths: 12,
        weightKg: 8.4,
        heightCm: 72.0,
      };
    } else if (type === 'stunting-risk') {
      preset = {
        childName: 'Adik Caca (24 Bulan)',
        gender: 'female',
        ageMonths: 24,
        weightKg: 9.0,
        heightCm: 78.5, // < -2 SD (Stunting)
      };
    } else {
      preset = {
        childName: 'Ananda Fatih (18 Bulan)',
        gender: 'male',
        ageMonths: 18,
        weightKg: 11.2,
        heightCm: 83.5,
      };
    }
    setFormData(preset);
    setResult(calculateChildGrowth(preset));
  };

  return (
    <section id="skrining-balita" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
            <Activity className="w-3.5 h-3.5" /> Standar Baku WHO Anthro 2006 & Permenkes 2/2020
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Kalkulator Skrining Antropometri Balita
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Evaluasi deterministik pertumbuhan balita secara instan dengan toleransi 0% halusinasi medis. 
            Menganalisis indeks BB/U, TB/U (indikator stunting), dan kapasitas lambung anak.
          </p>
        </div>

        {/* Quick Demo Preset Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="text-xs font-bold text-slate-500 mr-2">Skenario Uji Cepat:</span>
          <button
            onClick={() => loadPreset('toddler-1yr')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-300 transition-all"
          >
            Balita 1 Tahun (Lambung 200 ml)
          </button>
          <button
            onClick={() => loadPreset('stunting-risk')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-300 transition-all"
          >
            Kasus Risiko Stunting (TB &lt; -2 SD)
          </button>
          <button
            onClick={() => loadPreset('normal')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-300 transition-all"
          >
            Pertumbuhan Gizi Baik (Normal)
          </button>
        </div>

        {/* Main Grid: Form & Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 items-start">
          
          {/* Form Input Card */}
          <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Scale className="w-5 h-5 text-teal-600" />
              <span>Data Antropometri Balita</span>
            </h3>

            <form onSubmit={handleCalculate} className="space-y-4 mt-5">
              
              {/* Child Name / Alias */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Balita / Alias Anonim
                </label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Contoh: Ananda Bintang"
                  required
                />
              </div>

              {/* Gender Radio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...formData, gender: 'male' as const };
                      setFormData(updated);
                      setResult(calculateChildGrowth(updated));
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      formData.gender === 'male'
                        ? 'bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-500/20 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Laki-Laki
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...formData, gender: 'female' as const };
                      setFormData(updated);
                      setResult(calculateChildGrowth(updated));
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      formData.gender === 'female'
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>

              {/* Age in Months Slider & Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Usia Balita
                  </label>
                  <span className="text-sm font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                    {formData.ageMonths} Bulan ({Math.floor(formData.ageMonths / 12)} Thn {formData.ageMonths % 12} Bln)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="59"
                  value={formData.ageMonths}
                  onChange={(e) => {
                    const updated = { ...formData, ageMonths: Number(e.target.value) };
                    setFormData(updated);
                    setResult(calculateChildGrowth(updated));
                  }}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Weight & Height Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="35"
                    value={formData.weightKg}
                    onChange={(e) => {
                      const updated = { ...formData, weightKg: Number(e.target.value) };
                      setFormData(updated);
                      setResult(calculateChildGrowth(updated));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tinggi / Panjang (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="40"
                    max="130"
                    value={formData.heightCm}
                    onChange={(e) => {
                      const updated = { ...formData, heightCm: Number(e.target.value) };
                      setFormData(updated);
                      setResult(calculateChildGrowth(updated));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-98"
                >
                  Hitung Status Pertumbuhan &amp; Rekomendasi
                </button>
              </div>
            </form>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Speedometer Status Banner */}
            <div className={`p-6 rounded-3xl border transition-all ${
              result.statusBadgeColor === 'green'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : result.statusBadgeColor === 'yellow'
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : 'bg-rose-50/90 border-rose-300 text-rose-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Hasil Diagnosa Baku WHO:
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black mt-1 flex items-center gap-2">
                    {result.overallStatus === 'Normal' && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
                    {result.overallStatus === 'Waspada' && <AlertTriangle className="w-8 h-8 text-amber-600" />}
                    {(result.overallStatus === 'Stunting' || result.overallStatus === 'Gizi Buruk') && (
                      <ShieldAlert className="w-8 h-8 text-rose-600" />
                    )}
                    <span>{result.overallStatus.toUpperCase()}</span>
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1">
                    Indeks TB/U: <b>{result.hazStatus}</b> (Z-Score: <b>{result.haz} SD</b>)
                  </p>
                </div>

                {/* Badge Indicator */}
                <div className="bg-white/80 backdrop-blur px-5 py-3 rounded-2xl border border-slate-200/80 text-center shadow-sm">
                  <span className="block text-xs font-bold text-slate-500">Estimasi Lambung</span>
                  <span className="text-2xl font-black text-slate-900">~{result.stomachCapacityMl} ml</span>
                  <span className="block text-[10px] text-slate-500 font-semibold">Kapasitas Mungil Balita</span>
                </div>
              </div>

              {/* 3 Metrics Z-Score Bar */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-200/80">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="block text-[11px] font-bold text-slate-500">TB / U (Stunting)</span>
                  <span className={`text-lg font-black ${result.haz < -2.0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {result.haz} SD
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate">{result.hazStatus}</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="block text-[11px] font-bold text-slate-500">BB / U (Berat)</span>
                  <span className={`text-lg font-black ${result.waz < -2.0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {result.waz} SD
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate">{result.wazStatus}</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="block text-[11px] font-bold text-slate-500">BB / TB (Wasting)</span>
                  <span className="text-lg font-black text-slate-900">{result.whz} SD</span>
                  <span className="block text-[10px] text-slate-500 truncate">{result.whzStatus}</span>
                </div>
              </div>
            </div>

            {/* Clinical Action Recommendations */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-teal-600" />
                <span>Intervensi Klinis MPASI &amp; Pangan Lokal (Saran Mbak Salsa)</span>
              </h4>

              <div className="space-y-2.5">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p>{rec}</p>
                  </div>
                ))}
              </div>

              {/* Target Nutrition Box */}
              <div className="p-4 rounded-2xl bg-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                  <div>
                    <h5 className="text-xs font-bold text-teal-200 uppercase tracking-wider">Target Nutrisi Harian Anak:</h5>
                    <p className="text-sm font-bold text-white">
                      Protein Hewani: <b>{result.proteinNeededG}g/hari</b> • Kebutuhan Zat Besi: <b>{result.ironNeededMg}mg/hari</b>
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-teal-800 px-3 py-1.5 rounded-xl text-teal-200 font-semibold border border-teal-700">
                  Zero Halusinasi
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
