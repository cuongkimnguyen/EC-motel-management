'use client';

import { useState, useEffect } from 'react';
import { Expense, ExpenseFormData, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_STATUSES, EXPENSE_PAYMENT_METHODS, BUILDINGS } from '../types';
import { XMarkIcon, ArrowPathIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface ExpenseFormModalProps {
  open: boolean;
  expense?: Expense | null;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

const EMPTY_FORM: ExpenseFormData = {
  title: '',
  category: '',
  amount: '',
  expenseDate: new Date().toISOString().split('T')[0],
  paymentStatus: '',
  paymentMethod: '',
  buildingName: 'Khu A',
  note: '',
  isRecurring: false,
};

export default function ExpenseFormModal({ open, expense, onClose, onSubmit }: ExpenseFormModalProps) {
  const [form, setForm] = useState<ExpenseFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (expense) {
        setForm({
          title: expense.title,
          category: expense.category,
          amount: String(expense.amount),
          expenseDate: expense.expenseDate,
          paymentStatus: expense.paymentStatus,
          paymentMethod: expense.paymentMethod,
          buildingName: expense.buildingName,
          note: expense.note,
          isRecurring: expense.isRecurring ?? false,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, expense]);

  const set = (key: keyof ExpenseFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validate(): boolean {
    const e: Partial<Record<keyof ExpenseFormData, string>> = {};
    if (!form.title.trim()) e.title = 'Vui lòng nhập tên khoản chi';
    if (!form.category) e.category = 'Vui lòng chọn danh mục';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Vui lòng nhập số tiền hợp lệ';
    if (!form.expenseDate) e.expenseDate = 'Vui lòng chọn ngày chi';
    if (!form.paymentStatus) e.paymentStatus = 'Vui lòng chọn trạng thái';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const isEdit = !!expense;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Chỉnh sửa khoản chi' : 'Thêm khoản chi mới'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? 'Cập nhật thông tin khoản chi' : 'Điền thông tin để tạo khoản chi mới'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tên khoản chi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="VD: Tiền điện tháng 3 khu A"
              className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all ${errors.title ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all ${errors.category ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              >
                <option value="">Chọn danh mục</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Số tiền (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="VD: 1500000"
                min="0"
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all ${errors.amount ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          </div>

          {/* Date + Payment status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ngày chi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => set('expenseDate', e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all ${errors.expenseDate ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {errors.expenseDate && <p className="text-xs text-red-500 mt-1">{errors.expenseDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                value={form.paymentStatus}
                onChange={(e) => set('paymentStatus', e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all ${errors.paymentStatus ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              >
                <option value="">Chọn trạng thái</option>
                {EXPENSE_PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.paymentStatus && <p className="text-xs text-red-500 mt-1">{errors.paymentStatus}</p>}
            </div>
          </div>

          {/* Payment method + Building */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phương thức thanh toán</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
              >
                <option value="">Chọn phương thức</option>
                {EXPENSE_PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Khu / Tòa nhà</label>
              <select
                value={form.buildingName}
                onChange={(e) => set('buildingName', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
              >
                {BUILDINGS.filter((b) => b !== 'Tất cả').map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú</label>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Mô tả chi tiết khoản chi..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none"
            />
          </div>

          {/* Receipt upload mock */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Chứng từ / Hóa đơn</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-teal-400 transition-colors cursor-pointer">
              <ArrowUpTrayIcon className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">Kéo thả hoặc <span className="text-teal-600 font-medium">chọn file</span></p>
              <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, PDF tối đa 5MB</p>
            </div>
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('isRecurring', !form.isRecurring)}
              className={`w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${form.isRecurring ? 'bg-teal-500' : 'bg-slate-200'}`}
              style={{ height: '22px' }}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Chi phí định kỳ</p>
              <p className="text-xs text-slate-400">Khoản chi lặp lại hàng tháng</p>
            </div>
          </label>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
