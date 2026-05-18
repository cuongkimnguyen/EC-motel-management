'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DebtTrendItem } from '../types';
import { formatCurrencyVND } from '../mockReportData';

interface DebtTrendChartProps {
  data: DebtTrendItem[];
  loading: boolean;
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

function formatMillions(value: number) {
  return `${(value / 1000000).toFixed(0)}tr`;
}

export default function DebtTrendChart({ data, loading }: DebtTrendChartProps) {
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
        <h3 className="text-base font-semibold text-slate-800">Xu hướng công nợ</h3>
        <p className="text-xs text-slate-500 mt-0.5">Tổng nợ, phát sinh mới và đã thu 6 tháng gần nhất</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatMillions} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => <span className="text-slate-600">{v}</span>} />
          <Area type="monotone" dataKey="totalDebt" name="Tổng nợ" stroke="#f87171" strokeWidth={2} fill="url(#debtGrad)" dot={{ r: 3 }} />
          <Area type="monotone" dataKey="collected" name="Đã thu" stroke="#0d9488" strokeWidth={2} fill="url(#collectedGrad)" dot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
