'use client';

import { useState } from 'react';
import { PencilSquareIcon, TrashIcon, ArrowPathIcon, XCircleIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, PhoneIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Contract, formatDate } from '@/lib/mockData';
import { ContractStatusBadge } from '@/components/ui/StatusBadge';

interface ContractTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onRenew: (contract: Contract) => void;
  onTerminate: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  selectedIds: string[];
  onSelectId: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}

type SortKey = 'code' | 'roomCode' | 'tenantName' | 'startDate' | 'endDate' | 'monthlyRent' | 'status' | 'daysUntilExpiry';
type SortDir = 'asc' | 'desc';

export default function ContractTable({
  contracts, onEdit, onRenew, onTerminate, onDelete,
  selectedIds, onSelectId, onSelectAll
}: ContractTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...contracts].sort((a, b) => {
    let av: any = a[sortKey];
    let bv: any = b[sortKey];
    if (av === null) av = 9999;
    if (bv === null) bv = 9999;
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowsUpDownIcon className="w-3 h-3 text-slate-300 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ArrowUpIcon className="w-3 h-3 text-teal-600 ml-1 inline" />
      : <ArrowDownIcon className="w-3 h-3 text-teal-600 ml-1 inline" />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap";
  const thSortClass = `${thClass} cursor-pointer hover:text-slate-700 select-none`;

  const allIds = contracts.map(c => c.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
  const someSelected = allIds.some(id => selectedIds.includes(id)) && !allSelected;

  const getRowHighlight = (contract: Contract) => {
    if (contract.daysUntilExpiry !== null && contract.daysUntilExpiry <= 7) return 'bg-red-50/60 border-l-2 border-l-red-400';
    if (contract.daysUntilExpiry !== null && contract.daysUntilExpiry <= 15) return 'bg-amber-50/60 border-l-2 border-l-amber-400';
    if (contract.status === 'Đã hết hạn') return 'opacity-70';
    if (contract.status === 'Đã chấm dứt') return 'opacity-60 bg-slate-50';
    return '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={() => allSelected ? onSelectAll([]) : onSelectAll(allIds)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              <th className={thSortClass} onClick={() => handleSort('code')}>
                Mã HĐ <SortIcon col="code" />
              </th>
              <th className={thSortClass} onClick={() => handleSort('roomCode')}>
                Phòng <SortIcon col="roomCode" />
              </th>
              <th className={thSortClass} onClick={() => handleSort('tenantName')}>
                Khách thuê <SortIcon col="tenantName" />
              </th>
              <th className={thClass}>SĐT / CCCD</th>
              <th className={thSortClass} onClick={() => handleSort('startDate')}>
                Ngày bắt đầu <SortIcon col="startDate" />
              </th>
              <th className={thSortClass} onClick={() => handleSort('endDate')}>
                Ngày kết thúc <SortIcon col="endDate" />
              </th>
              <th className={thSortClass} onClick={() => handleSort('monthlyRent')}>
                Tiền thuê <SortIcon col="monthlyRent" />
              </th>
              <th className={thClass}>Tiền cọc</th>
              <th className={thSortClass} onClick={() => handleSort('status')}>
                Trạng thái <SortIcon col="status" />
              </th>
              <th className={thClass + ' text-right'}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <DocumentTextIcon className="w-9 h-9 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Không tìm thấy hợp đồng nào</p>
                    <p className="text-xs">Thử thay đổi bộ lọc hoặc tạo hợp đồng mới</p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((contract) => {
                const isSelected = selectedIds.includes(contract.id);
                const isActive = contract.status === 'Đang hiệu lực' || contract.status === 'Sắp hết hạn';
                return (
                  <tr key={contract.id} className={`group hover:bg-slate-50 transition-colors ${getRowHighlight(contract)} ${isSelected ? 'bg-teal-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectId(contract.id)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-teal-700">{contract.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{contract.roomCode}</div>
                      <div className="text-xs text-slate-400">{contract.roomName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{contract.tenantName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <PhoneIcon className="w-3 h-3 text-slate-400" />
                        {contract.tenantPhone}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{contract.tenantCCCD}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-tabular text-slate-700">{formatDate(contract.startDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-tabular ${
                        contract.daysUntilExpiry !== null && contract.daysUntilExpiry <= 7 ? 'text-red-600 font-semibold' :
                        contract.daysUntilExpiry !== null && contract.daysUntilExpiry <= 30 ? 'text-amber-600 font-medium': 'text-slate-700'
                      }`}>
                        {formatDate(contract.endDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-tabular font-semibold text-slate-900">
                        {(contract.monthlyRent / 1000000).toFixed(1)}tr
                      </span>
                      <span className="text-xs text-slate-400">/tháng</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-tabular text-slate-700">
                        {(contract.deposit / 1000000).toFixed(0)}tr
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ContractStatusBadge status={contract.status} daysUntilExpiry={contract.daysUntilExpiry} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(contract)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Chỉnh sửa hợp đồng"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        {isActive && (
                          <button
                            onClick={() => onRenew(contract)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                            title="Gia hạn hợp đồng"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => onTerminate(contract)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Chấm dứt hợp đồng trước hạn"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(contract)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa hợp đồng — không thể hoàn tác"
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
            Hiển thị <span className="font-semibold text-slate-700">{sorted.length}</span> hợp đồng
          </span>
          <select className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
            <option>20 / trang</option>
            <option>50 / trang</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 text-xs font-medium rounded-lg bg-teal-600 text-white">1</button>
        </div>
      </div>
    </div>
  );
}