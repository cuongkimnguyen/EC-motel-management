'use client';

import Link from 'next/link';
import { ChartBarIcon, HomeModernIcon, DocumentTextIcon, ReceiptPercentIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export function ReportEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <ChartBarIcon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có dữ liệu báo cáo</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Hãy thêm dữ liệu phòng, hợp đồng và chi phí để bắt đầu theo dõi báo cáo vận hành nhà trọ.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/room-management"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
        >
          <HomeModernIcon className="w-4 h-4" />
          Đi đến Quản lý phòng
        </Link>
        <Link
          href="/contract-management"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <DocumentTextIcon className="w-4 h-4" />
          Đi đến Hợp đồng
        </Link>
        <Link
          href="/expenses"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <ReceiptPercentIcon className="w-4 h-4" />
          Đi đến Chi phí
        </Link>
      </div>
    </div>
  );
}

export function ReportErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <ExclamationCircleIcon className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Không thể tải dữ liệu báo cáo</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi tiếp tục xảy ra.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
      >
        <ArrowPathIcon className="w-4 h-4" />
        Thử lại
      </button>
    </div>
  );
}
