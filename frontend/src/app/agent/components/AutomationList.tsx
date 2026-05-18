'use client';

import { useState } from 'react';
import { AutomationItem } from '../types';
import { toggleAutomation, runAutomation, deleteAutomation } from '../agentService';
import { BoltIcon, PlayIcon, TrashIcon, ArrowPathIcon, PlusIcon, ExclamationCircleIcon, ClockIcon,  } from '@heroicons/react/24/outline';

interface AutomationListProps {
  automations: AutomationItem[];
  loading: boolean;
  onUpdate: (items: AutomationItem[]) => void;
  onCreateClick: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const statusConfig: Record<AutomationItem['status'], { label: string; color: string; bg: string }> = {
  active: { label: 'Đang chạy', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  paused: { label: 'Tạm dừng', color: 'text-amber-700', bg: 'bg-amber-100' },
  error: { label: 'Lỗi', color: 'text-red-700', bg: 'bg-red-100' },
  draft: { label: 'Nháp', color: 'text-slate-600', bg: 'bg-slate-100' },
};

const moduleLabels: Record<string, string> = {
  rooms: 'Phòng',
  contracts: 'Hợp đồng',
  tenants: 'Khách thuê',
  expenses: 'Chi phí',
  reports: 'Báo cáo',
  posts: 'Bài đăng',
  general: 'Chung',
};

const frequencyLabels: Record<string, string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  custom: 'Tùy chỉnh',
};

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AutomationList({ automations, loading, onUpdate, onCreateClick, onToast }: AutomationListProps) {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const updated = await toggleAutomation(id);
      onUpdate(automations.map((a) => (a.id === id ? updated : a)));
      onToast(updated.isEnabled ? 'Đã bật automation' : 'Đã tắt automation');
    } catch {
      onToast('Không thể thay đổi trạng thái', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await runAutomation(id);
      onToast('Đã chạy thử automation thành công');
    } catch {
      onToast('Chạy thử thất bại', 'error');
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa automation này không?')) return;
    setDeletingId(id);
    try {
      await deleteAutomation(id);
      onUpdate(automations.filter((a) => a.id !== id));
      onToast('Đã xóa automation');
    } catch {
      onToast('Không thể xóa automation', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Tự động hóa</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-7">Quản lý các quy trình chạy tự động</p>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Tạo automation
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-10">
          <BoltIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Chưa có automation nào</p>
          <p className="text-xs text-slate-400 mt-1">Tạo automation đầu tiên để tự động hóa công việc</p>
          <button
            onClick={onCreateClick}
            className="mt-3 text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Tạo automation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((item) => {
            const sc = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className={`border rounded-xl p-4 transition-all ${
                  item.status === 'error' ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    disabled={togglingId === item.id}
                    className={`flex-shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors relative ${
                      item.isEnabled ? 'bg-teal-500' : 'bg-slate-300'
                    } disabled:opacity-50`}
                    title={item.isEnabled ? 'Tắt automation' : 'Bật automation'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        item.isEnabled ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                      {item.status === 'error' && (
                        <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {frequencyLabels[item.frequency]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Module: <span className="font-medium text-slate-600">{moduleLabels[item.module]}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Lần cuối: <span className="font-medium text-slate-600">{formatDateTime(item.lastRunAt)}</span>
                      </span>
                      {item.nextRunAt && (
                        <span className="text-[10px] text-slate-400">
                          Lần tới: <span className="font-medium text-teal-600">{formatDateTime(item.nextRunAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleRun(item.id)}
                      disabled={runningId === item.id}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Chạy thử"
                    >
                      {runningId === item.id ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Xóa"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
