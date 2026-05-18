'use client';

import { useEffect, useState, useRef } from 'react';
import { MagnifyingGlassIcon, UserPlusIcon, ChevronDownIcon, XMarkIcon, CheckIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { Contract, mockRooms, mockTenants, Tenant } from '@/lib/mockData';

interface ContractFormData {
  roomId: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantCCCD: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  billingCycle: number;
  paymentDueDay: number;
  notes: string;
}

interface NewTenantFormData {
  full_name: string;
  phone_number: string;
  id_number: string;
  address: string;
  note: string;
}

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: Contract | null;
  onSave: (data: ContractFormData) => void;
  mode?: 'create' | 'edit' | 'renew';
}

const availableRooms = mockRooms.filter(r => r.status === 'Trống' || r.status === 'Đã đặt');

let runtimeTenants: Tenant[] = [...mockTenants];

const emptyForm: ContractFormData = {
  roomId: '', tenantId: '', tenantName: '', tenantPhone: '', tenantCCCD: '',
  startDate: new Date().toISOString().split('T')[0], endDate: '',
  monthlyRent: 0, deposit: 0, billingCycle: 1, paymentDueDay: 5, notes: '',
};

const emptyNewTenant: NewTenantFormData = {
  full_name: '', phone_number: '', id_number: '', address: '', note: '',
};

export default function ContractFormModal({ isOpen, onClose, contract, onSave, mode = 'create' }: ContractFormModalProps) {
  const isEdit = mode === 'edit';
  const isRenew = mode === 'renew';

  const [formData, setFormData] = useState<ContractFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ContractFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tenantSearch, setTenantSearch] = useState('');
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantError, setTenantError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newTenantLoading, setNewTenantLoading] = useState(false);
  const [newTenantData, setNewTenantData] = useState<NewTenantFormData>(emptyNewTenant);
  const [newTenantErrors, setNewTenantErrors] = useState<Partial<Record<keyof NewTenantFormData, string>>>({});
  const [allTenants, setAllTenants] = useState<Tenant[]>(runtimeTenants);

  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false });

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: '', visible: false }), 3000);
  };

  const filteredTenants = allTenants.filter(t => {
    const q = tenantSearch.toLowerCase();
    return t.fullName.toLowerCase().includes(q) || t.phone.includes(q);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTenantDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (formData.roomId) {
      const room = mockRooms.find(r => r.id === formData.roomId);
      if (room) {
        setFormData(prev => ({ ...prev, monthlyRent: room.rentPrice, deposit: room.deposit }));
      }
    }
  }, [formData.roomId]);

  useEffect(() => {
    if (!isOpen) return;
    if (contract && (isEdit || isRenew)) {
      setFormData({
        roomId: contract.roomId,
        tenantId: contract.tenantId,
        tenantName: contract.tenantName,
        tenantPhone: contract.tenantPhone,
        tenantCCCD: contract.tenantCCCD,
        startDate: isRenew ? new Date().toISOString().split('T')[0] : contract.startDate,
        endDate: isRenew ? '' : contract.endDate,
        monthlyRent: contract.monthlyRent,
        deposit: contract.deposit,
        billingCycle: contract.billingCycle,
        paymentDueDay: contract.paymentDueDay,
        notes: isRenew ? `Gia hạn từ HĐ ${contract.code}` : contract.notes,
      });
      const t = allTenants.find(x => x.id === contract.tenantId);
      if (t) setSelectedTenant(t);
    } else if (!contract) {
      setFormData(emptyForm);
      setSelectedTenant(null);
      setTenantSearch('');
      setTenantError('');
      setFormErrors({});
    }
  }, [contract, isEdit, isRenew, isOpen]);

  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantSearch('');
    setShowTenantDropdown(false);
    setTenantError('');
    setFormData(prev => ({ ...prev, tenantId: tenant.id, tenantName: tenant.fullName, tenantPhone: tenant.phone, tenantCCCD: tenant.cccd }));
  };

  const handleClearTenant = () => {
    setSelectedTenant(null);
    setTenantSearch('');
    setFormData(prev => ({ ...prev, tenantId: '', tenantName: '', tenantPhone: '', tenantCCCD: '' }));
  };

  const validateForm = (): boolean => {
    const errs: Partial<Record<keyof ContractFormData, string>> = {};
    if (!formData.roomId) errs.roomId = 'Vui lòng chọn phòng';
    if (!formData.startDate) errs.startDate = 'Chọn ngày bắt đầu';
    if (!formData.endDate) errs.endDate = 'Chọn ngày kết thúc';
    if (!formData.monthlyRent || formData.monthlyRent < 100000) errs.monthlyRent = 'Tối thiểu 100.000 ₫';
    if (formData.deposit < 0) errs.deposit = 'Không hợp lệ';
    if (formData.paymentDueDay < 1 || formData.paymentDueDay > 28) errs.paymentDueDay = 'Từ ngày 1 đến 28';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveNewTenant = async () => {
    const errs: Partial<Record<keyof NewTenantFormData, string>> = {};
    if (!newTenantData.full_name.trim()) errs.full_name = 'Nhập họ tên khách thuê';
    if (!newTenantData.phone_number.trim()) errs.phone_number = 'Nhập số điện thoại';
    else if (!/^0[0-9]{9}$/.test(newTenantData.phone_number)) errs.phone_number = 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu 0)';
    const duplicate = allTenants.find(t => t.phone === newTenantData.phone_number);
    if (duplicate) errs.phone_number = `Số điện thoại đã tồn tại (${duplicate.fullName})`;
    setNewTenantErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setNewTenantLoading(true);
    await new Promise(r => setTimeout(r, 700));

    const newTenant: Tenant = {
      id: `t_new_${Date.now()}`,
      fullName: newTenantData.full_name,
      phone: newTenantData.phone_number,
      cccd: newTenantData.id_number || '',
      gender: 'Nam',
      dateOfBirth: '',
      permanentAddress: newTenantData.address || '',
      currentRoomId: null,
      currentRoomCode: null,
      status: 'Đang thuê',
      debt: 0,
      notes: newTenantData.note || '',
    };

    runtimeTenants = [...runtimeTenants, newTenant];
    setAllTenants([...runtimeTenants]);
    setNewTenantLoading(false);
    setShowNewTenantModal(false);
    setNewTenantData(emptyNewTenant);
    handleSelectTenant(newTenant);
    showToast(`Đã tạo khách thuê "${newTenant.fullName}" và tự động chọn`);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant && !isEdit && !isRenew) {
      setTenantError('Vui lòng chọn hoặc tạo khách thuê');
      return;
    }
    if (!validateForm()) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    onSave(formData);
    const msg = isRenew ? 'Đã gia hạn hợp đồng thành công' : isEdit ? 'Đã cập nhật hợp đồng' : 'Đã tạo hợp đồng mới thành công';
    showToast(msg);
    setIsSubmitting(false);
    onClose();
  };

  const fieldClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-slate-900 placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const errorClass = "text-xs text-red-500 mt-1";
  const helperClass = "text-xs text-slate-400 mt-1";

  const titleMap = { create: 'Tạo hợp đồng mới', edit: 'Chỉnh sửa hợp đồng', renew: 'Gia hạn hợp đồng' };
  const btnMap = { create: 'Tạo hợp đồng', edit: 'Cập nhật', renew: 'Gia hạn' };

  return (
    <>
      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-[100] bg-teal-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckIcon className="w-4 h-4" />
          {toast.msg}
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={titleMap[mode]}
        subtitle={isRenew ? `Gia hạn từ hợp đồng ${contract?.code}` : 'Điền đầy đủ thông tin hợp đồng thuê phòng'}
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
              form="contract-form"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 active:scale-95 min-w-[130px] justify-center ${
                isRenew ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSubmitting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Đang lưu...' : btnMap[mode]}
            </button>
          </>
        }
      >
        <form id="contract-form" onSubmit={onSubmit} noValidate>
          {isRenew && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-800">
              <strong>Gia hạn hợp đồng:</strong> Hợp đồng cũ <strong>{contract?.code}</strong> sẽ được đánh dấu hết hạn.
              Hợp đồng mới sẽ được tạo từ ngày bắt đầu mới.
            </div>
          )}

          {/* Section 1: Phòng thuê */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">1</span>
              Phòng thuê
            </h3>
            <div>
              <label className={labelClass}>Phòng thuê <span className="text-red-500">*</span></label>
              <select
                value={formData.roomId}
                onChange={e => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                className={fieldClass}
                disabled={isEdit || isRenew}
              >
                <option value="">-- Chọn phòng --</option>
                {(isEdit || isRenew ? mockRooms : availableRooms).map(r => (
                  <option key={r.id} value={r.id}>{r.code} — {r.name} ({r.floor}, {r.block}) — {(r.rentPrice / 1000000).toFixed(1)}tr/tháng</option>
                ))}
              </select>
              {formErrors.roomId && <p className={errorClass}>{formErrors.roomId}</p>}
              <p className={helperClass}>Chỉ hiển thị phòng trống hoặc đã đặt cọc</p>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4" />

          {/* Section 2: Thông tin khách thuê */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">2</span>
              Thông tin khách thuê
            </h3>

            {selectedTenant ? (
              <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{selectedTenant.fullName}</p>
                  <p className="text-xs text-slate-500">{selectedTenant.phone}{selectedTenant.cccd ? ` · CCCD: ${selectedTenant.cccd}` : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full font-medium">
                    <CheckIcon className="w-3 h-3" /> Đã chọn
                  </span>
                  {!isEdit && !isRenew && (
                    <button
                      type="button"
                      onClick={handleClearTenant}
                      className="ml-1 p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                      title="Bỏ chọn"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div ref={dropdownRef} className="relative">
                  <label className={labelClass}>Chọn khách thuê có sẵn</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      value={tenantSearch}
                      onChange={e => { setTenantSearch(e.target.value); setShowTenantDropdown(true); }}
                      onFocus={() => setShowTenantDropdown(true)}
                      className={`${fieldClass} pl-9 pr-8`}
                      placeholder="Tìm theo tên hoặc số điện thoại..."
                    />
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>

                  {showTenantDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      {filteredTenants.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">Không tìm thấy khách thuê</div>
                      ) : (
                        filteredTenants.map(tenant => (
                          <button
                            key={tenant.id}
                            type="button"
                            onClick={() => handleSelectTenant(tenant)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{tenant.fullName}</p>
                              <p className="text-xs text-slate-500">{tenant.phone}{tenant.currentRoomCode ? ` · Phòng ${tenant.currentRoomCode}` : ' · Chưa có phòng'}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              tenant.status === 'Đang thuê' ? 'bg-green-100 text-green-700' :
                              tenant.status === 'Sắp hết hạn' ? 'bg-yellow-100 text-yellow-700' :
                              tenant.status === 'Nợ tiền' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                            }`}>{tenant.status}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">hoặc</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={() => { setShowNewTenantModal(true); setNewTenantData(emptyNewTenant); setNewTenantErrors({}); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 border-dashed rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  Thêm khách thuê mới
                </button>

                {tenantError && <p className={errorClass}>{tenantError}</p>}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 my-4" />

          {/* Section 3: Thời hạn */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">3</span>
              Thời hạn hợp đồng
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ngày bắt đầu <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className={fieldClass}
                />
                {formErrors.startDate && <p className={errorClass}>{formErrors.startDate}</p>}
              </div>
              <div>
                <label className={labelClass}>Ngày kết thúc <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={fieldClass}
                />
                {formErrors.endDate && <p className={errorClass}>{formErrors.endDate}</p>}
              </div>
              <div>
                <label className={labelClass}>Chu kỳ thanh toán</label>
                <select
                  value={formData.billingCycle}
                  onChange={e => setFormData(prev => ({ ...prev, billingCycle: Number(e.target.value) }))}
                  className={fieldClass}
                >
                  <option value={1}>Hàng tháng (1 tháng)</option>
                  <option value={3}>Hàng quý (3 tháng)</option>
                  <option value={6}>Nửa năm (6 tháng)</option>
                  <option value={12}>Hàng năm (12 tháng)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Ngày đóng tiền hàng tháng</label>
                <input
                  type="number"
                  value={formData.paymentDueDay}
                  onChange={e => setFormData(prev => ({ ...prev, paymentDueDay: Number(e.target.value) }))}
                  className={fieldClass}
                  placeholder="5"
                  min={1}
                  max={28}
                />
                <p className={helperClass}>Ngày trong tháng khách phải đóng tiền (1–28)</p>
                {formErrors.paymentDueDay && <p className={errorClass}>{formErrors.paymentDueDay}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4" />

          {/* Section 4: Tài chính */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">4</span>
              Tài chính
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tiền thuê/tháng (₫) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.monthlyRent || ''}
                  onChange={e => setFormData(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))}
                  className={fieldClass}
                  placeholder="3000000"
                />
                {formErrors.monthlyRent && <p className={errorClass}>{formErrors.monthlyRent}</p>}
              </div>
              <div>
                <label className={labelClass}>Tiền đặt cọc (₫) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.deposit || ''}
                  onChange={e => setFormData(prev => ({ ...prev, deposit: Number(e.target.value) }))}
                  className={fieldClass}
                  placeholder="6000000"
                />
                <p className={helperClass}>Tự động điền từ thông tin phòng</p>
                {formErrors.deposit && <p className={errorClass}>{formErrors.deposit}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4" />

          {/* Section 5: Ghi chú */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-teal-100 text-teal-700 rounded text-xs font-bold flex items-center justify-center">5</span>
              Điều khoản & Ghi chú
            </h3>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className={`${fieldClass} resize-none`}
              placeholder="Ghi chú đặc biệt về hợp đồng, điều khoản thêm, thoả thuận riêng..."
            />
          </div>
        </form>
      </Modal>

      {/* New Tenant Modal */}
      {showNewTenantModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewTenantModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Thêm khách thuê mới</h2>
                <p className="text-xs text-slate-500 mt-0.5">Khách thuê sẽ được tự động chọn vào hợp đồng</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTenantModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
                <input
                  value={newTenantData.full_name}
                  onChange={e => setNewTenantData(prev => ({ ...prev, full_name: e.target.value }))}
                  className={fieldClass}
                  placeholder="Nguyễn Văn A"
                />
                {newTenantErrors.full_name && <p className={errorClass}>{newTenantErrors.full_name}</p>}
              </div>

              <div>
                <label className={labelClass}>Số điện thoại <span className="text-red-500">*</span></label>
                <input
                  value={newTenantData.phone_number}
                  onChange={e => setNewTenantData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className={fieldClass}
                  placeholder="0901234567"
                />
                {newTenantErrors.phone_number && <p className={errorClass}>{newTenantErrors.phone_number}</p>}
                <p className={helperClass}>Dùng để kiểm tra trùng lặp khách thuê</p>
              </div>

              <div>
                <label className={labelClass}>Số CCCD / CMND</label>
                <input
                  value={newTenantData.id_number}
                  onChange={e => setNewTenantData(prev => ({ ...prev, id_number: e.target.value }))}
                  className={fieldClass}
                  placeholder="001234567890 (không bắt buộc)"
                />
              </div>

              <div>
                <label className={labelClass}>Địa chỉ thường trú</label>
                <input
                  value={newTenantData.address}
                  onChange={e => setNewTenantData(prev => ({ ...prev, address: e.target.value }))}
                  className={fieldClass}
                  placeholder="Số nhà, đường, phường/xã, tỉnh/thành..."
                />
              </div>

              <div>
                <label className={labelClass}>Ghi chú</label>
                <textarea
                  value={newTenantData.note}
                  onChange={e => setNewTenantData(prev => ({ ...prev, note: e.target.value }))}
                  rows={2}
                  className={`${fieldClass} resize-none`}
                  placeholder="Ghi chú nội bộ về khách thuê..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowNewTenantModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNewTenant}
                disabled={newTenantLoading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-60 min-w-[120px] justify-center"
              >
                {newTenantLoading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <UserPlusIcon className="w-4 h-4" />}
                {newTenantLoading ? 'Đang lưu...' : 'Lưu & chọn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}