'use client';

import { ExpenseFilters, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_STATUSES, BUILDINGS } from '../types';
import { MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ExpenseFilterBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function ExpenseFilterBar({ filters, onChange, onApply, onReset }: ExpenseFilterBarProps) {
  const set = (key: keyof ExpenseFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã, ghi chú..."
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          />
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all min-w-[160px]"
        >
          <option value="">Tất cả danh mục</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Payment status */}
        <select
          value={filters.paymentStatus}
          onChange={(e) => set('paymentStatus', e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all min-w-[160px]"
        >
          <option value="">Tất cả trạng thái</option>
          {EXPENSE_PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Building */}
        <select
          value={filters.buildingName}
          onChange={(e) => set('buildingName', e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all min-w-[130px]"
        >
          {BUILDINGS.map((b) => (
            <option key={b} value={b === 'Tất cả' ? '' : b}>{b}</option>
          ))}
        </select>

        {/* From date */}
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => set('fromDate', e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          title="Từ ngày"
        />

        {/* To date */}
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => set('toDate', e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
          title="Đến ngày"
        />

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Đặt lại
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
          >
            <FunnelIcon className="w-3.5 h-3.5" />
            Lọc
          </button>
        </div>
      </div>
    </div>
  );
}
