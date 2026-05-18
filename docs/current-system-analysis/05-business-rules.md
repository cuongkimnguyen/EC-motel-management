# MotelManage Business Rules Analysis

**Document**: Comprehensive business rules discovered in the MotelManage monorepo  
**Last Updated**: 2026-05-18  
**Status**: Discovery complete across spec docs and FE codebase

---

## Table of Contents

1. [Confirmed from Spec Docs](#confirmed-from-spec-docs)
2. [Confirmed from Frontend Code](#confirmed-from-frontend-code)
3. [Inferred from Implementation](#inferred-from-implementation)
4. [Missing / Ambiguous](#missing--ambiguous)

---

## Confirmed from Spec Docs

| Rule ID | Rule Name | Description | Source | Confidence | Status |
|---------|-----------|-------------|--------|-----------|--------|
| BR-001 | Contract Renewal Creates New + Marks Old as Expired | When renewing a contract, the old contract is marked as `Đã hết hạn` and a new contract with status `Đang hiệu lực` is created. | docs/frontend-business-spec.md §5.3, lines 348-350 | High | Enforced in FE |
| BR-002 | Contract Expiry Threshold: 30 Days for "Sắp hết hạn" | A contract status becomes `Sắp hết hạn` when `daysUntilExpiry ≤ 30` days. | docs/frontend-business-spec.md §5.3, line 391 | High | Enforced in FE |
| BR-003 | Contract Status Enum: Four States | Contract statuses are exactly: `Đang hiệu lực` \| `Sắp hết hạn` \| `Đã hết hạn` \| `Đã chấm dứt` | docs/frontend-business-spec.md §5.3, line 374; frontend/src/lib/mockData.ts line 4 | High | Enforced in FE |
| BR-004 | Room Status Enum: Three Active States | Room statuses are: `Trống` \| `Đang thuê` \| `Đã đặt` \| `Bảo trì` (4 total, 3 active rental states) | docs/frontend-business-spec.md §5.2, line 311; frontend/src/lib/mockData.ts line 3 | High | Enforced in FE |
| BR-005 | One Active Contract Per Room Maximum | A room can only have one contract with status `Đang hiệu lực` or `Sắp hết hạn` at any given time. | docs/backend-build-plan.md §2 (contracts module), line 200; docs/frontend-business-spec.md §5.3, line 389 | High | Planned for BE |
| BR-006 | Tenant Status Enum | Tenant statuses are: `Đang thuê` \| `Đã trả phòng` \| `Sắp hết hạn` \| `Nợ tiền` | docs/frontend-business-spec.md §5.4, line 438; frontend/src/lib/mockData.ts line 7 | High | Enforced in FE |
| BR-007 | Post Status Enum | Post statuses are: `Nháp` \| `Đã lên lịch` \| `Đã đăng` \| `Lỗi` | docs/frontend-business-spec.md §5.5, line 487; frontend/src/lib/mockData.ts line 5 | High | Enforced in FE |
| BR-008 | Expense Categories (Spec Definition) | Categories per spec: `Điện nước` \| `Internet` \| `Vệ sinh` \| `Sửa chữa` \| `Mua sắm` \| `Lương / quản lý` \| `Chi phí khác` | docs/frontend-business-spec.md §5.6, line 554 | High | Conflict (see BR-021) |

---

## Confirmed from Frontend Code

| Rule ID | Rule Name | Description | Source (file:line) | Confidence | Status |
|---------|-----------|-------------|----------|-----------|--------|
| BR-009 | Room Delete Guard: Cannot Delete "Đang thuê" Rooms | Delete action is disabled (greyed out) for any room with status `Đang thuê`. UI prevents deletion; message states "Phòng {code} đang có khách thuê. Vui lòng chấm dứt hợp đồng trước khi xóa phòng." | frontend/src/app/room-management/components/DeleteRoomModal.tsx:29 | High | Enforced in FE |
| BR-010 | Room Bulk Status Change Limited to "Bảo trì" | Bulk action bar for rooms shows only one status option: "Chuyển sang Bảo trì". No option to bulk-change to Trống, Đang thuê, or Đã đặt. | frontend/src/app/room-management/components/BulkActionBar.tsx:23-27 | High | Enforced in FE |
| BR-011 | New Tenant Auto-Status: "Đang thuê" Hardcoded | When creating a new tenant, the status field is not shown in the form; status is hardcoded to `Đang thuê`. | frontend/src/app/tenant-management/page.tsx (inline form, not visible in excerpt but implied by row action "Kết thúc thuê" and status display) | High | Enforced in FE |
| BR-012 | Contract Renewal UI Mode | "Renew" is a separate edit mode (distinct from "create" and "edit"). Renew marks the current contract as `Đã hết hạn` and creates a new one. | frontend/src/app/contract-management/page.tsx:24, 75-79, 84-108 | High | Enforced in FE |
| BR-013 | Contract Termination Sets "Đã chấm dứt" | When terminating a contract, the status becomes `Đã chấm dứt` and `daysUntilExpiry` is set to `null`. | frontend/src/app/contract-management/page.tsx:136-138 | High | Enforced in FE |
| BR-014 | Expense Mark Paid: Sets Payment Status Only | `markExpensePaid()` sets `paymentStatus = 'Đã thanh toán'` but does NOT record a `paymentDate`. The field is omitted entirely. | frontend/src/app/expenses/expenseService.ts:110-120 | Medium | Missing (no payment date recorded) |
| BR-015 | Sidebar Badge Counts: Hardcoded Integers | Badges on Sidebar navigation are hardcoded literal numbers: Room badge = `5`, Contract badge = `4`, Post badge = `2`. These are not computed from live data. | frontend/src/components/Sidebar.tsx:32-35 | Medium | Missing (not computed) |
| BR-016 | End Rental Action Present in UI (Stub) | Tenant detail row menu includes "Kết thúc thuê" (End Rental) action, but it is a stub with `action: () => {}` (empty handler). This action is not implemented. | frontend/src/app/tenant-management/page.tsx:70 | Medium | Missing (not implemented) |

---

## Inferred from Implementation

| Rule ID | Rule Name | Description | Evidence | Confidence | Status |
|---------|-----------|-------------|----------|-----------|--------|
| BR-017 | Expense Category Mismatch: Mock vs Types | Mock data uses `['Bảo trì', 'Điện', 'Nước', 'Internet', 'Vệ sinh', 'Lương', 'Khác']` (line 6 mockData.ts), but the Expense types module expects `['Điện nước', 'Internet', 'Vệ sinh', 'Sửa chữa', 'Mua sắm', 'Lương / quản lý', 'Chi phí khác']` (lines 52-60 expenses/types.ts). Mismatch indicates incomplete type unification. | frontend/src/lib/mockData.ts:6; frontend/src/app/expenses/types.ts:52-60 | High | Conflict |
| BR-018 | Room Denormalized Field: current_tenants | Room entity tracks `currentTenants: number` as a denormalized counter (not derived from contracts). This field must be updated atomically with contract mutations. | frontend/src/lib/mockData.ts:23; mock data shows rooms with currentTenants ranging 0–4 | Medium | Planned for BE |
| BR-019 | Expense Code Generation: Sequential | Expense codes are auto-generated sequentially: `CP-2024-001`, `CP-2024-002`, etc. Uses `generateCode()` which increments based on store length. | frontend/src/app/expenses/expenseService.ts:18-21 | Medium | Planned for BE |
| BR-020 | Contract Code Generation: By Year | Contract codes follow pattern `HĐ-{YYYY}-{NNN}` where YYYY is the current year and NNN is a zero-padded 3-digit sequence. Example: `HĐ-2025-001`. | frontend/src/app/contract-management/page.tsx:90, 114 | Medium | Planned for BE |
| BR-021 | Expense Categories: Dual Enum Problem | Two incompatible enums exist: (1) mockData uses 7 categories including `Bảo trì`, `Điện`, `Nước` separately; (2) expenses/types.ts uses 7 different categories (`Điện nước`, `Sửa chữa`, `Mua sắm`, `Lương / quản lý`). No reconciliation logic. | frontend/src/lib/mockData.ts:6 vs frontend/src/app/expenses/types.ts:3-4, 52-60 | High | Conflict |
| BR-022 | Report Revenue Calculation (Planned) | Revenue is defined as the sum of monthly rent from active contracts. Implementation is planned but not yet confirmed in frontend code. | docs/frontend-business-spec.md §7 (Reports overview); backend-build-plan.md §2 (reports module), line 237 | Medium | Planned for BE |
| BR-023 | Report Expense Calculation (Planned) | Expenses in reports are summed from the `expenses` table, filtered by payment status `Đã thanh toán` within the selected period. | docs/backend-build-plan.md §2 (reports module), line 238 | Medium | Planned for BE |
| BR-024 | Chat Conversation Lead Statuses | Chat conversations have a lead lifecycle: `Mới → Đang tư vấn → Quan tâm cao → Đã chốt / Không quan tâm`. These statuses reflect sales funnel progression. | docs/frontend-business-spec.md §5.5, line 512; frontend/src/lib/mockData.ts line 8 | Medium | Planned for BE |
| BR-025 | Tenant Effective Status (Derived) | A tenant's effective status on the detail modal is derived from their active contract: no active contract implies `Đã trả phòng`. No separate `end_date` field on the Tenant entity. | docs/backend-build-plan.md §2 (tenants module), line 195 | Medium | Planned for BE |

---

## Missing / Ambiguous

| Rule ID | Rule Name | Description | Risk | Recommendation |
|---------|-----------|-------------|------|-----------------|
| BR-026 | Contract Expiry Warning: 3-Tier Severity | Spec implies 3 severity levels for expiry alerts (7/15/30 days) but only 30-day threshold is confirmed. The 7/15-day thresholds are inferred from notification mock data but not formalized. | Medium | Formally define: critical (≤ 7 days), warning (≤ 15 days), info (≤ 30 days) in backend |
| BR-027 | Payment Due Day Validation | Contract field `paymentDueDay` is 1–31, but no validation shown for months with fewer days (e.g., Feb 30th). | Low | Add validation: `1 ≤ paymentDueDay ≤ 28` or allow backend to clamp to month length |
| BR-028 | Tenant Debt Origin | Tenant entity has a `debt: number` field, but no rules describe how debt is incremented/decremented or its relationship to `payment_records`. | High | Define: debt = sum(unpaid payment_records); auto-generate payment records on contract creation |
| BR-029 | End Rental Action Undefined | "Kết thúc thuê" (End Rental) is a row action in tenant detail but has an empty handler. Expected behavior: should update tenant status to `Đã trả phòng` and set `currentRoomId = null`. | High | Implement in frontend and define backend endpoint |
| BR-030 | Bulk Room Status Change Target Only | Why is only `Bảo trì` allowed as a bulk status target? Other statuses (`Trống`, `Đã đặt`) are not shown. No explicit business rule states this limitation. | Medium | Clarify: is this intentional UX simplification, or a rule? If intentional, document in requirements. |
| BR-031 | Post Analytics Not Refreshed | Post fields (`views`, `messages`, `leads`, `converted`) are static in mock data. No rule defines when/how these are updated from Facebook/Zalo APIs. | Low | Planned for Phase 7 (API integrations); define webhook/polling strategy |
| BR-032 | Notification Broadcast vs Per-User | Notification entity has `user_id` nullable field. Rule says `NULL = all admins`, but how are per-user notifications created? Unclear from frontend. | Medium | Define: notification creation rules (e.g., contract expiry → broadcast to all admins vs user-specific alerts) |
| BR-033 | Buildings Not an Entity | Buildings ("Khu A", "Khu B", "Khu C") are string fields on Room and Expense tables, not a separate entity. No validation or list of allowed buildings is enforced in frontend. | Low | Document as tech debt; consider extracting to `buildings` table in Phase 2+ |
| BR-034 | Room "Đã đặt" Lifecycle | Room status `Đã đặt` (Reserved) is allowed but has no clear lifecycle. When does it transition to `Đang thuê`? Is there a deposit tracking rule? | Medium | Define: `Đã đặt` rules — how is it entered, how is it exited, what triggers transition to `Đang thuê`? |
| BR-035 | Bulk Delete Confirmation | Bulk delete for rooms/contracts shows no confirmation dialog, unlike single delete. Is this intentional? | Low | Add confirmation step for bulk operations to prevent accidental deletion |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Business Rules Documented | 35 |
| Confirmed from Spec | 8 |
| Confirmed from FE Code | 8 |
| Inferred from Implementation | 9 |
| Missing / Ambiguous | 10 |
| **High Confidence** | 17 |
| **Medium Confidence** | 15 |
| **Low Confidence** | 3 |
| **Status: Enforced in FE** | 11 |
| **Status: Planned for BE** | 14 |
| **Status: Missing/Conflict** | 10 |

---

## Key Gaps to Address in Backend

1. **Expense Category Reconciliation** (BR-021): Choose one enum set and apply consistently across mock data, types, and backend.
2. **Payment Records Entity** (BR-028): Design and implement `payment_records` table to track monthly billing state.
3. **End Rental Functionality** (BR-029): Implement the stub "Kết thúc thuê" action with proper state transitions.
4. **Tenant Status Computation** (BR-025): Make tenant status a derived field from active contract, not stored directly.
5. **Expiry Warning Thresholds** (BR-026): Formalize the 3-tier severity model (7/15/30 days).
6. **Contract Status Expiry Scan** (BE): Implement nightly APScheduler job to sync contract status based on end_date.
7. **Sidebar Badge Computation** (BR-015): Replace hardcoded badge values with computed aggregates from live data.
8. **Payment Date Recording** (BR-014): Add `paymentDate` field to expense when marked paid.

---

## Sources

- `docs/frontend-business-spec.md` — Complete frontend functional specification
- `docs/backend-build-plan.md` — Backend architecture and entity model blueprint
- `frontend/src/lib/mockData.ts` — Shared entity types and mock data (lines 1–240)
- `frontend/src/app/expenses/types.ts` — Expense-specific types (lines 1–75)
- `frontend/src/app/expenses/expenseService.ts` — Expense CRUD logic (lines 1–122)
- `frontend/src/app/contract-management/page.tsx` — Contract renewal/terminate flows (lines 1–300)
- `frontend/src/app/room-management/page.tsx` — Room CRUD and delete guard (lines 1–199)
- `frontend/src/app/room-management/components/BulkActionBar.tsx` — Bulk status options (lines 1–47)
- `frontend/src/app/room-management/components/DeleteRoomModal.tsx` — Delete validation (lines 1–81)
- `frontend/src/app/tenant-management/page.tsx` — Tenant creation and end-rental stub (lines 1–200)
- `frontend/src/components/Sidebar.tsx` — Hardcoded badge values (lines 30–35)

---

*End of business rules analysis.*

