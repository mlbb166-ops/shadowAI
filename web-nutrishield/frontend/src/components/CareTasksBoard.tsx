import React, { useState, useEffect } from 'react';
import { apiClient, CareTask } from '../services/apiClient';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  Calendar,
  User,
  Plus,
  Send,
  MessageSquare,
  Check,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface CareTasksBoardProps {
  onRefreshNeeded?: () => void;
}

export const CareTasksBoard: React.FC<CareTasksBoardProps> = ({ onRefreshNeeded }) => {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CareTask | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<'OPEN' | 'IN_PROGRESS' | 'DONE' | 'ESCALATED'>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [discordDispatched, setDiscordDispatched] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCareTasks();
      setTasks(data);
    } catch (e) {
      console.error('Error fetching care tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await apiClient.updateCareTask(selectedTask.id, statusUpdate, resolutionNotes);
      showToast(`Tugas "${selectedTask.title}" berhasil diperbarui ke status ${statusUpdate}.`);
      setSelectedTask(null);
      setResolutionNotes('');
      fetchTasks();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      showToast('Gagal memperbarui status tugas.');
    }
  };

  const handleDispatchDiscord = async (task: CareTask) => {
    try {
      const caseCode = `Kasus #NS-${task.child_id.replace('child-', '')}`;
      await apiClient.dispatchDiscordAlert({
        caseCode,
        ageMonths: 14,
        riskLevel: task.priority,
        reason: task.title,
        assignedTo: task.assigned_to
      });
      setDiscordDispatched(task.id);
      showToast(`Notifikasi terenkripsi pseudonim [${caseCode}] terkirim ke Discord Kader.`);
      setTimeout(() => setDiscordDispatched(null), 3000);
    } catch (e) {
      showToast('Gagal mengirim ke Discord.');
    }
  };

  const columns: Array<{ id: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'ESCALATED'; label: string; bg: string }> = [
    { id: 'OPEN', label: 'Menunggu Tindakan (Open)', bg: 'border-t-rose-500' },
    { id: 'IN_PROGRESS', label: 'Sedang Berjalan (In Progress)', bg: 'border-t-amber-500' },
    { id: 'DONE', label: 'Selesai Dilaksanakan (Done)', bg: 'border-t-emerald-500' },
    { id: 'ESCALATED', label: 'Eskalasi ke Puskesmas', bg: 'border-t-purple-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Tindak Lanjut &amp; Care Tasks Binaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dikelola secara otonom oleh Follow-up Coordinator saat terdeteksi indikator 2T atau risiko stunting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-teal-800 text-white text-xs font-medium rounded-xl shadow-md flex items-center justify-between animate-in fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-teal-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-slate-100/70 rounded-2xl p-4 border border-slate-200 border-t-4 ${col.bg} flex flex-col space-y-3 min-h-[460px]`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="w-5 h-5 rounded-full bg-white text-slate-700 font-bold text-[11px] flex items-center justify-center border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400 italic text-center">
                    Tidak ada tugas di kolom ini.
                  </div>
                ) : (
                  colTasks.map(t => (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow transition space-y-3"
                    >
                      {/* Priority badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            t.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : t.priority === 'MEDIUM'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{t.due_date}</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {t.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-3">
                          {t.description}
                        </p>
                      </div>

                      {/* Child & Parent Phone info */}
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-700">{t.child_name || t.child_id}</span>
                        </div>
                        {t.parent_phone && (
                          <div className="text-teal-700 font-medium">
                            Telp: {t.parent_phone}
                          </div>
                        )}
                        {t.resolution_notes && (
                          <div className="p-2 rounded bg-slate-50 border text-slate-700 italic text-[10px]">
                            Catatan: {t.resolution_notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedTask(t);
                            setStatusUpdate(t.status);
                            setResolutionNotes(t.resolution_notes || '');
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition text-center"
                        >
                          Ubah Status
                        </button>

                        <button
                          onClick={() => handleDispatchDiscord(t)}
                          title="Kirim Notifikasi Kasus Pseudonim ke Discord Kader"
                          className="p-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                        >
                          {discordDispatched === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Update Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Perbarui Status Tindak Lanjut</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-teal-800">{selectedTask.title}</div>
              <div className="text-xs text-slate-500">Penanggung jawab: {selectedTask.assigned_to}</div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pengerjaan</label>
                <select
                  value={statusUpdate}
                  onChange={e => setStatusUpdate(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-teal-600"
                >
                  <option value="OPEN">Menunggu Tindakan (Open)</option>
                  <option value="IN_PROGRESS">Sedang Berjalan (In Progress)</option>
                  <option value="DONE">Selesai Teratasi (Done)</option>
                  <option value="ESCALATED">Eskalasi ke Puskesmas (Escalated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Resolusi / Hasil Kunjungan</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Contoh: Sudah mengunjungi rumah, orang tua berkomitmen memberikan telur 1 butir/hari..."
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
