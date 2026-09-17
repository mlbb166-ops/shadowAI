import React, { useState } from 'react';
import { calculateChildGrowth } from '../utils/whoAnthroCalculator';
import { Shield, ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  onStartScreening: () => void;
  onExploreFoods: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartScreening, onExploreFoods }) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [ageMonths, setAgeMonths] = useState<number>(12);
  const [weightKg, setWeightKg] = useState<number>(8.5);
  const [heightCm, setHeightCm] = useState<number>(73.0);

  const quickResult = calculateChildGrowth({
    childName: 'Pemeriksaan Cepat',
    gender,
    ageMonths,
    weightKg,
    heightCm,
  });

  return (
    <section id="beranda" className="bg-slate-50 border-b border-slate-200 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Clinical Context & Direction */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Pencegahan Stunting 1.000 Hari Pertama Kehidupan Berbasis Pangan Nusantara
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Platform skrining antropometri anak berbasis kurva baku WHO 2006 dan data biokimia resmi Tabel Komposisi Pangan Indonesia (TKPI Kemenkes RI). Dirancang untuk kader Posyandu dan pemantauan mandiri keluarga balita.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onStartScreening}
                className="px-5 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition"
              >
                Buka Dashboard Pemeriksaan
              </button>

              <button
                onClick={onExploreFoods}
                className="px-5 py-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition"
              >
                Pelajari Data Pangan TKPI
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700">Landasan Klinis &amp; Regulasi Resmi:</p>
              <p>1. Standar Antropometri Anak Kemenkes RI (Permenkes No. 2 Tahun 2020)</p>
              <p>2. Kurva Baku Pertumbuhan WHO Child Growth Standards 2006</p>
              <p>3. Tabel Komposisi Pangan Indonesia (TKPI) Kemenkes RI 2020</p>
            </div>
          </div>

          {/* Right Column: Live Interactive Growth Quick Screener */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Uji Skrining Antropometri Cepat</h2>
                <p className="text-xs text-slate-500 mt-0.5">Perhitungan Z-score Box-Cox LMS seketika</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                WHO 2006
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2 text-xs font-semibold rounded border transition ${
                      gender === 'male'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2 text-xs font-semibold rounded border transition ${
                      gender === 'female'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Usia Anak: <span className="font-semibold text-slate-900">{ageMonths} Bulan</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(Number(e.target.value))}
                  className="w-full accent-teal-700 mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-teal-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Panjang / Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-teal-700 font-mono"
                />
              </div>
            </div>

            {/* Screener Output Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Status Pertumbuhan:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                  quickResult.haz < -2.0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-teal-100 text-teal-800'
                }`}>
                  {quickResult.overallStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500">Tinggi menurut Umur (TB/U):</span>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">
                    {quickResult.haz > 0 ? `+${quickResult.haz}` : quickResult.haz} SD
                  </div>
                  <div className="text-[11px] text-slate-500">{quickResult.hazStatus}</div>
                </div>

                <div>
                  <span className="text-slate-500">Berat menurut Umur (BB/U):</span>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">
                    {quickResult.waz > 0 ? `+${quickResult.waz}` : quickResult.waz} SD
                  </div>
                  <div className="text-[11px] text-slate-500">{quickResult.wazStatus}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Kapasitas Lambung Fisiologis:</span>
                <span className="font-mono text-slate-700 font-medium">{quickResult.stomachCapacityMl} ml</span>
              </div>
            </div>

            <button
              onClick={onStartScreening}
              className="w-full py-2.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition text-center"
            >
              Simpan Data &amp; Mulai Pemeriksaan Lengkap
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
