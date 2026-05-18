'use client';

import { AgentOverview } from '../types';
import {
  ClipboardDocumentListIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface AgentSummaryCardsProps {
  overview: AgentOverview | null;
  loading: boolean;
}

const cards = [
  {
    key: 'todayTasks' as keyof AgentOverview,
    label: 'Tác vụ hôm nay',
    unit: 'tác vụ',
    icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    sub: 'Cần xử lý hôm nay',
  },
  {
    key: 'runningAutomations' as keyof AgentOverview,
    label: 'Automation đang chạy',
    unit: 'automation',
    icon: <BoltIcon className="w-6 h-6" />,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    sub: 'Đang hoạt động',
  },
  {
    key: 'pendingAlerts' as keyof AgentOverview,
    label: 'Cảnh báo cần xử lý',
    unit: 'cảnh báo',
    icon: <ExclamationTriangleIcon className="w-6 h-6" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    sub: 'Cần chú ý ngay',
  },
  {
    key: 'aiAssisted' as keyof AgentOverview,
    label: 'Việc AI đã hỗ trợ',
    unit: 'hỗ trợ',
    icon: <SparklesIcon className="w-6 h-6" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    sub: 'Tháng này',
  },
  {
    key: 'overdueTenantsCount' as keyof AgentOverview,
    label: 'Khách thuê quá hạn',
    unit: 'khách',
    icon: <UserGroupIcon className="w-6 h-6" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    sub: 'Chưa thanh toán',
  },
  {
    key: 'expiringContractsCount' as keyof AgentOverview,
    label: 'Hợp đồng sắp hết hạn',
    unit: 'hợp đồng',
    icon: <DocumentTextIcon className="w-6 h-6" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    sub: 'Trong 30 ngày tới',
  },
];

export default function AgentSummaryCards({ overview, loading }: AgentSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-xl mb-3" />
            <div className="h-6 bg-slate-200 rounded w-12 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`bg-white rounded-2xl border ${card.border} p-4 hover:shadow-md transition-shadow`}
        >
          <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color} mb-3`}>
            {card.icon}
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>
            {overview ? overview[card.key] : '—'}
          </p>
          <p className="text-xs font-medium text-slate-700 mt-0.5">{card.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
