# Reports Module — API Contract

> Source of truth: `docs/frontend-business-spec.md` §5.7, §7 Reports section.
> Frontend types: `frontend/src/app/reports/types.ts`

## Endpoints

### GET /api/reports/overview

Returns all report data for the selected period in a single response.

**Auth:** Bearer token required (admin)

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period_type | string | month | `month` \| `quarter` \| `year` |
| selected_month | int | 7 | 1–12 |
| selected_quarter | int | 1 | 1–4 |
| selected_year | int | 2025 | e.g. 2025 |
| building_id | string | all | `all` \| `Khu A` \| `Khu B` \| `Khu C` |
| compare_with_previous | bool | false | Include trend % vs previous period |

**Response 200:**
```json
{
  "kpi": {
    "total_revenue": 45000000,
    "total_expense": 12000000,
    "net_profit": 33000000,
    "occupancy_rate": 80.0,
    "occupied_rooms": 16,
    "vacant_rooms": 4,
    "total_debt": 5200000,
    "expiring_contracts": 3,
    "revenue_trend": 5.2,
    "expense_trend": -2.1,
    "profit_trend": 8.4
  },
  "revenue_trend": [
    { "label": "T1/2025", "revenue": 42000000, "expense": 11000000, "profit": 31000000 }
  ],
  "expense_breakdown": [
    { "category": "Điện nước", "amount": 5000000, "percentage": 41.7, "color": "#6366f1" }
  ],
  "occupancy_by_building": [
    { "building_name": "Khu A", "total_rooms": 8, "occupied_rooms": 7, "vacant_rooms": 1, "occupancy_rate": 87.5 }
  ],
  "debt_trend": [
    { "label": "T1/2025", "total_debt": 5200000, "new_debt": 3000000, "collected": 42000000 }
  ],
  "room_operation": {
    "total_rooms": 20,
    "occupied_rooms": 16,
    "vacant_rooms": 3,
    "soon_vacant_rooms": 1,
    "occupancy_rate": 80.0
  },
  "contract_report": {
    "active_contracts": 16,
    "expiring_in_30_days": 3,
    "new_contracts_this_period": 2,
    "ended_contracts_this_period": 1,
    "expiring_list": [
      { "id": "uuid", "tenant_name": "...", "room_name": "...", "end_date": "2025-08-10", "days_left": 5 }
    ]
  },
  "financial_report": {
    "expected_rent": 48000000,
    "collected_rent": 43000000,
    "uncollected_rent": 5000000,
    "total_expense": 12000000,
    "estimated_profit": 31000000
  },
  "tenant_debt_list": [
    {
      "id": "tenant-uuid",
      "tenant_name": "Nguyễn Văn A",
      "room_name": "Phòng A101",
      "billing_period": "2025-07",
      "amount_due": 3500000,
      "amount_paid": 0,
      "amount_remaining": 3500000,
      "status": "Quá hạn"
    }
  ]
}
```

**Error responses:**
- `401 Unauthorized` — missing/invalid token
- `422 Unprocessable Entity` — invalid filter params

---

## Revenue/expense computation rules

- **Revenue** = `SUM(monthly_rent)` from contracts active during the period:
  `start_date <= period_end AND end_date >= period_start AND terminated_at IS NULL`
- **Expense** = `SUM(amount)` from expenses where `expense_date BETWEEN period_start AND period_end`
  (filtered by building_name if building_id != 'all')
- **Occupancy** = live room counts (not historical), filtered by block if building_id set
- **Total debt** = `SUM(tenants.debt)` for tenants with active contracts
- **Revenue trend** = last 6 months of (revenue, expense) regardless of period filter
- **Expense breakdown** = expenses in period grouped by category with % share
- **Debt trend** = last 6 months; total_debt = current snapshot; new_debt = monthly_rent sum
- **Tenant debt list** = tenants with debt > 0 joined with active contract + room
