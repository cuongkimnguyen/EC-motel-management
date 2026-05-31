# Dashboard Module — API Contract

> Source of truth: `docs/frontend-business-spec.md` §5.1, §7 Dashboard section.
> Frontend: `frontend/src/app/dashboard/` components, `frontend/src/lib/mockData.ts getDashboardStats()`

## Endpoints

### GET /api/dashboard/stats

Returns all KPI values needed by the dashboard in one request.

**Auth:** Bearer token required (admin)

**Response 200:**
```json
{
  "total_rooms": 20,
  "occupied_rooms": 16,
  "vacant_rooms": 3,
  "reserved_rooms": 1,
  "maintenance_rooms": 0,
  "occupancy_rate": 80.0,
  "vacancy_rate": 15.0,
  "active_contracts": 16,
  "expiring_contracts": 3,
  "expiring_in_7_days": 1,
  "expiring_in_30_days": 3,
  "current_month_revenue": 48000000,
  "current_month_expenses": 12000000,
  "current_month_profit": 36000000,
  "overdue_amount": 5200000,
  "expected_revenue": 60000000,
  "vacant_without_post": 2
}
```

---

### GET /api/dashboard/activity

Returns recent system events for the activity feed.

**Auth:** Bearer token required (admin)

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | int | 8 | Max events to return (1–50) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "contract.created",
      "description": "Hợp đồng HĐ-2025-011 đã được tạo",
      "module": "contracts",
      "reference_id": "uuid-or-null",
      "reference_type": "contract",
      "created_at": "2025-07-15T10:23:00Z"
    }
  ]
}
```

**Event types logged:**

| event_type | Trigger |
|---|---|
| `room.created` | POST /api/rooms |
| `room.updated` | PUT /api/rooms/:id |
| `room.deleted` | DELETE /api/rooms/:id |
| `room.status_changed` | PATCH /api/rooms/:id/status |
| `tenant.created` | POST /api/tenants |
| `tenant.updated` | PUT /api/tenants/:id |
| `tenant.deleted` | DELETE /api/tenants/:id |
| `contract.created` | POST /api/contracts |
| `contract.renewed` | POST /api/contracts/:id/renew |
| `contract.terminated` | POST /api/contracts/:id/terminate |
| `expense.created` | POST /api/expenses |
| `expense.paid` | PATCH /api/expenses/:id/mark-paid |
| `post.published` | POST /api/posts/:id/publish |
| `post.scheduled` | POST /api/posts/:id/schedule |

---

## Computation rules

- **current_month_revenue** = `ReportsRepository.get_revenue_for_period(current_month_start, current_month_end)`
- **current_month_expenses** = `ReportsRepository.get_expense_for_period(current_month_start, current_month_end)`
- **overdue_amount** = `SUM(tenants.debt)`
- **expected_revenue** = `SUM(monthly_rent)` from all currently active contracts (not period-scoped)
- **vacant_without_post** = `COUNT(rooms WHERE status='Trống' AND has_active_post=False)`
- **expiring_in_7_days** = contracts where `end_date - today <= 7` and not terminated
- **expiring_in_30_days** = contracts where `end_date - today <= 30` and not terminated
