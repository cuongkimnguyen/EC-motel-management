'use client';

import { ClockIcon, HomeIcon, ChevronRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { mockContracts, mockRooms, formatDate } from '@/lib/mockData';
import Link from 'next/link';

export default function AlertPanel() {
  const urgentContracts = mockContracts?.filter(c => c?.daysUntilExpiry !== null && c?.daysUntilExpiry <= 30)?.sort((a, b) => (a?.daysUntilExpiry ?? 999) - (b?.daysUntilExpiry ?? 999));

  const vacantNoPost = mockRooms?.filter(r => r?.status === 'Trống' && !r?.hasActivePost);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Expiring contracts */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Hợp đồng sắp hết hạn</h3>
              <p className="text-xs text-amber-600">{urgentContracts?.length} hợp đồng trong 30 ngày tới</p>
            </div>
          </div>
          <Link href="/contract-management" className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1">
            Xem tất cả <ChevronRightIcon className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {urgentContracts?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Không có hợp đồng nào sắp hết hạn
            </div>
          ) : (
            urgentContracts?.map(contract => (
              <div key={contract?.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${(contract?.daysUntilExpiry ?? 999) <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                `}>
                  {contract?.daysUntilExpiry}d
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{contract?.tenantName}</p>
                    <span className="text-xs text-slate-400 font-mono">{contract?.roomCode}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hết hạn: {formatDate(contract?.endDate)} · HĐ: {contract?.code}
                  </p>
                </div>
                <Link
                  href="/contract-management"
                  className={`
                    text-xs font-medium px-2.5 py-1 rounded-lg transition-colors flex-shrink-0
                    ${(contract?.daysUntilExpiry ?? 999) <= 7
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' :'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }
                  `}
                >
                  {(contract?.daysUntilExpiry ?? 999) <= 7 ? 'Khẩn cấp' : 'Gia hạn'}
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Vacant rooms without posts */}
      <div className="bg-white rounded-xl border border-red-200 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900">Phòng trống chưa có bài đăng</h3>
              <p className="text-xs text-red-600">{vacantNoPost?.length} phòng cần marketing gấp</p>
            </div>
          </div>
          <Link href="/room-management" className="text-xs text-red-700 hover:text-red-900 font-medium flex items-center gap-1">
            Xem phòng <ChevronRightIcon className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {vacantNoPost?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Tất cả phòng trống đã có bài đăng marketing 🎉
            </div>
          ) : (
            vacantNoPost?.map(room => (
              <div key={room?.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <HomeIcon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{room?.name}</p>
                    <span className="text-[11px] font-mono text-slate-400">{room?.code}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {room?.floor} · {room?.block} · {room?.area}m² ·
                    <span className="font-tabular ml-1 font-medium text-teal-600">
                      {(room?.rentPrice / 1000000)?.toFixed(1)}tr/tháng
                    </span>
                  </p>
                </div>
                <button className="text-xs font-medium px-2.5 py-1 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg transition-colors flex-shrink-0 flex items-center gap-1">
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  Đăng ngay
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}