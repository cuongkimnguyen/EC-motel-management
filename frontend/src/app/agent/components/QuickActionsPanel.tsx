'use client';

import { QuickActionItem } from '../types';
import { BoltIcon } from '@heroicons/react/24/outline';

interface QuickActionsPanelProps {
  actions: QuickActionItem[];
  loading: boolean;
  onActionClick: (prompt: string) => void;
}

export default function QuickActionsPanel({ actions, loading, onActionClick }: QuickActionsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="h-5 bg-slate-200 rounded w-40 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BoltIcon className="w-5 h-5 text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-900">AI đề xuất hành động</h3>
        <span className="text-xs text-slate-400 ml-1">Thao tác nhanh</span>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-8">
          <BoltIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Chưa có hành động nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <div
              key={action.id}
              className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all group overflow-hidden"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-xl flex-shrink-0 leading-none mt-0.5">{action.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors leading-snug line-clamp-1">
                    {action.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => action.prompt && onActionClick(action.prompt)}
                className="w-full text-xs py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Chạy ngay
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
