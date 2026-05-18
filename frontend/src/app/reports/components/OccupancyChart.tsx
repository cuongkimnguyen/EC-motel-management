'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { OccupancyByBuildingItem } from '../types';

interface OccupancyChartProps {
  data: OccupancyByBuildingItem[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload as OccupancyByBuildingItem;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Tổng phòng</span>
            <span className="font-medium">{item?.totalRooms}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-600">Đang thuê</span>
            <span className="font-medium text-emerald-700">{item?.occupiedRooms}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-amber-500">Trống</span>
            <span className="font-medium text-amber-600">{item?.vacantRooms}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-100">
            <span className="text-slate-500">Tỷ lệ lấp đầy</span>
            <span className="font-bold text-teal-600">{item?.occupancyRate.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

function getBarColor(rate: number) {
  if (rate >= 90) return '#0d9488';
  if (rate >= 70) return '#f59e0b';
  return '#f87171';
}

export default function OccupancyChart({ data, loading }: OccupancyChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-44 mb-4" />
        <div className="h-52 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Tỷ lệ lấp đầy theo khu</h3>
        <p className="text-xs text-slate-500 mt-0.5">Phân bổ phòng trống và đang thuê</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="buildingName" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="occupancyRate" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancyRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500 inline-block" />≥ 90%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />70–89%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />{'< 70%'}</span>
      </div>
    </div>
  );
}
