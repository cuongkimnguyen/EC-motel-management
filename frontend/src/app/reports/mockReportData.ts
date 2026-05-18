// Backend integration point: Replace with real API data
import {
  ReportData,
  RevenueExpenseTrendItem,
  ExpenseCategoryItem,
  OccupancyByBuildingItem,
  DebtTrendItem,
  TenantDebtItem,
} from './types';

export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' đ';
}

export function formatDateVN(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// 12 months of revenue/expense trend data (2024)
export const mockRevenueTrend: RevenueExpenseTrendItem[] = [
  { label: 'T1/2024', revenue: 72000000, expense: 18500000, profit: 53500000 },
  { label: 'T2/2024', revenue: 68000000, expense: 16200000, profit: 51800000 },
  { label: 'T3/2024', revenue: 75000000, expense: 19800000, profit: 55200000 },
  { label: 'T4/2024', revenue: 78000000, expense: 21000000, profit: 57000000 },
  { label: 'T5/2024', revenue: 80000000, expense: 20500000, profit: 59500000 },
  { label: 'T6/2024', revenue: 82000000, expense: 22000000, profit: 60000000 },
  { label: 'T7/2024', revenue: 85000000, expense: 24500000, profit: 60500000 },
  { label: 'T8/2024', revenue: 83000000, expense: 23000000, profit: 60000000 },
  { label: 'T9/2024', revenue: 86000000, expense: 25000000, profit: 61000000 },
  { label: 'T10/2024', revenue: 88000000, expense: 26000000, profit: 62000000 },
  { label: 'T11/2024', revenue: 84000000, expense: 23500000, profit: 60500000 },
  { label: 'T12/2024', revenue: 90000000, expense: 28000000, profit: 62000000 },
];

export const mockExpenseBreakdown: ExpenseCategoryItem[] = [
  { category: 'Điện nước', amount: 8500000, percentage: 34.7, color: '#0d9488' },
  { category: 'Sửa chữa', amount: 5200000, percentage: 21.2, color: '#f59e0b' },
  { category: 'Internet', amount: 2800000, percentage: 11.4, color: '#6366f1' },
  { category: 'Vệ sinh', amount: 2200000, percentage: 9.0, color: '#10b981' },
  { category: 'Lương / quản lý', amount: 3500000, percentage: 14.3, color: '#3b82f6' },
  { category: 'Mua sắm', amount: 1200000, percentage: 4.9, color: '#ec4899' },
  { category: 'Chi phí khác', amount: 1100000, percentage: 4.5, color: '#94a3b8' },
];

export const mockOccupancyByBuilding: OccupancyByBuildingItem[] = [
  { buildingName: 'Khu A', totalRooms: 8, occupiedRooms: 8, vacantRooms: 0, occupancyRate: 100 },
  { buildingName: 'Khu B', totalRooms: 6, occupiedRooms: 5, vacantRooms: 1, occupancyRate: 83.3 },
  { buildingName: 'Khu C', totalRooms: 4, occupiedRooms: 4, vacantRooms: 0, occupancyRate: 100 },
  { buildingName: 'Khu D', totalRooms: 2, occupiedRooms: 1, vacantRooms: 1, occupancyRate: 50 },
];

export const mockDebtTrend: DebtTrendItem[] = [
  { label: 'T7/2024', totalDebt: 12500000, newDebt: 5000000, collected: 3500000 },
  { label: 'T8/2024', totalDebt: 14000000, newDebt: 6000000, collected: 4500000 },
  { label: 'T9/2024', totalDebt: 11000000, newDebt: 4000000, collected: 7000000 },
  { label: 'T10/2024', totalDebt: 9500000, newDebt: 3500000, collected: 5000000 },
  { label: 'T11/2024', totalDebt: 8200000, newDebt: 3000000, collected: 4300000 },
  { label: 'T12/2024', totalDebt: 7800000, newDebt: 2500000, collected: 2900000 },
];

export const mockTenantDebtList: TenantDebtItem[] = [
  {
    id: 'debt-1',
    tenantName: 'Nguyễn Văn An',
    roomName: 'Phòng A101',
    billingPeriod: 'Tháng 12/2024',
    amountDue: 3500000,
    amountPaid: 3500000,
    amountRemaining: 0,
    status: 'Đúng hạn',
  },
  {
    id: 'debt-2',
    tenantName: 'Trần Thị Bình',
    roomName: 'Phòng A102',
    billingPeriod: 'Tháng 12/2024',
    amountDue: 3200000,
    amountPaid: 1600000,
    amountRemaining: 1600000,
    status: 'Sắp đến hạn',
  },
  {
    id: 'debt-3',
    tenantName: 'Lê Minh Cường',
    roomName: 'Phòng B201',
    billingPeriod: 'Tháng 11/2024',
    amountDue: 4000000,
    amountPaid: 0,
    amountRemaining: 4000000,
    status: 'Quá hạn',
  },
  {
    id: 'debt-4',
    tenantName: 'Phạm Thị Dung',
    roomName: 'Phòng B202',
    billingPeriod: 'Tháng 12/2024',
    amountDue: 3800000,
    amountPaid: 3800000,
    amountRemaining: 0,
    status: 'Đúng hạn',
  },
  {
    id: 'debt-5',
    tenantName: 'Hoàng Văn Em',
    roomName: 'Phòng C301',
    billingPeriod: 'Tháng 12/2024',
    amountDue: 3500000,
    amountPaid: 2000000,
    amountRemaining: 1500000,
    status: 'Sắp đến hạn',
  },
  {
    id: 'debt-6',
    tenantName: 'Vũ Thị Phương',
    roomName: 'Phòng A103',
    billingPeriod: 'Tháng 11/2024',
    amountDue: 3200000,
    amountPaid: 0,
    amountRemaining: 3200000,
    status: 'Quá hạn',
  },
  {
    id: 'debt-7',
    tenantName: 'Đặng Văn Giang',
    roomName: 'Phòng B203',
    billingPeriod: 'Tháng 12/2024',
    amountDue: 4200000,
    amountPaid: 4200000,
    amountRemaining: 0,
    status: 'Đúng hạn',
  },
  {
    id: 'debt-8',
    tenantName: 'Bùi Thị Hoa',
    roomName: 'Phòng D401',
    billingPeriod: 'Tháng 12/2024',
    amountDue: 3600000,
    amountPaid: 1800000,
    amountRemaining: 1800000,
    status: 'Sắp đến hạn',
  },
];

export const mockReportData: ReportData = {
  kpi: {
    totalRevenue: 85000000,
    totalExpense: 24500000,
    netProfit: 60500000,
    occupancyRate: 90,
    occupiedRooms: 18,
    vacantRooms: 2,
    totalDebt: 7800000,
    expiringContracts: 4,
    revenueTrend: 3.7,
    expenseTrend: 6.5,
    profitTrend: 2.5,
    occupancyTrend: -2.2,
  },
  revenueTrend: mockRevenueTrend,
  expenseBreakdown: mockExpenseBreakdown,
  occupancyByBuilding: mockOccupancyByBuilding,
  debtTrend: mockDebtTrend,
  roomOperation: {
    totalRooms: 20,
    occupiedRooms: 18,
    vacantRooms: 2,
    soonVacantRooms: 3,
    occupancyRate: 90,
  },
  contractReport: {
    activeContracts: 18,
    expiringIn30Days: 4,
    newContractsThisPeriod: 2,
    endedContractsThisPeriod: 1,
    expiringList: [
      { id: 'c1', tenantName: 'Nguyễn Văn An', roomName: 'Phòng A101', endDate: '2025-01-10', daysLeft: 10 },
      { id: 'c2', tenantName: 'Trần Thị Bình', roomName: 'Phòng A102', endDate: '2025-01-15', daysLeft: 15 },
      { id: 'c3', tenantName: 'Lê Minh Cường', roomName: 'Phòng B201', endDate: '2025-01-20', daysLeft: 20 },
      { id: 'c4', tenantName: 'Phạm Thị Dung', roomName: 'Phòng B202', endDate: '2025-01-28', daysLeft: 28 },
    ],
  },
  financialReport: {
    expectedRent: 90000000,
    collectedRent: 82200000,
    uncollectedRent: 7800000,
    totalExpense: 24500000,
    estimatedProfit: 57700000,
  },
  tenantDebtList: mockTenantDebtList,
};
