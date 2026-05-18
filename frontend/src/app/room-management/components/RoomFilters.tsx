'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface RoomFilterState {
  search: string;
  status: string;
  block: string;
  floor: string;
  priceMin: string;
  priceMax: string;
}

interface RoomFiltersProps {
  filters: RoomFilterState;
  onChange: (filters: RoomFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions = ['', 'Trống', 'Đang thuê', 'Đã đặt', 'Bảo trì'];
const blockOptions = ['', 'Khu A', 'Khu B', 'Khu C'];
const floorOptions = ['', 'Tầng 1', 'Tầng 2', 'Tầng 3'];

export default function RoomFilters({ filters, onChange, totalCount, filteredCount }: RoomFiltersProps) {
  const hasActiveFilters = filters.status || filters.block || filters.floor || filters.priceMin || filters.priceMax || filters.search;

  const clearAll = () => onChange({ search: '', status: '', block: '', floor: '', priceMin: '', priceMax: '' });

  const update = (key: keyof RoomFilterState, value: string) => onChange({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm mã phòng, tên phòng, khách thuê..."
            value={filters.search}
            onChange={e => update('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-400 text-slate-900"
          />
          {filters.search && (
            <button onClick={() => update('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status */}
        <select
          value={filters.status}
          onChange={e => update('status', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-700 min-w-[130px]"
        >
          <option value="">Tất cả trạng thái</option>
          {statusOptions.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Block */}
        <select
          value={filters.block}
          onChange={e => update('block', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-700 min-w-[110px]"
        >
          <option value="">Tất cả khu</option>
          {blockOptions.filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Floor */}
        <select
          value={filters.floor}
          onChange={e => update('floor', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-700 min-w-[110px]"
        >
          <option value="">Tất cả tầng</option>
          {floorOptions.filter(Boolean).map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Giá từ"
            value={filters.priceMin}
            onChange={e => update('priceMin', e.target.value)}
            className="w-24 px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-400 text-slate-700"
          />
          <span className="text-slate-400 text-sm">—</span>
          <input
            type="number"
            placeholder="đến"
            value={filters.priceMax}
            onChange={e => update('priceMax', e.target.value)}
            className="w-24 px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Clear + count */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Hiển thị <span className="font-semibold text-slate-700">{filteredCount}</span>/{totalCount} phòng
          </span>
          {hasActiveFilters && (
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