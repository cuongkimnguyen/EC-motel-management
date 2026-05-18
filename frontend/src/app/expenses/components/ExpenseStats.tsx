'use client';

import { Expense } from '../types';
import { formatCurrencyVND } from '../mockExpenses';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, ExclamationCircleIcon, TagIcon } from '@heroicons/react/24/outline';

interface ExpenseStatsProps {
  expenses: Expense[];
  loading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
        {sub && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            {trend === 'up' && <ArrowTrendingUpIcon className="w-3 h-3 text-red-500" />}
            {trend === 'down' && <ArrowTrendingDownIcon className="w-3 h-3 text-emerald-500" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-slate-200 rounded w-24 mb-2" />
        <div className="h-7 bg-slate-200 rounded w-36 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
    </div>
  );
}

export default function ExpenseStats({ expenses, loading }: ExpenseStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(currentMonth / 3);

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const thisQuarterExpenses = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    return Math.floor(d.getMonth() / 3) === currentQuarter && d.getFullYear() === currentYear;
  });

  const totalMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalQuarter = thisQuarterExpenses.reduce((s, e) => s + e.amount, 0);
  const unpaidCount = expenses.filter(
    (e) => e.paymentStatus === 'Chưa thanh toán' || e.paymentStatus === 'Chờ xử lý'
  ).length;

  // Largest category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const largestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Tổng chi tháng này"
        value={formatCurrencyVND(totalMonth)}
        sub="+12% so với tháng trước"
        trend="up"
        icon={<ArrowTrendingDownIcon className="w-6 h-6 text-blue-600" />}
        iconBg="bg-blue-50"
      />
      <StatCard
        label="Tổng chi quý này"
        value={formatCurrencyVND(totalQuarter)}
        sub={`Q${currentQuarter + 1}/${currentYear}`}
        icon={<ArrowTrendingDownIcon className="w-6 h-6 text-indigo-600" />}
        iconBg="bg-indigo-50"
      />
      <StatCard
        label="Khoản chưa thanh toán"
        value={`${unpaidCount} khoản`}
        sub="Cần xử lý sớm"
        icon={<ExclamationCircleIcon className="w-6 h-6 text-red-500" />}
        iconBg="bg-red-50"
      />
      <StatCard
        label="Nhóm chi phí lớn nhất"
        value={largestCategory}
        sub={largestCategory !== '—' ? formatCurrencyVND(categoryTotals[largestCategory]) : ''}
        icon={<TagIcon className="w-6 h-6 text-teal-600" />}
        iconBg="bg-teal-50"
      />
    </div>
  );
}
