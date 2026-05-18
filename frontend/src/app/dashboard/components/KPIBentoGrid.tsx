'use client';

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BuildingOffice2Icon, ExclamationTriangleIcon, CurrencyDollarIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getDashboardStats } from '@/lib/mockData';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { value: string; positive: boolean };
  icon: React.ReactNode;
  iconBg: string;
  variant?: 'default' | 'alert' | 'warning' | 'success' | 'hero';
  colSpan?: 1 | 2;
}

function KPICard({ label, value, subValue, trend, icon, iconBg, variant = 'default', colSpan = 1 }: KPICardProps) {
  const variantClasses = {
    default: 'bg-white border-slate-200',
    hero: 'bg-white border-teal-200 ring-1 ring-teal-100',
    success: 'bg-white border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    alert: 'bg-red-50 border-red-200',
  };

  return (
    <div
      className={`
        rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200
        ${variantClasses[variant]}
        ${colSpan === 2 ? 'col-span-2' : 'col-span-1'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <p className={`text-[13px] font-medium tracking-wide ${
          variant === 'alert' ? 'text-red-600' :
          variant === 'warning' ? 'text-amber-700' :
          variant === 'success' ? 'text-emerald-700' : 'text-slate-500'
        }`}>
          {label}
        </p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={`font-tabular font-bold leading-none ${
            variant === 'hero' ? 'text-3xl text-slate-900' :
            variant === 'alert' ? 'text-2xl text-red-700' :
            variant === 'warning' ? 'text-2xl text-amber-800' : 'text-2xl text-slate-900'
          }`}>
            {value}
          </p>
          {subValue && (
            <p className={`text-xs mt-1.5 ${
              variant === 'alert' ? 'text-red-500' :
              variant === 'warning' ? 'text-amber-600' : 'text-slate-400'
            }`}>
              {subValue}
            </p>
          )}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend.positive ? 'text-emerald-700 bg-emerald-100' : 'text-red-600 bg-red-100'
          }`}>
            {trend.positive ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KPIBentoGrid() {
  const stats = getDashboardStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {/* Hero: Tỷ lệ lấp đầy */}
      <div className="col-span-1 sm:col-span-2 lg:col-span-2">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200 h-full">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-teal-100">Tỷ lệ lấp đầy tháng 3</p>
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">%</span>
            </div>
          </div>
          <div className="flex items-end gap-4 mb-3">
            <p className="font-tabular text-5xl font-bold text-white leading-none">{stats.occupancyRate}%</p>
            <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-white/20 text-white rounded-full mb-1">
              <ArrowTrendingUpIcon className="w-3 h-3" />
              +4% so tháng trước
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-teal-200">
              <span>{stats.occupiedRooms} đang thuê</span>
              <span>{stats.totalRooms} tổng phòng</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
            <div className="flex gap-3 text-xs text-teal-200">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-white rounded-full inline-block" />{stats.occupiedRooms} đang thuê</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-300 rounded-full inline-block" />{stats.vacantRooms} trống</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-300 rounded-full inline-block" />{stats.reservedRooms} đã đặt</span>
            </div>
          </div>
        </div>
      </div>

      <KPICard
        label="Doanh thu tháng 3"
        value={`${(stats.currentMonthRevenue / 1000000).toFixed(1)}tr`}
        subValue="Tổng tiền thuê + dịch vụ"
        trend={{ value: '+5.2%', positive: true }}
        icon={<CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-100"
        variant="success"
      />

      <KPICard
        label="Lợi nhuận tháng 3"
        value={`${(stats.currentMonthProfit / 1000000).toFixed(1)}tr`}
        subValue={`Chi phí: ${(stats.currentMonthExpenses / 1000000).toFixed(0)}tr`}
        trend={{ value: '+1.3%', positive: true }}
        icon={<ArrowTrendingUpIcon className="w-5 h-5 text-teal-600" />}
        iconBg="bg-teal-100"
        variant="default"
      />

      <KPICard
        label="Nợ tồn đọng"
        value={`${(stats.overdueAmount / 1000000).toFixed(1)}tr`}
        subValue="2 phòng chưa đóng tiền"
        icon={<ExclamationTriangleIcon className="w-5 h-5 text-red-500" />}
        iconBg="bg-red-100"
        variant="alert"
      />

      <KPICard
        label="HĐ sắp hết hạn"
        value={stats.expiringContracts}
        subValue={`${stats.expiringIn7Days} hết hạn trong 7 ngày`}
        icon={<CalendarIcon className="w-5 h-5 text-amber-600" />}
        iconBg="bg-amber-100"
        variant="warning"
      />

      <KPICard
        label="Phòng trống"
        value={stats.vacantRooms}
        subValue={`${stats.vacantWithoutPost} chưa có bài đăng`}
        icon={<BuildingOffice2Icon className="w-5 h-5 text-blue-600" />}
        iconBg="bg-blue-100"
        variant={stats.vacantRooms > 3 ? 'warning' : 'default'}
      />

      <KPICard
        label="Hợp đồng hiệu lực"
        value={stats.activeContracts}
        subValue={`${stats.expiringContracts} sắp hết hạn`}
        icon={<DocumentTextIcon className="w-5 h-5 text-purple-600" />}
        iconBg="bg-purple-100"
        variant="default"
      />
    </div>
  );
}