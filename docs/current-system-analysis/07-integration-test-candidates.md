# Integration Test Candidates — Priority Testing Plan

**Purpose:** Identify the most critical frontend-backend integration test scenarios to execute FIRST when backend implementation begins.

**Scope:** When the FastAPI/PostgreSQL backend is implemented, these tests will verify that FE data contracts match BE behavior, state transitions are atomic, and error handling is consistent.

**Date Created:** 2025-05-18  
**Related Documents:**
- `04-fe-be-mapping.md` — Complete FE→BE action mapping with integration status
- `02-frontend-analysis.md` — Frontend module structure and state management
- `03-backend-analysis.md` — Backend skeleton analysis

---

## P1 Tests — Must Test First

**Rationale:** These 7 scenarios cover the highest-risk paths: complex state transitions, enum mismatches, missing error handling, and constraint violations.

### P1-001: Contract Renew Flow — Atomicity & Old Contract Mark

| Field | Value |
|---|---|
| **Test ID** | P1-001 |
| **Test Name** | Contract renew creates new contract AND marks old as `Đã hết hạn` atomically |
| **Module** | Contract Management (`contract-management/page.tsx`) |
| **Test Type** | API Integration + DB Constraint |
| **FE Source** | `contract-management/page.tsx:handleSaveContract()` (lines 84–107) |
| **Mapping Ref** | Row 43, `Renew contract` action |

**Preconditions:**
- One active contract with status `Đang hiệu lực` in the database (e.g., ID `c2`)
- Contract is eligible for renewal (end date <= today + 90 days)

**Test Steps:**
1. POST `/api/contracts/:id/renew` with payload:
   ```json
   {
     "startDate": "2025-06-01",
     "endDate": "2026-06-01",
     "monthlyRent": 3500000,
     "deposit": 7000000,
     "billingCycle": 1,
     "paymentDueDay": 5,
     "notes": "Renewal for year 2"
   }
   ```
2. Verify old contract (ID `c2`) is queried from DB and returned with `status: "Đã hết hạn"`
3. Verify new contract is created with `status: "Đang hiệu lực"`, unique ID, same `roomId` and `tenantId`
4. Query `GET /api/contracts` and confirm both contracts appear in list with correct statuses
5. Verify response structure: `{old: Contract, new: Contract}`

**Expected Outcome:**
- Response HTTP 200 with both old and new contracts
- Old contract in DB has `status = "Đã hết hạn"`, `daysUntilExpiry = null`
- New contract in DB has `status = "Đang hiệu lực"`, calculated `daysUntilExpiry`
- Both contracts have same `roomId`, `tenantId`, `roomCode`, `tenantName`, `tenantPhone`, `tenantCCCD`
- FE successfully replaces old contract in list with new one, marks old as expired (lines 85–108 show FE assumes this behavior)

**Risk If Not Tested:**
- Without atomicity verification, a failed BE request mid-operation could create a new contract but fail to mark the old as expired, leaving the FE and DB out of sync
- FE will receive both old and new and update its local state, but if BE rolls back mid-way, FE will show inconsistent data
- No transaction boundary currently enforced in mock or documented in FE

**Integration Gap Reference:**
- FE `Contract` interface (mockData.ts) has `daysUntilExpiry: number | null` — confirm BE calculates this
- Response payload: FE expects `{old: Contract, new: Contract}` — BE must return this exact structure
- Old contract is updated, new is inserted — atomicity requires a single transaction

---

### P1-002: Contract Terminate — Missing Field Handling

| Field | Value |
|---|---|
| **Test ID** | P1-002 |
| **Test Name** | Contract terminate accepts missing `terminationReason` and `terminationDate` (or rejects with 400) |
| **Module** | Contract Management (`TerminateContractModal.tsx`) |
| **Test Type** | API Integration + Schema Mismatch |
| **FE Source** | `contract-management/page.tsx:handleTerminate()` (lines 136–138) |
| **Mapping Ref** | Row 44, `Terminate contract` action, Critical Risk #2 |

**Preconditions:**
- One active contract with status `Đang hiệu lực` (e.g., ID `c2`)
- Contract is not already terminated

**Test Steps:**
1. POST `/api/contracts/:id/terminate` with an **empty payload** `{}`
   - FE does NOT pass `terminationReason` or `terminationDate` (see TerminateContractModal.tsx)
2. Verify BE response:
   - **Option A (Preferred):** Accept and return contract with `status: "Đã chấm dứt"`, `daysUntilExpiry: null`
   - **Option B (Strict):** Return HTTP 400 with error message indicating missing required fields
3. If Option A: Query `GET /api/contracts/:id` and confirm `status = "Đã chấm dứt"`, `daysUntilExpiry = null`
4. If Option B: FE must be updated to send `terminationReason` and `terminationDate` before backend is live

**Expected Outcome:**
- HTTP 200 (Option A) or HTTP 400 with clear error (Option B)
- If successful: Terminated contract in DB with correct status
- If failed: Error message describes which fields are required

**Risk If Not Tested:**
- The `Contract` FE interface has NO `terminationReason` or `terminationDate` fields, but the BE plan includes them
- FE will never pass these fields, causing the BE endpoint to either accept empty values or reject the request
- Silent failure: If BE accepts empty values, the termination record will have null/default values, breaking future audits or reports
- Option B is not currently handled in FE — no try-catch or error UI in `TerminateContractModal`

**Integration Gap Reference:**
- FE mapping table row 44 notes: `"NOTE: FE does NOT pass terminationReason or terminationDate — these fields are in BE plan but NOT in FE Contract interface"`
- **Action Required:** Either (a) update FE Contract interface to include these fields and modify TerminateContractModal to collect them, or (b) confirm BE accepts the terminate request with just the contract ID

---

### P1-003: ExpenseCategory Enum Roundtrip — Enum Value Mismatch

| Field | Value |
|---|---|
| **Test ID** | P1-003 |
| **Test Name** | Expense category enum values from types.ts must roundtrip correctly |
| **Module** | Expenses (`expenses/types.ts`, `mockExpenses.ts`) |
| **Test Type** | API Integration + Data Serialization |
| **FE Source** | `expenses/types.ts` (lines 3–4) and `expenseService.ts:createExpense()` (lines 60–82) |
| **Mapping Ref** | Row 74, `Create expense` action; Critical Risk #3 |

**Preconditions:**
- BE expense schema is defined with ExpenseCategory enum values
- Test has access to both FE and BE enum definitions

**Critical Finding:**
FE and mock data use **DIFFERENT** ExpenseCategory enums:

| Source | Categories |
|---|---|
| **`expenses/types.ts`** | `'Điện nước' \| 'Internet' \| 'Vệ sinh' \| 'Sửa chữa' \| 'Mua sắm' \| 'Lương / quản lý' \| 'Chi phí khác'` |
| **`lib/mockData.ts`** | `'Bảo trì' \| 'Điện' \| 'Nước' \| 'Internet' \| 'Vệ sinh' \| 'Lương' \| 'Khác'` |
| **`mockExpenses.ts`** | `'Điện nước'` (compound), `'Internet'`, `'Vệ sinh'`, `'Sửa chữa'`, `'Mua sắm'`, `'Lương'`, etc. |

**Test Steps:**
1. For each category in `EXPENSE_CATEGORIES` array from types.ts:
   ```javascript
   const categories = ['Điện nước', 'Internet', 'Vệ sinh', 'Sửa chữa', 'Mua sắm', 'Lương / quản lý', 'Chi phí khác'];
   ```
2. POST `/api/expenses` with `category: 'Điện nước'`:
   ```json
   {
     "title": "Test Expense",
     "category": "Điện nước",
     "amount": "1000000",
     "expenseDate": "2025-05-18",
     "paymentStatus": "Chưa thanh toán",
     "paymentMethod": "Chuyển khoản",
     "buildingName": "Khu A",
     "note": "Test",
     "isRecurring": false
   }
   ```
3. Verify response contains `category: "Điện nước"` (NOT `"Điện"` or `"Bảo trì"`)
4. Query `GET /api/expenses/:id` and confirm category is preserved exactly
5. Query `GET /api/expenses` and filter by category — confirm filtering works with exact string match

**Expected Outcome:**
- All 7 categories from `EXPENSE_CATEGORIES` roundtrip without transformation
- BE stores and returns the EXACT category string sent by FE
- No transformation between camelCase, compound names, or abbreviated forms
- Filtering on category works with exact match

**Risk If Not Tested:**
- Silent data corruption: If BE uses a different enum (e.g., `'Điện'` instead of `'Điện nước'`), expense records will be stored with one set of values and displayed with another
- Reports and aggregation by category will break silently (categories won't match)
- Filter operations will return no results because the DB values don't match the FE filter values
- mockData uses yet another enum, creating three different value sets across the codebase

**Integration Gap Reference:**
- FE enum in `expenses/types.ts` has 7 categories, `mockData.ts` has different 7 categories
- `mockExpenses.ts` uses `types.ts` enum values, but mockData could use different values — creates inconsistency within FE
- **Action Required:** Align mockData.ts `ExpenseCategory` type with types.ts, or document which is authoritative

---

### P1-004: Room Delete Guard — Client-Side vs Server-Side Enforcement

| Field | Value |
|---|---|
| **Test ID** | P1-004 |
| **Test Name** | DELETE /api/rooms/:id returns 409 if room status is `Đang thuê` |
| **Module** | Room Management (`room-management/page.tsx`) |
| **Test Type** | API Integration + Constraint |
| **FE Source** | `room-management/page.tsx:handleDeleteRoom()` (lines 140–149) |
| **Mapping Ref** | Row 28, `Delete room` action; Integration Status note: `"FE blocks delete if room.status === 'Đang thuê', but no API-level guard"` |

**Preconditions:**
- Room with status `Đang thuê` exists in DB (e.g., ID `r1` has 2 tenants, status = `"Đang thuê"`)
- Room with status `Trống` exists in DB (e.g., ID `r3`)

**Test Steps:**
1. Attempt to DELETE `/api/rooms/r1` (status = `"Đang thuê"`)
2. Verify response is HTTP 409 Conflict with error message: `"Cannot delete room with occupied/active status"`
3. Query `GET /api/rooms/r1` and confirm room still exists in DB
4. Attempt to DELETE `/api/rooms/r3` (status = `"Trống"`)
5. Verify response is HTTP 204 No Content or HTTP 200 OK
6. Query `GET /api/rooms/r3` and confirm room is deleted

**Expected Outcome:**
- DELETE on occupied room returns HTTP 409 (not 200 or 404)
- DELETE on vacant/empty room succeeds with 204/200
- Error response includes reason (occupied status, active tenants, etc.)

**Risk If Not Tested:**
- FE has UI-level guard (`DeleteRoomModal` blocks delete if status is occupied), but if BE lacks the same guard, direct API calls can bypass FE and delete occupied rooms
- Data integrity loss: Orphaned tenant/contract records if room is deleted while occupied
- FE assumes 204 response, but if BE returns 200 with a message body, FE may not handle it correctly
- Without server-side guard, any client (mobile app, API script) could delete occupied rooms

**Integration Gap Reference:**
- FE mapping row 28: `"Note: FE blocks delete if room.status === 'Đang thuê', but no API-level guard"`
- FE DELETE handler assumes success (lines 140–149), with no conditional on response status
- **Action Required:** BE must enforce this constraint at the API level

---

### P1-005: Tenant Create — Hardcoded Status Mismatch

| Field | Value |
|---|---|
| **Test ID** | P1-005 |
| **Test Name** | POST /api/tenants accepts hardcoded `status='Đang thuê'` and returns it |
| **Module** | Tenant Management (`tenant-management/page.tsx`) |
| **Test Type** | API Integration + Default Value Handling |
| **FE Source** | `tenant-management/page.tsx:handleCreate()` (creates with `status: 'Đang thuê'` hardcoded) |
| **Mapping Ref** | Row 58, `Create tenant` action; note: `"status='Đang thuê' hardcoded"` |

**Preconditions:**
- No validation or acceptance rules defined in backend yet
- Test DB is clean

**Test Steps:**
1. POST `/api/tenants` with payload (note: NO `status` field sent by FE):
   ```json
   {
     "fullName": "Nguyễn Văn Test",
     "phone": "0912345678",
     "cccd": "001234567890",
     "gender": "Nam",
     "dateOfBirth": "1990-01-01",
     "permanentAddress": "123 Main St",
     "occupation": "Engineer",
     "licensePlate": "30A-12345",
     "notes": "Test tenant"
   }
   ```
2. Verify response contains `status: "Đang thuê"` (BE must apply this default OR FE must send it explicitly)
3. Query `GET /api/tenants/:id` and confirm `status = "Đang thuê"` is persisted
4. Verify other fields are stored exactly as sent

**Expected Outcome:**
- HTTP 201 Created with tenant object including `status: "Đang thuê"`
- Status is not null, undefined, or a different default value
- Tenant can be queried back with the same status

**Risk If Not Tested:**
- If BE doesn't apply the default `status='Đang thuê'`, the field will be null, breaking FE assumptions
- FE filter by `status` will break (filters expect one of: 'Đang thuê', 'Đã trả phòng', 'Sắp hết hạn', 'Nợ tiền')
- Reports that count "active tenants" will incorrectly include newly created tenants (if status is null)

**Integration Gap Reference:**
- Mapping row 58: `"status='Đang thuê' hardcoded"`
- FE does NOT send status in the request payload (see tenant form — no status field)
- BE must either accept and ignore a missing status field OR require FE to send it

---

### P1-006: Expense Mark Paid — Unexpected Fields

| Field | Value |
|---|---|
| **Test ID** | P1-006 |
| **Test Name** | PATCH /api/expenses/:id/mark-paid returns `Đã thanh toán` without `paymentDate` field |
| **Module** | Expenses (`expenses/page.tsx`, `expenseService.ts`) |
| **Test Type** | API Integration + Response Schema |
| **FE Source** | `expenses/page.tsx:handleMarkPaid()` (calls `markExpensePaid(id)`) |
| **Mapping Ref** | Row 77, `Mark expense paid` action; note: `"no paymentDate field"` |

**Preconditions:**
- One expense with `paymentStatus: "Chưa thanh toán"` exists in DB (e.g., ID `exp-005`)
- Test expects response to NOT include a `paymentDate` field (because FE doesn't use it)

**Test Steps:**
1. PATCH `/api/expenses/exp-005/mark-paid` with empty payload `{}`
2. Verify response HTTP 200 with expense object:
   ```json
   {
     "id": "exp-005",
     "expenseCode": "CP-2024-005",
     "title": "Vệ sinh hành lang...",
     "category": "Vệ sinh",
     "amount": 1500000,
     "expenseDate": "2024-03-12",
     "paymentStatus": "Đã thanh toán",
     "paymentMethod": "Tiền mặt",
     "buildingName": "Khu A",
     "note": "...",
     "attachmentCount": 0,
     "createdBy": "Nguyễn Văn Chủ",
     "createdAt": "2024-03-12T10:00:00Z",
     "updatedAt": "2024-05-18T10:00:00Z",
     "isRecurring": true
   }
   ```
3. Verify `paymentStatus` is exactly `"Đã thanh toán"` (not `"paid"`, `"Paid"`, or any other form)
4. Verify NO `paymentDate` field is present in response
5. Query `GET /api/expenses/exp-005` and confirm `paymentStatus = "Đã thanh toán"` and no `paymentDate`

**Expected Outcome:**
- Response includes updated `paymentStatus: "Đã thanh toán"`
- Response includes updated `updatedAt` timestamp
- Response does NOT include a `paymentDate` field (optional or removed)
- FE UI updates the expense row to show "Đã thanh toán" status and shows a success toast

**Risk If Not Tested:**
- If BE adds a `paymentDate` field that FE doesn't expect, FE may still work (ignores unknown fields) but data inconsistency exists
- If BE stores `paymentDate` internally but doesn't return it, the field is opaque and may cause confusion during audits
- If `paymentStatus` is returned as `"Paid"` (English), filter operations will break (filters use Vietnamese values)

**Integration Gap Reference:**
- FE mapping row 77: `"NOTE: no paymentDate field"`
- `Expense` interface in `expenses/types.ts` has NO `paymentDate` field
- `expenseService.ts:markExpensePaid()` (line 116) only updates `paymentStatus`, not `paymentDate`
- **Action Required:** BE must NOT return `paymentDate` in response, or FE must be updated to handle it

---

### P1-007: Dashboard Stats Aggregation — All 8 Fields Must Present & Match

| Field | Value |
|---|---|
| **Test ID** | P1-007 |
| **Test Name** | GET /api/dashboard/stats returns all 8 fields with correct aggregations |
| **Module** | Dashboard (`dashboard/page.tsx`) |
| **Test Type** | API Integration + Aggregation Logic |
| **FE Source** | `dashboard/page.tsx:getDashboardStats()` (line 14 mapping) |
| **Mapping Ref** | Row 14, `Load dashboard KPIs` action |

**Preconditions:**
- DB contains:
  - 20 rooms (from mockRooms): 13 occupied (Đang thuê), 5 vacant (Trống), 1 maintenance (Bảo trì), 1 reserved (Đã đặt)
  - 12 tenants: 10 with status 'Đang thuê', 1 with status 'Đã trả phòng', 1 with status 'Nợ tiền'
  - 50 expenses with various dates and statuses
  - 8+ contracts with various statuses and expiry dates
- Current month: May 2025
- Current date: 2025-05-18

**Test Steps:**
1. GET `/api/dashboard/stats` with no query params
2. Verify response HTTP 200 with **exact** structure:
   ```json
   {
     "totalRooms": 20,
     "occupiedRooms": 13,
     "vacantRooms": 5,
     "occupancyRate": 65.0,
     "currentMonthRevenue": [sum of all contract monthlyRent for active contracts in May],
     "currentMonthExpenses": [sum of all expenses with expenseDate in May],
     "overdueAmount": [sum of all tenant debts with status 'Nợ tiền' OR overdue payments],
     "expiringContracts": [count of contracts expiring within 30 days]
   }
   ```
3. Verify each field type:
   - `totalRooms`: integer
   - `occupiedRooms`: integer (count of rooms with status 'Đang thuê')
   - `vacantRooms`: integer (count of rooms with status 'Trống')
   - `occupancyRate`: float (0–100, percentage)
   - `currentMonthRevenue`: integer (VND, no cents)
   - `currentMonthExpenses`: integer (VND, no cents)
   - `overdueAmount`: integer (VND, no cents)
   - `expiringContracts`: integer (count of contracts with daysUntilExpiry between 1 and 30)
4. Verify calculations:
   - `occupancyRate = (occupiedRooms / totalRooms) * 100` (e.g., 13/20 = 65%)
   - `occupiedRooms + vacantRooms + maintenance + reserved == totalRooms`
   - `currentMonthRevenue` sums only active contracts (status 'Đang hiệu lực' or 'Sắp hết hạn') for May
   - `currentMonthExpenses` includes all expenses with `expenseDate` in May 2025
   - `overdueAmount` sums all tenant.debt values where status is 'Nợ tiền'
5. Modify DB (add/delete a room, create an expense, change tenant status) and re-query to verify updates

**Expected Outcome:**
- Response includes all 8 fields, no missing fields
- All values are numeric (no strings like `"65.0"`)
- All aggregations match manual calculation from DB
- KPIBentoGrid in FE dashboard renders all 4 cards: "Tổng phòng", "Phòng cho thuê", "Phòng trống", "Tỷ lệ lấp đầy", "Doanh thu tháng này", "Chi phí tháng này", "Số tiền quá hạn", "Hợp đồng sắp hết hạn"

**Risk If Not Tested:**
- Missing a single field breaks the entire dashboard (FE assumes all 8 are present)
- Wrong aggregation logic: If `occupancyRate` is calculated as `occupiedRooms / vacantRooms` instead of `occupiedRooms / totalRooms`, dashboard KPIs are misleading
- Aggregation across multiple tables is complex: rooms, contracts, expenses, tenants must be joined and summed correctly
- FE has NO error handling for this endpoint (row 14 note: `"No error handling in current mock — integration risk"`)
- A single null or missing field will cause the entire dashboard to fail to render

**Integration Gap Reference:**
- Mapping row 14: `"No error handling in current mock — integration risk"`
- FE expects exact response structure; response payload must be validated against this schema
- Dashboard depends on real-time aggregates — BE must query all 4+ tables and compute sums in a single endpoint

---

## P2 Tests — Important but Lower Risk

These tests cover important workflows that are lower risk due to better FE error handling, simpler state transitions, or less critical business impact.

### P2-001: Room Bulk Delete — Multiple Records with Error Handling

| Field | Value |
|---|---|
| **Test ID** | P2-001 |
| **Test Name** | POST /api/rooms/bulk-delete removes multiple rooms and returns count |
| **Module** | Room Management (`room-management/page.tsx`) |
| **Test Type** | API Integration |
| **FE Source** | `page.tsx:handleBulkDelete()` (lines 151–154) |
| **Mapping Ref** | Row 29, `Bulk delete rooms` action |

**Preconditions:**
- 5 vacant rooms exist in DB (status = 'Trống')
- 2 occupied rooms exist in DB (status = 'Đang thuê')

**Test Steps:**
1. POST `/api/rooms/bulk-delete` with:
   ```json
   {
     "ids": ["r3", "r13", "r17", "r20"]
   }
   ```
2. Verify response HTTP 200 with `{deleted: 4}`
3. Query `GET /api/rooms` and confirm those 4 rooms are no longer in list
4. Attempt to POST `/api/rooms/bulk-delete` with mixed occupied and vacant rooms:
   ```json
   {
     "ids": ["r1", "r3"]
   }
   ```
5. Verify either:
   - **Option A:** Partial success — delete r3, skip r1 with error `{deleted: 1, failed: [{id: "r1", reason: "Occupied"}]}`
   - **Option B:** All-or-nothing — return 409 Conflict with error, delete nothing

**Expected Outcome:**
- Clear response indicating which rooms were deleted
- No orphaned records (rooms deleted from all references)
- FE bulk action bar clears selection on success

**Risk If Not Tested:**
- Bulk operations are often source of silent failures (some records deleted, others not)
- FE assumes all selected records are deleted (line 153 filters them out immediately)
- If BE fails silently or partially, FE state will be out of sync with DB

---

### P2-002: Contract Expiry Threshold Computations — 7/15/30 Day Zones

| Field | Value |
|---|---|
| **Test ID** | P2-002 |
| **Test Name** | Contracts with different expiry timelines are categorized into 7/15/30 day zones |
| **Module** | Contract Management (`ExpiryAlertBanner.tsx`) |
| **Test Type** | API Integration + Business Logic |
| **FE Source** | `ExpiryAlertBanner.tsx` (renders 3 zones) |
| **Mapping Ref** | Row 40, `Load expiry alerts` action |

**Preconditions:**
- Contracts with exact expiry dates:
  - 3 days until expiry (red zone)
  - 10 days until expiry (orange zone)
  - 25 days until expiry (yellow zone)
  - 45 days until expiry (not alert)

**Test Steps:**
1. GET `/api/contracts/expiring?withinDays=30`
2. Verify response includes only contracts expiring within 30 days (3, 10, 25 day contracts)
3. Verify each contract has `daysUntilExpiry` field calculated correctly
4. FE ExpiryAlertBanner should render 3 zones with correct contracts in each

**Expected Outcome:**
- Contracts correctly categorized by severity
- Calculations precise (no off-by-one errors in day count)

---

### P2-003: Tenant Detail — Payments Tab Real Data

| Field | Value |
|---|---|
| **Test ID** | P2-003 |
| **Test Name** | GET /api/tenants/:id/payments returns real PaymentRecord[] (currently hardcoded) |
| **Module** | Tenant Management (`DetailModal`, tab 4) |
| **Test Type** | API Integration + Data Structure |
| **FE Source** | `DetailModal` tab 4; currently hardcoded 3 mock payments |
| **Mapping Ref** | Row 63, `View tenant payments (tab)` action |

**Preconditions:**
- Tenant with ID `t1` has multiple payment records in DB
- Response shape must match FE expectations

**Test Steps:**
1. GET `/api/tenants/t1/payments`
2. Verify response is array of `PaymentRecord[]`
3. Verify each record has fields FE uses:
   - date
   - amount
   - method
   - status
   - note
4. Verify total paid matches sum of all payments

**Expected Outcome:**
- Response matches `PaymentRecord[]` interface
- No hardcoded data
- Total aggregation is correct

---

### P2-004: Post Status Transitions — Draft → Scheduled → Published

| Field | Value |
|---|---|
| **Test ID** | P2-004 |
| **Test Name** | Post status transitions from Nháp → Đã lên lịch → Đã đăng via different endpoints |
| **Module** | Post Management (`post-management/page.tsx`) |
| **Test Type** | API Integration + State Transitions |
| **FE Source** | `page.tsx` (buttons: Schedule, Post Now, Save) |
| **Mapping Ref** | Rows 93–94, `Post now` and `Schedule post` actions |

**Preconditions:**
- One post with status 'Nháp' (draft) exists

**Test Steps:**
1. POST `/api/posts/:id/schedule` with `{scheduledAt: "2025-05-25T10:00:00Z"}`
   - Verify response has `status: "Đã lên lịch"`, `plannedDate: "2025-05-25T10:00:00Z"`
2. POST `/api/posts/:id/publish` with empty body
   - Verify response has `status: "Đã đăng"`, `postedDate: now`
3. Verify transitions are idempotent (can't post twice, can't schedule after publishing)

**Expected Outcome:**
- Status transitions work correctly
- Timestamps are set appropriately
- Invalid transitions are rejected

---

### P2-005: Expense Report Aggregation — Category Breakdown

| Field | Value |
|---|---|
| **Test ID** | P2-005 |
| **Test Name** | GET /api/reports/expense-breakdown aggregates expenses by category |
| **Module** | Reports (`reports/page.tsx`) |
| **Test Type** | API Integration + Aggregation |
| **FE Source** | `reportService.getExpenseBreakdown()` |
| **Mapping Ref** | Row 104, `Load expense breakdown` action |

**Preconditions:**
- 50 expenses with various categories and amounts in DB
- Categories: Điện nước, Internet, Vệ sinh, Sửa chữa, Mua sắm, Lương / quản lý, Chi phí khác

**Test Steps:**
1. GET `/api/reports/expense-breakdown?periodType=month&selectedMonth=5&selectedYear=2025`
2. Verify response is array of `{category, amount, percentage}`
3. Verify percentages sum to 100
4. Verify amounts sum to total expenses for the month

**Expected Outcome:**
- Correct aggregation by category
- All categories present (no missing categories)
- Percentages and sums are accurate

---

### P2-006: Agent Chat Send — Session ID & Message Continuity

| Field | Value |
|---|---|
| **Test ID** | P2-006 |
| **Test Name** | POST /api/agent/chat sends message and receives response with session continuity |
| **Module** | Agent (`AgentChatPanel`) |
| **Test Type** | API Integration + Session Management |
| **FE Source** | `AgentChatPanel:handleSend()` |
| **Mapping Ref** | Row 118, `Send chat message` action; Critical Risk #6: `"FE does not generate or persist a sessionId"` |

**Preconditions:**
- Agent chat panel is open
- No session ID yet initialized on FE

**Test Steps:**
1. POST `/api/agent/chat` first time with:
   ```json
   {
     "message": "What are the vacant rooms?",
     "sessionId": null
   }
   ```
2. Verify response includes:
   - `{message: "assistant response", sessionId: "sess-123"}`
3. Store `sessionId` in FE
4. POST `/api/agent/chat` second time with:
   ```json
   {
     "message": "How many people in P201?",
     "sessionId": "sess-123"
   }
   ```
5. Verify response uses the same `sessionId` and maintains context (can reference "vacant rooms" from message 1)

**Expected Outcome:**
- Session ID is generated and returned on first message
- FE persists session ID for subsequent messages
- Agent remembers context across messages in same session

**Risk If Not Tested:**
- Without session ID, each message is isolated, losing conversation context
- Agent will be unable to answer follow-up questions like "show me a list" if the previous message asked for room data
- FE currently has no sessionId persistence logic — integration will require FE changes

---

### P2-007: Notification Mark as Read — Optimistic Update & Rollback

| Field | Value |
|---|---|
| **Test ID** | P2-007 |
| **Test Name** | PATCH /api/notifications/:id/read updates notification with rollback on failure |
| **Module** | Notifications (`Topbar`) |
| **Test Type** | API Integration + Optimistic Update |
| **FE Source** | `Topbar` (notification dropdown) |
| **Mapping Ref** | Row 138, `Mark notification read` action |

**Preconditions:**
- 5 unread notifications in DB
- One notification has ID `notif-001`

**Test Steps:**
1. PATCH `/api/notifications/notif-001/read` with empty body
2. Verify response HTTP 200 with `{id: "notif-001", read: true}`
3. Query `GET /api/notifications/count` and verify unread count decreased by 1
4. Simulate network failure on PATCH request:
   - FE optimistically sets `read: true` on the notification in state
   - Request fails (timeout or 500 error)
   - Verify FE can rollback the notification to `read: false` if user closes and re-opens notification panel

**Expected Outcome:**
- Notification is marked read in DB
- Unread badge updates correctly
- Failure scenarios are handled gracefully

---

## Risk Summary Table

| Risk ID | Scenario | Severity | Mitigation |
|---|---|---|---|
| R1 | Contract renew not atomic — old contract not marked, new not created | **Critical** | Test P1-001: verify both updates in single DB transaction |
| R2 | Contract terminate field mismatch — FE sends no reason/date, BE expects them | **Critical** | Test P1-002: clarify contract termination contract (option A or B) |
| R3 | Expense category enum values differ between types.ts and mockData.ts | **High** | Test P1-003: roundtrip categories, verify FE enum is authoritative |
| R4 | Room delete allowed on occupied rooms if BE lacks guard | **High** | Test P1-004: enforce 409 on occupied room delete at API level |
| R5 | Tenant created without status defaults to null, breaking filters | **Medium** | Test P1-005: confirm status defaults to 'Đang thuê' |
| R6 | Mark paid endpoint returns unexpected paymentDate field | **Low** | Test P1-006: verify field is NOT in response |
| R7 | Dashboard stats missing a field or wrong aggregation logic | **Critical** | Test P1-007: verify all 8 fields, validate calculations |
| R8 | Bulk operations silently fail on subset of records | **High** | Test P2-001: clear error reporting for partial failures |
| R9 | Contract expiry threshold calculations off-by-one | **Medium** | Test P2-002: validate 7/15/30 day zones |
| R10 | Tenant payment tab hardcoded data not replaced with API | **Medium** | Test P2-003: verify real PaymentRecord[] response |
| R11 | Post status transitions don't validate state machine | **Medium** | Test P2-004: test invalid transitions (e.g., publish twice) |
| R12 | Expense report missing categories or wrong percentages | **Medium** | Test P2-005: validate aggregation and sums |
| R13 | Agent chat loses context without session ID | **High** | Test P2-006: FE must persist sessionId, BE must return it |
| R14 | Notification mark-as-read not idempotent | **Low** | Test P2-007: verify can mark read multiple times safely |

---

## Test Execution Plan

### Phase 1: P1 Tests (Must Pass Before Feature Freeze)
Execute in order: P1-001 → P1-002 → P1-003 → P1-004 → P1-005 → P1-006 → P1-007

**Expected Duration:** 8–12 hours  
**Success Criteria:** All 7 tests pass without errors or data inconsistencies

### Phase 2: P2 Tests (Nice to Have Before Release)
Execute in any order: P2-001 → P2-007

**Expected Duration:** 6–8 hours  
**Success Criteria:** 5+ of 7 tests pass (bulk operations and report aggregation can be addressed in Phase 2 or minor release)

### Test Environment
- Isolated test database with seed data from mockData.ts
- Fresh DB state before each test run
- Backend API running locally on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- Test framework: Pytest + SQLAlchemy (backend), Jest + Supertest (integration)

---

## Notes for Backend Developer

1. **Atomicity:** Contract renew and terminate operations should use database transactions to ensure both old contract update and new contract insert succeed together.

2. **Enum Consistency:** Choose a single authoritative enum for ExpenseCategory (recommend `types.ts` values). Update mockData.ts to match.

3. **Default Values:** Tenant creation should always return `status: 'Đang thuê'` by default unless explicitly provided.

4. **Constraint Enforcement:** All business rules enforced client-side (delete occupied room, bulk delete failed rooms) must ALSO be enforced server-side via API validation.

5. **Response Schemas:** All response payloads must match the FE interface expectations exactly (field names, types, presence/absence of optional fields).

6. **Session Management:** Agent chat requires a session ID for conversation context. FE needs to be updated to persist and reuse session IDs.

7. **Field Naming:** Use Vietnamese field names where applicable (e.g., `Đã thanh toán`, not `paid`). Match FE enum values exactly.

---

## Appendix: Field Mapping Validation Checklist

Before marking any test as complete, verify:

- [ ] Request payload matches mapping table "Request Payload" column
- [ ] Response payload has all expected fields from mapping table "Expected Response" column
- [ ] No unexpected fields in response (or document why they're present)
- [ ] HTTP status codes are appropriate (201 for creates, 204 for deletes, 409 for constraint violations)
- [ ] Error responses include a descriptive message, not just a code
- [ ] Pagination works if applicable (`page`, `limit`, `total` fields)
- [ ] Timestamps are ISO 8601 format and server-generated (not client timestamp)
- [ ] Numeric values have correct precision (no floating-point errors in money calculations)
- [ ] Vietnamese text is preserved without transformation (no encoding issues)
- [ ] Arrays are empty arrays `[]`, not null, when empty

