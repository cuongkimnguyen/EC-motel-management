'use client';

import { ReportFilters, PeriodType } from '../types';
import { FunnelIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ReportFilterBarProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const QUARTERS = ['Quý 1','Quý 2','Quý 3','Quý 4'];
const YEARS = [2022, 2023, 2024, 2025];
const BUILDINGS = ['Tất cả', 'Khu A', 'Khu B', 'Khu C', 'Khu D'];

export default function ReportFilterBar({ filters, onChange, onApply, onReset }: ReportFilterBarProps) {
  const set = (partial: Partial<ReportFilters>) => onChange({ ...filters, ...partial });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {/* Period type */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-slate-500">Kỳ báo cáo</label>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(['month', 'quarter', 'year'] as PeriodType[]).map((pt) => (
              <button
                key={pt}
                onClick={() => set({ periodType: pt })}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  filters.periodType === pt
                    ? 'bg-teal-600 text-white' :'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pt === 'month' ? 'Tháng' : pt === 'quarter' ? 'Quý' : 'Năm'}
              </button>
            ))}
          </div>
        </div>

        {/* Month selector */}
        {filters.periodType === 'month' && (
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs font-medium text-slate-500">Tháng</label>
            <select
              value={filters.selectedMonth}
              onChange={(e) => set({ selectedMonth: Number(e.target.value) })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quarter selector */}
        {filters.periodType === 'quarter' && (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs font-medium text-slate-500">Quý</label>
            <select
              value={filters.selectedQuarter}
              onChange={(e) => set({ selectedQuarter: Number(e.target.value) })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {QUARTERS.map((q, i) => (
                <option key={i} value={i + 1}>{q}</option>
              ))}
            </select>
          </div>
        )}

        {/* Year selector */}
        <div className="flex flex-col gap-1 min-w-[100px]">
          <label className="text-xs font-medium text-slate-500">Năm</label>
          <select
            value={filters.selectedYear}
            onChange={(e) => set({ selectedYear: Number(e.target.value) })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Building selector */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs font-medium text-slate-500">Khu / Tòa nhà</label>
          <select
            value={filters.buildingId}
            onChange={(e) => set({ buildingId: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {BUILDINGS.map((b) => (
              <option key={b} value={b === 'Tất cả' ? 'all' : b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Compare toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">So sánh</label>
          <button
            onClick={() => set({ compareWithPrevious: !filters.compareWithPrevious })}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors ${
              filters.compareWithPrevious
                ? 'bg-teal-50 border-teal-300 text-teal-700' :'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filters.compareWithPrevious && <CheckIcon className="w-3.5 h-3.5" />}
            So sánh kỳ trước
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-end gap-2 ml-auto">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Đặt lại
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
          >
            <FunnelIcon className="w-3.5 h-3.5" />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
