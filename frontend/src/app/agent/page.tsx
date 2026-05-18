'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  AgentConversationItem,
  AutomationItem,
  AgentAlertItem,
  AgentTaskHistoryItem,
  QuickActionItem,
  WorkflowTemplateItem,
  AgentOverview,
} from './types';
import {
  getAgentOverview,
  getAgentConversations,
  getQuickActions,
  getAutomations,
  getAgentAlerts,
  getTaskHistory,
  getWorkflowTemplates,
} from './agentService';
import AgentSummaryCards from './components/AgentSummaryCards';
import AgentChatPanel from './components/AgentChatPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import AutomationList from './components/AutomationList';
import AutomationFormModal from './components/AutomationFormModal';
import AgentAlertsPanel from './components/AgentAlertsPanel';
import AgentTaskHistoryTable from './components/AgentTaskHistoryTable';
import AgentCapabilitiesSection from './components/AgentCapabilitiesSection';
import WorkflowTemplatesSection from './components/WorkflowTemplatesSection';
import {
  SparklesIcon,
  BoltIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white flex items-center gap-2 ${
            t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {t.type === 'success' ? '✓' : '✕'} {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-base font-semibold text-slate-700">Không thể tải dữ liệu</p>
      <p className="text-sm text-slate-500 mt-1 mb-4">Đã có lỗi xảy ra khi tải dữ liệu AI Agent</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-medium"
      >
        <ArrowPathIcon className="w-4 h-4" />
        Thử lại
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const [overview, setOverview] = useState<AgentOverview | null>(null);
  const [conversations, setConversations] = useState<AgentConversationItem[]>([]);
  const [quickActions, setQuickActions] = useState<QuickActionItem[]>([]);
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [alerts, setAlerts] = useState<AgentAlertItem[]>([]);
  const [taskHistory, setTaskHistory] = useState<AgentTaskHistoryItem[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplateItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [automationModalOpen, setAutomationModalOpen] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [ov, convs, qa, autos, als, hist, wfs] = await Promise.all([
        getAgentOverview(),
        getAgentConversations(),
        getQuickActions(),
        getAutomations(),
        getAgentAlerts(),
        getTaskHistory(),
        getWorkflowTemplates(),
      ]);
      setOverview(ov);
      setConversations(convs);
      setQuickActions(qa);
      setAutomations(autos);
      setAlerts(als);
      setTaskHistory(hist);
      setWorkflowTemplates(wfs);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleQuickActionClick = (prompt: string) => {
    const chatEl = document.getElementById('agent-chat-panel');
    if (chatEl) chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const userMsg: AgentConversationItem = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString(),
      messageType: 'text',
    };
    setConversations((prev) => [...prev, userMsg]);
  };

  const handleUseTemplate = (template: WorkflowTemplateItem) => {
    setAutomationModalOpen(true);
  };

  if (error) {
    return (
      <AppLayout>
        <ErrorState onRetry={loadAll} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Outer wrapper: full width, no overflow issues */}
      <div className="w-full min-w-0 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-900">AI Agent</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Trợ lý AI hỗ trợ quản lý và tự động hóa vận hành nhà trọ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Đang hoạt động
              </span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Kết nối mock
              </span>
              {overview && (
                <span className="text-xs text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full font-medium">
                  {overview.runningAutomations} automation đang chạy
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={() => setAutomationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
            >
              <BoltIcon className="w-4 h-4" />
              Tạo automation
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('task-history-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ClockIcon className="w-4 h-4" />
              Xem lịch sử
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              <Cog6ToothIcon className="w-4 h-4" />
              Cài đặt agent
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <AgentSummaryCards overview={overview} loading={loading} />

        {/* ── Two-column workspace ──
            Use CSS grid with explicit column sizing.
            Both columns get min-w-0 to prevent overflow blowout.
        ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-5 min-w-0 w-full" id="agent-chat-panel">
            <AgentChatPanel
              conversations={conversations}
              loading={loading}
              onConversationsUpdate={setConversations}
            />
            <QuickActionsPanel
              actions={quickActions}
              loading={loading}
              onActionClick={handleQuickActionClick}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5 min-w-0 w-full">
            <AgentAlertsPanel alerts={alerts} loading={loading} />
            <AutomationList
              automations={automations}
              loading={loading}
              onUpdate={setAutomations}
              onCreateClick={() => setAutomationModalOpen(true)}
              onToast={showToast}
            />
          </div>
        </div>

        {/* ── Task History ── */}
        <div id="task-history-section" className="w-full min-w-0">
          <AgentTaskHistoryTable tasks={taskHistory} loading={loading} />
        </div>

        {/* ── Capabilities ── */}
        <div className="w-full min-w-0">
          <AgentCapabilitiesSection />
        </div>

        {/* ── Workflow Templates ── */}
        <div className="w-full min-w-0">
          <WorkflowTemplatesSection
            templates={workflowTemplates}
            loading={loading}
            onUseTemplate={handleUseTemplate}
          />
        </div>
      </div>

      {/* ── Automation Modal ── */}
      <AutomationFormModal
        open={automationModalOpen}
        onClose={() => setAutomationModalOpen(false)}
        onCreated={(item) => {
          setAutomations((prev) => [...prev, item]);
          if (overview) {
            setOverview({
              ...overview,
              runningAutomations: overview.runningAutomations + (item.isEnabled ? 1 : 0),
            });
          }
        }}
        onToast={showToast}
      />

      <ToastContainer toasts={toasts} />
    </AppLayout>
  );
}
