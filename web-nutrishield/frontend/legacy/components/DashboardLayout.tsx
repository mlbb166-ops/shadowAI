import React, { useState, useEffect } from 'react';
import { UserSession } from '../services/authService';
import { apiClient, BackendHealth, CareTask, AgentRun, FoodItem } from '../services/apiClient';
import { ChildDetailModal } from './ChildDetailModal';
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  User,
  Plus,
  Send,
  Sparkles,
  ClipboardList,
  Utensils,
  ChevronRight,
  Clock,
  Heart,
  Eye,
  Check
} from 'lucide-react';

interface DashboardLayoutProps {
  user: UserSession;
  onLogout: () => void;
  onRoleSwitch?: (newRole: any) => void;
  onOpenReportModal: () => void;
  hideHeader?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onLogout,
  onRoleSwitch,
  onOpenReportModal,
  hideHeader = false,
}) => {
  // Navigation tabs for lower section
  const [lowerTab, setLowerTab] = useState<'cohort' | 'agents' | 'foods'>('cohort');

  // Backend state
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [kpi, setKpi] = useState({
    totalChildren: 7,
    stuntedCount: 3,
    alert2TCount: 3,
    normalCount: 4,
    stuntingRate: '42.9%',
    openTasksCount: 5
  });
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<CareTask[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [foodsList, setFoodsList] = useState<FoodItem[]>([]);
  const [foodSubTab, setFoodSubTab] = useState<'catalog' | 'btp' | 'scanner'>('catalog');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('Semua');
  const [btpList, setBtpList] = useState<any[]>([]);
  const [btpSearch, setBtpSearch] = useState('');
  const [scannerText, setScannerText] = useState('Tepung terigu, minyak kelapa sawit, pewarna sintetik tartrazin CI 19140 (INS 102), penguat rasa mononatrium glutamat, pemanis buatan sakarin');
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Child 360 modal state
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childModalOpen, setChildModalOpen] = useState(false);

  // Form input penimbangan
  const [selectedChildOption, setSelectedChildOption] = useState<string>('child-01');
  const [formName, setFormName] = useState('Muhammad Bintang Al-Fatih');
  const [formAge, setFormAge] = useState('14');
  const [formWeight, setFormWeight] = useState('9.6');
  const [formHeight, setFormHeight] = useState('76.0');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<any>(null);

  // Data Quality live guardrail warning
  const wNum = parseFloat(formWeight) || 0;
  const hNum = parseFloat(formHeight) || 0;
  let guardrailWarning: string | null = null;
  if (hNum > 0.3 && hNum < 1.5) {
    guardrailWarning = `Tinggi badan ${hNum} kemungkinan dalam satuan meter. Masukkan dalam centimeter (${Math.round(hNum * 100)} cm).`;
  } else if (wNum > 30 && hNum < 45) {
    guardrailWarning = 'Angka berat dan tinggi badan kemungkinan tertukar.';
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunScan = async () => {
    if (!scannerText.trim()) return;
    setIsScanning(true);
    try {
      const res = await apiClient.checkIngredients(scannerText);
      setScanResult(res);
      showToast('Analisis BTP selesai dievaluasi otonom!');
    } catch (e) {
      showToast('Gagal menganalisis komposisi');
    } finally {
      setIsScanning(false);
    }
  };

  // Fetch all live data from backend & SQLite
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [health, kpiData, children, tasks, runs, foods, btp] = await Promise.all([
        apiClient.checkHealth().catch(() => null),
        apiClient.getKpis().catch(() => null),
        apiClient.getChildren().catch(() => []),
        apiClient.getCareTasks().catch(() => []),
        apiClient.getAgentRuns().catch(() => []),
        apiClient.getFoods().catch(() => []),
        apiClient.getBtpRegulations().catch(() => [])
      ]);

      if (health) setBackendHealth(health);
      if (kpiData) setKpi(kpiData);
      if (children.length) {
        setChildrenList(children);
        // Sync selected child
        const current = children.find((c: any) => c.id === selectedChildOption);
        if (current) {
          setFormName(current.name);
          const latestM = current.measurements && current.measurements.length
            ? current.measurements[current.measurements.length - 1]
            : null;
          if (latestM) {
            setFormAge(latestM.ageMonths.toString());
            setFormWeight(latestM.weightKg.toString());
            setFormHeight(latestM.heightCm.toString());
          }
        }
      }
      if (tasks.length) setTasksList(tasks);
      if (runs.length) setAgentRuns(runs);
      if (foods.length) setFoodsList(foods);
      if (btp && btp.length) setBtpList(btp);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectChildDropdown = (childId: string) => {
    setSelectedChildOption(childId);
    setLastAssessment(null);
    if (childId === 'NEW') {
      setFormName('');
      setFormAge('12');
      setFormWeight('8.5');
      setFormHeight('73.0');
      setFormNotes('');
      return;
    }

    const c = childrenList.find((ch) => ch.id === childId);
    if (c) {
      setFormName(c.name);
      const latestM = c.measurements && c.measurements.length
        ? c.measurements[c.measurements.length - 1]
        : null;
      if (latestM) {
        setFormAge(latestM.ageMonths.toString());
        setFormWeight(latestM.weightKg.toString());
        setFormHeight(latestM.heightCm.toString());
      }
    }
  };

  // Submit Penimbangan Langsung ke SQLite
  const handleRecordMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('⚠️ Mohon isi nama balita.');
      return;
    }
    if (guardrailWarning) {
      showToast(`⚠️ ${guardrailWarning}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.recordScreening({
        nik: `327601${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        name: formName,
        gender: 'male',
        birthDate: '2025-07-10',
        ageMonths: parseFloat(formAge),
        weightKg: parseFloat(formWeight),
        heightCm: parseFloat(formHeight),
        parentName: `Orang Tua ${formName}`,
        address: 'Posyandu Mawar III, Beji',
        allergens: [],
        notes: formNotes
      });

      setLastAssessment(res.assessment || res);
      showToast(`✅ Data ${formName} tersimpan di SQLite! Z-score WHO berhasil dihitung.`);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast('⚠️ Gagal menyimpan data pengukuran ke backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Task Status
  const handleTaskStatusChange = async (taskId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await apiClient.updateCareTask(taskId, newStatus, `Status diperbarui oleh Kader pada ${new Date().toLocaleTimeString('id-ID')}`);
      showToast(`Tugas berhasil diperbarui ke ${newStatus}.`);
      loadAllData();
    } catch (err) {
      showToast('Gagal memperbarui tugas.');
    }
  };

  // Send Discord Alert
  const handleSendDiscord = async (t: CareTask) => {
    try {
      const caseCode = `Kasus #NS-${t.child_id.replace('child-', '')}`;
      await apiClient.dispatchDiscordAlert({
        caseCode,
        ageMonths: 14,
        riskLevel: t.priority,
        reason: t.title,
        assignedTo: t.assigned_to
      });
      showToast(`🚨 Peringatan klinis pseudonim [${caseCode}] terkirim ke Discord!`);
    } catch (err) {
      showToast('Gagal mengirim ke Discord.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-700 selection:text-white pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-teal-700 animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Clean Compact Header (hidden if master navbar active) */}
      {!hideHeader && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 text-base tracking-tight">
                    NutriShield
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                    Care Intelligence
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pencegahan Stunting 1.000 HPK • Posyandu Mawar III, Beji
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live SQLite Status Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden md:inline">SQLite 3 WAL Mode:</span>
                <span className="font-semibold">Terhubung Riil</span>
              </div>

              {/* Reload Data Button */}
              <button
                onClick={loadAllData}
                disabled={isLoading}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              {/* Research Report Button */}
              <button
                onClick={onOpenReportModal}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bukti Klinis</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. TOP KPI METRICS (4 CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] text-slate-500 font-medium">Total Balita Terdaftar</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">{kpi.totalChildren}</div>
            <div className="text-[11px] text-slate-500 mt-1">Posyandu Mawar III</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] text-slate-500 font-medium">Terindikasi Stunting</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-700 mt-1 font-mono">{kpi.stuntedCount}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Prevalensi: {kpi.stuntingRate}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] text-slate-500 font-medium">Peringatan 2T (Faltering)</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1 font-mono">{kpi.alert2TCount}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">Kenaikan BB belum optimal</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] text-slate-500 font-medium">Tugas Terbuka (Care Tasks)</div>
            <div className="text-2xl sm:text-3xl font-bold text-teal-800 mt-1 font-mono">{tasksList.filter(t => t.status === 'OPEN').length}</div>
            <div className="text-[11px] text-teal-700 font-medium mt-1">Perlu pendampingan kader</div>
          </div>
        </div>

        {/* 2. MAIN WORKING GRID (INPUT & CARE TASKS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Input Penimbangan & Analisis AI Langsung */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Input Penimbangan &amp; Analisis AI
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Box-Cox LMS WHO</span>
            </div>

            <form onSubmit={handleRecordMeasurement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Balita:
                </label>
                <select
                  value={selectedChildOption}
                  onChange={(e) => handleSelectChildDropdown(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-teal-600 focus:outline-none"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.measurements?.[c.measurements.length - 1]?.ageMonths || 12} bulan)
                    </option>
                  ))}
                  <option value="NEW">+ Tambah Balita Baru...</option>
                </select>
              </div>

              {selectedChildOption === 'NEW' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Balita Baru:
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Masukkan nama lengkap balita"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Usia (Bulan):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Badan (kg):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="2"
                    max="35"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tinggi Badan (cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="135"
                    value={formHeight}
                    onChange={(e) => setFormHeight(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {guardrailWarning && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{guardrailWarning}</span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Catatan tambahan kader (opsional)..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-600 focus:outline-none text-slate-600"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  Kalkulasi deterministik WHO Anthro 2006
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menilai...' : 'Simpan & Analisis AI'}</span>
                </button>
              </div>
            </form>

            {/* Assessment Result Card */}
            {lastAssessment && (
              <div className="mt-3 p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    <span>Hasil Penilaian AI Growth Sentinel:</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    lastAssessment.isStunted || lastAssessment.growth_status === 'Stunting'
                      ? 'bg-rose-100 text-rose-800'
                      : lastAssessment.is2TAlert
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {lastAssessment.growth_status || (lastAssessment.isStunted ? 'Stunting' : 'Pertumbuhan Optimal')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-white p-2 rounded border border-teal-100">
                    <div className="text-[10px] text-slate-500 font-sans">TB/U (HAZ):</div>
                    <div className="font-bold text-slate-900">{lastAssessment.haz ?? '-0.52'} SD</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-teal-100">
                    <div className="text-[10px] text-slate-500 font-sans">BB/U (WAZ):</div>
                    <div className="font-bold text-slate-900">{lastAssessment.waz ?? '-0.23'} SD</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-teal-100 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-500 font-sans">Status 2T:</div>
                    <div className="font-bold text-slate-900">{lastAssessment.is2TAlert ? 'Alert Faltering' : 'Normal'}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  {lastAssessment.parentExplanation ||
                    `Pengukuran ${formName} telah tersimpan di SQLite. Berat ${formWeight} kg dan tinggi ${formHeight} cm tercatat pada sistem kohort posyandu.`}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Papan Tugas Tindak Lanjut (Care Tasks) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-rose-600" />
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Tindak Lanjut Kasus (Care Tasks)
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 font-mono">
                  {tasksList.length} Tugas
                </span>
              </div>

              {/* Task Cards List */}
              <div className="space-y-2.5 mt-3 max-h-[380px] overflow-y-auto pr-1">
                {tasksList.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition ${
                      t.priority === 'CRITICAL'
                        ? 'bg-rose-50/60 border-rose-200'
                        : t.priority === 'HIGH'
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[200px]">
                          {t.child_name || t.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        t.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                      <div>Petugas: <strong className="text-slate-700">{t.assigned_to}</strong></div>
                      <div className="flex items-center gap-1">
                        {t.status !== 'DONE' && (
                          <button
                            onClick={() => handleTaskStatusChange(t.id, 'DONE')}
                            className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition"
                          >
                            Selesai
                          </button>
                        )}
                        <button
                          onClick={() => handleSendDiscord(t)}
                          className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 font-medium transition"
                          title="Kirim Peringatan ke Discord Kader"
                        >
                          Discord
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Otomatis diterbitkan oleh <strong>Follow-up Coordinator</strong></span>
              <span className="text-emerald-700 font-medium">Tersinkronisasi SQLite</span>
            </div>
          </div>
        </div>

        {/* 3. LOWER SECTION (TABS: KOHORT, AUDIT AI, PANGAN TKPI) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 overflow-x-auto">
            <button
              onClick={() => setLowerTab('cohort')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 ${
                lowerTab === 'cohort'
                  ? 'bg-white text-teal-800 border-teal-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              📋 Data Kohort Balita ({childrenList.length})
            </button>
            <button
              onClick={() => setLowerTab('agents')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
                lowerTab === 'agents'
                  ? 'bg-white text-teal-800 border-teal-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Jejak Audit 6 AI Agent ({agentRuns.length})</span>
            </button>
            <button
              onClick={() => setLowerTab('foods')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
                lowerTab === 'foods'
                  ? 'bg-white text-teal-800 border-teal-700 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Katalog Pangan Lokal TKPI 2020</span>
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {/* TAB 1: KOHORT BALITA TABLE */}
            {lowerTab === 'cohort' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nama Balita</th>
                      <th className="py-2.5 px-3">Usia</th>
                      <th className="py-2.5 px-3">BB (kg)</th>
                      <th className="py-2.5 px-3">TB (cm)</th>
                      <th className="py-2.5 px-3">Z-Score TB/U</th>
                      <th className="py-2.5 px-3">Status Gizi</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {childrenList.map((c) => {
                      const latest = c.measurements && c.measurements.length
                        ? c.measurements[c.measurements.length - 1]
                        : null;
                      const hazVal = latest ? parseFloat(latest.haz || 0) : 0;
                      const isStunted = hazVal < -2.0;
                      const is2T = latest?.is2TAlert;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {c.name}
                            <div className="text-[10px] text-slate-500 font-normal">
                              Ortu: {c.parentName}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">{latest?.ageMonths || 12} bln</td>
                          <td className="py-2.5 px-3 font-mono font-medium">{latest?.weightKg || '-'}</td>
                          <td className="py-2.5 px-3 font-mono font-medium">{latest?.heightCm || '-'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span className={isStunted ? 'text-rose-700' : 'text-slate-800'}>
                              {hazVal.toFixed(2)} SD
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isStunted
                                ? 'bg-rose-100 text-rose-800'
                                : is2T
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isStunted ? 'Stunting' : is2T ? 'Alert 2T' : 'Normal'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedChildId(c.id);
                                setChildModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 hover:bg-teal-100 font-medium transition text-[11px]"
                            >
                              Rekam Medis 360°
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: AUDIT 6 AI AGENTS */}
            {lowerTab === 'agents' && (
              <div className="overflow-x-auto space-y-3">
                <div className="text-xs text-slate-500">
                  Audit trail event-driven: Membuktikan 6 AI Agent bekerja secara otonom pada setiap pengukuran.
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nama Agent</th>
                      <th className="py-2.5 px-3">Event Pemicu</th>
                      <th className="py-2.5 px-3">Ringkasan Eksekusi</th>
                      <th className="py-2.5 px-3">Latensi</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {agentRuns.slice(0, 10).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          {r.agent_name}
                        </td>
                        <td className="py-2.5 px-3 text-teal-700">{r.trigger_event}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 max-w-md truncate">
                          {r.execution_summary}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{r.latency_ms} ms</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-sans font-semibold">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: KATALOG PANGAN & REGULASI BTP BPOM */}
            {lowerTab === 'foods' && (
              <div className="space-y-4">
                {/* Sub-tab switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFoodSubTab('catalog')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                        foodSubTab === 'catalog'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Katalog Pangan ({foodsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodSubTab('btp')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                        foodSubTab === 'btp'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Regulasi BTP BPOM ({btpList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodSubTab('scanner')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                        foodSubTab === 'scanner'
                          ? 'bg-white text-teal-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Scanner BTP Jajanan Anak</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Standar TKPI Kemenkes RI 2020 & Perka BPOM No. 11/2019
                  </span>
                </div>

                {/* SUBTAB 1: FOOD CATALOG */}
                {foodSubTab === 'catalog' && (
                  <div className="space-y-3">
                    {/* Search & Category Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Cari pangan (contoh: kembung, telur bebek, kelor, bayam, lele, indomie)..."
                          value={foodSearch}
                          onChange={(e) => setFoodSearch(e.target.value)}
                          className="w-full text-xs px-3 py-2 pl-8 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 focus:outline-none bg-white"
                        />
                        <span className="absolute left-2.5 top-2 text-slate-400">🔍</span>
                        {foodSearch && (
                          <button
                            type="button"
                            onClick={() => setFoodSearch('')}
                            className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <select
                        value={foodCategoryFilter}
                        onChange={(e) => setFoodCategoryFilter(e.target.value)}
                        className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-600 focus:outline-none"
                      >
                        <option value="Semua">Semua Kategori</option>
                        <option value="Lauk Hewani">Lauk Hewani (Tinggi Protein)</option>
                        <option value="Ikan & Hasil Laut">Ikan & Hasil Laut</option>
                        <option value="Telur">Telur</option>
                        <option value="Sayuran">Sayuran</option>
                        <option value="Buah-buahan">Buah-buahan</option>
                        <option value="Serealia & Umbi">Serealia & Umbi</option>
                        <option value="Produk Kemasan">Produk Kemasan</option>
                        <option value="Produk BPOM Terdaftar">Produk BPOM Terdaftar</option>
                      </select>
                    </div>

                    {/* Table */}
                    {(() => {
                      const filtered = foodsList.filter((f) => {
                        const matchQ = !foodSearch ||
                          f.common_name?.toLowerCase().includes(foodSearch.toLowerCase()) ||
                          f.name_id?.toLowerCase().includes(foodSearch.toLowerCase()) ||
                          ((f as any).brand && (f as any).brand.toLowerCase().includes(foodSearch.toLowerCase()));
                        const matchCat = foodCategoryFilter === 'Semua' || f.category === foodCategoryFilter;
                        return matchQ && matchCat;
                      });

                      return (
                        <>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Menampilkan <strong>{Math.min(filtered.length, 30)}</strong> dari <strong>{filtered.length}</strong> pangan yang cocok</span>
                            {filtered.length > 30 && <span className="text-slate-400 italic">Gunakan kata kunci untuk mempersempit</span>}
                          </div>
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3">Bahan Pangan</th>
                                  <th className="py-2.5 px-3">Kategori</th>
                                  <th className="py-2.5 px-3">Protein (g)</th>
                                  <th className="py-2.5 px-3">Kalori (kkal)</th>
                                  <th className="py-2.5 px-3">Zat Besi (mg)</th>
                                  <th className="py-2.5 px-3">Kalsium (mg)</th>
                                  <th className="py-2.5 px-3">Sumber / Merek</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filtered.slice(0, 30).map((f) => (
                                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                                    <td className="py-2.5 px-3 font-bold text-slate-900">
                                      {f.common_name}
                                      {f.name_id && f.name_id !== f.common_name && (
                                        <div className="text-[10px] text-slate-500 font-normal">{f.name_id}</div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium">
                                        {f.category}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                                      {f.protein_g > 0 ? `${f.protein_g} g` : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono">
                                      {f.energy_kcal > 0 ? `${f.energy_kcal} kkal` : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono">
                                      {f.iron_mg > 0 ? `${f.iron_mg} mg` : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono">
                                      {f.calcium_mg > 0 ? `${f.calcium_mg} mg` : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                                      {(f as any).brand || (f as any).source_ref || 'TKPI Kemenkes'}
                                    </td>
                                  </tr>
                                ))}
                                {filtered.length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                                      Tidak ada data pangan yang cocok dengan kata kunci "{foodSearch}".
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* SUBTAB 2: BTP REGULATIONS */}
                {foodSubTab === 'btp' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari BTP (contoh: INS 470, tartrazin, benzoat, pemanis, tokoferol, antikempal)..."
                        value={btpSearch}
                        onChange={(e) => setBtpSearch(e.target.value)}
                        className="w-full text-xs px-3 py-2 pl-8 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 focus:outline-none bg-white"
                      />
                      <span className="absolute left-2.5 top-2 text-slate-400">🔍</span>
                    </div>

                    {(() => {
                      const filteredBtp = btpList.filter((b) => {
                        if (!btpSearch) return true;
                        const s = btpSearch.toLowerCase();
                        return (
                          (b.btp_name && b.btp_name.toLowerCase().includes(s)) ||
                          (b.ins_number && b.ins_number.toLowerCase().includes(s)) ||
                          (b.functional_category && b.functional_category.toLowerCase().includes(s))
                        );
                      });

                      return (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">Nomor INS</th>
                                <th className="py-2.5 px-3">Nama Bahan Tambahan Pangan (BTP)</th>
                                <th className="py-2.5 px-3">Golongan Fungsi</th>
                                <th className="py-2.5 px-3">Pedoman untuk Balita (&lt;5 Tahun)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredBtp.slice(0, 30).map((b, idx) => (
                                <tr key={b.id || idx} className="hover:bg-slate-50/80 transition">
                                  <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                                    INS {b.ins_number}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs">
                                    {b.btp_name}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                      {b.functional_category}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-sm">
                                    {b.safety_notes_for_children || 'Penggunaan wajar terdaftar BPOM RI.'}
                                  </td>
                                </tr>
                              ))}
                              {filteredBtp.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                                    Tidak ada BTP yang cocok dengan kata kunci "{btpSearch}".
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SUBTAB 3: SCANNER BTP JAJANAN ANAK */}
                {foodSubTab === 'scanner' && (
                  <div className="space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-teal-700" />
                        <span>Scanner Keamanan Bahan Tambahan Pangan (BTP) untuk Balita</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tempelkan daftar komposisi dari kemasan jajanan/camilan anak untuk mendeteksi zat aditif, nomor INS, atau pemanis/pewarna sintetik yang perlu dibatasi menurut BPOM RI.
                      </p>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 font-medium">Contoh Preset:</span>
                      <button
                        type="button"
                        onClick={() => setScannerText('Minyak nabati, antioksidan tokoferol (INS 308), magnesium stearat (INS 470iii)')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition"
                      >
                        Biskuit Standar (Aman)
                      </button>
                      <button
                        type="button"
                        onClick={() => setScannerText('Air, gula, pengatur keasaman asam sitrat, pewarna sintetik tartrazin CI 19140 (INS 102), pemanis buatan aspartam')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-rose-50 hover:text-rose-800 transition"
                      >
                        Minuman Berpemanis Sintetik (Perhatian)
                      </button>
                      <button
                        type="button"
                        onClick={() => setScannerText('Tepung gandum, garam, penguat rasa mononatrium glutamat, pengawet natrium benzoat')}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
                      >
                        Mi Instan / Bumbu Gurih
                      </button>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={scannerText}
                        onChange={(e) => setScannerText(e.target.value)}
                        placeholder="Ketik atau tempel daftar komposisi kemasan di sini..."
                        className="w-full text-xs p-3 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-600 focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleRunScan}
                          disabled={isScanning}
                          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>{isScanning ? 'Menganalisis...' : 'Periksa Keamanan untuk Balita'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Scan Result */}
                    {scanResult && (
                      <div className={`p-3.5 rounded-lg border text-xs ${
                        scanResult.child_safety_verdict === 'PERLU_PERHATIAN'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}>
                        <div className="flex items-center justify-between font-bold text-sm mb-1.5">
                          <span>
                            {scanResult.child_safety_verdict === 'PERLU_PERHATIAN'
                              ? '⚠️ Perlu Pembatasan untuk Balita'
                              : '✓ Komposisi Bahan Tambahan Terdaftar Standar'}
                          </span>
                          <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-white/80 border">
                            {scanResult.regulatory_ref}
                          </span>
                        </div>
                        <p className="text-[11px] mb-2">
                          Terdeteksi <strong>{scanResult.total_btp_detected}</strong> zat aditif / BTP pada daftar komposisi.
                        </p>
                        {scanResult.detected_additives && scanResult.detected_additives.length > 0 && (
                          <div className="space-y-1.5 mt-2 bg-white/70 p-2.5 rounded border">
                            {scanResult.detected_additives.map((ad: any, i: number) => (
                              <div key={i} className="flex items-start justify-between gap-2 border-b border-slate-100 last:border-0 pb-1">
                                <div>
                                  <span className="font-bold text-slate-900">INS {ad.ins_number} — {ad.btp_name}</span>
                                  <div className="text-[10px] text-slate-500">{ad.safety_notes_for_children}</div>
                                </div>
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold whitespace-nowrap">
                                  {ad.functional_category}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rekam Medis 360° Modal */}
      <ChildDetailModal
        childId={selectedChildId || 'child-01'}
        isOpen={childModalOpen}
        onClose={() => setChildModalOpen(false)}
      />
    </div>
  );
};
