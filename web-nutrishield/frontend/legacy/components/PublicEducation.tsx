import React, { useState } from 'react';
import { ShieldCheck, Award, FileCheck2, Lock, BookOpen } from 'lucide-react';

interface TermDetail {
  id: string;
  term: string;
  category: string;
  summary: string;
  mechanism: string;
  riskIfDeficient: string;
  practicalAction: string;
}

const CLINICAL_TERMS: TermDetail[] = [
  {
    id: 'hpk',
    term: '1.000 Hari Pertama Kehidupan',
    category: 'Fase Kritis',
    summary: 'Masa konsepsi (270 hari) hingga anak berusia 2 tahun (730 hari).',
    mechanism: 'Fase pembentukan 80% arsitektur jaringan otak, mielinisasi akson saraf, dan pemanjangan tulang linier.',
    riskIfDeficient: 'Defisiensi energi-protein kronis pada fase ini memicu gangguan kognitif menetap dan perawakan pendek permanen.',
    practicalAction: 'Pemantauan berkala grafik kurva pertumbuhan di Posyandu, ASI eksklusif 6 bulan, dan kecukupan protein hewani sejak MPASI.'
  },
  {
    id: 'dha',
    term: 'DHA & Asam Lemak Omega-3',
    category: 'Perkembangan Saraf',
    summary: 'Komponen lipid struktural utama pembentuk selubung mielin otak dan retina.',
    mechanism: 'Docosahexaenoic Acid (DHA) menyusun membran fosfolipid neuron untuk menjaga plastisitas sinaps dan kecepatan transmisi saraf.',
    riskIfDeficient: 'Penurunan kapasitas konsentrasi, respons motorik melambat, dan hambatan ketajaman visual anak.',
    practicalAction: 'Ikan kembung lokal menyediakan 2,2 g DHA per 100 g (lebih tinggi dari salmon impor 1,4 g / 100 g) dengan harga terjangkau.'
  },
  {
    id: 'mtorc1',
    term: 'Aktivasi Jalur Biokimia mTORC1',
    category: 'Pertumbuhan Tulang',
    summary: 'Saklar molekuler seluler pengendali pembelahan sel dan pertumbuhan linier anak.',
    mechanism: 'Kompleks protein kinase mTORC1 menstimulasi proliferasi kondrosit pada lempeng pertumbuhan tulang pipa saat asam amino darah cukup.',
    riskIfDeficient: 'Pola makan berbasis karbohidrat tinggi tanpa protein hewani menghentikan sinyal mTORC1, memicu hambatan pertumbuhan tinggi badan.',
    practicalAction: 'Sertakan satu porsi protein hewani padat gizi (telur, ikan kembung, ayam, atau daging) pada setiap jam makan balita.'
  },
  {
    id: 'lambung',
    term: 'Batas Fisiologis Lambung Balita (200–250 ml)',
    category: 'Kapasitas Cerna',
    summary: 'Kapasitas volume lambung anak usia 12 bulan yang terbatas (hanya 25–30 ml per kg berat badan).',
    mechanism: 'Volume lambung balita yang kecil membutuhkan kepadatan kalori dan nutrisi tinggi dalam porsi terukur.',
    riskIfDeficient: 'Pemberian makanan berkuah banyak atau serat kasar berlebih membuat lambung penuh sebelum kebutuhan kalori dan protein tercapai.',
    practicalAction: 'Terapkan prinsip MPASI padat gizi: tekstur kental, kaya lemak sehat dan protein hewani, hindari mengisi lambung dengan kuah encer.'
  },
  {
    id: 'mukosa',
    term: 'Integritas Saluran Cerna & Mikrobiota',
    category: 'Penyerapan Nutrisi',
    summary: 'Kesehatan dinding vili usus halus dalam menyerap zat besi, kalsium, dan seng.',
    mechanism: 'Vili usus yang utuh memaksimalkan absorpsi mikronutrien. Infeksi saluran cerna kronis menyebabkan enteropati lingkungan.',
    riskIfDeficient: 'Malabsorpsi nutrisi esensial yang menyebabkan anemia defisiensi besi dan penurunan imunitas anak.',
    practicalAction: 'Jaga kebersihan air minum, terapkan cuci tangan sebelum makan, dan berikan pangan fermentasi lokal seperti tempe.'
  }
];

export const PublicEducation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(CLINICAL_TERMS[0].id);
  const activeTerm = CLINICAL_TERMS.find(t => t.id === activeTab) || CLINICAL_TERMS[0];

  return (
    <section id="kamus-medis" className="py-14 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dasar Ilmiah Pertumbuhan Anak &amp; Nutrisi 1.000 HPK
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Parameter biokimia dan fisiologi pertumbuhan anak berdasarkan panduan Kementerian Kesehatan RI dan kurva baku WHO 2006.
          </p>
        </div>

        {/* Clinical Terminology Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          {CLINICAL_TERMS.map((term) => (
            <button
              key={term.id}
              onClick={() => setActiveTab(term.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
                term.id === activeTab
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {term.term}
            </button>
          ))}
        </div>

        {/* Active Clinical Document Brief */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-teal-800">{activeTerm.category}</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{activeTerm.term}</h3>
            </div>
            <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded border border-slate-200">
              Parameter Baku Gizi Klinis
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {activeTerm.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">Mekanisme Biologis</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeTerm.mechanism}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-rose-800">Dampak Jika Defisiensi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeTerm.riskIfDeficient}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-teal-800">Tindakan Praktis di Posyandu &amp; Rumah</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeTerm.practicalAction}
              </p>
            </div>
          </div>
        </div>

        {/* Standar Validasi Klinis & Landasan Kebijakan Nasional */}
        <div id="standar-medis" className="mt-14 pt-10 border-t border-slate-200">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Validasi Berbasis Bukti Medis (Evidence-Based Medicine)</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Standar Regulasi Klinis &amp; Kebijakan Nasional
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                NutriShield dibangun dengan kepatuhan penuh terhadap regulasi antropometri Kementerian Kesehatan Republik Indonesia, standar emas World Health Organization (WHO), dan basis data biokimia pangan resmi.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              VERIFIKASI: DETERMINISTIK &amp; ZERO-HALUSINASI
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-teal-300 transition space-y-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider font-mono">
                  Regulasi Kemenkes RI
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  Permenkes No. 2 Tahun 2020
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Baku antropometri resmi penilaian pertumbuhan anak Indonesia. Digunakan sebagai dasar kalkulasi Z-Score (BB/U, TB/U, BB/TB) serta parameter intervensi 2T (tidak naik / turun) di seluruh Puskesmas &amp; Posyandu.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                <span>Standar Baku Nasional</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-teal-300 transition space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <FileCheck2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider font-mono">
                  Standar Emas Global
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  WHO MGRS 2006 (Box-Cox LMS)
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Algoritma matematis non-linear Box-Cox LMS (parameter L, M, S) untuk menghitung standar deviasi biologis anak secara deterministik tanpa toleransi halusinasi AI pada metrik klinis.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                <span>Komputasi Deterministik</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-teal-300 transition space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider font-mono">
                  Data Laboratorium Biokimia
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  TKPI Kemenkes RI 2020
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tabel Komposisi Pangan Indonesia resmi untuk optimasi substitusi protein hewani lokal (Ikan Kembung, Telur Puyuh, Hati Ayam) berdensitas mikronutrien tinggi (Zinc, Zat Besi Heme, DHA).
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>Pangan Lokal Berkelanjutan</span>
              </div>
            </div>
          </div>

          {/* Privacy & Clinical Data Integrity Bar */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                <strong>Integritas &amp; Keamanan Rekam Medis:</strong> Seluruh data penimbangan kohort posyandu tersimpan dalam basis data lokal terisolasi berstandar enkripsi tanpa paparan data privat ke pihak ketiga.
              </span>
            </div>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700">
              Standar Perlindungan Data Pribadi (PDP)
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
