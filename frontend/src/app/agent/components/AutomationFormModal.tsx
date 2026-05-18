'use client';

import { useState } from 'react';
import { AutomationFormData } from '../types';
import { createAutomation } from '../agentService';
import { AutomationItem } from '../types';
import { XMarkIcon, BoltIcon } from '@heroicons/react/24/outline';

interface AutomationFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (item: AutomationItem) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM: AutomationFormData = {
  name: '',
  description: '',
  triggerType: '',
  frequency: '',
  runTime: '08:00',
  module: '',
  condition: '',
  action: '',
  notifyRecipient: '',
  notifyChannel: '',
  enableImmediately: true,
};

export default function AutomationFormModal({ open, onClose, onCreated, onToast }: AutomationFormModalProps) {
  const [form, setForm] = useState<AutomationFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof AutomationFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const set = (field: keyof AutomationFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Partial<Record<keyof AutomationFormData, string>> = {};
    if (!form.name.trim()) e.name = 'Tên automation là bắt buộc';
    if (!form.triggerType) e.triggerType = 'Loại trigger là bắt buộc';
    if (!form.action.trim()) e.action = 'Hành động AI là bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const item = await createAutomation(form);
      onCreated(item);
      onToast('Đã tạo automation thành công!');
      setForm(EMPTY_FORM);
      onClose();
    } catch {
      onToast('Không thể tạo automation', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field: keyof AutomationFormData) =>
    `w-full text-sm border rounded-xl px-3 py-2.5 outline-none transition-colors ${
      errors[field]
        ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400/30' :'border-slate-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30'
    } bg-white text-slate-900 placeholder-slate-400`;

  const selectClass = (field: keyof AutomationFormData) =>
    `w-full text-sm border rounded-xl px-3 py-2.5 outline-none transition-colors ${
      errors[field]
        ? 'border-red-300 focus:border-red-400' :'border-slate-200 focus:border-teal-400'
    } bg-white text-slate-900`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <BoltIcon className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Tạo automation mới</h2>
              <p className="text-xs text-slate-500">Thiết lập quy trình tự động hóa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên automation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="VD: Nhắc thanh toán tiền phòng hàng tháng"
              className={inputClass('name')}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Mô tả ngắn về automation này..."
              rows={2}
              className={inputClass('description') + ' resize-none'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Trigger type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Loại trigger <span className="text-red-500">*</span>
              </label>
              <select value={form.triggerType} onChange={(e) => set('triggerType', e.target.value)} className={selectClass('triggerType')}>
                <option value="">Chọn loại trigger</option>
                <option value="schedule">Theo lịch</option>
                <option value="event">Theo sự kiện</option>
                <option value="condition">Theo điều kiện</option>
              </select>
              {errors.triggerType && <p className="text-xs text-red-500 mt-1">{errors.triggerType}</p>}
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tần suất</label>
              <select value={form.frequency} onChange={(e) => set('frequency', e.target.value)} className={selectClass('frequency')}>
                <option value="">Chọn tần suất</option>
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Run time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Thời gian chạy</label>
              <input
                type="time"
                value={form.runTime}
                onChange={(e) => set('runTime', e.target.value)}
                className={inputClass('runTime')}
              />
            </div>

            {/* Module */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Module liên quan</label>
              <select value={form.module} onChange={(e) => set('module', e.target.value)} className={selectClass('module')}>
                <option value="">Chọn module</option>
                <option value="rooms">Phòng</option>
                <option value="contracts">Hợp đồng</option>
                <option value="tenants">Khách thuê</option>
                <option value="expenses">Chi phí</option>
                <option value="reports">Báo cáo</option>
                <option value="posts">Bài đăng</option>
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Điều kiện áp dụng</label>
            <input
              type="text"
              value={form.condition}
              onChange={(e) => set('condition', e.target.value)}
              placeholder="VD: Khi có khách thuê quá hạn thanh toán > 3 ngày"
              className={inputClass('condition')}
            />
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hành động AI sẽ thực hiện <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.action}
              onChange={(e) => set('action', e.target.value)}
              placeholder="VD: Gửi thông báo nhắc nhở đến khách thuê, tạo danh sách công nợ..."
              rows={2}
              className={inputClass('action') + ' resize-none'}
            />
            {errors.action && <p className="text-xs text-red-500 mt-1">{errors.action}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Notify recipient */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Người nhận thông báo</label>
              <input
                type="text"
                value={form.notifyRecipient}
                onChange={(e) => set('notifyRecipient', e.target.value)}
                placeholder="VD: Admin, Chủ nhà"
                className={inputClass('notifyRecipient')}
              />
            </div>

            {/* Notify channel */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kênh thông báo</label>
              <select value={form.notifyChannel} onChange={(e) => set('notifyChannel', e.target.value)} className={selectClass('notifyChannel')}>
                <option value="">Chọn kênh</option>
                <option value="in_app">Trong ứng dụng</option>
                <option value="email">Email</option>
                <option value="sms">SMS (mock)</option>
                <option value="zalo">Zalo (mock)</option>
              </select>
            </div>
          </div>

          {/* Enable immediately */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="enableImmediately"
              checked={form.enableImmediately}
              onChange={(e) => set('enableImmediately', e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <label htmlFor="enableImmediately" className="text-sm text-slate-700 cursor-pointer">
              Bật ngay sau khi tạo
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Đang tạo...' : 'Tạo automation'}
          </button>
        </div>
      </div>
    </div>
  );
}
