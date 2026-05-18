'use client';

import { useState } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { Room } from '@/lib/mockData';

interface DeleteRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onConfirm: (roomId: string) => void;
}

export default function DeleteRoomModal({ isOpen, onClose, room, onConfirm }: DeleteRoomModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!room) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 700));
    onConfirm(room.id);
    setDeleting(false);
    onClose();
  };

  if (!room) return null;

  const canDelete = room.status !== 'Đang thuê';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa phòng"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60 min-w-[100px] justify-center"
            >
              {deleting ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : null}
              {deleting ? 'Đang xóa...' : 'Xóa phòng'}
            </button>
          )}
        </>
      }
    >
      <div className="text-center py-2">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        {!canDelete ? (
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">Không thể xóa phòng đang cho thuê</p>
            <p className="text-sm text-slate-500">
              Phòng <strong>{room.code}</strong> đang có khách thuê. Vui lòng chấm dứt hợp đồng trước khi xóa phòng.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">
              Xóa phòng <span className="text-red-600">{room.code} — {room.name}</span>?
            </p>
            <p className="text-sm text-slate-500">
              Hành động này không thể hoàn tác. Toàn bộ lịch sử hợp đồng và dữ liệu liên quan đến phòng này sẽ bị xóa vĩnh viễn.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}