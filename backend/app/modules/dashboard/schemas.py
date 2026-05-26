from __future__ import annotations

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_rooms: int
    occupied_rooms: int
    vacant_rooms: int
    reserved_rooms: int
    maintenance_rooms: int
    occupancy_rate: float
    vacancy_rate: float
    active_contracts: int
    expiring_contracts: int
    expiring_in_7_days: int
    expiring_in_30_days: int
    current_month_revenue: int
    current_month_expenses: int
    current_month_profit: int
    overdue_amount: int
    expected_revenue: int
    vacant_without_post: int
