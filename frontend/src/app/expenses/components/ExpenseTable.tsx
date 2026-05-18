'use client';

import { useState, useRef, useEffect } from 'react';
import { Expense } from '../types';
import { formatCurrencyVND, formatDateVN, getPaymentStatusColor, getCategoryColor } from '../mockExpenses';
import {
  EllipsisVerticalIcon, EyeIcon, PencilIcon, CheckCircleIcon,
  TrashIcon, ChevronLeftIcon, ChevronRightIcon, ReceiptPercentIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onMarkPaid: (expense: Expense) => void;
}

const PAGE_SIZE = 10;

function RowMenu({
  expense,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  expense: Expense;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const canMarkPaid =
    expense.paymentStatus === 'Chưa thanh toán' || expense.paymentStatus === 'Chờ xử lý';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <EyeIcon className="w-3.5 h-3.5 text-slate-400" />
            Xem chi tiết
          </button>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <PencilIcon className="w-3.5 h-3.5 text-slate-400" />
            Chỉnh sửa
          </button>
          {canMarkPaid && (
            <button
              onClick={() => { onMarkPaid(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
            >
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
              Đánh dấu đã thanh toán
            </button>
          )}
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <TrashIcon className="w-3.5 h-3.5 text-red-500" />
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <ReceiptPercentIcon className="w-7 h-7 text-slate-400" />
      </div>
      <p className="text-lg font-semibold text-slate-700 mb-1">Chưa có khoản chi nào</p>
      <p className="text-sm text-slate-400 mb-5 max-w-xs">
        Hãy thêm khoản chi đầu tiên để bắt đầu quản lý chi phí vận hành
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors"
        >
          Thêm chi phí
        </button>
      )}
    </div>
  );
}

export default function ExpenseTable({
  expenses,
  loading,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
}: ExpenseTableProps) {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [expenses.length]);

  const totalPages = Math.ceil(expenses.length / PAGE_SIZE);
  const paginated = expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          Danh sách chi phí
          <span className="ml-2 text-xs font-normal text-slate-400">({expenses.length} khoản)</span>
        </p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : expenses.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mã</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tên khoản chi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Danh mục</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Số tiền</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Khu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phương thức</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => onView(expense)}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {expense.expenseCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 line-clamp-1">{expense.title}</p>
                      {expense.isRecurring && (
                        <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">Định kỳ</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatDateVN(expense.expenseDate)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {formatCurrencyVND(expense.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPaymentStatusColor(expense.paymentStatus)}`}>
                        {expense.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <BuildingOfficeIcon className="w-3 h-3 text-slate-400" />
                        {expense.buildingName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{expense.paymentMethod}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        expense={expense}
                        onView={() => onView(expense)}
                        onEdit={() => onEdit(expense)}
                        onDelete={() => onDelete(expense)}
                        onMarkPaid={() => onMarkPaid(expense)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginated.map((expense) => (
              <div
                key={expense.id}
                className="p-4 hover:bg-slate-50 transition-colors"
                onClick={() => onView(expense)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm line-clamp-1">{expense.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{expense.expenseCode} · {formatDateVN(expense.expenseDate)}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowMenu
                      expense={expense}
                      onView={() => onView(expense)}
                      onEdit={() => onEdit(expense)}
                      onDelete={() => onDelete(expense)}
                      onMarkPaid={() => onMarkPaid(expense)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPaymentStatusColor(expense.paymentStatus)}`}>
                    {expense.paymentStatus}
                  </span>
                  <span className="text-xs text-slate-500 ml-auto font-semibold">{formatCurrencyVND(expense.amount)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, expenses.length)} / {expenses.length} khoản
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-teal-600 text-white' :'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
