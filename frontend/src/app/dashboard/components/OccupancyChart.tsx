'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockRevenueData, mockRooms } from '@/lib/mockData';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-dropdown px-4 py-3 text-sm">
        <p className="font-semibold text-slate-900 mb-1">{label}</p>
        <p className="text-slate-700">
          Tỷ lệ lấp đầy: <span className="font-bold text-teal-600">{payload[0]?.value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const ROOM_STATUS_COLORS = {
  'Đang thuê': '#0d9488',
  'Trống': '#f59e0b',
  'Đã đặt': '#3b82f6',
  'Bảo trì': '#ef4444',
};

export default function OccupancyChart() {
  const statusCounts = {
    'Đang thuê': mockRooms.filter(r => r.status === 'Đang thuê').length,
    'Trống': mockRooms.filter(r => r.status === 'Trống').length,
    'Đã đặt': mockRooms.filter(r => r.status === 'Đã đặt').length,
    'Bảo trì': mockRooms.filter(r => r.status === 'Bảo trì').length,
  };

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-dropdown px-3 py-2 text-sm">
          <p className="font-medium text-slate-900">{payload[0].name}</p>
          <p className="text-slate-600 font-tabular">{payload[0].value} phòng ({Math.round(payload[0].value / mockRooms.length * 100)}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Occupancy trend */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-900">Xu hướng lấp đầy</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tỷ lệ phòng đang cho thuê theo tháng</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mockRevenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              domain={[50, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="occupancyRate"
              stroke="#0d9488"
              strokeWidth={2.5}
              fill="url(#occupancyGrad)"
              dot={{ fill: '#0d9488', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#0d9488' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Room status pie */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">Trạng thái phòng</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tổng {mockRooms.length} phòng</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={ROOM_STATUS_COLORS[entry.name as keyof typeof ROOM_STATUS_COLORS]} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {pieData.map(item => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: ROOM_STATUS_COLORS[item.name as keyof typeof ROOM_STATUS_COLORS] }}
              />
              <span className="truncate">{item.name}</span>
              <span className="font-tabular font-semibold text-slate-900 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}