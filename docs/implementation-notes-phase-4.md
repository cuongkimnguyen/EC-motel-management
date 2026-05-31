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

### 7. SQLAlchemy join ambiguity on aggregate queries with building filter

**What happened:** Queries like `select(func.sum(Contract.monthly_rent))` start from Contract. When adding `.join(Room, ...)` for the building filter, SQLAlchemy raised `InvalidRequestError: Don't know how to join to Room`.

**Fix:** Added `.select_from(Contract)` to every scalar aggregate query that conditionally joins Room. This pins the FROM clause regardless of whether the join is applied.

**Affected:** `get_revenue_for_period`, `get_active_contract_count`.

---

### 8. Tests use dynamic `date.today()` for contract dates, not hardcoded 2025

**What happened:** Tests used `end="2025-12-31"` — already in the past. `get_active_contract_count` filters `end_date >= today`, so count returned 0.

**Fix:** `make_contract` default `end` = `date.today() + 365 days`. Tests that check `active_contracts` now use the current month/year as the report period, not July 2025.

**Note:** Expense-only tests (quarter/year period) still use 2025 dates because expense queries filter by `expense_date`, which is independent of contract currency.

---

## Module B — Dashboard + Activity Log

### 9. DashboardService reuses ReportsRepository for month financials

**Spec said:** `current_month_revenue`, `current_month_expenses`.

**Decision:** Rather than duplicating the aggregation SQL that already lives in `ReportsRepository`, `DashboardService` instantiates `ReportsRepository` and calls `get_revenue_for_period` / `get_expense_for_period` with `month_start`/`month_end`. This avoids drift between the two modules' numbers.

**Tradeoff:** DashboardService now depends on ReportsRepository (cross-module dependency). Acceptable because Dashboard is a read-only aggregation layer and the dependency is one-way.

---

### 10. ActivityService swallows all exceptions silently

**Spec said:** Activity log is a cross-cutting concern.

**Decision:** `ActivityService.log_event()` wraps the insert in `try/except Exception: pass`. Failures in activity logging will never propagate to the API caller and won't roll back the main transaction.

**Why:** Activity logs are observability-only. If the `activity_log` table is unavailable or the insert fails for any reason, the main business operation (e.g. creating a contract) must still succeed.

**Tradeoff:** Silent failures mean activity gaps won't be noticed immediately. If log completeness is ever required (audit trail), this exception handling must be removed and the insert must be part of the main transaction.

---

### 11. Activity events wired at service layer, not router layer

**Decision:** `log_event()` is called from within each module's Service method (rooms, tenants, contracts, expenses), not from the router. This ensures events are logged regardless of how the service is called (direct call from another service or via HTTP).

**What's logged:** `room_created`, `room_deleted`, `tenant_created`, `tenant_deleted`, `contract_created`, `contract_renewed`, `contract_terminated`, `expense_created`.

**What's NOT logged:** Read operations (list, get), update operations (minor field changes), status-only updates (e.g. `update_status`). Rationale: activity feed is for significant events, not every field edit.

---

### 12. `GET /api/dashboard/activity` returns `{ "data": [...] }` envelope, not bare array

**Spec said:** Activity feed returns a list.

**Decision:** Response uses `{ "data": [...] }` wrapper to be consistent with paginated list responses elsewhere in the API (even though activity is not paginated). The frontend mock also uses a `data` key.

---

### 13. ActivityLog model uses `server_default` for `created_at`, no Python `default`

**Decision:** `created_at` uses `server_default=text("now()")` so the DB sets the timestamp atomically. No Python-side `default=datetime.utcnow` to avoid clock skew in multi-process deployments.

---

### 14. `vacant_without_post` query uses Room table directly, no join to posts

**Decision:** `DashboardService.get_stats()` queries `Room.status == "Trống" AND Room.has_active_post IS FALSE` directly on the Room table. The `has_active_post` column is maintained by the Posts module as a denormalized flag, so no join to the `posts` table is needed.

---
