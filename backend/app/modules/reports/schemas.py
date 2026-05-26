from __future__ import annotations

from pydantic import BaseModel


class ReportKPI(BaseModel):
    total_revenue: int
    total_expense: int
    net_profit: int
    occupancy_rate: float
    occupied_rooms: int
    vacant_rooms: int
    total_debt: int
    expiring_contracts: int
    revenue_trend: float | None = None
    expense_trend: float | None = None
    profit_trend: float | None = None
    occupancy_trend: float | None = None


class RevenueExpenseTrendItem(BaseModel):
    label: str
    revenue: int
    expense: int
    profit: int


class ExpenseCategoryItem(BaseModel):
    category: str
    amount: int
    percentage: float
    color: str


class OccupancyByBuildingItem(BaseModel):
    building_name: str
    total_rooms: int
    occupied_rooms: int
    vacant_rooms: int
    occupancy_rate: float


class DebtTrendItem(BaseModel):
    label: str
    total_debt: int
    new_debt: int
    collected: int


class RoomOperationReport(BaseModel):
    total_rooms: int
    occupied_rooms: int
    vacant_rooms: int
    soon_vacant_rooms: int
    occupancy_rate: float


class ExpiringContractItem(BaseModel):
    id: str
    tenant_name: str
    room_name: str
    end_date: str
    days_left: int


class ContractReport(BaseModel):
    active_contracts: int
    expiring_in_30_days: int
    new_contracts_this_period: int
    ended_contracts_this_period: int
    expiring_list: list[ExpiringContractItem]


class FinancialReport(BaseModel):
    expected_rent: int
    collected_rent: int
    uncollected_rent: int
    total_expense: int
    estimated_profit: int


class TenantDebtItem(BaseModel):
    id: str
    tenant_name: str
    room_name: str
    billing_period: str
    amount_due: int
    amount_paid: int
    amount_remaining: int
    status: str  # Quá hạn | Sắp đến hạn | Đúng hạn


class ReportOverviewResponse(BaseModel):
    kpi: ReportKPI
    revenue_trend: list[RevenueExpenseTrendItem]
    expense_breakdown: list[ExpenseCategoryItem]
    occupancy_by_building: list[OccupancyByBuildingItem]
    debt_trend: list[DebtTrendItem]
    room_operation: RoomOperationReport
    contract_report: ContractReport
    financial_report: FinancialReport
    tenant_debt_list: list[TenantDebtItem]
