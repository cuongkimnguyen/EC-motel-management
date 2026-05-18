'use client';

import { useState, useRef, useEffect } from 'react';
import {
  BellIcon, MagnifyingGlassIcon, ChevronDownIcon,
  UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon,
  XMarkIcon, CheckIcon
} from '@heroicons/react/24/outline';
import { mockNotifications } from '@/lib/mockData';
import Link from 'next/link';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'contract_expiry': return '📋';
      case 'vacant_room': return '🏠';
      case 'overdue_payment': return '💰';
      case 'maintenance': return '🔧';
      default: return '🔔';
    }
  };

  return (
    <header
      className={`
        fixed top-0 right-0 h-16 bg-white border-b border-slate-200 z-20
        flex items-center justify-between px-4 lg:px-6
        transition-all duration-300
        ${sidebarCollapsed ? 'left-16' : 'left-60'}
      `}
    >
      {/* Left: Breadcrumb / Page title area */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <span className="text-teal-600 font-medium">MotelManage</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">Tổng quan</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-64 fade-in">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm phòng, khách thuê, HĐ..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
              />
              <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-150"
              title="Tìm kiếm (Ctrl+K)"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-150"
            aria-label={`${unreadCount} thông báo chưa đọc`}
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-96 bg-white border border-slate-200 rounded-xl shadow-modal z-50 scale-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Thông báo</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <CheckIcon className="w-3 h-3" />
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer ${!notif.read ? 'bg-teal-50/50' : ''}`}
                      onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-lg">{getNotifIcon(notif.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                            {notif.title}
                          </p>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${notif.read ? 'opacity-0' : getPriorityColor(notif.priority)}`} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{notif.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                <button className="text-xs text-teal-600 hover:text-teal-700 font-medium w-full text-center">
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
              NV
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-900 leading-none">Nguyễn Văn Chủ</p>
              <p className="text-xs text-slate-500 mt-0.5">Chủ nhà</p>
            </div>
            <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-xl shadow-dropdown z-50 scale-in overflow-hidden py-1">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Nguyễn Văn Chủ</p>
                <p className="text-xs text-slate-500">chuNha@motelmanage.vn</p>
              </div>
              <div className="py-1">
                {[
                  { icon: <UserIcon className="w-4 h-4" />, label: 'Hồ sơ cá nhân', href: '/profile' },
                  { icon: <Cog6ToothIcon className="w-4 h-4" />, label: 'Cài đặt', href: '/settings' },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={() => setUserOpen(false)}
                  >
                    <span className="text-slate-400">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-slate-100 py-1">
                <button className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}