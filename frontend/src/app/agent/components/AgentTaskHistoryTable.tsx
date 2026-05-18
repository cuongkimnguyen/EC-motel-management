'use client';

import { AgentTaskHistoryItem } from '../types';
import { ClipboardDocumentListIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, NoSymbolIcon,  } from '@heroicons/react/24/outline';

interface AgentTaskHistoryTableProps {
  tasks: AgentTaskHistoryItem[];
  loading: boolean;
}

const statusConfig: Record<AgentTaskHistoryItem['status'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  completed: {
    label: 'Hoàn thành',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
  },
  running: {
    label: 'Đang chạy',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />,
  },
  failed: {
    label: 'Thất bại',
    color: 'text-red-700',
    bg: 'bg-red-100',
    icon: <XCircleIcon className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    icon: <NoSymbolIcon className="w-3.5 h-3.5" />,
  },
};

const taskTypeLabels: Record<AgentTaskHistoryItem['taskType'], string> = {
  ai_summary: 'AI Tóm tắt',
  automation: 'Automation',
  ai_generated: 'AI Tạo nội dung',
  scan: 'Quét dữ liệu',
  digest: 'Tổng hợp',
};

const triggerLabels: Record<AgentTaskHistoryItem['triggerSource'], string> = {
  manual: 'Thủ công',
  automation: 'Automation',
  ai_suggestion: 'AI gợi ý',
  schedule: 'Lịch trình',
};

const moduleLabels: Record<string, string> = {
  rooms: '🏠 Phòng',
  contracts: '📋 Hợp đồng',
  tenants: '👤 Khách thuê',
  expenses: '💰 Chi phí',
  reports: '📊 Báo cáo',
  posts: '📢 Bài đăng',
  general: '⚙️ Chung',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AgentTaskHistoryTable({ tasks, loading }: AgentTaskHistoryTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardDocumentListIcon className="w-5 h-5 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-900">Lịch sử tác vụ</h3>
        {!loading && (
          <span className="ml-auto text-xs text-slate-400">{tasks.length} tác vụ gần đây</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10">
          <ClipboardDocumentListIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Chưa có tác vụ nào</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-slate-500 font-semibold py-2.5 px-3">Thời gian</th>
                  <th className="text-left text-slate-500 font-semibold py-2.5 px-3">Tên tác vụ</th>
                  <th className="text-left text-slate-500 font-semibold py-2.5 px-3">Loại</th>
                  <th className="text-left text-slate-500 font-semibold py-2.5 px-3">Nguồn</th>
                  <th className="text-left text-slate-500 font-semibold py-2.5 px-3">Kết quả</th>
                  <th className="text-left text-slate-500 font-semibold py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.map((task) => {
                  const sc = statusConfig[task.status];
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDateTime(task.createdAt)}</td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800 truncate">{task.name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{moduleLabels[task.module]}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{taskTypeLabels[task.taskType]}</td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{triggerLabels[task.triggerSource]}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <p className="truncate text-xs" title={task.resultSummary}>{task.resultSummary}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${sc.bg} ${sc.color}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2.5">
            {tasks.map((task) => {
              const sc = statusConfig[task.status];
              return (
                <div key={task.id} className="border border-slate-100 rounded-xl p-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-slate-800 leading-snug flex-1 min-w-0 truncate">{task.name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] flex-shrink-0 ${sc.bg} ${sc.color}`}>
                      {sc.icon}
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">{task.resultSummary}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] text-slate-400">{formatDateTime(task.createdAt)}</span>
                    <span className="text-[10px] text-slate-400">{taskTypeLabels[task.taskType]}</span>
                    <span className="text-[10px] text-slate-400">{moduleLabels[task.module]}</span>
                    <span className="text-[10px] text-slate-400">{triggerLabels[task.triggerSource]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
