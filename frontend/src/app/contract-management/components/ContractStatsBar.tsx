'use client';

import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Contract } from '@/lib/mockData';

interface ContractStatsBarProps {
  contracts: Contract[];
}

export default function ContractStatsBar({ contracts }: ContractStatsBarProps) {
  const active = contracts.filter(c => c.status === 'Đang hiệu lực').length;
  const expiring = contracts.filter(c => c.status === 'Sắp hết hạn').length;
  const expired = contracts.filter(c => c.status === 'Đã hết hạn').length;
  const terminated = contracts.filter(c => c.status === 'Đã chấm dứt').length;
  const critical = contracts.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry <= 7).length;

  const stats = [
    { label: 'Đang hiệu lực', value: active, icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Sắp hết hạn', value: expiring, icon: <ClockIcon className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Đã hết hạn', value: expired, icon: <XCircleIcon className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { label: 'Đã chấm dứt', value: terminated, icon: <DocumentTextIcon className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
    { label: 'Khẩn cấp (≤7 ngày)', value: critical, icon: <ExclamationTriangleIcon className="w-4 h-4" />, color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {stats.map(stat => (
        <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stat.bg} shadow-card`}>
          <span className={stat.color}>{stat.icon}</span>
          <div>
            <p className={`text-lg font-bold font-tabular leading-none ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}