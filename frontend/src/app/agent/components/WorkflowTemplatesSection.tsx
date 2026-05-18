'use client';

import { WorkflowTemplateItem } from '../types';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface WorkflowTemplatesSectionProps {
  templates: WorkflowTemplateItem[];
  loading: boolean;
  onUseTemplate: (template: WorkflowTemplateItem) => void;
}

const moduleEmoji: Record<string, string> = {
  rooms: '🏠',
  contracts: '📋',
  tenants: '👤',
  expenses: '💰',
  reports: '📊',
  posts: '📢',
  general: '⚙️',
};

export default function WorkflowTemplatesSection({ templates, loading, onUseTemplate }: WorkflowTemplatesSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowPathIcon className="w-5 h-5 text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-900">Mẫu workflow AI</h3>
        <span className="text-xs text-slate-400 ml-1">Quy trình gợi ý sẵn sàng sử dụng</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-10">
          <ArrowPathIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Chưa có mẫu workflow nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xl">{moduleEmoji[tpl.module]}</span>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors leading-tight">
                  {tpl.name}
                </p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{tpl.description}</p>
              <div className="space-y-1 mb-3">
                <p className="text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600">Trigger:</span> {tpl.trigger}
                </p>
                <p className="text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600">Kết quả:</span> {tpl.outcome}
                </p>
                <p className="text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-600">Thời gian:</span> {tpl.estimatedTime}
                </p>
              </div>
              <button
                onClick={() => onUseTemplate(tpl)}
                className="w-full text-xs py-1.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors font-medium"
              >
                Dùng mẫu này
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
