'use client';

import Link from 'next/link';
import { AgentAlertItem } from '../types';
import { ExclamationTriangleIcon, InformationCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface AgentAlertsPanelProps {
  alerts: AgentAlertItem[];
  loading: boolean;
}

const severityConfig = {
  high: {
    label: 'Cao',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badgeBg: 'bg-red-100',
    icon: <ShieldExclamationIcon className="w-4 h-4 text-red-500" />,
  },
  medium: {
    label: 'Trung bình',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    icon: <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />,
  },
  info: {
    label: 'Thông tin',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    icon: <InformationCircleIcon className="w-4 h-4 text-blue-500" />,
  },
};

export default function AgentAlertsPanel({ alerts, loading }: AgentAlertsPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">Cảnh báo & gợi ý</h3>
        {!loading && alerts.length > 0 && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
            {alerts.filter((a) => a.severity === 'high').length} cao
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8">
          <InformationCircleIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Không có cảnh báo nào</p>
          <p className="text-xs text-slate-300 mt-1">Mọi thứ đang hoạt động tốt</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((alert) => {
            const sc = severityConfig[alert.severity];
            return (
              <div key={alert.id} className={`p-3.5 rounded-xl border ${sc.bg} ${sc.border}`}>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5">{sc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${sc.color}`}>{alert.title}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.badgeBg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</p>
                    <Link
                      href={alert.relatedRoute}
                      className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-lg border ${sc.border} ${sc.color} hover:opacity-80 transition-opacity`}
                    >
                      {alert.actionLabel} →
                    </Link>
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
