// Backend integration point: Replace with API types from your backend schema

export type PeriodType = 'month' | 'quarter' | 'year';

export interface ReportFilters {
  periodType: PeriodType;
  selectedMonth: number; // 1-12
  selectedQuarter: number; // 1-4
  selectedYear: number;
  buildingId: string; // 'all' or specific building
  compareWithPrevious: boolean;
}

export interface ReportKPI {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  occupancyRate: number; // percentage 0-100
  occupiedRooms: number;
  vacantRooms: number;
  totalDebt: number;
  expiringContracts: number;
  // Trend vs previous period
  revenueTrend?: number; // percentage change
  expenseTrend?: number;
  profitTrend?: number;
  occupancyTrend?: number;
}

export interface RevenueExpenseTrendItem {
  label: string; // e.g. "T1/2024"
  revenue: number;
  expense: number;
  profit: number;
}

export interface ExpenseCategoryItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface OccupancyByBuildingItem {
  buildingName: string;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
}

export interface DebtTrendItem {
  label: string;
  totalDebt: number;
  newDebt: number;
  collected: number;
}

export interface RoomOperationReport {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  soonVacantRooms: number;
  occupancyRate: number;
}

export interface ContractReport {
  activeContracts: number;
  expiringIn30Days: number;
  newContractsThisPeriod: number;
  endedContractsThisPeriod: number;
  expiringList: ExpiringContractItem[];
}

export interface ExpiringContractItem {
  id: string;
  tenantName: string;
  roomName: string;
  endDate: string;
  daysLeft: number;
}

export interface FinancialReport {
  expectedRent: number;
  collectedRent: number;
  uncollectedRent: number;
  totalExpense: number;
  estimatedProfit: number;
}

export type DebtStatus = 'Đúng hạn' | 'Sắp đến hạn' | 'Quá hạn';

export interface TenantDebtItem {
  id: string;
  tenantName: string;
  roomName: string;
  billingPeriod: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  status: DebtStatus;
}

export interface ReportData {
  kpi: ReportKPI;
  revenueTrend: RevenueExpenseTrendItem[];
  expenseBreakdown: ExpenseCategoryItem[];
  occupancyByBuilding: OccupancyByBuildingItem[];
  debtTrend: DebtTrendItem[];
  roomOperation: RoomOperationReport;
  contractReport: ContractReport;
  financialReport: FinancialReport;
  tenantDebtList: TenantDebtItem[];
}
