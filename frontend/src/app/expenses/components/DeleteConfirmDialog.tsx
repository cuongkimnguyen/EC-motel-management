'use client';

import { ArrowPathIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmDialogProps {
  open: boolean;
  title?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmDialog({
  open,
  title,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <TrashIcon className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 mb-1">Xóa khoản chi</h3>
            <p className="text-sm text-slate-500">
              Bạn có chắc chắn muốn xóa khoản chi{' '}
              {title && <strong className="text-slate-700">"{title}"</strong>} không?
            </p>
            <p className="text-xs text-red-500 mt-1.5">Hành động này không thể hoàn tác.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <TrashIcon className="w-3.5 h-3.5" />}
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
