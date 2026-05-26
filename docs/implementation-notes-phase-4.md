# Implementation Notes — Phase 4: Reports, Dashboard, Conversations, Agent, Automations

> Decisions, changes, and tradeoffs made during implementation that weren't in the spec or plan.

---

## Module A — Reports

### 1. Revenue computation uses contract overlap, not payment records

**Spec said:** Revenue = SUM(monthly_rent) for the period.

**Problem:** There are no `payment_records` in the DB yet (the build plan lists them as inferred/future). Revenue cannot be computed from actual payments received.

**Decision:** Revenue = SUM(monthly_rent) from contracts that **overlapped** with the selected period: `start_date <= period_end AND end_date >= period_start AND terminated_at IS NULL`. This is an approximation — it counts each active contract as contributing one full month_rent per period regardless of whether it was actually collected.

**Tradeoff:** Overestimates revenue if contracts started or ended mid-period; underestimates if a tenant paid late. Acceptable for MVP reporting. When `payment_records` is introduced, this query should be replaced.

---

### 2. Debt total uses `tenants.debt` snapshot, not historical records

**Spec said:** Total debt = outstanding amounts from tenants.

**Problem:** Same as above — no payment_records table. `tenants.debt` is a raw integer field that represents current outstanding debt, not a historical series.

**Decision:** `total_debt` in KPI = `SUM(tenants.debt)` for tenants with active contracts. The debt trend chart uses the current snapshot as the most recent data point and zeros for prior months (since historical debt states are not recorded).

**Tradeoff:** Debt trend will show a flat line or step at the current month. Once payment_records are added, this should be rewritten as `SUM(amount_due - amount_paid)` per billing period.

---

### 3. Revenue trend always shows last 6 months regardless of period filter

**Spec said:** Revenue trend = multi-month chart.

**Decision:** The trend chart always returns the **last 6 calendar months** ending at today's date, ignoring the selected period filter. This matches the frontend mock which always shows a rolling 6-month window.

**Why:** The trend chart is meant to show momentum, not filter to the same narrow window as the KPI cards. Filtering a "month" period to show only 1 data point on a trend chart is useless.

---

### 4. `soon_vacant_rooms` in RoomOperationReport uses expiring contracts, not room status

**Spec said:** `soon_vacant_rooms` — rooms that will become vacant soon.

**Problem:** Rooms don't have a "soon vacant" status. This field isn't stored.

**Decision:** `soon_vacant_rooms` = count of contracts expiring within 30 days (same list as `expiring_list`). These rooms will likely become vacant when the contract ends.

---

### 5. Expense category color palette hardcoded in repository

**Spec said:** `ExpenseCategoryItem` includes a `color` field.

**Problem:** Colors are a frontend concern and aren't stored in the DB.

**Decision:** Color palette is a hardcoded dict in `repository.py` keyed by Vietnamese category name. Unknown categories get `#6b7280` (gray). If categories are ever changed/added, this dict must be updated.

---

### 6. `get_debt_trend` approximates `collected` as `new_debt` when no historical debt data

**Spec said:** `DebtTrendItem` has `{ label, total_debt, new_debt, collected }`.

**Decision:** For each past month: `new_debt` = monthly_rent sum from contracts active that month (approximation of rent due), `collected` = `new_debt` (assuming all was collected for past months), `total_debt` = 0 for past months / current total for latest month. This gives a chart that shows "all collected, small residual debt now" which is a reasonable visual for a healthy motel.

---
