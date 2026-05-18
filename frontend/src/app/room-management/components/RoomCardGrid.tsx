'use client';

import {
  PencilIcon, TrashIcon, UsersIcon, BoltIcon,
  BeakerIcon, BuildingOfficeIcon, ExclamationCircleIcon, ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Room } from '@/lib/mockData';
import { RoomStatusBadge } from '@/components/ui/StatusBadge';

interface RoomCardGridProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}

export default function RoomCardGrid({ rooms, onEdit, onDelete }: RoomCardGridProps) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-card py-20 text-center">
        <BuildingOfficeIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Không tìm thấy phòng nào</p>
        <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {rooms.map((room) => {
        const isVacant = room.status === 'Trống';
        const needsMarketing = isVacant && !room.hasActivePost;
        const isMaintenance = room.status === 'Bảo trì';

        return (
          <div
            key={room.id}
            className={`
              bg-white rounded-xl border shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group
              ${needsMarketing ? 'border-red-200 ring-1 ring-red-100' : isMaintenance ? 'border-red-200' : isVacant ? 'border-amber-200' : 'border-slate-200'}
            `}
          >
            {/* Card Header */}
            <div className={`px-4 pt-4 pb-3 ${
              needsMarketing ? 'bg-red-50/50' : isMaintenance ?'bg-red-50/30': isVacant ?'bg-amber-50/50': 'bg-slate-50/50'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{room.code}</span>
                  <p className="text-sm font-semibold text-slate-900 mt-1.5">{room.name}</p>
                  <p className="text-xs text-slate-500">{room.floor} · {room.block} · {room.area}m²</p>
                </div>
                <RoomStatusBadge status={room.status} size="sm" />
              </div>

              {needsMarketing && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                  <ExclamationCircleIcon className="w-3 h-3" />
                  Chưa có bài đăng marketing
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="px-4 py-3 space-y-2.5">
              {/* Rent price - prominent */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Giá thuê</span>
                <div className="text-right">
                  <span className="text-lg font-bold font-tabular text-teal-700">
                    {(room.rentPrice / 1000000).toFixed(1)}tr
                  </span>
                  <span className="text-xs text-slate-400">/tháng</span>
                </div>
              </div>

              {/* Deposit */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tiền cọc</span>
                <span className="font-tabular font-medium text-slate-700">{(room.deposit / 1000000).toFixed(0)}tr ₫</span>
              </div>

              {/* Utilities */}
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <BoltIcon className="w-3 h-3 text-amber-500" />
                  {room.electricityPrice.toLocaleString('vi-VN')}đ/kWh
                </span>
                <span className="flex items-center gap-1">
                  <BeakerIcon className="w-3 h-3 text-blue-500" />
                  {room.waterPrice.toLocaleString('vi-VN')}đ/m³
                </span>
              </div>

              {/* Occupancy */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <UsersIcon className="w-3 h-3 text-slate-400" />
                  <span>{room.currentTenants}/{room.maxTenants} người</span>
                </div>
                {/* Mini occupancy bar */}
                <div className="flex gap-0.5">
                  {Array.from({ length: room.maxTenants }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-sm ${i < room.currentTenants ? 'bg-teal-500' : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer - actions */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
              {needsMarketing ? (
                <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 py-2 rounded-lg transition-colors">
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  Đăng bài ngay
                </button>
              ) : (
                <button className="flex-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 py-2 rounded-lg transition-colors">
                  Xem chi tiết
                </button>
              )}
              <button
                onClick={() => onEdit(room)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Chỉnh sửa"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(room)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Xóa phòng"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}