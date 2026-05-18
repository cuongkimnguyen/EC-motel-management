'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { RevenueExpenseTrendItem } from '../types';
import { formatCurrencyVND } from '../mockReportData';

interface RevenueExpenseChartProps {
  data: RevenueExpenseTrendItem[];
  loading: boolean;
}

function formatMillions(value: number) {
  return `${(value / 1000000).toFixed(0)}tr`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[180px]">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium text-slate-800">{formatCurrencyVND(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueExpenseChart({ data, loading }: RevenueExpenseChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-48 mb-4" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Doanh thu – Chi phí – Lợi nhuận</h3>
        <p className="text-xs text-slate-500 mt-0.5">Xu hướng theo tháng trong năm 2024</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatMillions} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) => <span className="text-slate-600">{value}</span>}
          />
          <Bar dataKey="revenue" name="Doanh thu" fill="#0d9488" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Bar dataKey="expense" name="Chi phí" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Line dataKey="profit" name="Lợi nhuận" type="monotone" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
