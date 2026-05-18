'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { mockTenants, mockRooms, Tenant, TenantStatus, formatCurrency, formatDate, getTenantStatusColor } from '@/lib/mockData';
import {
  MagnifyingGlassIcon, PlusIcon, ArrowDownTrayIcon, EllipsisVerticalIcon,
  XMarkIcon, EyeIcon, PencilIcon, ClockIcon, PhoneIcon, DocumentTextIcon,
  ArrowRightOnRectangleIcon, TrashIcon, UserIcon, HomeIcon, CreditCardIcon,
  DocumentDuplicateIcon, UsersIcon, ExclamationTriangleIcon,
  CheckCircleIcon, XCircleIcon, ArrowUpTrayIcon, PaperAirplaneIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalMode = 'detail' | 'create' | 'edit' | null;
type DetailTab = 'info' | 'contract' | 'history' | 'payment' | 'notes';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const color = getTenantStatusColor(status);
  const dot =
    status === 'Đang thuê' ? 'bg-emerald-500' :
    status === 'Sắp hết hạn' ? 'bg-amber-500' :
    status === 'Nợ tiền' ? 'bg-red-500' : 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2 py-1 whitespace-nowrap ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {status}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────
function RowActions({ tenant, onView, onEdit, onDelete }: {
  tenant: Tenant;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = [
    { icon: <EyeIcon className="w-3.5 h-3.5" />, label: 'Xem chi tiết', action: onView },
    { icon: <PencilIcon className="w-3.5 h-3.5" />, label: 'Sửa thông tin', action: onEdit },
    { icon: <HistoryIcon className="w-3.5 h-3.5" />, label: 'Xem lịch sử thuê', action: onView },
    { icon: <PhoneIcon className="w-3.5 h-3.5" />, label: 'Liên hệ', action: () => {} },
    { icon: <DocumentTextIcon className="w-3.5 h-3.5" />, label: 'Tạo hợp đồng', action: () => {} },
    { icon: <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />, label: 'Kết thúc thuê', action: () => {}, danger: false },
    { icon: <TrashIcon className="w-3.5 h-3.5" />, label: 'Xóa', action: onDelete, danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={item.danger ? 'text-red-500' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function TenantDetailModal({ tenant, onClose, onEdit }: { tenant: Tenant; onClose: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState<DetailTab>('info');

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Thông tin cá nhân', icon: <UserIcon className="w-3.5 h-3.5" /> },
    { key: 'contract', label: 'Hợp đồng', icon: <DocumentTextIcon className="w-3.5 h-3.5" /> },
    { key: 'history', label: 'Lịch sử thuê', icon: <HistoryIcon className="w-3.5 h-3.5" /> },
    { key: 'payment', label: 'Thanh toán', icon: <CreditCardIcon className="w-3.5 h-3.5" /> },
    { key: 'notes', label: 'Ghi chú nội bộ', icon: <DocumentDuplicateIcon className="w-3.5 h-3.5" /> },
  ];

  const mockPayments = [
    { date: '05/03/2025', amount: tenant.currentRoomId ? 3500000 : 0, type: 'Tiền thuê tháng 3', status: 'Đã thanh toán' },
    { date: '05/02/2025', amount: tenant.currentRoomId ? 3500000 : 0, type: 'Tiền thuê tháng 2', status: 'Đã thanh toán' },
    { date: '05/01/2025', amount: tenant.currentRoomId ? 3500000 : 0, type: 'Tiền thuê tháng 1', status: 'Đã thanh toán' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {tenant.fullName.split(' ').slice(-1)[0][0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{tenant.fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <TenantStatusBadge status={tenant.status} />
                {tenant.currentRoomCode && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <HomeIcon className="w-3 h-3" /> {tenant.currentRoomCode}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              <PencilIcon className="w-3.5 h-3.5" /> Sửa
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                tab === t.key
                  ? 'border-teal-600 text-teal-700' :'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Họ và tên', value: tenant.fullName },
                { label: 'Số điện thoại', value: tenant.phone },
                { label: 'CCCD', value: tenant.cccd },
                { label: 'Ngày sinh', value: formatDate(tenant.dateOfBirth) },
                { label: 'Giới tính', value: tenant.gender },
                { label: 'Nghề nghiệp', value: tenant.occupation || '—' },
                { label: 'Biển số xe', value: tenant.licensePlate || '—' },
                { label: 'Địa chỉ thường trú', value: tenant.permanentAddress, full: true },
                { label: 'Ghi chú', value: tenant.notes || '—', full: true },
              ].map((field, i) => (
                <div key={i} className={field.full ? 'col-span-2' : ''}>
                  <p className="text-xs text-slate-500 mb-1">{field.label}</p>
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 rounded-lg px-3 py-2">{field.value}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'contract' && (
            <div className="space-y-3">
              {tenant.contractCode ? (
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-900">{tenant.contractCode}</span>
                    <TenantStatusBadge status={tenant.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-500 text-xs">Phòng</p><p className="font-medium">{tenant.currentRoomCode || '—'}</p></div>
                    <div><p className="text-slate-500 text-xs">Ngày bắt đầu</p><p className="font-medium">{tenant.startDate ? formatDate(tenant.startDate) : '—'}</p></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Không có hợp đồng hiện tại</p>
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tenant.currentRoomCode || 'Không có phòng'}</p>
                    <p className="text-xs text-slate-500">{tenant.startDate ? formatDate(tenant.startDate) : '—'} — Hiện tại</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'payment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-emerald-700 mb-1">Tổng tiền đã đóng</p>
                  <p className="text-xl font-bold text-emerald-700">{formatCurrency(10500000)}</p>
                </div>
                <div className={`rounded-xl p-4 ${tenant.debt > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <p className={`text-xs mb-1 ${tenant.debt > 0 ? 'text-red-700' : 'text-slate-500'}`}>Công nợ hiện tại</p>
                  <p className={`text-xl font-bold ${tenant.debt > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                    {tenant.debt > 0 ? formatCurrency(tenant.debt) : '0đ'}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Lịch sử thanh toán</h4>
                <div className="space-y-2">
                  {mockPayments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.type}</p>
                        <p className="text-xs text-slate-500">{p.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.amount)}</p>
                        <span className="text-xs text-emerald-600 font-medium">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">{tenant.notes || 'Chưa có ghi chú nội bộ.'}</p>
              </div>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows={4}
                placeholder="Thêm ghi chú nội bộ..."
              />
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                <PaperAirplaneIcon className="w-3.5 h-3.5" /> Lưu ghi chú
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create/Edit Modal ────────────────────────────────────────────────────────
function TenantFormModal({ tenant, onClose, onSave }: {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (data: Partial<Tenant>) => void;
}) {
  const isEdit = !!tenant;
  const [form, setForm] = useState({
    fullName: tenant?.fullName || '',
    phone: tenant?.phone || '',
    cccd: tenant?.cccd || '',
    dateOfBirth: tenant?.dateOfBirth || '',
    gender: tenant?.gender || 'Nam',
    permanentAddress: tenant?.permanentAddress || '',
    occupation: tenant?.occupation || '',
    licensePlate: tenant?.licensePlate || '',
    notes: tenant?.notes || '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Sửa thông tin khách thuê' : 'Thêm khách thuê mới'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
              <input value={form.fullName} onChange={e => set('fullName', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="0901234567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">CCCD <span className="text-red-500">*</span></label>
              <input value={form.cccd} onChange={e => set('cccd', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="001234567890" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Ngày sinh</label>
              <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Giới tính</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Địa chỉ thường trú</label>
              <input value={form.permanentAddress} onChange={e => set('permanentAddress', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Số nhà, đường, phường/xã, tỉnh/thành" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Nghề nghiệp</label>
              <input value={form.occupation} onChange={e => set('occupation', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Sinh viên, nhân viên văn phòng..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Biển số xe</label>
              <input value={form.licensePlate} onChange={e => set('licensePlate', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="30A-12345" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Upload ảnh CCCD</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-teal-400 transition-colors cursor-pointer">
                <ArrowUpTrayIcon className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Kéo thả hoặc <span className="text-teal-600 font-medium">chọn file</span></p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG tối đa 5MB</p>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Ghi chú</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="Ghi chú thêm về khách thuê..." />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            {isEdit ? 'Lưu thay đổi' : 'Thêm khách thuê'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tenants.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.fullName.toLowerCase().includes(q) && !t.phone.includes(q) && !t.cccd.includes(q)) return false;
      }
      if (statusFilter && t.status !== statusFilter) return false;
      if (genderFilter && t.gender !== genderFilter) return false;
      if (blockFilter) {
        const room = mockRooms.find(r => r.id === t.currentRoomId);
        if (!room || room.block !== blockFilter) return false;
      }
      return true;
    });
  }, [tenants, search, statusFilter, genderFilter, blockFilter]);

  const kpis = useMemo(() => ({
    total: tenants.length,
    active: tenants.filter(t => t.status === 'Đang thuê').length,
    expiring: tenants.filter(t => t.status === 'Sắp hết hạn').length,
    debt: tenants.filter(t => t.status === 'Nợ tiền').length,
    left: tenants.filter(t => t.status === 'Đã trả phòng').length,
  }), [tenants]);

  const openDetail = (t: Tenant) => { setSelectedTenant(t); setModalMode('detail'); };
  const openEdit = (t: Tenant) => { setSelectedTenant(t); setModalMode('edit'); };
  const openCreate = () => { setSelectedTenant(null); setModalMode('create'); };
  const closeModal = () => { setModalMode(null); setSelectedTenant(null); };

  const handleSave = (data: Partial<Tenant>) => {
    if (modalMode === 'create') {
      const newT: Tenant = {
        id: `t${Date.now()}`,
        fullName: data.fullName || '',
        phone: data.phone || '',
        cccd: data.cccd || '',
        gender: (data.gender as 'Nam' | 'Nữ') || 'Nam',
        dateOfBirth: data.dateOfBirth || '',
        permanentAddress: data.permanentAddress || '',
        currentRoomId: null,
        currentRoomCode: null,
        occupation: data.occupation,
        licensePlate: data.licensePlate,
        notes: data.notes,
        status: 'Đang thuê',
        debt: 0,
      };
      setTenants(prev => [newT, ...prev]);
    } else if (modalMode === 'edit' && selectedTenant) {
      setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, ...data } : t));
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    setDeleteId(null);
  };

  const blocks = [...new Set(mockRooms.map(r => r.block))];

  return (
    <AppLayout>
      <div className="fade-in">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Khách thuê</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý hồ sơ khách thuê và lịch sử thuê phòng</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KPICard label="Tổng khách thuê" value={kpis.total} icon={<UsersIcon className="w-5 h-5 text-slate-600" />} color="bg-slate-100" />
          <KPICard label="Đang thuê" value={kpis.active} icon={<CheckCircleIcon className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100" />
          <KPICard label="Sắp hết hạn HĐ" value={kpis.expiring} icon={<ClockIcon className="w-5 h-5 text-amber-600" />} color="bg-amber-100" />
          <KPICard label="Có công nợ" value={kpis.debt} icon={<ExclamationTriangleIcon className="w-5 h-5 text-red-600" />} color="bg-red-100" />
          <KPICard label="Đã trả phòng" value={kpis.left} icon={<XCircleIcon className="w-5 h-5 text-slate-500" />} color="bg-slate-100" />
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Tìm theo tên, SĐT, CCCD..."
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option>Đang thuê</option>
              <option>Đã trả phòng</option>
              <option>Sắp hết hạn</option>
              <option>Nợ tiền</option>
            </select>

            {/* Gender filter */}
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Giới tính</option>
              <option>Nam</option>
              <option>Nữ</option>
            </select>

            {/* Block filter */}
            <select
              value={blockFilter}
              onChange={e => setBlockFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tất cả khu</option>
              {blocks.map(b => <option key={b}>{b}</option>)}
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <ArrowDownTrayIcon className="w-4 h-4" /> Xuất Excel
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" /> Thêm khách thuê
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Khách thuê', 'Số điện thoại', 'CCCD', 'Giới tính', 'Ngày sinh', 'Phòng', 'Hợp đồng', 'Ngày bắt đầu', 'Trạng thái', 'Công nợ', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {tenant.fullName.split(' ').slice(-1)[0][0]}
                        </div>
                        <button
                          onClick={() => openDetail(tenant)}
                          className="font-medium text-slate-900 hover:text-teal-700 transition-colors text-left"
                        >
                          {tenant.fullName}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tenant.phone}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{tenant.cccd}</td>
                    <td className="px-4 py-3 text-slate-600">{tenant.gender}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(tenant.dateOfBirth)}</td>
                    <td className="px-4 py-3">
                      {tenant.currentRoomCode ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                          <HomeIcon className="w-3 h-3" /> {tenant.currentRoomCode}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{tenant.contractCode || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{tenant.startDate ? formatDate(tenant.startDate) : '—'}</td>
                    <td className="px-4 py-3"><TenantStatusBadge status={tenant.status} /></td>
                    <td className="px-4 py-3">
                      {tenant.debt > 0 ? (
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(tenant.debt)}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">0đ</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        tenant={tenant}
                        onView={() => openDetail(tenant)}
                        onEdit={() => openEdit(tenant)}
                        onDelete={() => setDeleteId(tenant.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                <UsersIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Không tìm thấy khách thuê nào</p>
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">Hiển thị {filtered.length} / {tenants.length} khách thuê</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalMode === 'detail' && selectedTenant && (
        <TenantDetailModal
          tenant={selectedTenant}
          onClose={closeModal}
          onEdit={() => { setModalMode('edit'); }}
        />
      )}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <TenantFormModal
          tenant={modalMode === 'edit' ? selectedTenant : null}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xóa khách thuê?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
