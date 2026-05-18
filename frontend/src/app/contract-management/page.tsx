'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { mockContracts, Contract } from '@/lib/mockData';
import ExpiryAlertBanner from './components/ExpiryAlertBanner';
import ContractFilters, { ContractFilterState } from './components/ContractFilters';
import ContractTable from './components/ContractTable';
import ContractFormModal from './components/ContractFormModal';
import TerminateContractModal from './components/TerminateContractModal';
import ContractStatsBar from './components/ContractStatsBar';
import { PlusIcon, ArrowDownTrayIcon, PrinterIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';

// Backend integration point: Replace with SWR/React Query fetching from /api/contracts

export default function ContractManagementPage() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [filters, setFilters] = useState<ContractFilterState>({ search: '', status: '', room: '', month: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit' | 'renew'>('create');
  const [terminateContract, setTerminateContract] = useState<Contract | null>(null);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [deleteContract, setDeleteContract] = useState<Contract | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !c.code.toLowerCase().includes(q) &&
          !c.tenantName.toLowerCase().includes(q) &&
          !c.tenantCCCD.includes(q) &&
          !c.roomCode.toLowerCase().includes(q) &&
          !c.tenantPhone.includes(q)
        ) return false;
      }
      if (filters.status && c.status !== filters.status) return false;
      if (filters.month) {
        if (filters.month.startsWith('Q')) {
          // Quarter filter logic
        } else if (filters.month.length === 4) {
          if (!c.startDate.startsWith(filters.month) && !c.endDate.startsWith(filters.month)) return false;
        } else {
          if (!c.startDate.startsWith(filters.month) && !c.endDate.startsWith(filters.month)) return false;
        }
      }
      return true;
    });
  }, [contracts, filters]);

  const handleSelectId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (ids: string[]) => setSelectedIds(ids);

  const openCreate = () => {
    setEditContract(null);
    setEditMode('create');
    setAddModalOpen(true);
  };

  const openEdit = (contract: Contract) => {
    setEditContract(contract);
    setEditMode('edit');
    setAddModalOpen(true);
  };

  const openRenew = (contract: Contract) => {
    setEditContract(contract);
    setEditMode('renew');
    setAddModalOpen(true);
  };

  const handleSaveContract = (data: any) => {
    if (editMode === 'edit' && editContract) {
      setContracts(prev => prev.map(c => c.id === editContract.id ? { ...c, ...data } : c));
    } else if (editMode === 'renew' && editContract) {
      // Mark old contract as expired
      setContracts(prev => prev.map(c => c.id === editContract.id ? { ...c, status: 'Đã hết hạn' as const } : c));
      // Add new contract
      const newContract: Contract = {
        id: `c${Date.now()}`,
        code: `HĐ-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`,
        roomId: data.roomId,
        roomCode: editContract.roomCode,
        roomName: editContract.roomName,
        tenantId: editContract.tenantId,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        tenantCCCD: data.tenantCCCD,
        startDate: data.startDate,
        endDate: data.endDate,
        monthlyRent: data.monthlyRent,
        deposit: data.deposit,
        billingCycle: data.billingCycle,
        paymentDueDay: data.paymentDueDay,
        status: 'Đang hiệu lực',
        daysUntilExpiry: 365,
        notes: data.notes,
      };
      setContracts(prev => [...prev, newContract]);
    } else {
      // Create new
      const room = { roomCode: 'P???', roomName: 'Phòng mới' };
      const newContract: Contract = {
        id: `c${Date.now()}`,
        code: `HĐ-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`,
        roomId: data.roomId,
        roomCode: room.roomCode,
        roomName: room.roomName,
        tenantId: `t${Date.now()}`,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        tenantCCCD: data.tenantCCCD,
        startDate: data.startDate,
        endDate: data.endDate,
        monthlyRent: data.monthlyRent,
        deposit: data.deposit,
        billingCycle: data.billingCycle,
        paymentDueDay: data.paymentDueDay,
        status: 'Đang hiệu lực',
        daysUntilExpiry: 365,
        notes: data.notes,
      };
      setContracts(prev => [...prev, newContract]);
    }
  };

  const handleTerminate = (contractId: string) => {
    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'Đã chấm dứt' as const, daysUntilExpiry: null } : c));
  };

  const handleDeleteContract = async () => {
    if (!deleteContract) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 600));
    setContracts(prev => prev.filter(c => c.id !== deleteContract.id));
    setSelectedIds(prev => prev.filter(id => id !== deleteContract.id));
    setDeleting(false);
    setDeleteModalOpen(false);
    setDeleteContract(null);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.length;
    setContracts(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  };

  return (
    <AppLayout>
      <div className="fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý hợp đồng</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Tổng <span className="font-semibold text-slate-700">{contracts.length}</span> hợp đồng ·
              Cập nhật lúc 14:32 · 14/03/2025
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-card">
              <PrinterIcon className="w-4 h-4" />
              <span className="hidden sm:inline">In hợp đồng</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-card">
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 shadow-card"
            >
              <PlusIcon className="w-4 h-4" />
              Tạo hợp đồng
            </button>
          </div>
        </div>

        {/* Expiry Alert Banner */}
        <ExpiryAlertBanner />

        {/* Stats Bar */}
        <ContractStatsBar contracts={contracts} />

        {/* Filters */}
        <ContractFilters
          filters={filters}
          onChange={setFilters}
          totalCount={contracts.length}
          filteredCount={filteredContracts.length}
        />

        {/* Table */}
        <ContractTable
          contracts={filteredContracts}
          onEdit={openEdit}
          onRenew={openRenew}
          onTerminate={(c) => { setTerminateContract(c); setTerminateModalOpen(true); }}
          onDelete={(c) => { setDeleteContract(c); setDeleteModalOpen(true); }}
          selectedIds={selectedIds}
          onSelectId={handleSelectId}
          onSelectAll={handleSelectAll}
        />

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 slide-up">
            <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-modal">
              <span className="text-sm font-medium">
                Đã chọn <span className="text-teal-400 font-bold">{selectedIds.length}</span> hợp đồng
              </span>
              <div className="w-px h-5 bg-slate-700" />
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Xóa đã chọn
              </button>
              <div className="w-px h-5 bg-slate-700" />
              <button onClick={() => setSelectedIds([])} className="p-1 text-slate-400 hover:text-white transition-colors rounded">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <ContractFormModal
          isOpen={addModalOpen}
          onClose={() => { setAddModalOpen(false); setEditContract(null); }}
          contract={editContract}
          onSave={handleSaveContract}
          mode={editMode}
        />

        <TerminateContractModal
          isOpen={terminateModalOpen}
          onClose={() => { setTerminateModalOpen(false); setTerminateContract(null); }}
          contract={terminateContract}
          onConfirm={handleTerminate}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setDeleteContract(null); }}
          title="Xóa hợp đồng"
          size="sm"
          footer={
            <>
              <button
                onClick={() => { setDeleteModalOpen(false); setDeleteContract(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteContract}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60 min-w-[100px] justify-center"
              >
                {deleting
                  ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang xóa...</span>
                  : 'Xóa hợp đồng'
                }
              </button>
            </>
          }
        >
          <div className="text-center py-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">
              Xóa hợp đồng <span className="text-red-600">{deleteContract?.code}</span>?
            </p>
            <p className="text-sm text-slate-500">
              Hợp đồng của <strong>{deleteContract?.tenantName}</strong> ({deleteContract?.roomCode}) sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}