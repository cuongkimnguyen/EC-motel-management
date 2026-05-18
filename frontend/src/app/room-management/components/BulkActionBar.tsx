'use client';

import { TrashIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onBulkDelete: () => void;
  onBulkStatusChange: (status: string) => void;
}

export default function BulkActionBar({ selectedCount, onClear, onBulkDelete, onBulkStatusChange }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 slide-up">
      <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-modal">
        <span className="text-sm font-medium">
          Đã chọn <span className="text-teal-400 font-bold">{selectedCount}</span> phòng
        </span>
        <div className="w-px h-5 bg-slate-700" />
        <button
          onClick={() => onBulkStatusChange('Bảo trì')}
          className="flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          <TagIcon className="w-3.5 h-3.5" />
          Chuyển sang Bảo trì
        </button>
        <button
          onClick={onBulkDelete}
          className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          Xóa đã chọn
        </button>
        <div className="w-px h-5 bg-slate-700" />
        <button
          onClick={onClear}
          className="p-1 text-slate-400 hover:text-white transition-colors rounded"
          title="Bỏ chọn tất cả"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}