import React, { useState } from 'react';
import { ShieldCheck, Utensils, Check, AlertTriangle, Sparkles, Filter, Clock, DollarSign } from 'lucide-react';

interface Recipe {
  id: string;
  targetGroup: 'balita-1yr' | 'balita-6to11' | 'bumil-trimester';
  title: string;
  energyKcal: number;
  proteinG: number;
  ironMg: number;
  costEst: string;
  ingredients: string[];
  allergensContained: string[];
  servingVolume: string;
  instructions: string;
  clinicalRationale: string;
}

const MASTER_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    targetGroup: 'balita-1yr',
    title: 'Tim Daging Sapi Cincang & Labu Siam Parut',
    energyKcal: 185,
    proteinG: 10.5,
    ironMg: 2.2,
    costEst: 'Rp 6.500 / porsi',
    ingredients: [
      '2 sdm peres nasi pulen lembek (30g)',
      '2 sdm peres daging sapi cincang halus matang (25g)',
      '1 sdm parutan labu siam kukus (15g)',
      '1/2 sdt minyak kelapa murni (booster kalori)'
    ],
    allergensContained: ['daging sapi'],
    servingVolume: '180 ml (Pas dengan lambung balita 1 tahun)',
    instructions: 'Kukus daging sapi cincang bersama parutan labu siam. Masukkan minyak kelapa di akhir proses untuk aroma harum dan energi padat.',
    clinicalRationale: 'Zat besi hewani (heme) langsung diserap usus balita tanpa membebani lambung 200 ml.'
  },
  {
    id: 'rec-2',
    targetGroup: 'balita-1yr',
    title: 'Puree Hati Ayam Gurih & Telur Puyuh Lumat',
    energyKcal: 195,
    proteinG: 12.0,
    ironMg: 5.5,
    costEst: 'Rp 4.000 / porsi',
    ingredients: [
      '1 potong kecil hati ayam segar rebus lumat (20g)',
      '2 butir telur puyuh rebus lumat (20g)',
      '2 sdm bubur beras merah halus',
      '1/2 sdt santan segar matang'
    ],
    allergensContained: ['telur', 'unggas'],
    servingVolume: '170 ml',
    instructions: 'Lumatkan hati ayam dan telur puyuh saat masih hangat bersama bubur beras merah. Tambahkan sedikit santan untuk kelembutan tekstur.',
    clinicalRationale: 'Booster zat besi 5.5mg dan kolin otak untuk memacu berat badan balita pasca sakit.'
  },
  {
    id: 'rec-3',
    targetGroup: 'balita-1yr',
    title: 'Kukus Suwir Fillet Ikan Kembung Daun Kelor',
    energyKcal: 175,
    proteinG: 11.2,
    ironMg: 2.4,
    costEst: 'Rp 5.000 / porsi',
    ingredients: [
      '1/2 ekor ikan kembung segar kukus, suwir bebas duri (30g)',
      '1 sdm daun kelor cincang sangat halus (10g)',
      '2 sdm nasi tim lembek',
      '1 sdm kaldu ayam bening gurih'
    ],
    allergensContained: ['ikan laut', 'seafood'],
    servingVolume: '190 ml',
    instructions: 'Periksa duri ikan kembung dua kali secara teliti. Campurkan suwiran ikan dan daun kelor cincang ke dalam nasi tim hangat.',
    clinicalRationale: 'DHA alami 1.1 gram dalam 1 porsi untuk mempercepat mielinisasi saraf otak balita.'
  },
  {
    id: 'rec-4',
    targetGroup: 'balita-1yr',
    title: 'Tim Tempe Fermentasi & Ikan Teri Basah Halus (Anti-Alergi Udang)',
    energyKcal: 160,
    proteinG: 9.8,
    ironMg: 2.6,
    costEst: 'Rp 3.500 / porsi',
    ingredients: [
      '1 potong tempe kedelai kukus lumat (25g)',
      '1 sdm teri basah tawar cincang halus (15g)',
      '2 sdm nasi lembek',
      '1 sdm kaldu sayur bening'
    ],
    allergensContained: ['kedelai', 'ikan laut'],
    servingVolume: '180 ml',
    instructions: 'Kukus tempe dan teri basah bersamaan hingga lunak, lalu lumatkan menggunakan sendok garpu.',
    clinicalRationale: 'Alternatif kalsium tinggi (280mg) bebas susu sapi dan bebas gluten (GFCF).'
  },
  {
    id: 'rec-5',
    targetGroup: 'bumil-trimester',
    title: 'Pindang Kuning Belut Sawah & Daun Katuk (Bumil Trimester 2 & 3)',
    energyKcal: 380,
    proteinG: 26.5,
    ironMg: 4.8,
    costEst: 'Rp 14.000 / porsi',
    ingredients: [
      '1 ekor belut sawah sedang potong 3 (80g)',
      '1 mangkok kecil daun katuk segar',
      'Bumbu kuning alami (kunyit, jahe, bawang merah, serai)',
      '1 porsi nasi hangat'
    ],
    allergensContained: ['ikan air tawar'],
    servingVolume: '1 porsi dewasa',
    instructions: 'Masak belut dengan bumbu kuning tanpa santan kental untuk mencegah mual. Masukkan daun katuk sesaat sebelum api dimatikan.',
    clinicalRationale: 'Kalori padat (250 kkal/100g) dan vitamin A alami 4.500 IU memacu berat badan janin untuk mencegah BBLR.'
  }
];

export const MealPlanner: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<'balita-1yr' | 'bumil-trimester'>('balita-1yr');
  const [activeAllergens, setActiveAllergens] = useState<string[]>([]);

  const allergenOptions = [
    { id: 'seafood', label: 'Udang & Makanan Laut' },
    { id: 'ikan laut', label: 'Ikan Laut' },
    { id: 'telur', label: 'Telur Ayam / Bebek' },
    { id: 'susu sapi', label: 'Susu Sapi & Olahan' },
    { id: 'kedelai', label: 'Kacang Kedelai' },
    { id: 'gluten', label: 'Gluten / Terigu' },
  ];

  const toggleAllergen = (id: string) => {
    if (activeAllergens.includes(id)) {
      setActiveAllergens(activeAllergens.filter((a) => a !== id));
    } else {
      setActiveAllergens([...activeAllergens, id]);
    }
  };

  // Filter recipes deterministically
  const filteredRecipes = MASTER_RECIPES.filter((r) => {
    if (selectedTarget === 'balita-1yr' && r.targetGroup !== 'balita-1yr') return false;
    if (selectedTarget === 'bumil-trimester' && r.targetGroup !== 'bumil-trimester') return false;

    for (const allergy of activeAllergens) {
      if (r.allergensContained.includes(allergy)) return false;
    }
    return true;
  });

  return (
    <section id="resep-bebas-alergi" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Perencana Menu MPASI &amp; Pangan Bebas Alergi
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Formulasi menu berbahan pangan nusantara dengan eliminasi bahan pemicu alergi anak dan penyesuaian volume lambung balita (200–250 ml).
          </p>
        </div>

        {/* Target Profile Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSelectedTarget('balita-1yr')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedTarget === 'balita-1yr'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Balita 12–24 Bulan (Kapasitas Lambung 200 ml)
          </button>
          <button
            onClick={() => setSelectedTarget('bumil-trimester')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedTarget === 'bumil-trimester'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Ibu Hamil Trimester 2 &amp; 3 (Pencegahan BBLR)
          </button>
        </div>

        {/* Allergen Checkbox Filter Bar */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-3">
            <Filter className="w-4 h-4 text-teal-700" />
            <span>Pilih pantangan alergi anak (menu yang mengandung alergen akan dikecualikan):</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {allergenOptions.map((opt) => {
              const isChecked = activeAllergens.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleAllergen(opt.id)}
                  className={`p-2.5 rounded-lg text-xs font-medium text-left border transition flex items-center justify-between ${
                    isChecked
                      ? 'bg-rose-50 text-rose-900 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isChecked && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {activeAllergens.length > 0 && (
            <div className="mt-3 text-xs text-rose-700 font-medium">
              Filter aktif mengecualikan menu dengan kandungan: {activeAllergens.join(', ')}.
            </div>
          )}
        </div>

        {/* Filtered Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.length === 0 ? (
            <div className="col-span-full p-10 text-center rounded-xl border border-slate-200 bg-slate-50">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">Tidak ada resep yang sesuai</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Kombinasi pantangan alergi terlalu ketat. Coba kurangi salah satu pantangan untuk melihat menu alternatif.
              </p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-500">
                      Volume: {recipe.servingVolume}
                    </span>
                    <span className="font-mono font-semibold text-teal-800">
                      {recipe.costEst}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                    {recipe.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {recipe.clinicalRationale}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Takaran Sendok Makan Dapur:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {recipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-teal-700 font-bold">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600">
                    Energi: <strong className="text-slate-900">{recipe.energyKcal} kkal</strong>
                  </span>
                  <span className="text-slate-600">
                    Zat Besi: <strong className="text-teal-800">{recipe.ironMg} mg</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};
