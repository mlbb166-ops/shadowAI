import React, { useState } from 'react';
import { TKPI_FOODS, FoodItem } from '../data/tkpiFoods';
import { Check, Info } from 'lucide-react';

export const FoodComparator: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<'kembung-salmon' | 'kelor-susu' | 'sapi-tempe'>('kembung-salmon');

  const foodMap: Record<string, FoodItem> = {};
  TKPI_FOODS.forEach((item) => {
    foodMap[item.id] = item;
  });

  const kembung = foodMap['ikan-kembung'];
  const salmon = foodMap['ikan-salmon'];
  const kelor = foodMap['daun-kelor'];
  const bayam = foodMap['bayam-hijau'];
  const sapi = foodMap['daging-sapi-cincang'];
  const tempe = foodMap['tempe-kedelai'];

  return (
    <section id="pangan-nusantara" className="py-14 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Komparasi Kandungan Gizi Pangan Lokal dan Impor
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Data biokimia resmi Tabel Komposisi Pangan Indonesia (TKPI Kemenkes RI) dibandingkan dengan data harga acuan pasar Badan Pangan Nasional.
          </p>
        </div>

        {/* Pair Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setSelectedPair('kembung-salmon')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedPair === 'kembung-salmon'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Ikan Kembung vs. Salmon Atlantik
          </button>

          <button
            onClick={() => setSelectedPair('kelor-susu')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedPair === 'kelor-susu'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daun Kelor vs. Bayam Hijau
          </button>

          <button
            onClick={() => setSelectedPair('sapi-tempe')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedPair === 'sapi-tempe'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daging Sapi Cincang vs. Tempe Kedelai
          </button>
        </div>

        {/* Pair 1: Ikan Kembung vs Salmon */}
        {selectedPair === 'kembung-salmon' && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Parameter Gizi (per 100 g)</th>
                    <th className="py-3 px-4 bg-teal-50/60 text-teal-900">
                      Ikan Kembung Segar (Nusantara)
                    </th>
                    <th className="py-3 px-4">Ikan Salmon (Impor)</th>
                    <th className="py-3 px-4">Keterangan Klinis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Omega-3 (DHA + EPA)</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">2,2 g</td>
                    <td className="py-3 px-4 font-mono">1,4 g</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Kandungan DHA kembung 57% lebih tinggi untuk mendukung mielinisasi saraf otak anak.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Zat Besi (Fe)</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">2,0 mg</td>
                    <td className="py-3 px-4 font-mono">0,8 mg</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Zat besi heme untuk pencegahan anemia defisiensi besi pada fase 1.000 HPK.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Kalsium (Ca)</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">136 mg</td>
                    <td className="py-3 px-4 font-mono">12 mg</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Mendukung densitas mineral matriks tulang selama percepatan pertumbuhan linier.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Protein Hewani</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">21,4 g</td>
                    <td className="py-3 px-4 font-mono">19,8 g</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Profil asam amino esensial lengkap untuk memicu aktivitas jalur mTORC1.
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-900">Estimasi Harga Pasar (kg)</td>
                    <td className="py-3 px-4 bg-teal-50/50 font-mono font-bold text-teal-800">Rp 35.000</td>
                    <td className="py-3 px-4 font-mono text-slate-600">Rp 320.000</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Rasio biaya 1:9, lebih terjangkau bagi ketahanan pangan keluarga balita.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong>Catatan Fisiologis Lambung Balita (200–250 ml):</strong> Balita usia 12 bulan hanya mampu mengonsumsi 200–250 ml makanan per porsi. Porsi 30 g ikan kembung kukus suwir memberikan kalori dan protein padat tanpa membuat lambung teregang berlebih.
              </div>
            </div>
          </div>
        )}

        {/* Pair 2: Kelor vs Bayam */}
        {selectedPair === 'kelor-susu' && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Parameter Gizi (per 100 g)</th>
                    <th className="py-3 px-4 bg-teal-50/60 text-teal-900">Daun Kelor Segar</th>
                    <th className="py-3 px-4">Bayam Hijau Segar</th>
                    <th className="py-3 px-4">Keterangan Klinis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Kalsium (Ca)</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">440 mg</td>
                    <td className="py-3 px-4 font-mono">166 mg</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Densitas kalsium nabati tinggi, bermanfaat bagi balita dengan alergi susu sapi.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Zat Besi (Fe)</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">7,0 mg</td>
                    <td className="py-3 px-4 font-mono">3,5 mg</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Dua kali lipat kandungan zat besi bayam untuk menunjang produksi hemoglobin.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Vitamin A (Beta Karoten)</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">6.780 mcg</td>
                    <td className="py-3 px-4 font-mono">4.090 mcg</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Penting untuk regenerasi epitel mukosa usus halus dan imunitas mukosa.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong>Pengolahan yang Disarankan:</strong> Cincang halus 1 sendok makan daun kelor (10 g) dan masukkan sesaat sebelum sup diangkat agar vitamin C dan antioksidan tidak rusak oleh pemanasan berlebih.
              </div>
            </div>
          </div>
        )}

        {/* Pair 3: Daging Sapi vs Tempe */}
        {selectedPair === 'sapi-tempe' && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Parameter Gizi (per 100 g)</th>
                    <th className="py-3 px-4 bg-teal-50/60 text-teal-900">Daging Sapi Cincang</th>
                    <th className="py-3 px-4">Tempe Kedelai Murni</th>
                    <th className="py-3 px-4">Keterangan Klinis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Protein Total</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">18,8 g</td>
                    <td className="py-3 px-4 font-mono">20,8 g</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Kombinasi protein hewani (sapi) dan nabati terfermentasi (tempe) saling melengkapi profil asam amino.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Zat Besi Heme vs Non-Heme</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">2,8 mg (Heme)</td>
                    <td className="py-3 px-4 font-mono">4,0 mg (Non-Heme)</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Besi heme sapi memiliki bioavailabilitas 20–30%, lebih mudah diserap dibanding besi non-heme nabati (2–5%).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-900">Kalsium (Ca)</td>
                    <td className="py-3 px-4 bg-teal-50/30 font-mono font-bold text-teal-800">11 mg</td>
                    <td className="py-3 px-4 font-mono">517 mg</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      Tempe menyediakan kalsium tinggi hasil dekomposisi fitat oleh fermentasi kapang Rhizopus.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong>Konsep Gizi Ganda (Double Prohe):</strong> Memadukan daging sapi cincang (25 g) dengan tempe lumat (20 g) pada satu porsi menu memberikan asupan zat besi hewani cepat serap sekaligus kalsium padat tanpa memberatkan sistem cerna balita.
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
