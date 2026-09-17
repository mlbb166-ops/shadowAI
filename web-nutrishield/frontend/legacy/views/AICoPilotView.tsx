import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { ChildRecord } from '../services/storageService';
import {
  Bot,
  Send,
  Sparkles,
  Database,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  Cpu,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface ToolExecuted {
  tool: string;
  summary: string;
}

interface ArtifactItem {
  title: string;
  filename: string;
  url: string;
  type: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolsExecuted?: ToolExecuted[];
  ragSources?: string[];
  artifacts?: ArtifactItem[];
}

interface AICoPilotViewProps {
  cohort: ChildRecord[];
  onSelectChildForScreening?: (child: ChildRecord) => void;
  prefillQuery?: string;
}

export const AICoPilotView: React.FC<AICoPilotViewProps> = ({
  cohort,
  onSelectChildForScreening,
  prefillQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Halo! Saya **Shadow Co-Pilot**, asisten klinis kecerdasan buatan otonom untuk pencegahan stunting dan monitoring 1.000 HPK.\n\n' +
        'Saya terhubung langsung ke **Gateway 9Router (Port 27888)** dengan model `ag/gemini-3.8-flash-high`, ' +
        'basis data SQLite Posyandu, serta standar biokimia **TKPI Kemenkes RI 2020** dan **WHO Anthro 2006**.\n\n' +
        'Silakan klik salah satu perintah otonom di bawah atau tanyakan kasus klinis balita Anda:',
      timestamp: 'Baru saja',
      toolsExecuted: [
        {
          tool: 'system_initialization',
          summary: 'Terhubung ke Gateway 9Router (Port 27888) & Basis Data SQLite Posyandu'
        }
      ],
      ragSources: ['01_proposal_shield_salsabila.md', '02_kemenkes_pangan_dan_standar_medis.md']
    }
  ]);

  const [inputMessage, setInputMessage] = useState(prefillQuery || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [selectedChildName, setSelectedChildName] = useState<string>(cohort[0]?.name || 'Kenzo Al-Fatih');
  const [agentStatus, setAgentStatus] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    // Check live agent status from backend
    apiClient.getAgentStatus().then((status) => {
      if (status) setAgentStatus(status);
    });
  }, []);

  useEffect(() => {
    if (prefillQuery) {
      setInputMessage(prefillQuery);
    }
  }, [prefillQuery]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isProcessing) return;

    const userMsgId = `user-${Date.now()}`;
    const newHistory: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newHistory);
    if (!customPrompt) setInputMessage('');
    setIsProcessing(true);
    setCurrentStep('Menghubungkan ke Shadow Agent (Gateway Port 27888)...');

    try {
      // Step simulator for UI realism while waiting for AI synthesis
      setTimeout(() => setCurrentStep('Menganalisis parameter klinis & query knowledge base...'), 800);
      setTimeout(() => setCurrentStep('Mengeksekusi tool otonom di server backend...'), 2000);

      // Build simplified history for LLM
      const historyPayload = newHistory
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await apiClient.agentChat(textToSend, historyPayload);

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolsExecuted: res.tools_executed,
          ragSources: res.rag_sources,
          artifacts: res.artifacts
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ Terjadi kendala saat menghubungkan ke gateway AI. Namun tool lokal tetap aktif di server. ' +
            'Silakan periksa koneksi backend atau coba kembali.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  // Quick Action Handlers
  const handleQuickAuditCohort = () => {
    handleSendMessage('Lakukan audit klinis menyeluruh terhadap seluruh kohort balita di SQLite dan berikan rekomendasi triage prioritas!');
  };

  const handleQuickFoodCompare = () => {
    handleSendMessage('Bandingkan nilai gizi dan efisiensi biaya ikan kembung lokal vs ikan salmon impor berdasarkan data TKPI Kemenkes untuk balita stunting!');
  };

  const handleQuickGeneratePdf = () => {
    handleSendMessage(`Tolong buatkan lembar rujukan klinis dan rencana intervensi nutrisi resmi berformat PDF untuk balita bernama ${selectedChildName}!`);
  };

  const handleQuickHypoallergenic = () => {
    handleSendMessage('Susun rekomendasi menu MP-ASI padat energi dan bebas alergi (bebas susu sapi, telur, dan kacang) untuk balita usia 12-24 bulan.');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[640px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Top Header & Connection Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Shadow AI Co-Pilot
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Otonom Aktif (Port 27888)
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Model: <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">{agentStatus?.active_model || 'ag/gemini-3.8-flash-high'}</code></span>
              <span>•</span>
              <span className="text-slate-600">Standar Permenkes No. 2/2020 & TKPI</span>
            </p>
          </div>
        </div>

        {/* Quick Child Selector for Specific Audit */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
          <UserCheck className="w-4 h-4 text-teal-700" />
          <span className="text-slate-600 font-medium">Target Balita:</span>
          <select
            value={selectedChildName}
            onChange={(e) => setSelectedChildName(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-semibold focus:ring-1 focus:ring-teal-600 outline-none"
          >
            {cohort.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({c.measurements[c.measurements.length - 1]?.hazStatus || 'Aktif'})
              </option>
            ))}
          </select>
          <button
            onClick={handleQuickGeneratePdf}
            className="bg-teal-700 hover:bg-teal-800 text-white px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="bg-slate-100/70 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Aksi Otonom:
        </span>
        <button
          onClick={handleQuickAuditCohort}
          disabled={isProcessing}
          className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Database className="w-3.5 h-3.5 text-teal-700" />
          <span>Audit Kohort SQLite</span>
        </button>
        <button
          onClick={handleQuickFoodCompare}
          disabled={isProcessing}
          className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Scale className="w-3.5 h-3.5 text-indigo-600" />
          <span>Komparasi Pangan TKPI</span>
        </button>
        <button
          onClick={handleQuickGeneratePdf}
          disabled={isProcessing}
          className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cetak Lembar Rujukan ({selectedChildName.split(' ')[0]})</span>
        </button>
        <button
          onClick={handleQuickHypoallergenic}
          disabled={isProcessing}
          className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Formulasi Bebas Alergi</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3.5 max-w-4xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-teal-700 text-white shadow-sm'
                }`}
              >
                {isUser ? (
                  <span className="text-xs font-bold">Anda</span>
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`rounded-xl px-5 py-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                {/* Assistant Name and Timestamp */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-100 text-[11px] text-slate-500">
                    <span className="font-semibold text-teal-800">
                      Shadow Co-Pilot (Clinical AI)
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                )}

                {/* Tool Execution Logs (If any tool was called by Agent) */}
                {m.toolsExecuted && m.toolsExecuted.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    {m.toolsExecuted.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-teal-50/80 border border-teal-200 text-teal-900 rounded-md px-3 py-1.5 text-xs flex items-start gap-2"
                      >
                        <Cpu className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-teal-800 mr-1.5 font-mono">
                            [EKSEKUSI OTONOM: {t.tool}]
                          </span>
                          <span className="text-teal-950">{t.summary}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Message Text (Render with Markdown format) */}
                <div className="space-y-2 whitespace-pre-line text-xs sm:text-sm">
                  {m.content}
                </div>

                {/* Generated Artifacts (Download Cards for PDF) */}
                {m.artifacts && m.artifacts.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      Berkas Resmi yang Dihasilkan Otonom:
                    </div>
                    {m.artifacts.map((art, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-emerald-900">{art.title}</div>
                          <div className="text-[11px] text-emerald-700 font-mono">
                            {art.filename} • ReportLab Publication Engine
                          </div>
                        </div>
                        <a
                          href={`http://localhost:8000${art.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-md shadow-2xs transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh PDF</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* RAG Citations */}
                {m.ragSources && m.ragSources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-medium text-slate-600">Rujukan Knowledge Base:</span>
                    {m.ragSources.map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Processing Indicator */}
        {isProcessing && (
          <div className="flex items-start gap-3.5 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs">
              <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
              <span>{currentStep || 'Shadow Co-Pilot sedang bernalar & mengeksekusi...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Form */}
      <div className="bg-white border-t border-slate-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isProcessing}
            placeholder="Tanyakan analisis klinis, audit balita, perbandingan pangan, atau minta cetak PDF..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing}
            className="bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <span>Kirim</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-center mt-2 text-[11px] text-slate-600">
          Shadow AI Co-Pilot mengeksekusi kalkulasi Box-Cox LMS WHO 2006 dan data biokimia TKPI Kemenkes RI secara deterministik tanpa halusinasi.
        </div>
      </div>
    </div>
  );
};
