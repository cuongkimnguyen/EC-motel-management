'use client';

import { FinancialReport } from '../types';
import { formatCurrencyVND } from '../mockReportData';
import {
  CurrencyDollarIcon, CheckCircleIcon, ClockIcon,
  ArrowTrendingDownIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface FinancialSummarySectionProps {
  data: FinancialReport;
  loading: boolean;
}

function FinancialRow({
  label, value, icon, color, valueColor,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${valueColor || 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

export default function FinancialSummarySection({ data, loading }: FinancialSummarySectionProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-40 mb-4" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded mb-2" />)}
      </div>
    );
  }

  const collectionRate = data.expectedRent > 0
    ? ((data.collectedRent / data.expectedRent) * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Báo cáo tài chính</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tổng hợp thu chi trong kỳ</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Tỷ lệ thu</p>
          <p className="text-lg font-bold text-teal-600">{collectionRate}%</p>
        </div>
      </div>

      {/* Collection progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Đã thu / Dự kiến</span>
          <span>{formatCurrencyVND(data.collectedRent)} / {formatCurrencyVND(data.expectedRent)}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full"
            style={{ width: `${Math.min(100, parseFloat(collectionRate))}%` }}
          />
        </div>
      </div>

      <FinancialRow label="Tổng tiền thuê dự kiến" value={formatCurrencyVND(data.expectedRent)} icon={<CurrencyDollarIcon className="w-4 h-4 text-slate-500" />} color="bg-slate-50" />
      <FinancialRow label="Tổng tiền đã thu" value={formatCurrencyVND(data.collectedRent)} icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />} color="bg-emerald-50" valueColor="text-emerald-700" />
      <FinancialRow label="Tổng tiền chưa thu" value={formatCurrencyVND(data.uncollectedRent)} icon={<ClockIcon className="w-4 h-4 text-amber-600" />} color="bg-amber-50" valueColor="text-amber-700" />
      <FinancialRow label="Tổng chi phí" value={formatCurrencyVND(data.totalExpense)} icon={<ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />} color="bg-red-50" valueColor="text-red-600" />
      <FinancialRow label="Lợi nhuận ước tính" value={formatCurrencyVND(data.estimatedProfit)} icon={<ArrowTrendingUpIcon className="w-4 h-4 text-indigo-600" />} color="bg-indigo-50" valueColor="text-indigo-700" />
    </div>
  );
}
