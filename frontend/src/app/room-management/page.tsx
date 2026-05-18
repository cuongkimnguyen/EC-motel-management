'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { mockRooms, Room } from '@/lib/mockData';
import RoomFilters, { RoomFilterState } from './components/RoomFilters';
import RoomTable from './components/RoomTable';
import RoomCardGrid from './components/RoomCardGrid';
import RoomFormModal from './components/RoomFormModal';
import DeleteRoomModal from './components/DeleteRoomModal';
import BulkActionBar from './components/BulkActionBar';
import { PlusIcon, Squares2X2Icon, ListBulletIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Backend integration point: Replace with SWR/React Query fetching from /api/rooms

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [view, setView] = useState<'table' | 'card'>('table');
  const [filters, setFilters] = useState<RoomFilterState>({
    search: '', status: '', block: '', floor: '', priceMin: '', priceMax: '',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!room.code.toLowerCase().includes(q) && !room.name.toLowerCase().includes(q)) return false;
      }
      if (filters.status && room.status !== filters.status) return false;
      if (filters.block && room.block !== filters.block) return false;
      if (filters.floor && room.floor !== filters.floor) return false;
      if (filters.priceMin && room.rentPrice < parseInt(filters.priceMin) * 1000000) return false;
      if (filters.priceMax && room.rentPrice > parseInt(filters.priceMax) * 1000000) return false;
      return true;
    });
  }, [rooms, filters]);

  const stats = useMemo(() => ({
    total: rooms.length,
    vacant: rooms.filter(r => r.status === 'Trống').length,
    occupied: rooms.filter(r => r.status === 'Đang thuê').length,
    maintenance: rooms.filter(r => r.status === 'Bảo trì').length,
    noPost: rooms.filter(r => r.status === 'Trống' && !r.hasActivePost).length,
  }), [rooms]);

  const handleSelectId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (ids: string[]) => setSelectedIds(ids);

  const handleSaveRoom = (data: any) => {
    if (editRoom) {
      setRooms(prev => prev.map(r => r.id === editRoom.id ? { ...r, ...data } : r));
    } else {
      const newRoom: Room = {
        id: `r${Date.now()}`,
        ...data,
        currentTenants: 0,
        images: [],
        hasActivePost: false,
      };
      setRooms(prev => [...prev, newRoom]);
    }
    setEditRoom(null);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
    setSelectedIds(prev => prev.filter(id => id !== roomId));
  };

  const handleBulkDelete = () => {
    const count = selectedIds.length;
    setRooms(prev => prev.filter(r => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };

  const handleBulkStatusChange = (status: string) => {
    const count = selectedIds.length;
    setRooms(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, status: status as any } : r));
    setSelectedIds([]);
  };

  return (
    <AppLayout>
      <div className="fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý phòng</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Tổng <span className="font-semibold text-slate-700">{stats.total}</span> phòng ·
              <span className="text-emerald-600 font-medium ml-1">{stats.occupied} đang thuê</span> ·
              <span className="text-amber-600 font-medium ml-1">{stats.vacant} trống</span>
              {stats.maintenance > 0 && (
                <span className="text-red-600 font-medium ml-1">· {stats.maintenance} bảo trì</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setView('table')}
                className={`p-1.5 rounded-md transition-all duration-150 ${view === 'table' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                title="Dạng bảng"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('card')}
                className={`p-1.5 rounded-md transition-all duration-150 ${view === 'card' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
                title="Dạng thẻ"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => { setEditRoom(null); setAddModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 shadow-card"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm phòng
            </button>
          </div>
        </div>

        {/* Alert for rooms without marketing posts */}
        {stats.noPost > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">{stats.noPost} phòng trống</span> chưa có bài đăng marketing.
              Những phòng này được đánh dấu <span className="font-medium">⚠</span> trong danh sách bên dưới.
            </p>
            <button className="ml-auto text-xs font-medium text-red-700 hover:text-red-900 whitespace-nowrap underline">
              Đăng bài ngay
            </button>
          </div>
        )}

        {/* Filters */}
        <RoomFilters
          filters={filters}
          onChange={setFilters}
          totalCount={rooms.length}
          filteredCount={filteredRooms.length}
        />

        {/* Content */}
        {view === 'table' ? (
          <RoomTable
            rooms={filteredRooms}
            onEdit={(room) => { setEditRoom(room); setAddModalOpen(true); }}
            onDelete={(room) => { setDeleteRoom(room); setDeleteModalOpen(true); }}
            selectedIds={selectedIds}
            onSelectId={handleSelectId}
            onSelectAll={handleSelectAll}
          />
        ) : (
          <RoomCardGrid
            rooms={filteredRooms}
            onEdit={(room) => { setEditRoom(room); setAddModalOpen(true); }}
            onDelete={(room) => { setDeleteRoom(room); setDeleteModalOpen(true); }}
          />
        )}

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
        />

        {/* Modals */}
        <RoomFormModal
          isOpen={addModalOpen}
          onClose={() => { setAddModalOpen(false); setEditRoom(null); }}
          room={editRoom}
          onSave={handleSaveRoom}
        />
        <DeleteRoomModal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setDeleteRoom(null); }}
          room={deleteRoom}
          onConfirm={handleDeleteRoom}
        />
      </div>
    </AppLayout>
  );
}