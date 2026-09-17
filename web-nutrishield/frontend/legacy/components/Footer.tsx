import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-10 border-b border-slate-800 text-xs">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                NutriShield
              </span>
            </div>
            
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Sistem skrining antropometri digital dan formulasi gizi pangan lokal untuk mendukung kader Posyandu serta pemantauan mandiri 1.000 Hari Pertama Kehidupan balita.
            </p>

            <div className="flex items-center gap-2 text-teal-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Domain Resmi: https://nutrishield.web.id</span>
            </div>
          </div>

          {/* Tim Pengembang */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-200">
              Tim Peneliti &amp; Pengembang
            </h4>
            <div className="space-y-3 text-slate-300">
              <div>
                <div className="font-semibold text-white">Muhammad Hisyam Alfaris</div>
                <div className="text-slate-400 text-[11px]">Rekayasa Sistem &amp; Algoritma Antropometri</div>
                <div className="text-slate-400 text-[11px]">STT Terpadu Nurul Fikri, Depok</div>
              </div>

              <div>
                <div className="font-semibold text-white">Salsabila Putri Halimi</div>
                <div className="text-slate-400 text-[11px]">Riset Data Gizi Pangan &amp; Validasi Klinis TKPI</div>
                <div className="text-slate-400 text-[11px]">Universitas Terbuka Bogor, Bogor</div>
              </div>
            </div>
          </div>

          {/* Dewan Juri & Penyelenggara */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-200">
              Evaluasi AI HackFest 2026
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <span className="font-semibold text-white">Ir. Onno W. Purbo, M.Eng., Ph.D.</span>
                <div className="text-slate-400 text-[11px]">Kedaulatan Digital &amp; Perangkat Lunak Terbuka</div>
              </li>
              <li>
                <span className="font-semibold text-white">Ogi S. Pornawan</span>
                <div className="text-slate-400 text-[11px]">CEO IDwebhost, Infrastruktur Cloud &amp; Keamanan Web</div>
              </li>
              <li>
                <span className="font-semibold text-white">Eko Novianto</span>
                <div className="text-slate-400 text-[11px]">Pengembangan Produk AI &amp; Dampak Sosial Komunitas</div>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-slate-400">
              Penyelenggara: IDwebhost x PANDI (Pengelola Nama Domain Internet Indonesia)
            </div>
          </div>

        </div>

        {/* Bottom copyright & standards */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Tim Shadow AI (NutriShield). Dikembangkan untuk AI HackFest 2026.</p>
          <p>
            Mengacu pada Standar Baku WHO Anthro 2006, Permenkes No. 2/2020 &amp; TKPI Kemenkes RI
          </p>
        </div>

      </div>
    </footer>
  );
};
