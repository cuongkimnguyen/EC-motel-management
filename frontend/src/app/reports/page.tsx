'use client';

import { useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { ReportFilters, ReportData } from './types';
import { getReportOverview, exportReports } from './reportService';
import ReportHeader from './components/ReportHeader';
import ReportFilterBar from './components/ReportFilterBar';
import ReportKpiCards from './components/ReportKpiCards';
import RevenueExpenseChart from './components/RevenueExpenseChart';
import ExpenseBreakdownChart from './components/ExpenseBreakdownChart';
import OccupancyChart from './components/OccupancyChart';
import DebtTrendChart from './components/DebtTrendChart';
import RoomOperationSection from './components/RoomOperationSection';
import ContractSummarySection from './components/ContractSummarySection';
import FinancialSummarySection from './components/FinancialSummarySection';
import TenantDebtTable from './components/TenantDebtTable';
import { ReportEmptyState, ReportErrorState } from './components/ReportStates';
import { useEffect } from 'react';

// Backend integration point: Replace reportService calls with real API endpoints

const DEFAULT_FILTERS: ReportFilters = {
  periodType: 'month',
  selectedMonth: 7,
  selectedQuarter: 3,
  selectedYear: 2024,
  buildingId: 'all',
  compareWithPrevious: false,
};

type LoadState = 'idle' | 'loading' | 'success' | 'error';

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-800 text-white text-sm rounded-2xl shadow-xl px-4 py-3 flex items-start gap-3 fade-in">
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white mt-0.5 flex-shrink-0">✕</button>
    </div>
  );
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<ReportData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = useCallback(async (f: ReportFilters) => {
    setLoadState('loading');
    try {
      const result = await getReportOverview(f);
      setData(result);
      setLoadState('success');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [loadData, filters]);

  const handleApply = () => {
    setFilters(pendingFilters);
  };

  const handleReset = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const result = await exportReports(format, filters);
      setToast(result.message);
    } finally {
      setExporting(false);
    }
  };

  const isLoading = loadState === 'loading' || loadState === 'idle';
  const isEmpty = loadState === 'success' && !data;

  return (
    <AppLayout>
      <div className="fade-in">
        <ReportHeader
          onExportExcel={() => handleExport('excel')}
          onExportPdf={() => handleExport('pdf')}
          exporting={exporting}
        />

        <ReportFilterBar
          filters={pendingFilters}
          onChange={setPendingFilters}
          onApply={handleApply}
          onReset={handleReset}
        />

        {loadState === 'error' && (
          <ReportErrorState onRetry={() => loadData(filters)} />
        )}

        {isEmpty && <ReportEmptyState />}

        {(isLoading || loadState === 'success') && data !== null && (
          <>
            {/* KPI Cards */}
            <ReportKpiCards kpi={data.kpi} loading={isLoading} />

            {/* Charts row 1 */}
            <section className="mb-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <RevenueExpenseChart data={data.revenueTrend} loading={isLoading} />
                </div>
                <div className="xl:col-span-1">
                  <ExpenseBreakdownChart data={data.expenseBreakdown} loading={isLoading} />
                </div>
              </div>
            </section>

            {/* Charts row 2 */}
            <section className="mb-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <OccupancyChart data={data.occupancyByBuilding} loading={isLoading} />
                <DebtTrendChart data={data.debtTrend} loading={isLoading} />
              </div>
            </section>

            {/* Detail sections */}
            <section className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <RoomOperationSection data={data.roomOperation} loading={isLoading} />
                <ContractSummarySection data={data.contractReport} loading={isLoading} />
                <FinancialSummarySection data={data.financialReport} loading={isLoading} />
              </div>
            </section>

            {/* Tenant debt table */}
            <section className="mb-6">
              <TenantDebtTable data={data.tenantDebtList} loading={isLoading} />
            </section>
          </>
        )}

        {/* Loading state when no data yet */}
        {isLoading && data === null && (
          <>
            <ReportKpiCards kpi={{} as any} loading={true} />
            <section className="mb-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <RevenueExpenseChart data={[]} loading={true} />
                </div>
                <div className="xl:col-span-1">
                  <ExpenseBreakdownChart data={[]} loading={true} />
                </div>
              </div>
            </section>
            <section className="mb-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <OccupancyChart data={[]} loading={true} />
                <DebtTrendChart data={[]} loading={true} />
              </div>
            </section>
            <section className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <RoomOperationSection data={{} as any} loading={true} />
                <ContractSummarySection data={{} as any} loading={true} />
                <FinancialSummarySection data={{} as any} loading={true} />
              </div>
            </section>
            <section className="mb-6">
              <TenantDebtTable data={[]} loading={true} />
            </section>
          </>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
