'use client';

import { useState } from 'react';
import {
  PencilIcon, TrashIcon, EyeIcon,
  ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon,
  BoltIcon, BeakerIcon, UsersIcon
} from '@heroicons/react/24/outline';
import { Room } from '@/lib/mockData';
import { RoomStatusBadge } from '@/components/ui/StatusBadge';


interface RoomTableProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  selectedIds: string[];
  onSelectId: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}

type SortKey = 'code' | 'floor' | 'area' | 'rentPrice' | 'currentTenants' | 'status';
type SortDir = 'asc' | 'desc';

export default function RoomTable({ rooms, onEdit, onDelete, selectedIds, onSelectId, onSelectAll }: RoomTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...rooms].sort((a, b) => {
    let av: unknown = a[sortKey];
    let bv: unknown = b[sortKey];
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUpDownIcon className="w-3.5 h-3.5 text-slate-300 ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUpIcon className="w-3.5 h-3.5 text-teal-600 ml-1" />
      : <ChevronDownIcon className="w-3.5 h-3.5 text-teal-600 ml-1" />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap";
  const thSortClass = `${thClass} cursor-pointer hover:text-slate-700 select-none`;

  const allCurrentIds = rooms.map(r => r.id);
  const allSelected = allCurrentIds.length > 0 && allCurrentIds.every(id => selectedIds.includes(id));
  const someSelected = allCurrentIds.some(id => selectedIds.includes(id)) && !allSelected;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={() => allSelected ? onSelectAll([]) : onSelectAll(allCurrentIds)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              <th className={thSortClass} onClick={() => handleSort('code')}>
                <span className="flex items-center">Mã phòng <SortIcon col="code" /></span>
              </th>
              <th className={thClass}>Tên phòng</th>
              <th className={thSortClass} onClick={() => handleSort('floor')}>
                <span className="flex items-center">Tầng / Khu <SortIcon col="floor" /></span>
              </th>
              <th className={thSortClass} onClick={() => handleSort('area')}>
                <span className="flex items-center">Diện tích <SortIcon col="area" /></span>
              </th>
              <th className={thSortClass} onClick={() => handleSort('rentPrice')}>
                <span className="flex items-center">Giá thuê <SortIcon col="rentPrice" /></span>
              </th>
              <th className={thClass}>Điện / Nước</th>
              <th className={thClass}>Phí DV</th>
              <th className={thSortClass} onClick={() => handleSort('currentTenants')}>
                <span className="flex items-center">Người ở <SortIcon col="currentTenants" /></span>
              </th>
              <th className={thSortClass} onClick={() => handleSort('status')}>
                <span className="flex items-center">Trạng thái <SortIcon col="status" /></span>
              </th>
              <th className={thClass + ' text-right'}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <span className="text-4xl">🏠</span>
                    <p className="text-sm font-medium text-slate-600">Không tìm thấy phòng nào</p>
                    <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((room) => {
                const isSelected = selectedIds.includes(room.id);
                const isVacant = room.status === 'Trống';
                return (
                  <tr
                    key={room.id}
                    className={`
                      group hover:bg-slate-50 transition-colors
                      ${isSelected ? 'bg-teal-50/50' : ''}
                      ${isVacant ? 'border-l-2 border-l-amber-400' : ''}
                    `}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectId(room.id)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-teal-700">{room.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-900">{room.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">{room.floor}</div>
                      <div className="text-xs text-slate-400">{room.block}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-tabular text-slate-700">{room.area}m²</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-tabular font-semibold text-slate-900">
                        {(room.rentPrice / 1000000).toFixed(1)}tr
                      </span>
                      <span className="text-xs text-slate-400">/tháng</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <BoltIcon className="w-3 h-3 text-amber-500" />
                        <span className="font-tabular">{room.electricityPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                        <BeakerIcon className="w-3 h-3 text-blue-500" />
                        <span className="font-tabular">{room.waterPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-tabular text-slate-700">
                        {room.serviceFee > 0 ? `${(room.serviceFee / 1000).toFixed(0)}k` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className={`text-sm font-tabular font-medium ${
                          room.currentTenants === 0 ? 'text-slate-400' : 'text-slate-900'
                        }`}>
                          {room.currentTenants}/{room.maxTenants}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoomStatusBadge status={room.status} />
                      {isVacant && !room.hasActivePost && (
                        <div className="text-[10px] text-red-500 mt-0.5 font-medium">⚠ Chưa có bài đăng</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                          onClick={() => {}}
                          title="Xem chi tiết phòng"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          onClick={() => onEdit(room)}
                          title="Chỉnh sửa thông tin phòng"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          onClick={() => onDelete(room)}
                          title="Xóa phòng — không thể hoàn tác"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Hiển thị <span className="font-semibold text-slate-700">{sorted.length}</span> phòng
          </span>
          <select className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
            <option>20 / trang</option>
            <option>50 / trang</option>
            <option>100 / trang</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          {[1].map(p => (
            <button key={p} className="w-7 h-7 text-xs font-medium rounded-lg bg-teal-600 text-white">
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}