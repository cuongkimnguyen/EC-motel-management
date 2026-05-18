'use client';

import { DocumentTextIcon, HomeIcon, CurrencyDollarIcon, WrenchScrewdriverIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Icon from '@/components/ui/AppIcon';


interface ActivityItem {
  id: string;
  type: 'contract' | 'room' | 'payment' | 'post' | 'maintenance' | 'tenant';
  title: string;
  description: string;
  time: string;
  actor: string;
}

const activities: ActivityItem[] = [
  { id: '1', type: 'contract', title: 'Ký hợp đồng mới', description: 'HĐ-2025-011 — Ngô Văn Mạnh — Phòng B05', time: '2 giờ trước', actor: 'NV' },
  { id: '2', type: 'payment', title: 'Thu tiền thuê', description: 'Phòng C01 — Đinh Thị Nga — 5.500.000 ₫', time: '4 giờ trước', actor: 'NV' },
  { id: '3', type: 'post', title: 'Đăng bài Facebook', description: 'Khuyến mãi tháng 3 — 1.842 lượt xem', time: '1 ngày trước', actor: 'NV' },
  { id: '4', type: 'maintenance', title: 'Ghi nhận bảo trì', description: 'Phòng 204 — Sửa hệ thống điện', time: '1 ngày trước', actor: 'NV' },
  { id: '5', type: 'room', title: 'Cập nhật phòng trống', description: 'Phòng B07 — Khách trả phòng', time: '2 ngày trước', actor: 'NV' },
  { id: '6', type: 'tenant', title: 'Thêm khách thuê mới', description: 'Ngô Văn Mạnh — CCCD: 001234567898', time: '2 ngày trước', actor: 'NV' },
  { id: '7', type: 'payment', title: 'Thu tiền thuê', description: 'Phòng 302 — Đặng Quốc Hùng — 4.200.000 ₫', time: '3 ngày trước', actor: 'NV' },
  { id: '8', type: 'contract', title: 'Gia hạn hợp đồng', description: 'HĐ-2025-001 — Nguyễn Văn An — P101', time: '4 ngày trước', actor: 'NV' },
];

const iconMap = {
  contract: { icon: DocumentTextIcon, bg: 'bg-blue-100', color: 'text-blue-600' },
  room: { icon: HomeIcon, bg: 'bg-amber-100', color: 'text-amber-600' },
  payment: { icon: CurrencyDollarIcon, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  post: { icon: HomeIcon, bg: 'bg-indigo-100', color: 'text-indigo-600' },
  maintenance: { icon: WrenchScrewdriverIcon, bg: 'bg-red-100', color: 'text-red-600' },
  tenant: { icon: UserPlusIcon, bg: 'bg-teal-100', color: 'text-teal-600' },
};

export default function ActivityFeed() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Hoạt động gần đây</h3>
          <p className="text-xs text-slate-500 mt-0.5">Cập nhật lúc 14:32 · 14/03/2025</p>
        </div>
        <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
          Xem tất cả
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {activities.map((activity) => {
          const { icon: Icon, bg, color } = iconMap[activity.type];
          return (
            <div key={activity.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={15} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{activity.description}</p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}