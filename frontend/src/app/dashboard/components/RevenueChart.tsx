'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockRevenueData } from '@/lib/mockData';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-dropdown px-4 py-3 text-sm">
        <p className="font-semibold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-slate-700 mb-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.fill || entry.color }} />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-semibold font-tabular">{(entry.value / 1000000).toFixed(1)}tr ₫</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Doanh thu & Lợi nhuận</h3>
          <p className="text-xs text-slate-500 mt-0.5">6 tháng gần nhất (đơn vị: triệu đồng)</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-500 inline-block" />Doanh thu</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />Lợi nhuận</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-300 inline-block" />Chi phí</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={mockRevenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={3}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={1} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fca5a5" stopOpacity={1} />
              <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v / 1000000}tr`}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="revenue" name="Doanh thu" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="profit" name="Lợi nhuận" fill="url(#colorProfit)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name="Chi phí" fill="url(#colorExpense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}