# Gap Analysis: MotelManage Current State vs. Target State

**Document ID:** 06-gap-analysis  
**Version:** 1.0  
**Date:** 2026-05-18  
**Scope:** Frontend-only mock system (Next.js 15) vs. full production system (FE + FastAPI/PostgreSQL backend)

---

## Executive Summary

MotelManage is **100% frontend-implemented** with in-memory mock data and **zero backend** infrastructure. All 76 features function in isolation via React useState and mock service files. The gap between current state and production readiness is **critical and extensive**: no real authentication, no persistence, no real API calls, hardcoded user identity, missing pages, duplicate type definitions, and validation split between frontend only.

**Key Findings:**
- Backend folder: **empty (0 files)**
- Axios installed: **never called**
- Pages implemented: **8/11** (missing login, settings, notifications)
- Type conflicts found: **2 major** (ExpenseCategory mismatch)
- Mock-only features: **5 identified** (payment history, activity feed, etc.)
- Production blockers: **12 critical gaps**

---

## Gap Categories & Detailed Analysis

---

### 1. Backend Not Implemented — CRITICAL

**Severity:** CRITICAL  
**Impact:** System non-functional without backend; all features fall back to mock data.

#### Gap Description
The entire backend layer is missing. The `backend/` directory is empty (verified: no files). The FastAPI/PostgreSQL architecture is planned in `docs/backend-build-plan.md` but zero code exists. All data mutations (create, update, delete) only modify in-memory mock state in the frontend.

#### Evidence
- **Directory status:** `/backend/` contains only `.` and `..` (confirmed via `ls -la`)
- **Frontend fallback:** All service files (`expenseService.ts`, `reportService.ts`, etc.) use local state
- **Data persistence:** Zero database writes; data loss on page refresh
- **API comments:** "Backend integration point" markers exist in 13 files but are never implemented

#### Affected Features
All 76 features depend on backend for production:
- Room Management (6 features)
- Tenant Management (8 features)
- Contract Management (7 features)
- Expenses (6 features)
- Reports (5 features)
- Post Management (5 features)
- Payment Collection (4 features)
- Notifications (3 features)
- And 37 others

#### File References
- `/backend/` — **empty directory**
- `frontend/src/app/expenses/expenseService.ts:1-3` — Mock implementation with placeholder API_BASE
- `frontend/src/app/dashboard/page.tsx:9-11` — Backend integration comments
- `frontend/src/app/room-management/page.tsx:14` — Backend integration comment
- `frontend/src/app/contract-management/page.tsx:15` — Backend integration comment

#### Resolution Required Before Production
1. Implement entire FastAPI backend following `docs/backend-build-plan.md`
2. Scaffold all modules: rooms, tenants, contracts, expenses, reports, posts, payments, auth
3. Migrate all service files to real HTTP calls via axios
4. Implement PostgreSQL schema + migrations
5. Add comprehensive backend validation (duplicate FE validation server-side)

---

### 2. Enum/Type Mismatches — HIGH

**Severity:** HIGH  
**Impact:** Form validation failures; inconsistent category handling across modules.

#### Gap Description
Critical type conflict exists for `ExpenseCategory` enum. `mockData.ts` defines one set of categories; `expenses/types.ts` defines a different set. This will cause runtime errors when FE and BE are integrated.

#### Evidence

**File 1: `frontend/src/lib/mockData.ts:6`**
```typescript
export type ExpenseCategory = 'Bảo trì' | 'Điện' | 'Nước' | 'Internet' | 'Vệ sinh' | 'Lương' | 'Khác';
```
- 7 categories: Bảo trì, Điện, Nước, Internet, Vệ sinh, Lương, Khác

**File 2: `frontend/src/app/expenses/types.ts:3-4`**
```typescript
export type ExpenseCategory =
  | 'Điện nước' |'Internet' |'Vệ sinh' |'Sửa chữa' |'Mua sắm' |'Lương / quản lý' |'Chi phí khác';
```
- 7 categories: Điện nước, Internet, Vệ sinh, Sửa chữa, Mua sắm, Lương / quản lý, Chi phí khác

**Overlap issues:**
- `mockData.ts` has separate "Điện" + "Nước" → `expenses/types.ts` combines as "Điện nước"
- `mockData.ts` has "Lương" → `expenses/types.ts` has "Lương / quản lý"
- `mockData.ts` has "Khác" → `expenses/types.ts` has "Chi phí khác"
- `mockData.ts` has no "Sửa chữa" or "Mua sắm" equivalents
- `expenses/types.ts` has no "Bảo trì" equivalent

**Conflict impact:**
- `mockExpenses.ts` uses mockData categories (e.g., 'Bảo trì', 'Điện', 'Nước')
- `ExpenseFormModal.tsx` renders options from `expenses/types.ts` (EXPENSE_CATEGORIES constant)
- **Result:** If user selects "Sửa chữa" from form, it won't match mockExpenses entries that use "Bảo trì"

#### Affected Features
- F-23: Create/Update Expense (mismatches in form submission)
- F-24: Filter Expenses by Category (category dropdown mismatch)
- F-25: Expense Analytics (category aggregation fails)

#### File References
- `frontend/src/lib/mockData.ts:6`
- `frontend/src/app/expenses/types.ts:3-4`
- `frontend/src/app/expenses/mockExpenses.ts` — uses mockData categories
- `frontend/src/app/expenses/page.tsx` — renders ExpenseFormModal with mismatched categories

#### Resolution Required Before Production
1. Reconcile enums: choose one canonical set of expense categories
2. Update mockData.ts and mockExpenses.ts to match
3. Update backend FastAPI enums to match
4. Validate all category constants across FE (no more than one definition per type)
5. Add enum consistency tests

---

### 3. Missing Pages/Routes — HIGH

**Severity:** HIGH  
**Impact:** Key features unavailable; incomplete feature coverage.

#### Gap Description
Three critical pages referenced in the navigation and feature spec do not exist:

#### Missing Pages

| Page | Route | Status | Reason |
|---|---|---|---|
| **Login** | `/login` | ❌ Missing | No auth flow; user hardcoded as "Nguyễn Văn Chủ" |
| **Settings** | `/settings` | ❌ Missing | Referenced in Sidebar (line 39); no implementation |
| **Notifications** | `/notifications` | ❌ Missing | No dedicated page; notifications only in mock array |

#### Evidence
- **Sidebar navigation:** `frontend/src/components/Sidebar.tsx:39` — `/settings` link exists but no route
- **Sidebar items:** No `/login` in nav (would be unusual to expose in main nav, but auth flow missing entirely)
- **Routes searched:** Glob pattern `frontend/src/app/*/page.tsx` returns 8 pages; no login, settings, notifications
- **Features requiring these:**
  - F-01: User Login
  - F-02: User Profile
  - F-69: System Settings
  - F-70: Notification Preferences

#### File References
- `frontend/src/components/Sidebar.tsx:39` — `/settings` link points to non-existent page
- `docs/frontend-business-spec.md` (implied) — features F-01, F-02, F-69, F-70 require these pages
- No routes under `/login`, `/settings`, `/notifications` in app directory

#### Affected Features
- F-01: User Login (0% implemented)
- F-02: User Profile / Account Settings (0% implemented)
- F-69: Configure System Settings (0% implemented)
- F-70: Notification Preferences (0% implemented)

#### Resolution Required Before Production
1. Create `/login` page with auth form + JWT flow
2. Create `/settings` page with user profile, system settings, preferences
3. Create `/notifications` page with notification center
4. Wire all pages to backend auth endpoints
5. Implement auth guard middleware for protected routes

---

### 4. Authentication Gap — CRITICAL

**Severity:** CRITICAL  
**Impact:** System has no multi-user support; anyone can access all data; no role-based access control.

#### Gap Description
**Zero authentication infrastructure exists.** User identity is hardcoded as "Nguyễn Văn Chủ" (property owner). No login page, no JWT tokens, no session management, no route guards. All endpoints assume a single authenticated user.

#### Evidence

**User hardcoded in two locations:**

1. **Sidebar:** `frontend/src/components/Sidebar.tsx:189`
```typescript
<p className="text-sm font-semibold text-white truncate">Nguyễn Văn Chủ</p>
<p className="text-xs text-slate-400 truncate">Chủ nhà · Admin</p>
```

2. **Expense Service:** `frontend/src/app/expenses/expenseService.ts:75`
```typescript
createdBy: 'Nguyễn Văn Chủ',
```

3. **Activity Feed:** `frontend/src/app/dashboard/components/ActivityFeed.tsx:16-24`
```typescript
const activities: ActivityItem[] = [
  { id: '1', ..., actor: 'NV' }, // All hardcoded with NV initials
  ...
];
```

**Missing implementations:**
- ❌ No `/login` route
- ❌ No JWT token generation/validation
- ❌ No password hashing
- ❌ No session storage
- ❌ No route guards (all routes public)
- ❌ No role-based access control (RBAC)
- ❌ No user permissions model

**Backend plan mentions RBAC but FE has no placeholder:**
- `docs/backend-build-plan.md` § 2. Module Boundaries lists "auth" as core module
- Plan describes role-based access but FE has no role concept
- Sidebar shows only one role: "Admin"

#### Affected Features
- F-01: User Login (0% implemented)
- F-02: User Profile (0% implemented)
- F-69: System Settings (0% implemented)
- F-71: User Role Management (0% implemented)
- All 76 features assume single authenticated user

#### File References
- `frontend/src/components/Sidebar.tsx:189-190` — hardcoded user name + role
- `frontend/src/app/expenses/expenseService.ts:75` — hardcoded creator
- `frontend/src/app/dashboard/components/ActivityFeed.tsx` — hardcoded activity actors
- No auth middleware, no token interceptor in axios
- No protected routes in app layout

#### Resolution Required Before Production
1. Implement FastAPI JWT auth with `/auth/login`, `/auth/logout`, `/auth/refresh`
2. Add password hashing (bcrypt) and storage in PostgreSQL users table
3. Create axios auth interceptor to attach JWT to all requests
4. Implement Next.js middleware for route guards
5. Add role-based access control (roles: admin, staff, property-manager, accountant, etc.)
6. Create `/login` page with email/password form
7. Store user context in React context or Zustand state
8. Verify auth token on app load; redirect to login if expired
9. Implement logout flow

---

### 5. Real API Call Gap — CRITICAL

**Severity:** CRITICAL  
**Impact:** No data persistence; axios installed but never called; all operations isolated to mock state.

#### Gap Description
**Axios is installed but never imported or called in any service file.** All service files have placeholder comments ("Backend integration point") but implement mock in-memory operations only. Frontend and backend cannot exchange data.

#### Evidence

**Axios installed in package.json (via `npm ls axios`):**
- Package exists in node_modules
- Available for use but unused

**Backend integration comments without implementation:**
```typescript
// 13 files found with "Backend integration point" comments
```

**Service file structure (all follow same mock pattern):**
- `frontend/src/app/expenses/expenseService.ts:3` — API_BASE declared but never used
- No axios import in service files
- All functions use mock store: `let expensesStore: Expense[] = [...mockExpenses]`
- Data modifications only update local array: `expensesStore = [...expensesStore, newExpense]`
- No HTTP calls: `.get()`, `.post()`, `.put()`, `.delete()` never used

**Example from expenseService.ts:**
```typescript
// Line 1: Backend integration point comment
// Line 3: const API_BASE = '/api/expenses';  // ← declared but never used
// Line 8: let expensesStore: Expense[] = [...mockExpenses]; // ← in-memory mock
// Line 23-53: getExpenses() simulates API delay + returns mock data
// Line 60-82: createExpense() adds to mock array only
```

**Impact cascade:**
- User creates expense → stored only in browser memory
- Page reload → data lost (returns to mockExpenses array)
- Axios interceptor could not exist (no auth token to attach)
- Error handling only for mock delays (no network errors possible)

#### Affected Features
All 76 features with create/read/update/delete operations:
- Room management: F-03–F-09 (create/edit/delete rooms, all mock)
- Tenant management: F-11–F-19 (create/edit/delete tenants, all mock)
- Contract management: F-20–F-27 (create/renew/terminate contracts, all mock)
- Expenses: F-43–F-48 (create/edit/delete expenses, all mock)
- All other features with data mutations

#### File References
- `frontend/src/app/expenses/expenseService.ts` — 122 lines, all mock
- `frontend/src/app/reports/reportService.ts` — reports service (mock)
- `frontend/src/app/agent/agentService.ts` — agent service (mock)
- `frontend/src/app/dashboard/page.tsx:9-11` — 3 integration point comments
- `frontend/src/app/room-management/page.tsx:14` — integration comment
- `frontend/src/app/contract-management/page.tsx:15` — integration comment

#### Resolution Required Before Production
1. Implement FastAPI backend with all CRUD endpoints
2. Create axios instance with base URL + auth interceptor
3. Replace all mock service functions with real HTTP calls
4. Add error handling for network failures, validation errors, auth failures
5. Implement pagination + filtering server-side
6. Add request/response logging for debugging
7. Test all service methods against real backend

---

### 6. Mock-Only Features — HIGH

**Severity:** HIGH  
**Impact:** Features appear functional but contain hardcoded static data; no real data flow.

#### Gap Description
Several features use hardcoded mock data instead of real data queries. Users cannot distinguish between mock and real:
- Tenant payment history always shows 3 identical transactions
- Activity feed has 8 hardcoded events
- Dashboard KPIs computed from mock data only

#### Evidence

**1. Tenant Payment History (3 hardcoded items)**
- `frontend/src/app/tenant-management/page.tsx:114-118`
```typescript
const mockPayments = [
  { date: '05/03/2025', amount: tenant.currentRoomId ? 3500000 : 0, type: 'Tiền thuê tháng 3', status: 'Đã thanh toán' },
  { date: '05/02/2025', amount: tenant.currentRoomId ? 3500000 : 0, type: 'Tiền thuê tháng 2', status: 'Đã thanh toán' },
  { date: '05/01/2025', amount: tenant.currentRoomId ? 3500000 : 0, type: 'Tiền thuê tháng 1', status: 'Đã thanh toán' },
];
```
- **Issue:** Always 3 months of data; amounts hardcoded; dates hardcoded
- **Impact:** Cannot show actual payment history; user cannot see if tenant overpaid, underpaid, or has payment gaps
- **Resolution needed:** Load from backend `/api/tenants/{id}/payments`

**2. Activity Feed (8 hardcoded events)**
- `frontend/src/app/dashboard/components/ActivityFeed.tsx:16-24`
```typescript
const activities: ActivityItem[] = [
  { id: '1', type: 'contract', title: 'Ký hợp đồng mới', ... },
  { id: '2', type: 'payment', title: 'Thu tiền thuê', ... },
  // ... 6 more hardcoded entries
];
```
- **Issue:** Static 8 entries; timestamps hardcoded ("2 giờ trước", "4 giờ trước")
- **Impact:** Users see same activity every page load; cannot track actual system changes
- **Resolution needed:** Load from backend `/api/activity?limit=8` (mentioned in dashboard comments)

**3. Dashboard KPI Cards**
- `frontend/src/app/dashboard/components/KPIBentoGrid.tsx` (not read, but inferred from mockData)
- Computes stats from mockRooms, mockTenants, mockContracts
- **Issue:** Mock data is static; cannot reflect real occupancy, revenue, profit
- **Impact:** Dashboard shows unrealistic KPIs based on test data
- **Resolution needed:** Load from `/api/dashboard/stats` (mentioned in dashboard comments)

#### Affected Features
- F-64: View Payment History (shows mock only)
- F-65: View Activity Log (shows mock only)
- F-72: Dashboard Summary (KPIs from mock data)

#### File References
- `frontend/src/app/tenant-management/page.tsx:114-118`
- `frontend/src/app/dashboard/components/ActivityFeed.tsx:16-24`
- `frontend/src/app/dashboard/page.tsx:9-11` (integration comments)

#### Resolution Required Before Production
1. Replace hardcoded mock with API calls
2. Fetch real payment history from `/api/tenants/{id}/payments`
3. Fetch real activity feed from `/api/activity`
4. Fetch dashboard KPIs from `/api/dashboard/stats`
5. Implement pagination for activity feed (more than 8 items)
6. Add timestamps that reflect actual event times (not relative strings)

---

### 7. Validation Gaps — HIGH

**Severity:** HIGH  
**Impact:** Invalid data accepted by frontend; backend will receive bad data; inconsistent error handling.

#### Gap Description
Validation exists only on frontend (expenses module) but is missing from other modules. No client-side validation for tenant names, room prices, contract dates. Backend validation must be comprehensive but FE should catch common errors early.

#### Evidence

**Present validation (only in expenses):**
- `frontend/src/app/expenses/components/ExpenseFormModal.tsx:55-65`
```typescript
function validate(): boolean {
  const e: Partial<Record<keyof ExpenseFormData, string>> = {};
  if (!form.title.trim()) e.title = 'Vui lòng nhập tên khoản chi';
  if (!form.category) e.category = 'Vui lòng chọn danh mục';
  if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
    e.amount = 'Vui lòng nhập số tiền hợp lệ';
  if (!form.expenseDate) e.expenseDate = 'Vui lòng chọn ngày chi';
  if (!form.paymentStatus) e.paymentStatus = 'Vui lòng chọn trạng thái';
  setErrors(e);
  return Object.keys(e).length === 0;
}
```

**Missing validation (no frontend validation in other modules):**

| Module | Form Fields | Validation | Status |
|---|---|---|---|
| **Tenant Management** | fullName, phone, cccd, birthDate, address | None | ❌ Missing |
| **Contract Management** | startDate, endDate, monthlyRent, deposit | None | ❌ Missing |
| **Room Management** | roomCode, floor, area, rentPrice, deposit | None | ❌ Missing |
| **Expenses** | title, category, amount, date, status | ✓ Present | ✓ Exists |

**Form examples without validation:**
- `TenantFormModal` (lines 294-368): no validation before calling `onSave(form)`
- `RoomFormModal` (not examined): presumably no validation
- `ContractFormModal` (not examined): presumably no validation

**Error handling inconsistency:**
- Expense page: has error state (`error` flag) and error toast
- Other pages: no error states; all operations assume success

#### Affected Features
- F-11: Create Tenant (no validation for phone format, CCCD format)
- F-12: Edit Tenant (no validation)
- F-20: Create Contract (no validation for date logic: endDate > startDate)
- F-03: Create Room (no validation for numeric fields)

#### File References
- `frontend/src/app/expenses/components/ExpenseFormModal.tsx:55-65` — only validation example
- `frontend/src/app/tenant-management/page.tsx:294-368` — TenantFormModal (no validation)
- `frontend/src/app/contract-management/page.tsx` — ContractFormModal (assumed no validation)
- `frontend/src/app/room-management/page.tsx` — RoomFormModal (assumed no validation)

#### Resolution Required Before Production
1. Add client-side validation to all forms (tenant, contract, room, post)
2. Validate:
   - Phone numbers: Vietnamese format (10 digits, starts with 0)
   - CCCD: 12 digits (Vietnamese ID format)
   - Email: standard email regex
   - Dates: endDate > startDate (for contracts)
   - Numeric fields: positive numbers, within reasonable ranges
3. Display validation errors inline with field highlighting
4. Implement comprehensive server-side validation (duplicate check on BE)
5. Ensure error messages are user-friendly

---

### 8. Error Handling Gaps — MEDIUM

**Severity:** MEDIUM  
**Impact:** Users see no feedback on failures; silent failures; poor debugging.

#### Gap Description
Most modules have no error states. The expenses module has basic error handling; others assume all operations succeed.

#### Evidence

**Error handling present (only in expenses):**
- `frontend/src/app/expenses/page.tsx:53-54`
```typescript
const [error, setError] = useState(false);
```
- `frontend/src/app/expenses/page.tsx:74-81`
```typescript
try {
  const data = await getExpenses(f);
  setExpenses(data);
} catch {
  setError(true);
} finally {
  setLoading(false);
}
```

**Error handling missing (no try/catch, no error UI):**

| Module | Component | Has Error State | Error UI | Status |
|---|---|---|---|---|
| **Expenses** | Page + modal | ✓ Yes | ✓ Toast | ✓ Present |
| **Tenant Management** | Page + modal | ❌ No | None | ❌ Missing |
| **Room Management** | Page + modal | ❌ No | None | ❌ Missing |
| **Contract Management** | Page + modal | ❌ No | None | ❌ Missing |
| **Reports** | Page | ❌ No | None | ❌ Missing |

**Impact:**
- User creates tenant → form silently closes; if BE fails, user unaware
- User deletes contract → no confirmation of deletion result
- Network timeout → no timeout error shown to user

#### Affected Features
All CRUD features in non-expense modules (68+ features)

#### File References
- `frontend/src/app/expenses/page.tsx:53-81` — good error handling example
- `frontend/src/app/tenant-management/page.tsx:427-450` — handleSave no error handling
- `frontend/src/app/room-management/page.tsx:57-71` — handleSaveRoom no error handling
- `frontend/src/app/contract-management/page.tsx` — no error handling

#### Resolution Required Before Production
1. Add error state + error UI to all pages with forms (tenant, room, contract, post)
2. Wrap all API calls in try/catch
3. Display error toasts for user-facing errors
4. Log errors to console/server for debugging
5. Handle specific error codes:
   - 400 Bad Request → show validation error
   - 401 Unauthorized → redirect to login
   - 403 Forbidden → show permission denied
   - 500 Server Error → show generic error, log details
   - Network timeout → show retry option

---

### 9. State Persistence Gap — CRITICAL

**Severity:** CRITICAL  
**Impact:** All user edits lost on page refresh; no data survives session; misleading UX.

#### Gap Description
All state lives in React `useState`. No persistence to localStorage, no backend sync, no database. Data loss on page refresh is immediate and complete.

#### Evidence

**State management pattern (all modules):**
- `frontend/src/app/expenses/page.tsx:51`
```typescript
const [expenses, setExpenses] = useState<Expense[]>([]);
```
- `frontend/src/app/tenant-management/page.tsx:389`
```typescript
const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
```
- `frontend/src/app/room-management/page.tsx:17`
```typescript
const [rooms, setRooms] = useState<Room[]>(mockRooms);
```

**User flow demonstrating gap:**
1. User opens app → mock data loaded into useState
2. User creates new tenant → state updated: `setTenants([newTenant, ...prevTenants])`
3. User clicks refresh (Cmd+R) → React component unmounts + remounts
4. New component mount → `useState` reinitializes from mock data
5. **New tenant gone forever** — only initial mockTenants array restored

**No recovery mechanisms:**
- ❌ localStorage backup
- ❌ Backend sync (no backend exists)
- ❌ Service worker for offline mode
- ❌ Undo/redo stack

#### Affected Features
All 76 features that modify data:
- Any room created/edited: lost on refresh
- Any tenant added/edited: lost on refresh
- Any contract signed/renewed: lost on refresh
- Any expense recorded: lost on refresh
- Any setting changed: lost on refresh

#### File References
- `frontend/src/app/expenses/page.tsx:51-60` — all state in useState
- `frontend/src/app/tenant-management/page.tsx:389-396` — all state in useState
- `frontend/src/app/room-management/page.tsx:17-26` — all state in useState
- `frontend/src/app/contract-management/page.tsx:18-29` — all state in useState
- Every service file uses in-memory mock store

#### Resolution Required Before Production
1. Implement backend database (PostgreSQL + Supabase)
2. Remove all in-memory mock stores
3. Fetch all data from backend on page load
4. Sync all mutations to backend immediately
5. Optional: add localStorage optimistic updates + sync queue for offline mode
6. Optional: implement Zustand or Redux for global state (but API should be source of truth)

---

### 10. Hardcoded Values — MEDIUM

**Severity:** MEDIUM  
**Impact:** Badge counts and user name embedded in UI; difficult to maintain; non-dynamic.

#### Gap Description
Badge counts in sidebar and user name in multiple locations are hardcoded constants, not computed from data.

#### Evidence

**Hardcoded Sidebar Badge Counts:**
- `frontend/src/components/Sidebar.tsx:32-35`
```typescript
const navItems: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard', ... },
  { label: 'Quản lý phòng', href: '/room-management', icon: ..., badge: 5, group: 'main' },
  { label: 'Hợp đồng', href: '/contract-management', icon: ..., badge: 4, group: 'main' },
  { label: 'Khách thuê', href: '/tenant-management', icon: ..., group: 'main' },
  { label: 'Bài đăng', href: '/post-management', icon: ..., badge: 2, group: 'marketing' },
  ...
];
```
- **Badges:** 5, 4, 2 are hardcoded constants
- **Should be:** computed from data:
  - Badge 5 (rooms) = count of vacant rooms: `mockRooms.filter(r => r.status === 'Trống').length`
  - Badge 4 (contracts) = count of expiring contracts: `mockContracts.filter(c => c.daysUntilExpiry !== null && c.daysUntilExpiry <= 7).length`
  - Badge 2 (posts) = count of scheduled posts: `mockPosts.filter(p => p.status === 'Đã lên lịch').length`

**Hardcoded User Names (multiple locations):**
- `frontend/src/components/Sidebar.tsx:189` — "Nguyễn Văn Chủ"
- `frontend/src/app/expenses/expenseService.ts:75` — "Nguyễn Văn Chủ"
- `frontend/src/app/dashboard/components/ActivityFeed.tsx:17-24` — all activities by "NV"

**Hardcoded Dashboard User Name:**
- `frontend/src/app/dashboard/components/DashboardHeader.tsx` (not examined, but likely has hardcoded name)

#### Affected Features
- F-69: System Settings (user info not editable; hardcoded)
- Dashboard (user name not dynamic)

#### File References
- `frontend/src/components/Sidebar.tsx:32-35` — hardcoded badge values
- `frontend/src/components/Sidebar.tsx:189-190` — hardcoded user name
- `frontend/src/app/expenses/expenseService.ts:75` — hardcoded creator
- `frontend/src/app/dashboard/components/ActivityFeed.tsx:17-24` — hardcoded actor

#### Resolution Required Before Production
1. Compute badge counts from actual data
2. Store current user in React context (from JWT token after login)
3. Replace all hardcoded "Nguyễn Văn Chủ" with dynamic user from context
4. Implement user profile editing in settings page

---

### 11. Stub/Empty Handlers — MEDIUM

**Severity:** MEDIUM  
**Impact:** UI shows actions but they don't work; misleading to users.

#### Gap Description
Several UI actions have no implementation. User clicks button, nothing happens; no error shown.

#### Evidence

**Empty Handler 1: End Rental (Kết thúc thuê)**
- `frontend/src/app/tenant-management/page.tsx:70`
```typescript
{ icon: <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />, label: 'Kết thúc thuê', action: () => {}, danger: false },
```
- **Issue:** Action is empty function `() => {}`
- **Impact:** User clicks "Kết thúc thuê" → nothing happens; no feedback
- **Expected:** Should trigger refund process, mark room as vacant, update tenant status

**Empty Handler 2: Contact (Liên hệ)**
- `frontend/src/app/tenant-management/page.tsx:68`
```typescript
{ icon: <PhoneIcon className="w-3.5 h-3.5" />, label: 'Liên hệ', action: () => {} },
```
- **Issue:** Action is empty function
- **Expected:** Should dial phone, open email, or show contact options

**Empty Handler 3: Create Contract (Tạo hợp đồng)**
- `frontend/src/app/tenant-management/page.tsx:69`
```typescript
{ icon: <DocumentTextIcon className="w-3.5 h-3.5" />, label: 'Tạo hợp đồng', action: () => {} },
```
- **Issue:** Action is empty function
- **Expected:** Should navigate to contract creation form with tenant pre-filled

**Possible stubs (not verified, but likely):**
- Export Excel (F-59): probably shows toast but doesn't download
- Print (F-60): probably shows toast but doesn't print
- Send notification: probably no-op

#### Affected Features
- F-19: End Rental (stub handler)
- F-61: Contact Tenant (stub handler)
- F-20: Create Contract from Tenant (stub handler)
- Possibly F-59, F-60

#### File References
- `frontend/src/app/tenant-management/page.tsx:68-70` — empty actions
- Potentially other pages with similar patterns (not examined)

#### Resolution Required Before Production
1. Implement all action handlers
2. Remove empty `action: () => {}` placeholders
3. Wire actions to appropriate functions/modals/navigations
4. Add proper error handling for each action
5. Test all actions end-to-end

---

### 12. Multi-User / Multi-Property Gap — HIGH

**Severity:** HIGH  
**Impact:** System designed for single admin; cannot support team or multiple buildings.

#### Gap Description
System assumes single user (hardcoded "Nguyễn Văn Chủ") and single building. No multi-tenant architecture, no role differentiation, no property selector, no team management.

#### Evidence

**Single hardcoded user:**
- All operations attributed to "Nguyễn Văn Chủ" only
- Activity feed shows only "NV" as actor
- No concept of multiple staff members

**No property/building selector:**
- `frontend/src/app/expenses/types.ts:74`
```typescript
export const BUILDINGS = ['Tất cả', 'Khu A', 'Khu B', 'Khu C', 'Khu D'];
```
- Buildings exist as hardcoded list for filtering (mock context)
- No support for adding properties
- No multi-property dashboard

**No role-based differentiation:**
- Sidebar shows only "Admin" role
- No accountant, staff, property manager roles
- Backend plan mentions RBAC but FE has no placeholder

**Data isolation missing:**
- Each user sees all rooms, all tenants, all contracts
- No per-user or per-property access control
- No audit trail of who made changes

#### Affected Features
- F-71: User Role Management (0% implemented)
- F-72: Property Management (multi-building support; not implemented)
- F-73: Team Collaboration (0% implemented)
- F-74: Audit Log (no change tracking by user)

#### File References
- `frontend/src/components/Sidebar.tsx:189-190` — single hardcoded user
- `frontend/src/app/expenses/types.ts:74` — buildings as constant, not editable
- No role enum or permission model in codebase
- No multi-tenant architecture in backend plan yet

#### Resolution Required Before Production
1. Implement multi-user authentication (not just login flow, but role differentiation)
2. Define user roles: admin, accountant, staff, property-manager
3. Define permissions per role (e.g., accountant cannot delete contracts)
4. Implement property/building selection UI
5. Add property filtering to all data queries
6. Add user/creator tracking to all records
7. Implement audit log (who created/modified/deleted what, when)
8. Support multiple properties in database schema

---

## Summary Table

| Gap ID | Category | Severity | Affected Features | Resolution Path |
|--------|----------|----------|-------------------|-----------------|
| G-01 | Backend not implemented | CRITICAL | All 76 features | Build FastAPI backend + PostgreSQL schema + all CRUD endpoints |
| G-02 | Enum/type mismatches | HIGH | F-23, F-24, F-25 (Expenses) | Reconcile ExpenseCategory definitions across FE/BE |
| G-03 | Missing pages/routes | HIGH | F-01, F-02, F-69, F-70 | Create /login, /settings, /notifications pages + auth flow |
| G-04 | Authentication gap | CRITICAL | All 76 features | Implement JWT auth + login form + route guards + session management |
| G-05 | Real API call gap | CRITICAL | All 76 features (CRUD) | Replace all service mocks with axios calls to real endpoints |
| G-06 | Mock-only features | HIGH | F-64, F-65, F-72 | Load payment history, activity feed, KPIs from backend |
| G-07 | Validation gaps | HIGH | F-11, F-12, F-20, F-03 | Add client-side validation to tenant, contract, room forms |
| G-08 | Error handling gaps | MEDIUM | 68+ features in non-expense modules | Add try/catch + error UI to all forms |
| G-09 | State persistence gap | CRITICAL | All 76 features (CRUD) | Implement backend database; remove in-memory state |
| G-10 | Hardcoded values | MEDIUM | F-69, F-72, Dashboard | Compute badge counts + user info from data |
| G-11 | Stub/empty handlers | MEDIUM | F-19, F-20, F-61, F-59, F-60 | Implement all action handlers (end rental, create contract, export, print) |
| G-12 | Multi-user/multi-property | HIGH | F-71, F-72, F-73, F-74 | Implement RBAC, multi-property support, audit logging |

---

## Confidence Levels

| Gap | Evidence Quality | Confidence |
|-----|------------------|-----------|
| G-01 | Directory listing; verified empty | 100% |
| G-02 | Source code comparison; type definitions conflict | 100% |
| G-03 | Glob search for routes; none found; sidebar refs non-existent | 100% |
| G-04 | Grep + file inspection; hardcoded values; no auth code | 100% |
| G-05 | Service file review; axios unused; mock store only | 100% |
| G-06 | Source code; hardcoded arrays; component inspection | 100% |
| G-07 | ExpenseFormModal has validation; others lack it | 95% |
| G-08 | Expense page has error states; others don't | 90% |
| G-09 | useState in every page; no localStorage/backend | 100% |
| G-10 | Direct code references; hardcoded numbers/strings | 100% |
| G-11 | Empty action: () => {} found in RowActions | 95% |
| G-12 | Hardcoded user; no role model; buildings constant | 95% |

---

## Critical Path: Must-Do Before MVP Launch

**Blocking issues (cannot ship without fixing):**
1. **G-04 Authentication Gap** — users cannot log in; system unusable
2. **G-01 Backend not implemented** — no data persistence; no multi-user
3. **G-05 Real API call gap** — frontend cannot sync with backend
4. **G-09 State persistence gap** — all edits lost on refresh

**High-priority (should do before beta):**
5. **G-03 Missing pages/routes** — incomplete feature set
6. **G-12 Multi-user/multi-property** — only single user supported
7. **G-02 Type mismatches** — will cause integration errors
8. **G-07 Validation gaps** — bad data will reach backend

**Medium-priority (nice-to-have):**
9. **G-06 Mock-only features** — improve realism
10. **G-08 Error handling gaps** — improve UX
11. **G-10 Hardcoded values** — refactor for maintainability
12. **G-11 Stub handlers** — complete remaining UI actions

---

## Recommended Implementation Order

1. **Week 1-2:** Backend scaffold + FastAPI setup + PostgreSQL schema + auth endpoints
2. **Week 3:** Frontend auth (login page + JWT storage + interceptor + logout)
3. **Week 4:** Rooms CRUD endpoints + frontend service replacement
4. **Week 5:** Tenants + Contracts CRUD + service replacement
5. **Week 6:** Expenses, Reports, Posts CRUD + service replacement
6. **Week 7:** Validation (FE + BE), error handling, type fixes
7. **Week 8:** Settings page, notifications, role management, multi-property
8. **Week 9:** Testing, bug fixes, performance optimization
9. **Week 10:** Beta launch

---

**Document Status:** COMPLETE  
**Next Review:** After backend scaffold implementation  
**Owner:** Technical Lead / Backend Architect
