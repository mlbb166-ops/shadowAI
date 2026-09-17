import React from 'react';
import { Users, HeartHandshake, AlertCircle, FileSpreadsheet, CheckCircle2, ChevronRight, Info } from 'lucide-react';

export const PosyanduDashboard: React.FC = () => {
  const cohortSample = [
    { id: 'BALITA-01', alias: 'Ananda R. (12 Bln)', weight: '8.4 kg', height: '72.0 cm', zHaz: '-1.8 SD', status: 'Normal', alert2T: false },
    { id: 'BALITA-02', alias: 'Adik D. (18 Bln)', weight: '9.1 kg', height: '78.2 cm', zHaz: '-2.4 SD', status: 'Stunted', alert2T: true },
    { id: 'BALITA-03', alias: 'Ananda F. (24 Bln)', weight: '11.8 kg', height: '87.5 cm', zHaz: '-0.4 SD', status: 'Normal', alert2T: false },
    { id: 'BALITA-04', alias: 'Adik S. (15 Bln)', weight: '8.7 kg', height: '74.5 cm', zHaz: '-2.1 SD', status: 'Stunted', alert2T: true },
  ];

  const householdConversions = [
    { ingredient: 'Daging Sapi Cincang', labGram: '30 gram', homeMeasure: '2 sendok makan peres matang' },
    { ingredient: 'Hati Ayam Segar', labGram: '25 gram', homeMeasure: '1 potong kecil rebus lumat' },
    { ingredient: 'Telur Puyuh', labGram: '20 gram', homeMeasure: '2 - 3 butir rebus lumat' },
    { ingredient: 'Fillet Ikan Kembung', labGram: '30 gram', homeMeasure: '1/2 ekor sedang suwir bebas duri' },
    { ingredient: 'Daun Kelor Cincang', labGram: '15 gram', homeMeasure: '1 sendok makan sayur matang cincang' },
    { ingredient: 'Tempe Kedelai', labGram: '25 gram', homeMeasure: '1 potong dadu kukus lumat' },
  ];

  return (
    <section id="portal-posyandu" className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Users className="w-3.5 h-3.5" /> Sahabat Kader Posyandu &amp; Dapur Keluarga
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Portal Pemantauan Komunitas Posyandu
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Membantu kader desa mencatat grafik tumbuh kembang anak, mendeteksi sinyal peringatan 2T (tidak naik timbangan), 
            dan menerjemahkan gramasi laboratorium ke takaran sendok makan dapur rumahan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cohort Table Card */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm bg-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Kohort Balita Binaan Posyandu</h3>
                <span className="text-xs text-slate-500">Kader Posyandu Mawar • Data Anonim Terproteksi PII</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 w-fit">
                <AlertCircle className="w-3.5 h-3.5" /> 2 Balita Peringatan 2T
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-3">Inisial Balita</th>
                    <th className="pb-3">BB / TB</th>
                    <th className="pb-3">Indeks TB/U</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Sinyal 2T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {cohortSample.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">{c.alias}</td>
                      <td className="py-3.5">{c.weight} • {c.height}</td>
                      <td className="py-3.5">{c.zHaz}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          c.status === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {c.alert2T ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Peringatan 2T
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-bold">Aman (Naik)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <b>Arti Sinyal 2T:</b> Dua kali penimbangan berturut-turut berat badan balita tidak mengalami kenaikan. 
                Sistem secara otomatis memprioritaskan paket intervensi protein hewani padat energi.
              </span>
            </div>
          </div>

          {/* Household Spoon Measurements Card */}
          <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm bg-white space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">Kamus Takaran Sendok Rumahan</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konversi ilmiah gramasi laboratorium ke ukuran alat dapur yang mudah dipraktikkan ibu balita.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {householdConversions.map((conv, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-slate-900 block">{conv.ingredient}</span>
                    <span className="text-xs text-slate-400 font-semibold">{conv.labGram} lab</span>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-bold border border-teal-200 text-xs text-right">
                    {conv.homeMeasure}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-teal-900 text-white text-xs font-medium space-y-1">
                <span className="font-bold block text-teal-200">Prinsip Fisiologi Lambung 200 ml:</span>
                <p>
                  Ibu tidak perlu membeli timbangan makanan digital. Cukup gunakan takaran sendok makan peres agar anak tidak tersedak dan tidak kenyang semu.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
