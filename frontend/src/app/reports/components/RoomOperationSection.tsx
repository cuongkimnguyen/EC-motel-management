'use client';

import { RoomOperationReport } from '../types';
import { HomeModernIcon, HomeIcon, ClockIcon, ChartPieIcon } from '@heroicons/react/24/outline';

interface RoomOperationSectionProps {
  data: RoomOperationReport;
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

export default function RoomOperationSection({ data, loading }: RoomOperationSectionProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-40 mb-4" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded mb-2" />)}
      </div>
    );
  }

  const occupancyColor = data.occupancyRate >= 90 ? 'text-emerald-600' : data.occupancyRate >= 70 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Báo cáo vận hành phòng</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tình trạng sử dụng phòng trong kỳ</p>
        </div>
        <span className={`text-2xl font-bold ${occupancyColor}`}>{data.occupancyRate}%</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Tỷ lệ lấp đầy</span>
          <span>{data.occupiedRooms}/{data.totalRooms} phòng</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${data.occupancyRate >= 90 ? 'bg-teal-500' : data.occupancyRate >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${data.occupancyRate}%` }}
          />
        </div>
      </div>

      <MetricRow label="Tổng số phòng" value={`${data.totalRooms} phòng`} icon={<HomeModernIcon className="w-4 h-4 text-slate-500" />} color="bg-slate-50" />
      <MetricRow label="Phòng đang thuê" value={`${data.occupiedRooms} phòng`} icon={<HomeModernIcon className="w-4 h-4 text-emerald-600" />} color="bg-emerald-50" />
      <MetricRow label="Phòng trống" value={`${data.vacantRooms} phòng`} icon={<HomeIcon className="w-4 h-4 text-amber-600" />} color="bg-amber-50" />
      <MetricRow label="Phòng sắp trống" value={`${data.soonVacantRooms} phòng`} icon={<ClockIcon className="w-4 h-4 text-blue-500" />} color="bg-blue-50" />
      <MetricRow label="Tỷ lệ lấp đầy" value={`${data.occupancyRate}%`} icon={<ChartPieIcon className="w-4 h-4 text-teal-600" />} color="bg-teal-50" />
    </div>
  );
}
