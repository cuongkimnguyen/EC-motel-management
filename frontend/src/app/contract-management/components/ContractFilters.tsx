'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface ContractFilterState {
  search: string;
  status: string;
  room: string;
  month: string;
}

interface ContractFiltersProps {
  filters: ContractFilterState;
  onChange: (f: ContractFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions = ['', 'Đang hiệu lực', 'Sắp hết hạn', 'Đã hết hạn', 'Đã chấm dứt'];

export default function ContractFilters({ filters, onChange, totalCount, filteredCount }: ContractFiltersProps) {
  const hasActive = filters.search || filters.status || filters.room || filters.month;
  const update = (key: keyof ContractFilterState, value: string) => onChange({ ...filters, [key]: value });
  const clearAll = () => onChange({ search: '', status: '', room: '', month: '' });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm mã HĐ, tên khách, CCCD, phòng..."
            value={filters.search}
            onChange={e => update('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-400 text-slate-900"
          />
          {filters.search && (
            <button onClick={() => update('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <XMarkIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          value={filters.status}
          onChange={e => update('status', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-700 min-w-[160px]"
        >
          <option value="">Tất cả trạng thái</option>
          {statusOptions.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.month}
          onChange={e => update('month', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-700 min-w-[150px]"
        >
          <option value="">Tất cả thời gian</option>
          <option value="2025-03">Tháng 3/2025</option>
          <option value="2025-02">Tháng 2/2025</option>
          <option value="2025-01">Tháng 1/2025</option>
          <option value="2025">Năm 2025</option>
          <option value="2024">Năm 2024</option>
        </select>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Hiển thị <span className="font-semibold text-slate-700">{filteredCount}</span>/{totalCount} hợp đồng
          </span>
          {hasActive && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}