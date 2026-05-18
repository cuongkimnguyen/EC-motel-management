'use client';

import { ReportKPI } from '../types';
import { formatCurrencyVND } from '../mockReportData';
import {
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, CurrencyDollarIcon,
  MinusIcon, PercentBadgeIcon, HomeModernIcon, HomeIcon,
  ExclamationTriangleIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ReportKpiCardsProps {
  kpi: ReportKPI;
  loading: boolean;
}

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  trend,
  trendValue,
  trendLabel,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  trendLabel?: string;
  highlight?: 'success' | 'warning' | 'danger';
}) {
  const highlightBorder = highlight === 'success' ?'border-l-4 border-l-emerald-400'
    : highlight === 'warning' ?'border-l-4 border-l-amber-400'
    : highlight === 'danger' ?'border-l-4 border-l-red-400' :'';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 ${highlightBorder}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium mb-1 truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
        {trendValue !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
          }`}>
            {trend === 'up' && <ArrowTrendingUpIcon className="w-3 h-3" />}
            {trend === 'down' && <ArrowTrendingDownIcon className="w-3 h-3" />}
            {trend === 'neutral' && <MinusIcon className="w-3 h-3" />}
            {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}% {trendLabel || 'so với kỳ trước'}
          </p>
        )}
      </div>
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-slate-200 rounded w-24 mb-2" />
        <div className="h-6 bg-slate-200 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
    </div>
  );
}

export default function ReportKpiCards({ kpi, loading }: ReportKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        label="Tổng doanh thu"
        value={formatCurrencyVND(kpi.totalRevenue)}
        icon={<CurrencyDollarIcon className="w-6 h-6 text-teal-600" />}
        iconBg="bg-teal-50"
        trend={kpi.revenueTrend !== undefined ? (kpi.revenueTrend >= 0 ? 'up' : 'down') : undefined}
        trendValue={kpi.revenueTrend}
        highlight="success"
      />
      <KpiCard
        label="Tổng chi phí"
        value={formatCurrencyVND(kpi.totalExpense)}
        icon={<ArrowTrendingDownIcon className="w-6 h-6 text-red-500" />}
        iconBg="bg-red-50"
        trend={kpi.expenseTrend !== undefined ? (kpi.expenseTrend >= 0 ? 'down' : 'up') : undefined}
        trendValue={kpi.expenseTrend}
        highlight="danger"
      />
      <KpiCard
        label="Lợi nhuận ròng"
        value={formatCurrencyVND(kpi.netProfit)}
        icon={<ArrowTrendingUpIcon className="w-6 h-6 text-indigo-600" />}
        iconBg="bg-indigo-50"
        trend={kpi.profitTrend !== undefined ? (kpi.profitTrend >= 0 ? 'up' : 'down') : undefined}
        trendValue={kpi.profitTrend}
        highlight="success"
      />
      <KpiCard
        label="Tỷ lệ lấp đầy"
        value={`${kpi.occupancyRate}%`}
        icon={<PercentBadgeIcon className="w-6 h-6 text-blue-600" />}
        iconBg="bg-blue-50"
        trend={kpi.occupancyTrend !== undefined ? (kpi.occupancyTrend >= 0 ? 'up' : 'down') : undefined}
        trendValue={kpi.occupancyTrend}
        highlight={kpi.occupancyRate >= 90 ? 'success' : kpi.occupancyRate >= 70 ? 'warning' : 'danger'}
      />
      <KpiCard
        label="Số phòng đang thuê"
        value={`${kpi.occupiedRooms} phòng`}
        icon={<HomeModernIcon className="w-6 h-6 text-emerald-600" />}
        iconBg="bg-emerald-50"
        highlight="success"
      />
      <KpiCard
        label="Số phòng trống"
        value={`${kpi.vacantRooms} phòng`}
        icon={<HomeIcon className="w-6 h-6 text-amber-600" />}
        iconBg="bg-amber-50"
        highlight={kpi.vacantRooms === 0 ? 'success' : kpi.vacantRooms <= 2 ? 'warning' : 'danger'}
      />
      <KpiCard
        label="Tổng công nợ"
        value={formatCurrencyVND(kpi.totalDebt)}
        icon={<ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />}
        iconBg="bg-orange-50"
        highlight={kpi.totalDebt === 0 ? 'success' : kpi.totalDebt > 10000000 ? 'danger' : 'warning'}
      />
      <KpiCard
        label="Hợp đồng sắp hết hạn"
        value={`${kpi.expiringContracts} hợp đồng`}
        icon={<DocumentTextIcon className="w-6 h-6 text-rose-500" />}
        iconBg="bg-rose-50"
        highlight={kpi.expiringContracts === 0 ? 'success' : kpi.expiringContracts >= 3 ? 'danger' : 'warning'}
      />
    </div>
  );
}
