'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  Squares2X2Icon, BuildingOfficeIcon, DocumentTextIcon, UsersIcon,
  ReceiptPercentIcon, ChartBarIcon, Cog6ToothIcon,
  ChevronLeftIcon, ChevronRightIcon, ArrowRightOnRectangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Facebook icon inline SVG
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  group?: string;
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard', icon: <Squares2X2Icon className="w-5 h-5" />, group: 'main' },
  { label: 'Quản lý phòng', href: '/room-management', icon: <BuildingOfficeIcon className="w-5 h-5" />, badge: 5, group: 'main' },
  { label: 'Hợp đồng', href: '/contract-management', icon: <DocumentTextIcon className="w-5 h-5" />, badge: 4, group: 'main' },
  { label: 'Khách thuê', href: '/tenant-management', icon: <UsersIcon className="w-5 h-5" />, group: 'main' },
  { label: 'Bài đăng', href: '/post-management', icon: <FacebookIcon className="w-5 h-5" />, badge: 2, group: 'marketing' },
  { label: 'Chi phí', href: '/expenses', icon: <ReceiptPercentIcon className="w-5 h-5" />, group: 'finance' },
  { label: 'Báo cáo', href: '/reports', icon: <ChartBarIcon className="w-5 h-5" />, group: 'finance' },
  { label: 'AI Agent', href: '/agent', icon: <SparklesIcon className="w-5 h-5" />, group: 'ai' },
  { label: 'Cài đặt', href: '/settings', icon: <Cog6ToothIcon className="w-5 h-5" />, group: 'system' },
];

const groupLabels: Record<string, string> = {
  main: 'Quản lý',
  marketing: 'Marketing',
  finance: 'Tài chính',
  ai: 'Trí tuệ nhân tạo',
  system: 'Hệ thống',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const groups = ['main', 'marketing', 'finance', 'ai', 'system'];

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-30 flex flex-col
        bg-slate-900 border-r border-slate-800
        sidebar-transition overflow-hidden
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-slate-800 px-3 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <AppLogo size={32} className="flex-shrink-0" />
            <span className="font-bold text-white text-base truncate tracking-tight">
              MotelManage
            </span>
          </div>
        )}
        {collapsed && (
          <AppLogo size={32} />
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 flex-shrink-0"
            aria-label="Thu gọn sidebar"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapsed toggle */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="flex items-center justify-center h-8 mx-2 mt-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150"
          aria-label="Mở rộng sidebar"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {groups.map((group, gIdx) => {
          const items = navItems.filter(i => i.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className={gIdx > 0 ? 'mt-4' : ''}>
              {!collapsed && (
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 px-3 mb-1.5">
                  {groupLabels[group]}
                </p>
              )}
              {collapsed && gIdx > 0 && (
                <div className="border-t border-slate-800 my-2 mx-1" />
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`
                          group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-150 text-sm font-medium
                          ${isActive
                            ? 'bg-teal-700/30 text-teal-400 border border-teal-700/40' :'text-slate-400 hover:text-white hover:bg-slate-800'
                          }
                          ${collapsed ? 'justify-center' : ''}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className={`flex-shrink-0 ${isActive ? 'text-teal-400' : ''}`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.label}</span>
                        )}
                        {!collapsed && item.badge && (
                          <span className={`
                            flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                            ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'}
                          `}>
                            {item.badge}
                          </span>
                        )}
                        {collapsed && item.badge && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                        {/* Tooltip for collapsed */}
                        {collapsed && (
                          <div className="
                            absolute left-full ml-3 px-2.5 py-1.5 bg-slate-700 text-white text-xs
                            rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                            pointer-events-none transition-opacity duration-150 shadow-dropdown z-50
                          ">
                            {item.label}
                            {item.badge && (
                              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-700 rotate-45" />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`border-t border-slate-800 p-3 flex-shrink-0 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              NV
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Nguyễn Văn Chủ</p>
              <p className="text-xs text-slate-400 truncate">Chủ nhà · Admin</p>
            </div>
            <ArrowRightOnRectangleIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
          </div>
        ) : (
          <>
            <div
              className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer"
              title="Nguyễn Văn Chủ — Chủ nhà"
            >
              NV
            </div>
            <button
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
              title="Đăng xuất"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}