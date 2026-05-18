'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const periodOptions = [
  { label: 'Tháng 3/2025', value: '2025-03' },
  { label: 'Tháng 2/2025', value: '2025-02' },
  { label: 'Tháng 1/2025', value: '2025-01' },
  { label: 'Quý 1/2025', value: 'Q1-2025' },
  { label: 'Năm 2025', value: '2025' },
];

export default function DashboardHeader() {
  const [period, setPeriod] = useState(periodOptions?.[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Chào buổi chiều, <span className="font-medium text-slate-700">Nguyễn Văn Chủ</span> 👋 — Thứ Sáu, 14/03/2025
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Period selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-all duration-150 shadow-card"
          >
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            {period?.label}
            <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-dropdown z-20 py-1 scale-in">
              {periodOptions?.map(opt => (
                <button
                  key={opt?.value}
                  onClick={() => { setPeriod(opt); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    period?.value === opt?.value
                      ? 'bg-teal-50 text-teal-700 font-medium' :'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt?.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-teal-600 hover:border-teal-300 transition-all duration-150 shadow-card"
          title="Làm mới dữ liệu"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Export */}
        <button className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 shadow-card">
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Xuất báo cáo</span>
        </button>
      </div>
    </div>
  );
}