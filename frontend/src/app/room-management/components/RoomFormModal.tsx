'use client';

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { Room } from '@/lib/mockData';

interface RoomFormData {
  code: string;
  name: string;
  floor: string;
  block: string;
  area: number;
  rentPrice: number;
  deposit: number;
  electricityPrice: number;
  waterPrice: number;
  serviceFee: number;
  maxTenants: number;
  status: string;
  description: string;
}

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
  onSave: (data: RoomFormData) => void;
}

const DEFAULT_FORM: RoomFormData = {
  code: '',
  name: '',
  floor: 'Tầng 1',
  block: 'Khu A',
  area: 20,
  rentPrice: 3000000,
  deposit: 6000000,
  electricityPrice: 3500,
  waterPrice: 15000,
  serviceFee: 100000,
  maxTenants: 2,
  status: 'Trống',
  description: '',
};

export default function RoomFormModal({ isOpen, onClose, room, onSave }: RoomFormModalProps) {
  const isEdit = !!room;
  const [form, setForm] = useState<RoomFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (room) {
        setForm({
          code: room.code,
          name: room.name,
          floor: room.floor,
          block: room.block,
          area: room.area,
          rentPrice: room.rentPrice,
          deposit: room.deposit,
          electricityPrice: room.electricityPrice,
          waterPrice: room.waterPrice,
          serviceFee: room.serviceFee,
          maxTenants: room.maxTenants,
          status: room.status,
          description: room.description,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setErrors({});
    }
  }, [room, isOpen]);

  const set = (key: keyof RoomFormData, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  function validate(): boolean {
    const e: Partial<Record<keyof RoomFormData, string>> = {};
    if (!form.code.trim()) e.code = 'Vui lòng nhập mã phòng';
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên phòng';
    if (!form.area || form.area < 5) e.area = 'Tối thiểu 5m²';
    if (!form.rentPrice || form.rentPrice < 500000) e.rentPrice = 'Tối thiểu 500.000 ₫';
    if (form.deposit < 0) e.deposit = 'Không hợp lệ';
    if (!form.maxTenants || form.maxTenants < 1) e.maxTenants = 'Tối thiểu 1 người';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    onSave(form);
    setSubmitting(false);
    onClose();
  };

  const fieldClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-900 placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const errorClass = "text-xs text-red-500 mt-1";
  const helperClass = "text-xs text-slate-400 mt-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa ${room?.name}` : 'Thêm phòng mới'}
      subtitle={isEdit ? `Mã phòng: ${room?.code}` : 'Điền đầy đủ thông tin để thêm phòng mới'}
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="room-form"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-60 active:scale-95 min-w-[120px] justify-center"
          >
            {submitting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              isEdit ? 'Cập nhật phòng' : 'Thêm phòng'
            )}
          </button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} noValidate>
        {/* Section: Thông tin cơ bản */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">1</span>
            Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Mã phòng <span className="text-red-500">*</span></label>
              <input
                value={form.code}
                onChange={e => set('code', e.target.value)}
                className={`${fieldClass} ${errors.code ? 'border-red-400' : ''}`}
                placeholder="VD: P101, PB02..."
              />
              {errors.code && <p className={errorClass}>{errors.code}</p>}
            </div>
            <div>
              <label className={labelClass}>Tên phòng <span className="text-red-500">*</span></label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className={`${fieldClass} ${errors.name ? 'border-red-400' : ''}`}
                placeholder="VD: Phòng 101"
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Khu <span className="text-red-500">*</span></label>
              <select value={form.block} onChange={e => set('block', e.target.value)} className={fieldClass}>
                <option value="Khu A">Khu A</option>
                <option value="Khu B">Khu B</option>
                <option value="Khu C">Khu C</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tầng <span className="text-red-500">*</span></label>
              <select value={form.floor} onChange={e => set('floor', e.target.value)} className={fieldClass}>
                <option value="Tầng 1">Tầng 1</option>
                <option value="Tầng 2">Tầng 2</option>
                <option value="Tầng 3">Tầng 3</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Diện tích (m²) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.area}
                onChange={e => set('area', Number(e.target.value))}
                className={`${fieldClass} ${errors.area ? 'border-red-400' : ''}`}
                placeholder="20"
              />
              {errors.area && <p className={errorClass}>{errors.area}</p>}
            </div>
            <div>
              <label className={labelClass}>Số người tối đa <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.maxTenants}
                onChange={e => set('maxTenants', Number(e.target.value))}
                className={`${fieldClass} ${errors.maxTenants ? 'border-red-400' : ''}`}
                placeholder="2"
              />
              {errors.maxTenants && <p className={errorClass}>{errors.maxTenants}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* Section: Giá cả */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">2</span>
            Giá cả & Phí dịch vụ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Giá thuê/tháng (₫) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.rentPrice}
                onChange={e => set('rentPrice', Number(e.target.value))}
                className={`${fieldClass} ${errors.rentPrice ? 'border-red-400' : ''}`}
                placeholder="3000000"
              />
              <p className={helperClass}>Tiền thuê hàng tháng cơ bản</p>
              {errors.rentPrice && <p className={errorClass}>{errors.rentPrice}</p>}
            </div>
            <div>
              <label className={labelClass}>Tiền cọc (₫) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.deposit}
                onChange={e => set('deposit', Number(e.target.value))}
                className={`${fieldClass} ${errors.deposit ? 'border-red-400' : ''}`}
                placeholder="6000000"
              />
              <p className={helperClass}>Thường bằng 2 tháng tiền thuê</p>
              {errors.deposit && <p className={errorClass}>{errors.deposit}</p>}
            </div>
            <div>
              <label className={labelClass}>Giá điện (₫/kWh)</label>
              <input
                type="number"
                value={form.electricityPrice}
                onChange={e => set('electricityPrice', Number(e.target.value))}
                className={fieldClass}
                placeholder="3500"
              />
              <p className={helperClass}>Giá điện áp dụng cho phòng này</p>
            </div>
            <div>
              <label className={labelClass}>Giá nước (₫/m³)</label>
              <input
                type="number"
                value={form.waterPrice}
                onChange={e => set('waterPrice', Number(e.target.value))}
                className={fieldClass}
                placeholder="15000"
              />
              <p className={helperClass}>Giá nước sinh hoạt</p>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Phí dịch vụ/tháng (₫)</label>
              <input
                type="number"
                value={form.serviceFee}
                onChange={e => set('serviceFee', Number(e.target.value))}
                className={fieldClass}
                placeholder="100000"
              />
              <p className={helperClass}>Phí internet, vệ sinh, bảo vệ, v.v.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* Section: Trạng thái & Mô tả */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">3</span>
            Trạng thái & Mô tả
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Trạng thái phòng</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={fieldClass}>
                <option value="Trống">Trống</option>
                <option value="Đang thuê">Đang thuê</option>
                <option value="Đã đặt">Đã đặt</option>
                <option value="Bảo trì">Bảo trì</option>
              </select>
              <p className={helperClass}>Trạng thái tự động cập nhật khi có hợp đồng</p>
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Mô tả phòng</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className={`${fieldClass} resize-none`}
              placeholder="Mô tả tiện nghi, đặc điểm nổi bật của phòng..."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}