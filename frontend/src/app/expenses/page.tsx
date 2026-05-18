'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { Expense, ExpenseFilters, ExpenseFormData } from './types';
import { getExpenses, createExpense, updateExpense, deleteExpense, markExpensePaid } from './expenseService';
import ExpenseStats from './components/ExpenseStats';
import ExpenseFilterBar from './components/ExpenseFilterBar';
import ExpenseTable from './components/ExpenseTable';
import ExpenseFormModal from './components/ExpenseFormModal';
import ExpenseDetailDrawer from './components/ExpenseDetailDrawer';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import { PlusIcon, ArrowDownTrayIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white flex items-center gap-2 animate-fade-in ${
            t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {t.type === 'success' ? '✓' : '✕'} {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Default filters ──────────────────────────────────────────────────────────
const DEFAULT_FILTERS: ExpenseFilters = {
  search: '',
  category: '',
  paymentStatus: '',
  buildingName: '',
  fromDate: '',
  toDate: '',
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const fetchExpenses = useCallback(async (f: ExpenseFilters = appliedFilters) => {
    setLoading(true);
    setError(false);
    try {
      const data = await getExpenses(f);
      setExpenses(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchExpenses(DEFAULT_FILTERS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleApplyFilters() {
    setAppliedFilters(filters);
    fetchExpenses(filters);
  }

  function handleResetFilters() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    fetchExpenses(DEFAULT_FILTERS);
  }

  // Watch search changes for live filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      const f = { ...appliedFilters, search: filters.search };
      setAppliedFilters(f);
      fetchExpenses(f);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(data: ExpenseFormData) {
    await createExpense(data);
    showToast('Đã thêm khoản chi thành công');
    fetchExpenses(appliedFilters);
  }

  async function handleEdit(data: ExpenseFormData) {
    if (!editingExpense) return;
    await updateExpense(editingExpense.id, data);
    showToast('Đã cập nhật khoản chi thành công');
    fetchExpenses(appliedFilters);
    if (detailExpense?.id === editingExpense.id) {
      setDetailExpense(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteExpense(deleteTarget.id);
      showToast('Đã xóa khoản chi thành công');
      fetchExpenses(appliedFilters);
      if (detailExpense?.id === deleteTarget.id) setDetailExpense(null);
    } catch {
      showToast('Xóa thất bại, vui lòng thử lại', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleMarkPaid(expense: Expense) {
    try {
      await markExpensePaid(expense.id);
      showToast(`Đã đánh dấu "${expense.title}" là đã thanh toán`);
      fetchExpenses(appliedFilters);
      if (detailExpense?.id === expense.id) setDetailExpense(null);
    } catch {
      showToast('Cập nhật thất bại', 'error');
    }
  }

  function openCreate() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setDetailExpense(null);
    setFormOpen(true);
  }

  return (
    <AppLayout>
      <div className="fade-in space-y-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chi phí</h1>
            <p className="text-sm text-slate-500 mt-0.5">Quản lý các khoản chi vận hành nhà trọ</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất dữ liệu</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm chi phí
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <ExpenseStats expenses={expenses} loading={loading} />

        {/* Filter bar */}
        <ExpenseFilterBar
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {/* Error state */}
        {error && !loading && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">Không thể tải dữ liệu</p>
            <p className="text-sm text-slate-400 mb-4">Đã xảy ra lỗi khi tải danh sách chi phí</p>
            <button
              onClick={() => fetchExpenses(appliedFilters)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors mx-auto"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        {!error && (
          <ExpenseTable
            expenses={expenses}
            loading={loading}
            onView={setDetailExpense}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onMarkPaid={handleMarkPaid}
          />
        )}
      </div>

      {/* Modals & Drawers */}
      <ExpenseFormModal
        open={formOpen}
        expense={editingExpense}
        onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        onSubmit={editingExpense ? handleEdit : handleCreate}
      />

      <ExpenseDetailDrawer
        expense={detailExpense}
        onClose={() => setDetailExpense(null)}
        onEdit={openEdit}
        onMarkPaid={handleMarkPaid}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.title}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      <ToastContainer toasts={toasts} />
    </AppLayout>
  );
}
