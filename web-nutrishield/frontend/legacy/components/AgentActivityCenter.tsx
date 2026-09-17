import React, { useState, useEffect } from 'react';
import { apiClient, AgentRun } from '../services/apiClient';
import {
  Activity,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  Zap,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export const AgentActivityCenter: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [auditRunning, setAuditRunning] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAgentRuns(50);
      setRuns(data);
    } catch (e) {
      console.error('Error fetching agent runs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunAudit = async () => {
    setAuditRunning(true);
    try {
      await apiClient.agentAuditCohort();
      await fetchRuns();
    } catch (e) {
      console.error(e);
    } finally {
      setAuditRunning(false);
    }
  };

  const agentsList = [
    { name: 'Growth Sentinel', role: 'Deterministic Box-Cox LMS WHO 2006 & 2T Alert', icon: Activity, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { name: 'Data Quality Agent', role: 'Input Guardrail, Unit-Swap & Plausibility', icon: ShieldAlert, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { name: 'Follow-up Coordinator', role: 'Care Tasks Dispatcher & Puskesmas Referral', icon: CheckCircle2, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { name: 'Nutrition Planner', role: 'TKPI 2020 Constraint Solver & Recipes', icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { name: 'Cohort Monitor', role: 'Cross-Sectional Audit & Missed Weigh-in', icon: Cpu, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { name: 'Agent Orchestrator', role: 'Master Event Loop & Audit Event Logging', icon: Bot, color: 'text-slate-800 bg-slate-100 border-slate-300' },
  ];

  const filteredRuns = selectedAgent === 'all'
    ? runs
    : runs.filter(r => r.agent_name.toLowerCase() === selectedAgent.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase tracking-wide">
            <Bot className="w-3.5 h-3.5" />
            <span>Autonomous Intelligence &amp; Event Loop</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Aktivitas Agent &amp; Jejak Audit Transparan
          </h2>
          <p className="text-xs text-slate-500">
            Setiap penilaian klinis, deteksi anomali, dan pembuatan tugas tercatat secara persisten di tabel basis data riil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAudit}
            disabled={auditRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition disabled:opacity-50"
          >
            <Cpu className={`w-3.5 h-3.5 ${auditRunning ? 'animate-spin' : ''}`} />
            <span>{auditRunning ? 'Menjalankan Audit...' : 'Jalankan Audit Kohort'}</span>
          </button>

          <button
            onClick={fetchRuns}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Autonomous Agents Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {agentsList.map(a => {
          const Icon = a.icon;
          const agentRunsCount = runs.filter(r => r.agent_name.toLowerCase() === a.name.toLowerCase()).length;
          return (
            <div
              key={a.name}
              className={`p-4 rounded-xl border ${a.color} flex items-start gap-3.5 shadow-sm transition hover:shadow`}
            >
              <div className="p-2.5 rounded-lg bg-white shadow-sm border border-slate-100">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">{a.name}</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border text-slate-600">
                    {agentRunsCount} Runs
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {a.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Log Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Log Eksekusi Event-Driven ({filteredRuns.length} Peristiwa)
            </h3>
          </div>

          {/* Filter agent */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filter Agent:</span>
            <select
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">Semua Agent</option>
              <option value="Growth Sentinel">Growth Sentinel</option>
              <option value="Data Quality Agent">Data Quality Agent</option>
              <option value="Follow-up Coordinator">Follow-up Coordinator</option>
              <option value="Nutrition Planner">Nutrition Planner</option>
              <option value="Cohort Monitor">Cohort Monitor</option>
            </select>
          </div>
        </div>

        {/* Feed List */}
        <div className="space-y-3">
          {filteredRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              Belum ada log eksekusi untuk filter ini.
            </div>
          ) : (
            filteredRuns.map(run => {
              const isExpanded = expandedRunId === run.id;
              return (
                <div
                  key={run.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{run.agent_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                        {run.trigger_event}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          run.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : run.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>⚡ {run.latency_ms} ms</span>
                      <span>•</span>
                      <span>{run.created_at}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {run.execution_summary}
                  </p>

                  {/* Evidence accordion toggle */}
                  {run.evidence_text && (
                    <div className="pt-1">
                      <button
                        onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                        className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 transition"
                      >
                        <span>{isExpanded ? 'Sembunyikan Bukti / Parameter Klinis' : 'Lihat Bukti Klinis & Parameter LMS'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono space-y-1.5 border border-slate-800 animate-in fade-in">
                          <div className="text-teal-400 font-semibold">Model / Engine: {run.model_used}</div>
                          <div className="text-slate-300">Evidence: {run.evidence_text}</div>
                          {run.output_payload_json && (
                            <div className="text-[11px] text-slate-400 overflow-x-auto pt-1 border-t border-slate-800">
                              Payload Output: {run.output_payload_json}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
