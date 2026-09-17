import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  X,
  Calendar,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Utensils,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Plus
} from 'lucide-react';

interface ChildDetailModalProps {
  childId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfReport?: (childName: string) => void;
}

export const ChildDetailModal: React.FC<ChildDetailModalProps> = ({
  childId,
  isOpen,
  onClose,
  onOpenPdfReport
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [generatingNutrition, setGeneratingNutrition] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getChildDetail(childId);
      setData(res);
    } catch (e) {
      console.error('Error fetching child detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && childId) {
      fetchDetail();
    }
  }, [isOpen, childId]);

  if (!isOpen) return null;

  const handleCopyTelegram = () => {
    const code = data?.telegramIntegration?.auth_token || 'NUTRI-7821';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGeneratePlan = async () => {
    setGeneratingNutrition(true);
    try {
      await apiClient.generateNutritionPlan(childId, data?.allergens);
      await fetchDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingNutrition(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-teal-700 tracking-wide uppercase">
              Rekam Medis 360° Posyandu
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {data?.child?.name || 'Memuat Profil...'}
            </h3>
            <p className="text-xs text-slate-500">
              NIK: {data?.child?.nik || '-'} • Lahir: {data?.child?.birth_date || '-'} ({data?.child?.gender === 'male' ? 'Laki-laki' : 'Perempuan'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
              <span className="text-xs">Mengambil rekam pertumbuhan balita...</span>
            </div>
          ) : (
            <>
              {/* Profile & Telegram Code Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-700" />
                    <span>Data Keluarga</span>
                  </div>
                  <div><span className="text-slate-500">Nama Orang Tua:</span> <span className="font-medium text-slate-800">{data?.child?.parent_name}</span></div>
                  <div><span className="text-slate-500">No. Telepon:</span> <span className="font-medium text-slate-800">{data?.child?.parent_phone || '-'}</span></div>
                  <div><span className="text-slate-500">Alamat:</span> <span className="font-medium text-slate-800">{data?.child?.address}</span></div>
                  <div className="pt-1 flex flex-wrap gap-1">
                    <span className="text-slate-500">Alergen:</span>
                    {data?.allergens && data.allergens.length > 0 ? (
                      data.allergens.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold text-[10px]">
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Tidak ada alergen tercatat</span>
                    )}
                  </div>
                </div>

                {/* Telegram Bot Pairing Code */}
                <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 space-y-2 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-teal-950 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-teal-700" />
                      <span>Akun Telegram Pendamping</span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      Keluarga dapat menerima rekam timbang dan notifikasi jadwal langsung melalui bot.
                    </p>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-teal-300">
                    <span className="font-mono font-bold text-teal-900 text-sm">
                      {data?.telegramIntegration?.auth_token || 'NUTRI-7821'}
                    </span>
                    <button
                      onClick={handleCopyTelegram}
                      className="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-medium flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Historical Measurements Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Riwayat Penimbangan &amp; Evaluasi Baku WHO (Box-Cox LMS)
                  </h4>
                  <span className="text-xs text-slate-500">
                    {data?.measurements?.length || 0} Pengukuran tercatat
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2.5">Tanggal</th>
                        <th className="p-2.5">Usia</th>
                        <th className="p-2.5">BB (kg)</th>
                        <th className="p-2.5">TB (cm)</th>
                        <th className="p-2.5">Z-Score TB/U</th>
                        <th className="p-2.5">Z-Score BB/U</th>
                        <th className="p-2.5">2T</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.measurements && data.measurements.length > 0 ? (
                        data.measurements.map((m: any) => (
                          <tr key={m.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-medium text-slate-800">{m.measure_date}</td>
                            <td className="p-2.5">{m.age_months} bln</td>
                            <td className="p-2.5 font-bold text-slate-900">{m.weight_kg}</td>
                            <td className="p-2.5 font-bold text-slate-900">{m.height_cm}</td>
                            <td className="p-2.5 font-mono">
                              <span className={m.haz_zscore < -2.0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                                {m.haz_zscore !== null ? m.haz_zscore.toFixed(2) : '-'}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono">
                              <span className={m.waz_zscore < -2.0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                                {m.waz_zscore !== null ? m.waz_zscore.toFixed(2) : '-'}
                              </span>
                            </td>
                            <td className="p-2.5">
                              {m.is_2t_alert ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  2T
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  m.risk_level === 'NEEDS_HUMAN_REVIEW'
                                    ? 'bg-rose-100 text-rose-800'
                                    : m.risk_level === 'MONITOR'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {m.growth_status || 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                            Belum ada riwayat pengukuran.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nutrition Plans Formulated */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-700" />
                    <span>Rencana Gizi Pangan Lokal (Nutrition Planner)</span>
                  </h4>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingNutrition}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{generatingNutrition ? 'Merumuskan...' : 'Rumuskan Menu Baru'}</span>
                  </button>
                </div>

                {data?.nutritionPlans && data.nutritionPlans.length > 0 ? (
                  <div className="space-y-3">
                    {data.nutritionPlans.map((plan: any) => (
                      <div key={plan.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{plan.title}</span>
                          <span className="text-slate-500 font-mono">{plan.created_at}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 bg-white rounded border">
                            <div className="text-slate-500 text-[10px]">Target Protein:</div>
                            <div className="font-bold text-teal-800">{plan.target_protein_g}g / hari</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-slate-500 text-[10px]">Target Kalori:</div>
                            <div className="font-bold text-slate-800">{plan.target_calories} kkal</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-slate-500 text-[10px]">Estimasi Biaya:</div>
                            <div className="font-bold text-emerald-700">Rp{plan.ingredients_budget_est?.toLocaleString() || '14.500'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-400">
                    Belum ada rencana gizi yang digenerate untuk ananda. Klik "Rumuskan Menu Baru" di atas.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => onOpenPdfReport && onOpenPdfReport(data?.child?.name)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Cetak Surat Rujukan Klinis (ReportLab PDF)</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Tutup
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
