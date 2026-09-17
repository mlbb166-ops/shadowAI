import React, { useState, useEffect } from 'react';
import { apiClient, SupervisorOverview } from '../services/apiClient';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  UserCheck,
  Building,
  RefreshCw,
  CheckCircle2,
  Phone,
  ChevronRight
} from 'lucide-react';

interface SupervisorHubProps {
  onOpenReportModal: () => void;
  onSelectChild: (childId: string) => void;
}

export const SupervisorHub: React.FC<SupervisorHubProps> = ({
  onOpenReportModal,
  onSelectChild
}) => {
  const [overview, setOverview] = useState<SupervisorOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSupervisorOverview();
      setOverview(data);
    } catch (e) {
      console.error('Error fetching supervisor overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const audit = overview?.cohortAudit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <Building className="w-3.5 h-3.5" />
              <span>Puskesmas Kecamatan Beji • Hub Pengawasan Klinis &amp; Supervisi</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Pusat Pengawasan Kohort &amp; Integritas Data
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pemantauan lintas Posyandu untuk memastikan kepatuhan standar antropometri WHO 2006, 
              evaluasi tindak lanjut kasus 2T, serta deteksi dini balita absen penimbangan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => apiClient.downloadBackendCsv()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold transition"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV Master</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Dokumen Regulasi Klinis</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Balita Kohort</span>
            <Building className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {audit?.total_children || 0}
          </div>
          <div className="text-xs text-slate-500">
            Posyandu Mawar III, RW 04 Beji
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Prevalensi Stunting</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-rose-700">
            {audit?.stunted_rate_pct || 0}%
          </div>
          <div className="text-xs text-slate-500">
            {audit?.stunted_count || 0} balita dengan HAZ &lt; -2.0 SD
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tingkat Alert 2T (Faltering)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {audit?.alert_2t_count || 0}
          </div>
          <div className="text-xs text-slate-500">
            {audit?.alert_2t_rate_pct || 0}% berat tidak naik 2 bulan
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Absen Timbang (&gt;35 Hari)</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-700">
            {audit?.missed_weighin_count || 0}
          </div>
          <div className="text-xs text-slate-500">
            Perlu konfirmasi kunjungan rumah
          </div>
        </div>
      </div>

      {/* Critical Cases Requiring Supervisor Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Critical Cases */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>Kasus Prioritas Tinggi (Tinjauan Dokter Puskesmas)</span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
              {overview?.criticalCases?.length || 0} Kasus
            </span>
          </div>

          <div className="space-y-2.5">
            {overview?.criticalCases && overview.criticalCases.length > 0 ? (
              overview.criticalCases.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => onSelectChild(c.child_id)}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>{c.child_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                        TB/U: {c.haz_zscore?.toFixed(2)} SD
                      </span>
                      {c.is_2t_alert ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          2T
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {c.human_explanation_mother}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                Tidak ada kasus darurat stunting berat saat ini.
              </div>
            )}
          </div>
        </div>

        {/* Right: Overdue Follow-ups */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>Tindak Lanjut Melewati Batas Waktu (Overdue Tasks)</span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
              {overview?.overdueTasks?.length || 0} Tugas
            </span>
          </div>

          <div className="space-y-2.5">
            {overview?.overdueTasks && overview.overdueTasks.length > 0 ? (
              overview.overdueTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{task.title}</span>
                    <span className="text-[10px] font-mono text-rose-700 font-bold">Batas: {task.due_date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                    <span>Balita: {task.child_name}</span>
                    <span>Petugas: {task.assigned_to}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                Semua tugas tindak lanjut kader berjalan tepat waktu.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Missed Weigh-in Children Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Daftar Balita Absen Penimbangan Bulanan (&gt;35 Hari)
            </h3>
            <p className="text-xs text-slate-500">
              Perlu intervensi kunjungan kader door-to-door untuk meminimalisasi missing data kohort.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-2.5">Nama Balita</th>
                <th className="p-2.5">Orang Tua / Wali</th>
                <th className="p-2.5">Terakhir Ditimbang</th>
                <th className="p-2.5">Keterlambatan</th>
                <th className="p-2.5 text-right">Aksi Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audit?.missed_weighin_list && audit.missed_weighin_list.length > 0 ? (
                audit.missed_weighin_list.map((c: any) => (
                  <tr key={c.child_id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-2.5 text-slate-600">{c.parent_name}</td>
                    <td className="p-2.5 text-slate-500">{c.last_measured}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                        +{c.days_overdue} Hari Terlambat
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onSelectChild(c.child_id)}
                        className="px-3 py-1 rounded bg-teal-700 text-white font-semibold text-[11px] hover:bg-teal-800 transition"
                      >
                        Buka Rekam
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                    Semua balita aktif telah ditimbang dalam 30 hari terakhir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
