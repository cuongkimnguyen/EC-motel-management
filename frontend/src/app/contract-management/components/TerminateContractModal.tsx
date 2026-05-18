'use client';

import { useState } from 'react';
import { ArrowPathIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { Contract } from '@/lib/mockData';

interface TerminateFormData {
  reason: string;
  terminationDate: string;
  refundDeposit: boolean;
  refundAmount: number;
  notes: string;
}

interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onConfirm: (contractId: string) => void;
}

export default function TerminateContractModal({ isOpen, onClose, contract, onConfirm }: TerminateContractModalProps) {
  const [formData, setFormData] = useState<TerminateFormData>({
    reason: '',
    terminationDate: new Date().toISOString().split('T')[0],
    refundDeposit: true,
    refundAmount: contract?.deposit ?? 0,
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TerminateFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Partial<Record<keyof TerminateFormData, string>> = {};
    if (!formData.reason) errs.reason = 'Chọn lý do chấm dứt';
    if (!formData.terminationDate) errs.terminationDate = 'Chọn ngày';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    if (contract) {
      onConfirm(contract.id);
    }
    setIsSubmitting(false);
    onClose();
  };

  if (!contract) return null;

  const fieldClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all text-slate-900";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const errorClass = "text-xs text-red-500 mt-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chấm dứt hợp đồng"
      subtitle={`${contract.code} — ${contract.tenantName} — ${contract.roomCode}`}
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button type="submit" form="terminate-form" disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60 min-w-[130px] justify-center">
            {isSubmitting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <XCircleIcon className="w-4 h-4" />}
            {isSubmitting ? 'Đang xử lý...' : 'Chấm dứt HĐ'}
          </button>
        </>
      }
    >
      <form id="terminate-form" onSubmit={onSubmit} noValidate>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm text-red-800">
            ⚠️ Hành động này <strong>không thể hoàn tác</strong>. Hợp đồng sẽ bị chấm dứt và phòng <strong>{contract.roomCode}</strong> sẽ được chuyển về trạng thái <strong>Trống</strong>.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Lý do chấm dứt <span className="text-red-500">*</span></label>
            <select
              value={formData.reason}
              onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className={fieldClass}
            >
              <option value="">-- Chọn lý do --</option>
              <option value="Khách tự ý chuyển đi">Khách tự ý chuyển đi</option>
              <option value="Hết hạn hợp đồng">Hết hạn hợp đồng</option>
              <option value="Vi phạm điều khoản">Vi phạm điều khoản hợp đồng</option>
              <option value="Hai bên thỏa thuận">Hai bên thỏa thuận chấm dứt</option>
              <option value="Chủ nhà yêu cầu">Chủ nhà yêu cầu lấy lại phòng</option>
              <option value="Khác">Lý do khác</option>
            </select>
            {errors.reason && <p className={errorClass}>{errors.reason}</p>}
          </div>

          <div>
            <label className={labelClass}>Ngày chấm dứt hiệu lực <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.terminationDate}
              onChange={e => setFormData(prev => ({ ...prev, terminationDate: e.target.value }))}
              className={fieldClass}
            />
            {errors.terminationDate && <p className={errorClass}>{errors.terminationDate}</p>}
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="refundDeposit"
              checked={formData.refundDeposit}
              onChange={e => setFormData(prev => ({ ...prev, refundDeposit: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-teal-600"
            />
            <label htmlFor="refundDeposit" className="text-sm text-slate-700 font-medium">
              Hoàn trả tiền cọc ({(contract.deposit / 1000000).toFixed(0)}tr ₫)
            </label>
          </div>

          <div>
            <label className={labelClass}>Ghi chú thêm</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className={`${fieldClass} resize-none`}
              placeholder="Tình trạng phòng khi bàn giao, tài sản thiếu, v.v."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}