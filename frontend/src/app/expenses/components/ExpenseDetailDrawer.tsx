'use client';

import { Expense } from '../types';
import { formatCurrencyVND, formatDateVN, getPaymentStatusColor, getCategoryColor } from '../mockExpenses';
import {
  XMarkIcon, ReceiptPercentIcon, BuildingOfficeIcon, CalendarIcon,
  CreditCardIcon, UserIcon, DocumentTextIcon, PaperClipIcon,
  ArrowPathIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ExpenseDetailDrawerProps {
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onMarkPaid: (expense: Expense) => void;
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-800 flex-1 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

export default function ExpenseDetailDrawer({ expense, onClose, onEdit, onMarkPaid }: ExpenseDetailDrawerProps) {
  if (!expense) return null;

  const canMarkPaid =
    expense.paymentStatus === 'Chưa thanh toán' || expense.paymentStatus === 'Chờ xử lý';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Chi tiết khoản chi</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{expense.expenseCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Amount hero */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white">
            <p className="text-xs text-teal-200 mb-1">Số tiền</p>
            <p className="text-3xl font-bold">{formatCurrencyVND(expense.amount)}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white`}>
                {expense.paymentStatus}
              </span>
              {expense.isRecurring && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white flex items-center gap-1">
                  <ArrowPathIcon className="w-2.5 h-2.5" />
                  Định kỳ
                </span>
              )}
            </div>
          </div>

          {/* Main info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-2">Thông tin chính</p>
            <InfoRow label="Tên khoản chi" value={expense.title} />
            <InfoRow
              label="Danh mục"
              value={
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(expense.category)}`}>
                  {expense.category}
                </span>
              }
            />
            <InfoRow label="Ngày chi" value={
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                {formatDateVN(expense.expenseDate)}
              </span>
            } />
            <InfoRow label="Trạng thái" value={
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPaymentStatusColor(expense.paymentStatus)}`}>
                {expense.paymentStatus}
              </span>
            } />
            <InfoRow label="Phương thức" value={
              <span className="flex items-center gap-1.5">
                <CreditCardIcon className="w-3.5 h-3.5 text-slate-400" />
                {expense.paymentMethod}
              </span>
            } />
            <InfoRow label="Khu / Tòa nhà" value={
              <span className="flex items-center gap-1.5">
                <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-400" />
                {expense.buildingName}
              </span>
            } />
          </div>

          {/* Additional info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-2">Thông tin bổ sung</p>
            {expense.note && (
              <InfoRow label="Ghi chú" value={
                <span className="flex items-start gap-1.5">
                  <DocumentTextIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  {expense.note}
                </span>
              } />
            )}
            <InfoRow label="Số chứng từ" value={
              <span className="flex items-center gap-1.5">
                <PaperClipIcon className="w-3.5 h-3.5 text-slate-400" />
                {expense.attachmentCount} tệp đính kèm
              </span>
            } />
            <InfoRow label="Người tạo" value={
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                {expense.createdBy}
              </span>
            } />
            <InfoRow label="Ngày tạo" value={formatDateVN(expense.createdAt)} />
            <InfoRow label="Cập nhật lần cuối" value={formatDateVN(expense.updatedAt)} />
          </div>

          {/* Receipt mock */}
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4 text-center">
            <ReceiptPercentIcon className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Chưa có hóa đơn đính kèm</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          {canMarkPaid && (
            <button
              onClick={() => onMarkPaid(expense)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Đánh dấu đã thanh toán
            </button>
          )}
          <button
            onClick={() => onEdit(expense)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </>
  );
}
