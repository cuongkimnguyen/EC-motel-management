// Backend integration point: Replace mock implementations with real API calls
// e.g., import axios from 'axios'
; const API_BASE = '/api/reports';

import { ReportFilters, ReportData, TenantDebtItem, RevenueExpenseTrendItem, ExpenseCategoryItem, OccupancyByBuildingItem, DebtTrendItem } from './types';
import { mockReportData } from './mockReportData';

function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getReportOverview(filters: ReportFilters): Promise<ReportData> {
  await delay();
  // Backend integration point: return fetch(`${API_BASE}/overview?${buildQueryParams(filters)}`).then(r => r.json())
  return { ...mockReportData };
}

export async function getRevenueExpenseTrend(filters: ReportFilters): Promise<RevenueExpenseTrendItem[]> {
  await delay(300);
  return mockReportData.revenueTrend;
}

export async function getExpenseBreakdown(filters: ReportFilters): Promise<ExpenseCategoryItem[]> {
  await delay(300);
  return mockReportData.expenseBreakdown;
}

export async function getOccupancyByBuilding(filters: ReportFilters): Promise<OccupancyByBuildingItem[]> {
  await delay(300);
  return mockReportData.occupancyByBuilding;
}

export async function getDebtTrend(filters: ReportFilters): Promise<DebtTrendItem[]> {
  await delay(300);
  return mockReportData.debtTrend;
}

export async function getTenantDebtList(filters: ReportFilters): Promise<TenantDebtItem[]> {
  await delay(400);
  return mockReportData.tenantDebtList;
}

export async function exportReports(format: 'excel' | 'pdf', filters: ReportFilters): Promise<{ success: boolean; message: string }> {
  await delay(800);
  // Backend integration point: trigger real export endpoint
  return {
    success: true,
    message: `Tính năng đang dùng mock data — xuất ${format.toUpperCase()} sẽ được hỗ trợ sau khi kết nối backend.`,
  };
}
