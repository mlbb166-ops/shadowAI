import React from 'react';
import { X, FileText, Download, BookOpen } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const chapters = [
    { num: 'Bab I', title: 'Pendahuluan & Urgensi Intervensi Stunting Nasional' },
    { num: 'Bab II', title: 'Standar Pemenang & Pemetaan Rubrik Evaluasi AI HackFest' },
    { num: 'Bab III', title: 'Sains Pangan Nusantara & Analisis Biokimia TKPI Kemenkes RI' },
    { num: 'Bab IV', title: 'Formulasi Gizi Klinis: MPASI Balita 1 Tahun & Ibu Hamil' },
    { num: 'Bab V', title: 'Arsitektur Sistem 3 Lapis & Algoritma Deterministik Box-Cox LMS' },
    { num: 'Bab VI', title: 'Analisis Harga Pangan Acuan Badan Pangan Nasional' },
    { num: 'Bab VII', title: 'Kamus Kesehatan 1.000 HPK untuk Edukasi Keluarga' },
    { num: 'Bab VIII', title: 'Kesimpulan, Rekomendasi Kader & Tindak Lanjut Lapangan' },
    { num: 'Lampiran', title: 'Formulasi Menu 7 Hari & Spesifikasi Peladen' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-800 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dokumen Laporan Resmi NutriShield</h3>
              <span className="text-xs text-slate-400">Struktur Sistematika Laporan Riset Klinis &amp; Teknis</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            Dokumen memuat laporan riset dan implementasi sistem oleh <strong>Muhammad Hisyam Alfaris</strong> (STT Terpadu Nurul Fikri, Depok) dan <strong>Salsabila Putri Halimi</strong> (Universitas Terbuka Bogor, Bogor), ditujukan kepada Dewan Juri AI HackFest 2026.
          </div>

          {/* Chapters List */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Sistematika Bab Laporan:
            </div>
            <div className="space-y-1.5 text-xs text-slate-800">
              {chapters.map((ch, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-teal-700 text-white text-[11px] font-semibold shrink-0">
                    {ch.num}
                  </span>
                  <span className="truncate">{ch.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Files */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              Berkas Laporan Tersedia:
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span className="font-medium text-slate-900">Laporan_Master_NutriShield_Per_Bab_Resmi_2026.pdf</span>
              </div>
              <span className="text-slate-500">11 Halaman</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span className="font-medium text-slate-900">NutriShield_Ringkasan_Riset_Pangan_Lokal.pdf</span>
              </div>
              <span className="text-slate-500">4 Halaman</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-700" />
                <span className="font-medium text-slate-900">NutriShield_PitchDeck_Winning_Agent_2026.pptx</span>
              </div>
              <span className="text-slate-500">10 Slide</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Terhubung dengan peladen cloud NutriShield
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold transition"
          >
            Tutup Jendela
          </button>
        </div>

      </div>
    </div>
  );
};
