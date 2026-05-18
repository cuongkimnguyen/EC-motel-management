'use client';

import { TableCellsIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface ReportHeaderProps {
  onExportExcel: () => void;
  onExportPdf: () => void;
  exporting: boolean;
}

export default function ReportHeader({ onExportExcel, onExportPdf, exporting }: ReportHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
          <ChartBarIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Báo cáo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Theo dõi hiệu quả vận hành nhà trọ</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onExportExcel}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-60"
        >
          <TableCellsIcon className="w-4 h-4" />
          Xuất Excel
        </button>
        <button
          onClick={onExportPdf}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60"
        >
          <DocumentTextIcon className="w-4 h-4" />
          Xuất PDF
        </button>
      </div>
    </div>
  );
}
