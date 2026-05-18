'use client';

import { useState } from 'react';
import { TenantDebtItem, DebtStatus } from '../types';
import { formatCurrencyVND } from '../mockReportData';
import { ChevronLeftIcon, ChevronRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface TenantDebtTableProps {
  data: TenantDebtItem[];
  loading: boolean;
}

const PAGE_SIZE = 5;

function DebtStatusBadge({ status }: { status: DebtStatus }) {
  const styles: Record<DebtStatus, string> = {
    'Đúng hạn': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Sắp đến hạn': 'bg-amber-50 text-amber-700 border-amber-200',
    'Quá hạn': 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex gap-4 py-3 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export default function TenantDebtTable({ data, loading }: TenantDebtTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="h-5 bg-slate-200 rounded w-44 mb-4 animate-pulse" />
        <TableSkeleton />
      </div>
    );
  }

  const hasDebt = data.some(d => d.amountRemaining > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Báo cáo công nợ khách thuê</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tình trạng thanh toán của từng khách thuê</p>
        </div>
        {hasDebt && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            <ExclamationCircleIcon className="w-3.5 h-3.5" />
            Có công nợ cần xử lý
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ExclamationCircleIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Không có công nợ</p>
          <p className="text-xs text-slate-400 mt-1">Tất cả khách thuê đã thanh toán đầy đủ</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Khách thuê', 'Phòng', 'Kỳ thanh toán', 'Phải thu', 'Đã trả', 'Còn nợ', 'Trạng thái'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-slate-800 whitespace-nowrap">{row.tenantName}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-600 whitespace-nowrap">{row.roomName}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-600 whitespace-nowrap">{row.billingPeriod}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-slate-800 whitespace-nowrap font-tabular">{formatCurrencyVND(row.amountDue)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-emerald-700 whitespace-nowrap font-tabular">{formatCurrencyVND(row.amountPaid)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-sm font-semibold whitespace-nowrap font-tabular ${row.amountRemaining > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {row.amountRemaining > 0 ? formatCurrencyVND(row.amountRemaining) : '—'}
                      </span>
                    </td>
                    <td className="py-3">
                      <DebtStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} / {data.length} bản ghi
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      p === page ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
