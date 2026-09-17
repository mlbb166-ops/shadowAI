/**
 * NutriShield API Client
 * Mengintegrasikan Frontend (React 18 + Vite) dengan Backend API (FastAPI) & Database (SQLite 3 WAL)
 * Mendukung Multi-Agent Architecture: Growth Sentinel, Data Quality, Follow-up Coordinator, Nutrition Planner, Cohort Monitor.
 */

import { storageService, ChildRecord } from './storageService';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const BACKEND_URL = isLocal && window.location.port === '3000'
  ? 'http://localhost:8000/api'
  : '/api';

export interface BackendHealth {
  status: string;
  database: string;
  engine: string;
  total_children: number;
  total_measurements: number;
  total_care_tasks: number;
  agents: string[];
  standard: string;
  timestamp: string;
}

export interface CareTask {
  id: string;
  child_id: string;
  child_name?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  assessment_id?: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assigned_to: string;
  due_date: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'ESCALATED';
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AgentRun {
  id: string;
  correlation_id?: string;
  agent_name: string;
  trigger_event: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'NEEDS_REVIEW' | 'FAILED';
  execution_summary: string;
  evidence_text?: string;
  input_payload_json?: string;
  output_payload_json?: string;
  model_used: string;
  latency_ms: number;
  created_at: string;
}

export interface FoodItem {
  id: string;
  name_id: string;
  common_name: string;
  category: string;
  energy_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  calcium_mg: number;
  iron_mg: number;
  zinc_mg: number;
  omega3_g: number;
  avg_cost_per_100g: number;
  allergen_tags_csv: string;
  serving_suggestion: string;
}

export interface SupervisorOverview {
  cohortAudit: {
    total_children: number;
    stunted_count: number;
    stunted_rate_pct: number;
    alert_2t_count: number;
    alert_2t_rate_pct: number;
    normal_count: number;
    missed_weighin_count: number;
    missed_weighin_list: Array<{ child_id: string; name: string; parent_name: string; last_measured: string; days_overdue: number }>;
    stunted_list: Array<any>;
    alert_2t_list: Array<any>;
    tasks_summary: Record<string, number>;
  };
  overdueTasks: CareTask[];
  criticalCases: Array<any>;
  dataIntegrityScore: number;
}

export const apiClient = {
  /**
   * Cek status koneksi Frontend <-> Backend <-> Database
   */
  async checkHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend API offline, menggunakan fallback storage lokal:', e);
    }
    return null;
  },

  /**
   * Mengambil data kohort balita dari Database Backend
   */
  async getChildren(): Promise<ChildRecord[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/children`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Gagal fetch children dari backend, fallback ke storage:', e);
    }
    return storageService.getChildren();
  },

  /**
   * Mengambil detail lengkap balita (rekam medis 360)
   */
  async getChildDetail(childId: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/children/${childId}`);
    if (!res.ok) {
      throw new Error(`Gagal memuat rekam medis balita ${childId}`);
    }
    return await res.json();
  },

  /**
   * Mengambil ringkasan KPI kohort dari Database Backend
   */
  async getKpis() {
    try {
      const res = await fetch(`${BACKEND_URL}/kpi`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Gagal fetch KPI dari backend, fallback ke storage:', e);
    }
    return storageService.getCohortKPIs();
  },

  /**
   * Merekam penimbangan melalui pipeline multi-agent (Data Quality -> Growth Sentinel -> Follow-up Coordinator)
   */
  async recordMeasurement(input: {
    childId: string;
    measureDate?: string;
    ageMonths: number;
    weightKg: number;
    heightCm: number;
    headCircCm?: number;
    notes?: string;
  }) {
    const res = await fetch(`${BACKEND_URL}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return await res.json();
  },

  /**
   * Skrining cepat untuk portal ibu/publik (tanpa perlu login)
   */
  async recordScreening(input: {
    nik?: string;
    name: string;
    gender: 'male' | 'female';
    birthDate: string;
    ageMonths: number;
    weightKg: number;
    heightCm: number;
    parentName: string;
    address: string;
    allergens: string[];
    notes?: string;
  }) {
    try {
      const res = await fetch(`${BACKEND_URL}/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (res.ok) {
        const data = await res.json();
        const safeInput = { ...input, nik: input.nik || `327601${Date.now()}` };
        storageService.recordMeasurement(safeInput);
        return data;
      }
    } catch (e) {
      console.warn('Gagal simpan ke backend, fallback ke storage:', e);
    }
    const fallbackInput = { ...input, nik: input.nik || `327601${Date.now()}` };
    return storageService.recordMeasurement(fallbackInput);
  },

  /**
   * Menghapus balita dari Database Backend
   */
  async deleteChild(childId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/children/${childId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        storageService.deleteChild(childId);
        return true;
      }
    } catch (e) {
      console.warn('Gagal delete di backend, fallback ke storage:', e);
    }
    storageService.deleteChild(childId);
    return true;
  },

  /**
   * Mengambil daftar Care Tasks (Tindak Lanjut)
   */
  async getCareTasks(filter?: { status?: string; priority?: string; child_id?: string }): Promise<CareTask[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.status) params.append('status', filter.status);
      if (filter?.priority) params.append('priority', filter.priority);
      if (filter?.child_id) params.append('child_id', filter.child_id);

      const res = await fetch(`${BACKEND_URL}/tasks?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Gagal fetch care tasks:', e);
    }
    return [];
  },

  /**
   * Memperbarui status Care Task
   */
  async updateCareTask(taskId: string, status: string, notes?: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) {
      throw new Error(`Gagal update task ${taskId}`);
    }
    return await res.json();
  },

  /**
   * Mengambil Katalog Pangan Terverifikasi TKPI 2020
   */
  async getFoods(category?: string, excludeAllergens?: string, query?: string): Promise<FoodItem[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (excludeAllergens) params.append('exclude_allergens', excludeAllergens);
      if (query) params.append('q', query);

      const res = await fetch(`${BACKEND_URL}/foods?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Gagal fetch foods:', e);
    }
    return [];
  },

  /**
   * Mengambil daftar Bahan Tambahan Pangan (BTP) resmi Peraturan BPOM No. 11/2019
   */
  async getBtpRegulations(query?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      params.append('limit', '100');
      const res = await fetch(`${BACKEND_URL}/foods/btp?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.items || [];
      }
    } catch (e) {
      console.warn('Gagal fetch btp regulations:', e);
    }
    return [];
  },

  /**
   * Scanner komposisi jajanan anak untuk mendeteksi zat aditif / BTP berbahaya
   */
  async checkIngredients(text: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/foods/check-ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientsText: text })
    });
    if (!res.ok) {
      throw new Error('Gagal scan BTP komposisi makanan');
    }
    return await res.json();
  },

  /**
   * Menjalankan Nutrition Planner Agent untuk menyusun menu makanan
   */
  async generateNutritionPlan(childId: string, allergens?: string[], budgetMaxRp?: number) {
    const res = await fetch(`${BACKEND_URL}/nutrition/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, allergens, budgetMaxRp })
    });
    if (!res.ok) {
      throw new Error('Gagal merumuskan rencana nutrisi');
    }
    return await res.json();
  },

  /**
   * Mengambil audit trail eksekusi AI Agent dari agent_runs
   */
  async getAgentRuns(limit: number = 30): Promise<AgentRun[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/agent/runs?limit=${limit}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Gagal fetch agent runs:', e);
    }
    return [];
  },

  /**
   * Mengambil ringkasan pengawasan Supervisor Hub
   */
  async getSupervisorOverview(): Promise<SupervisorOverview | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/supervisor/overview`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Gagal fetch supervisor overview:', e);
    }
    return null;
  },

  /**
   * Membuat / meminta kode pairing Telegram
   */
  async getTelegramPairCode(childId: string) {
    const res = await fetch(`${BACKEND_URL}/telegram/link-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId })
    });
    if (!res.ok) {
      throw new Error('Gagal membuat kode pairing Telegram');
    }
    return await res.json();
  },

  /**
   * Simulasi pesan webhook Telegram
   */
  async simulateTelegramMessage(chatId: number, messageText: string, senderName: string = 'Ibu Sarah') {
    const res = await fetch(`${BACKEND_URL}/webhook/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, messageText, senderName })
    });
    return await res.json();
  },

  /**
   * Mengirim notifikasi terenkripsi pseudonim ke Discord Kader
   */
  async dispatchDiscordAlert(payload: { caseCode: string; ageMonths: number; riskLevel: string; reason: string; assignedTo: string }) {
    const res = await fetch(`${BACKEND_URL}/webhook/discord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  /**
   * Mengunduh CSV langsung dari backend database
   */
  downloadBackendCsv() {
    window.open(`${BACKEND_URL}/export/csv`, '_blank');
  },

  // ---------------------------------------------------------
  // Autonomous AI Agent (Shadow Co-Pilot) Client Calls
  // ---------------------------------------------------------
  async getAgentStatus() {
    try {
      const res = await fetch(`${BACKEND_URL}/agent/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Gagal cek status agent:', e);
    }
    return null;
  },

  async agentChat(message: string, history: { role: string; content: string }[] = []) {
    const res = await fetch(`${BACKEND_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    if (!res.ok) {
      throw new Error(`Agent error: ${res.statusText}`);
    }
    return await res.json();
  },

  async agentAuditCohort() {
    const res = await fetch(`${BACKEND_URL}/agent/audit-cohort`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error(`Audit error: ${res.statusText}`);
    }
    return await res.json();
  },

  async agentGeneratePdf(childName: string, notes: string = '') {
    const res = await fetch(`${BACKEND_URL}/agent/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childName, notes })
    });
    if (!res.ok) {
      throw new Error(`Generate PDF error: ${res.statusText}`);
    }
    return await res.json();
  },

  async getDashboardOverview(childId: string = 'child-01') {
    const res = await fetch(`${BACKEND_URL}/dashboard/overview?childId=${encodeURIComponent(childId)}`);
    if (!res.ok) throw new Error(`Overview error: ${res.statusText}`);
    return await res.json();
  },

  async getWeeklyPlan(childId: string = 'child-01', budgetMaxRp: number = 20000) {
    const res = await fetch(`${BACKEND_URL}/planner/weekly?childId=${encodeURIComponent(childId)}&budgetMaxRp=${budgetMaxRp}`);
    if (!res.ok) throw new Error(`Weekly plan error: ${res.statusText}`);
    return await res.json();
  },

  async getChannelsStatus() {
    const res = await fetch(`${BACKEND_URL}/channels/status`);
    if (!res.ok) throw new Error(`Channels status error: ${res.statusText}`);
    return await res.json();
  },

  async askCoach(payload: { name?: string; ageMonths?: number; allergy?: string; budget?: number; region?: string; question: string }) {
    const res = await fetch(`${BACKEND_URL}/agent/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Coach error: ${res.statusText}`);
    return await res.json();
  },

  async runAgentCycle(profile?: any, measurements?: any) {
    const res = await fetch(`${BACKEND_URL}/agent/run-cycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, measurements })
    });
    if (!res.ok) throw new Error(`Agent run-cycle error: ${res.statusText}`);
    return await res.json();
  },

  async testChannelAI(payload: { channel: string; message: string; profile?: any }) {
    const res = await fetch(`${BACKEND_URL}/channels/test-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Channel test-ai error: ${res.statusText}`);
    return await res.json();
  },

  async getKnowledgeSources() {
    const res = await fetch(`${BACKEND_URL}/knowledge/sources`);
    if (!res.ok) throw new Error(`Knowledge sources error: ${res.statusText}`);
    return await res.json();
  },

  async getGrowthSample() {
    const res = await fetch(`${BACKEND_URL}/growth/sample`);
    if (!res.ok) throw new Error(`Growth sample error: ${res.statusText}`);
    return await res.json();
  }
};


