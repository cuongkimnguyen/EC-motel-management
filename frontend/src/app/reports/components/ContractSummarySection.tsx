'use client';

import { ContractReport } from '../types';
import {
  DocumentTextIcon, ExclamationTriangleIcon, PlusCircleIcon,
  XCircleIcon, CalendarIcon
} from '@heroicons/react/24/outline';
import { formatDateVN } from '../mockReportData';

interface ContractSummarySectionProps {
  data: ContractReport;
  loading: boolean;
}

function MetricRow({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

export default function ContractSummarySection({ data, loading }: ContractSummarySectionProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-44 mb-4" />
        {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 rounded mb-2" />)}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Báo cáo hợp đồng</h3>
        <p className="text-xs text-slate-500 mt-0.5">Tình trạng hợp đồng trong kỳ</p>
      </div>

      <MetricRow label="Hợp đồng đang hiệu lực" value={`${data.activeContracts} HĐ`} icon={<DocumentTextIcon className="w-4 h-4 text-teal-600" />} color="bg-teal-50" />
      <MetricRow label="Sắp hết hạn (30 ngày)" value={`${data.expiringIn30Days} HĐ`} icon={<ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />} color="bg-amber-50" />
      <MetricRow label="Hợp đồng mới trong kỳ" value={`${data.newContractsThisPeriod} HĐ`} icon={<PlusCircleIcon className="w-4 h-4 text-blue-500" />} color="bg-blue-50" />
      <MetricRow label="Hợp đồng đã kết thúc" value={`${data.endedContractsThisPeriod} HĐ`} icon={<XCircleIcon className="w-4 h-4 text-slate-400" />} color="bg-slate-50" />

      {data.expiringList.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cần gia hạn sớm</p>
          <div className="space-y-2">
            {data.expiringList.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">{item.tenantName}</p>
                    <p className="text-xs text-slate-500">{item.roomName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{formatDateVN(item.endDate)}</p>
                  <span className={`text-xs font-semibold ${item.daysLeft <= 10 ? 'text-red-600' : item.daysLeft <= 20 ? 'text-amber-600' : 'text-slate-500'}`}>
                    còn {item.daysLeft} ngày
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
