# Frontend Analysis — MotelManage

This document provides a comprehensive analysis of the MotelManage frontend codebase. The frontend is built with Next.js 15.1.11, TypeScript, and Tailwind CSS. All data is served from in-memory mock stores — there are no real API calls, no authentication, and no data persistence between page refreshes. This analysis serves as the source of truth for backend contract design.

---

## 1. Shared Layout & Navigation

### AppLayout.tsx

- **Props**: `children: React.ReactNode`
- **State**: `collapsed: boolean` (default `false`), `mobileOpen: boolean` (default `false`)
- **Responsive behavior**: `useEffect` sets `collapsed=true` when `window.innerWidth < 1024` (lg breakpoint)
- **Renders**: Sidebar (fixed left, z-30), Topbar (fixed top h-16, z-20), main content area (pt-16, transitions left margin), `FacebookChatPopup`
- **Main content margin**: `lg:ml-60` when expanded / `lg:ml-16` when collapsed

---

### Sidebar.tsx

State: receives `collapsed` prop from `AppLayout`.

Navigation groups and items:

| Group | Label | Items (label → path) | Badge |
|---|---|---|---|
| main | Quản lý | Tổng quan → `/dashboard` | — |
| main | Quản lý | Quản lý phòng → `/room-management` | 5 |
| main | Quản lý | Hợp đồng → `/contract-management` | 4 |
| main | Quản lý | Khách thuê → `/tenant-management` | — |
| marketing | Marketing | Bài đăng → `/post-management` | 2 |
| finance | Tài chính | Chi phí → `/expenses` | — |
| finance | Tài chính | Báo cáo → `/reports` | — |
| ai | Trí tuệ nhân tạo | AI Agent → `/agent` | — |
| system | Hệ thống | Cài đặt → `/settings` | — |

**Footer**: hardcoded user "Nguyễn Văn Chủ" / "Chủ nhà · Admin" / avatar initials "NV".

> **Note**: Badge values (5, 4, 2) are hardcoded integers — they are NOT computed from data.

---

### Topbar.tsx

- **Search**: toggle button opens a `w-64` input, placeholder "Tìm phòng, khách thuê, HĐ..." — no actual search logic implemented
- **Notifications**: badge count = `unreadCount` from `mockNotifications`; dropdown shows up to 80 notifications; "mark all read" button; priority color dots for visual severity
- **User menu**: fully hardcoded — name "Nguyễn Văn Chủ", role "Chủ nhà", email "chuNha@motelmanage.vn"; menu items: Hồ sơ (`/profile`), Cài đặt (`/settings`), Đăng xuất (no click handler)

---

### FacebookChatPopup.tsx

- **Toggle button**: floating 56×56px button, `bottom-6 right-6`
- **Pop-up dimensions**: 900×600px, 3-panel layout
  - Conversation list panel: `w-64`
  - Chat area: `flex-1`
  - Lead context panel: `w-64`
- **Functional mock**: uses in-memory state from `mockConversations`
- **Features**: conversation filtering by status, unread count display, message send (creates staff message object in local state), lead status display, quick replies, suggested rooms (placeholder only — not implemented)

---

### Shared UI Components

| Component | Description |
|---|---|
| `Modal.tsx` | Controlled via `isOpen`/`onClose` props; sizes: `sm`, `md`, `lg`, `xl`, `2xl`; keyboard `Escape` to close |
| `StatusBadge.tsx` | Handles `RoomStatus`, `ContractStatus`, `PostStatus` with color mapping |
| `LoadingSkeleton.tsx` | `KPISkeleton`, `TableSkeleton(rows, cols)`, `ChartSkeleton(height)`, `CardGridSkeleton(count)` — all use `animate-pulse` |

---

## 2. Dashboard (/dashboard)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/dashboard/page.tsx` |
| Type | Server Component shell (wraps Client Components) |

### Data Sources

| Source | Usage |
|---|---|
| `getDashboardStats()` from `mockData.ts` | Returns 16 aggregated fields |
| `mockRevenueData` | 7-month revenue/expense data |
| `mockContracts` | Filtered for expiry alerts |

### Components

| Component | Description |
|---|---|
| `DashboardHeader` | Date display, quick action buttons |
| `KPIBentoGrid` | 6 stat cards: `totalRooms`, `occupancyRate`, `currentMonthRevenue`, `currentMonthExpenses`, `expiringContracts`, `overdueAmount` |
| `RevenueChart` | Line/bar combo chart (7 months revenue vs expense), uses Recharts |
| `OccupancyChart` | Donut/pie chart (rooms by status), uses Recharts |
| `AlertPanel` | Contract expiry warnings (`expiringIn7Days`, `expiringIn30Days`), vacant rooms without posts (`vacantWithoutPost`) |
| `ActivityFeed` | Recent system events (static mock list) |

### API Calls

None — all data sourced from `getDashboardStats()`, `mockRevenueData`, `mockContracts` directly.

### UI Behavior

Loading: `LoadingSkeleton` components displayed while data loads. No error state documented.

---

## 3. Room Management (/room-management)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/room-management/page.tsx` |
| Type | `'use client'` |

### State Variables

| Variable | Type | Initial Value |
|---|---|---|
| `rooms` | `Room[]` | `mockRooms` (20 items) |
| `view` | `'table' \| 'card'` | `'table'` |
| `filters` | `RoomFilterState` | all empty strings |
| `selectedIds` | `string[]` | `[]` |
| `addModalOpen` | `boolean` | `false` |
| `editRoom` | `Room \| null` | `null` |
| `deleteRoom` | `Room \| null` | `null` |
| `deleteModalOpen` | `boolean` | `false` |
| `filteredRooms` | `Room[]` (useMemo) | computed |
| `stats` | `object` (useMemo) | computed |

### Filters (client-side, computed via useMemo)

| Field | Operator | Notes |
|---|---|---|
| `search` | case-insensitive `includes()` on `code` AND `name` | OR logic between fields |
| `status` | `===` | exact match |
| `block` | `===` | exact match |
| `floor` | `===` | exact match |
| `priceMin` | `>=` | parsed value × 1,000,000 |
| `priceMax` | `<=` | parsed value × 1,000,000 |

Hardcoded filter options:
- `blocks`: Khu A, Khu B, Khu C
- `floors`: Tầng 1, Tầng 2, Tầng 3
- `statuses`: Trống, Đang thuê, Đã đặt, Bảo trì

### Forms & Validation (RoomFormModal)

| Field | Type | Required | Validation |
|---|---|---|---|
| `code` | text | Yes | JS: non-empty trim |
| `name` | text | Yes | JS: non-empty trim |
| `block` | select | Yes | Options: Khu A / B / C |
| `floor` | select | Yes | Options: Tầng 1 / 2 / 3 |
| `area` | number | Yes | JS: >= 5 |
| `maxTenants` | number | Yes | JS: >= 1 |
| `rentPrice` | number | Yes | JS: >= 500,000 |
| `deposit` | number | No | JS: >= 0 |
| `electricityPrice` | number | No | None |
| `waterPrice` | number | No | None |
| `serviceFee` | number | No | None |
| `status` | select | No | Options: Trống / Đang thuê / Đã đặt / Bảo trì |
| `description` | textarea | No | None |

### Actions

| Action | Behavior |
|---|---|
| Create | Generates `id = r${Date.now()}`, `currentTenants=0`, `images=[]`, `hasActivePost=false` |
| Edit | Shallow merges form data into existing room object |
| Delete single | Blocked with warning if `room.status === 'Đang thuê'`; otherwise removes from state |
| Bulk delete | Removes all `selectedIds` from state |
| Bulk status change | Hardcoded to `'Bảo trì'` only (BulkActionBar limitation) |
| View toggle | Switches between table and card layout |

### API Calls

None — all mock. Backend integration point annotated as:
```
// Replace with SWR/React Query fetching from /api/rooms
```

---

## 4. Contract Management (/contract-management)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/contract-management/page.tsx` |
| Type | `'use client'` |

### State Variables

| Variable | Type | Initial Value |
|---|---|---|
| `contracts` | `Contract[]` | `mockContracts` (15 items) |
| `filters` | `ContractFilterState` | `{search:'', status:'', room:'', month:''}` |
| `selectedIds` | `string[]` | `[]` |
| `addModalOpen` | `boolean` | `false` |
| `editContract` | `Contract \| null` | `null` |
| `editMode` | `'create' \| 'edit' \| 'renew'` | `'create'` |
| `terminateContract` | `Contract \| null` | `null` |
| `terminateModalOpen` | `boolean` | `false` |
| `deleteContract` | `Contract \| null` | `null` |
| `deleteModalOpen` | `boolean` | `false` |
| `deleting` | `boolean` | `false` |

### Filters

> **Known gap**: The `room` field in `ContractFilterState` is defined but NOT applied in the filter logic (bug/unfinished feature).

| Field | Operator | Notes |
|---|---|---|
| `search` | `includes()` | Searches `code`, `tenantName`, `tenantCCCD`, `roomCode`, `tenantPhone` |
| `status` | `===` | Exact match on contract status |
| `month` | `startsWith()` | Matches `startDate` or `endDate` by `'2025-03'` format; also handles year-only and `'Q'` prefix |

### ExpiryAlertBanner

Shows 3 severity zones (dismissable via local boolean state):

| Zone | Condition | Color |
|---|---|---|
| Critical | `daysUntilExpiry <= 7` | Red |
| Warning | `7 < daysUntilExpiry <= 15` | Amber |
| Notice | `15 < daysUntilExpiry <= 30` | Blue |

### CRUD Actions

| Action | Behavior |
|---|---|
| Create | Auto-generates `id=c${Date.now()}`, `code=HĐ-{year}-{padded count}`, `tenantId=t${Date.now()}`, `status='Đang hiệu lực'`, `daysUntilExpiry=365` |
| Edit | Shallow merges form data into existing contract |
| Renew | Marks old contract `status='Đã hết hạn'`; creates new with new `code`, `status='Đang hiệu lực'`, `notes` prefixed with "Gia hạn từ HĐ {old.code}" |
| Terminate | Sets `status='Đã chấm dứt'`, `daysUntilExpiry=null`; **NOTE**: `terminationReason` and `terminationDate` are NOT stored on the Contract object (gap vs backend plan) |
| Delete / bulk delete | Filters matching records from state |

### Forms & Validation (ContractFormModal)

| Field | Type | Required | Notes |
|---|---|---|---|
| `roomId` | select | Yes | Room selector |
| `tenantSearch` / `selectedTenant` | search+select | Yes | Existing tenant lookup |
| `startDate` | date | Yes | — |
| `endDate` | date | Yes | — |
| `billingCycle` | select | No | Options: 1 / 3 / 6 / 12 months |
| `paymentDueDay` | number (1–28) | No | Default 5 |
| `monthlyRent` | number | Yes | >= 100,000 |
| `deposit` | number | Yes | >= 0 |
| `notes` | textarea | No | — |

**Inline new tenant creation** (within ContractFormModal):

| Field | Required | Validation |
|---|---|---|
| `fullName` | Yes | Non-empty |
| `phone` | Yes | Regex `^0[0-9]{9}$` |
| `cccd` | No | — |
| `address` | No | — |
| `note` | No | — |

### Table

| Column | Notes |
|---|---|
| Checkbox | Bulk select |
| Mã HĐ | Contract code |
| Phòng | Room code |
| Khách thuê | Tenant name |
| SĐT/CCCD | Phone and ID number |
| Ngày bắt đầu | Start date |
| Ngày kết thúc | End date |
| Tiền thuê | Monthly rent |
| Tiền cọc | Deposit |
| Trạng thái | Status badge |
| Thao tác | Row actions |

Row highlighting rules:
- Red background: `daysUntilExpiry <= 7`
- Amber background: `daysUntilExpiry <= 15`
- `opacity-70`: expired contracts
- `opacity-60` / gray: terminated contracts

Row action availability:

| Action | Condition |
|---|---|
| Edit | Always |
| Renew | Active contracts only |
| Terminate | Active contracts only |
| Delete | Always |

### Mock Export/Print

| Button | Handler |
|---|---|
| Print | No `onClick` handler — does nothing |
| Export Excel | No `onClick` handler — does nothing |

---

## 5. Tenant Management (/tenant-management)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/tenant-management/page.tsx` |
| Type | `'use client'` (all components inline, ~646 lines) |

### State Variables

| Variable | Type | Initial Value |
|---|---|---|
| `tenants` | `Tenant[]` | `mockTenants` (12 items) |
| `search` | `string` | `''` |
| `statusFilter` | `string` | `''` |
| `genderFilter` | `string` | `''` |
| `blockFilter` | `string` | `''` |
| `modalMode` | `'detail' \| 'create' \| 'edit' \| null` | `null` |
| `selectedTenant` | `Tenant \| null` | `null` |
| `deleteId` | `string \| null` | `null` |
| `filtered` | `Tenant[]` (useMemo) | computed |
| `kpis` | `object` (useMemo) | computed |

### KPI Cards

| Card | Logic |
|---|---|
| Total | `tenants.length` |
| Active (Đang thuê) | Filter by `status === 'Đang thuê'` |
| Expiring (Sắp hết hạn) | Filter by `status === 'Sắp hết hạn'` |
| Debt (Nợ tiền) | Filter by `status === 'Nợ tiền'` |
| Left (Đã trả phòng) | Filter by `status === 'Đã trả phòng'` |

### Detail Modal — 5 Tabs

| Tab | Content | Notes |
|---|---|---|
| Thông tin cá nhân | `fullName`, `phone`, `cccd`, `dateOfBirth`, `gender`, `occupation`, `licensePlate`, `permanentAddress`, `notes` | All read-only |
| Hợp đồng | `contractCode`, `currentRoomCode`, status badge, `startDate` | Read-only; empty state if no `contractCode` |
| Lịch sử thuê | Shows `currentRoomCode` + `startDate` only | NOT full rental history |
| Thanh toán | Total paid (hardcoded 10,500,000), `tenant.debt`, mock 3-month payment list | Fully mocked — hardcoded values |
| Ghi chú nội bộ | Read-only existing notes + textarea for new note + "Lưu ghi chú" button | Button has NO `onClick` handler (placeholder) |

### Row Actions

| Action | Status |
|---|---|
| View detail | Opens detail modal (`modalMode='detail'`) — IMPLEMENTED |
| Edit | Opens form modal (`modalMode='edit'`) — IMPLEMENTED |
| View rental history | Same as view detail — IMPLEMENTED |
| Contact | Empty handler — NOT IMPLEMENTED |
| Create contract | Empty handler — NOT IMPLEMENTED |
| End rental | Empty handler — NOT IMPLEMENTED (SPEC GAP) |
| Delete | Confirmation dialog → filter from state — IMPLEMENTED |

### Tenant Form Fields

| Field | Type | Required |
|---|---|---|
| `fullName` | text | Yes |
| `phone` | text | Yes |
| `cccd` | text | Yes |
| `dateOfBirth` | date | No |
| `gender` | select (Nam/Nữ) | No (default: Nam) |
| `permanentAddress` | text | No |
| `occupation` | text | No |
| `licensePlate` | text | No |
| `notes` | textarea | No |
| CCCD image upload | file input | No (mock UI — no actual upload) |

---

## 6. Post Management (/post-management)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/post-management/page.tsx` |
| Type | `'use client'` (all inline, ~555 lines) |

### State Variables

| Variable | Type | Initial Value |
|---|---|---|
| `posts` | `FacebookPost[]` | `mockPosts` (8 items) |
| `search` | `string` | `''` |
| `statusFilter` | `string` | `''` |
| `channelFilter` | `string` | `''` |
| `typeFilter` | `string` | `''` |
| `viewMode` | `'card' \| 'table'` | `'table'` |
| `createOpen` | `boolean` | `false` |

### KPI Cards

| Card | Logic |
|---|---|
| Total posts | `posts.length` |
| Published (Đã đăng) | Count by status |
| Scheduled (Đã lên lịch) | Count by status |
| Total messages | Sum of `messages` field |
| Leads | Sum of `leads` field |
| Conversion rate | `(sum converted / sum leads) × 100` |

### Filter Logic

All 4 filters use `===` exact equality. Filters are combined with AND logic.

### Post Form (CreatePostModal — inline)

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | Yes | — |
| `postType` | select | No | Options: Tuyển khách / Khuyến mãi / Thông báo |
| `channel` | select | No | Options: Facebook Page / Group / Zalo |
| `room` | select | No | Only vacant rooms shown |
| `content` | textarea | Yes | — |
| `hashtags` | text | No | — |
| `price` | number | No | — |
| `area` | number | No | — |
| `amenities` | text | No | — |
| `address` | text | No | — |
| `phone` | text | No | Default: 0901234567 |
| `scheduledDate` | datetime-local | No | — |
| `assignee` | select | No | Options: Nguyễn Văn Chủ / Trần Thị Mai |

Live preview: mirrors `content`, `hashtags`, `title`, `price` in a Facebook-styled card.

### Actions

| Action | Status |
|---|---|
| Delete | `setPosts(prev => prev.filter(p => p.id !== id))` — IMPLEMENTED |
| Edit | Empty handler — STUB |
| Duplicate | Empty handler — STUB |
| Post Now | Empty handler — STUB |
| Schedule | Empty handler — STUB |

### Analytics Charts (hardcoded data)

| Chart Component | Library | Type | X-axis | Data Key |
|---|---|---|---|---|
| WeeklyPosts BarChart | Recharts | Bar | Days of week | Post count |
| InboxTrend LineChart | Recharts | Line | Days | Inbox count |
| LeadByChannel PieChart | Recharts | Pie | N/A | 3 channels |

---

## 7. Expenses (/expenses)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/expenses/page.tsx` |
| Type | `'use client'` |

### State Variables

| Variable | Type | Initial Value |
|---|---|---|
| `expenses` | `Expense[]` | `[]` (populated via `useEffect`) |
| `loading` | `boolean` | `true` |
| `error` | `boolean` | `false` |
| `filters` | `ExpenseFilters` | `DEFAULT_FILTERS` |
| `appliedFilters` | `ExpenseFilters` | `DEFAULT_FILTERS` |
| `formOpen` | `boolean` | `false` |
| `editingExpense` | `Expense \| null` | `null` |
| `detailExpense` | `Expense \| null` | `null` |
| `deleteTarget` | `Expense \| null` | `null` |
| `deleteLoading` | `boolean` | `false` |
| `toasts` | `Toast[]` | `[]` |

### Service Layer (expenseService.ts)

Full async service with 400ms simulated delay. Operates on module-level `expensesStore: Expense[]`.

| Function | Description |
|---|---|
| `getExpenses(filters)` | Returns filtered list |
| `getExpenseById(id)` | Returns single record |
| `createExpense(payload)` | Appends to store |
| `updateExpense(id, payload)` | Merges update into record |
| `deleteExpense(id)` | Removes from store |
| `markExpensePaid(id)` | Sets `paymentStatus='Đã thanh toán'` + `updatedAt` |

### Filter Logic (applied inside service)

| Field | Operator | Notes |
|---|---|---|
| `search` | `includes()` (lowercase) | Matches `title`, `expenseCode`, `note` |
| `category` | `===` | Exact match |
| `paymentStatus` | `===` | Exact match |
| `buildingName` | `===` AND `!== 'Tất cả'` | Skipped if value is 'Tất cả' |
| `fromDate` | `>=` | ISO string comparison |
| `toDate` | `<=` | ISO string comparison |

### Expense Form Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | Yes | — |
| `category` | select | Yes | 7 options from `EXPENSE_CATEGORIES` |
| `amount` | number | Yes | > 0 |
| `expenseDate` | date | Yes | Default: today |
| `paymentStatus` | select | Yes | 3 options |
| `paymentMethod` | select | No | 3 options |
| `buildingName` | select | No | Default: Khu A; 5 options including Khu D |
| `note` | textarea | No | — |
| `isRecurring` | custom toggle | No | Default: false |
| Receipt upload | file input | No | Mock UI only — no actual upload |

### Table Pagination

`PAGE_SIZE = 10` records per page.

### Mark Paid

Updates `paymentStatus='Đã thanh toán'` and `updatedAt` only. **Note**: no `paymentDate` field is recorded.

### Stats Cards

| Card | Logic |
|---|---|
| Total spent this month | `SUM(amount)` where `expenseDate` falls in current month/year |
| Total spent this quarter | `SUM(amount)` where `expenseDate` falls in current quarter/year |
| Unpaid count | `COUNT` where `paymentStatus` in `['Chưa thanh toán', 'Chờ xử lý']` |
| Largest category | Category with maximum total amount (computed from loaded expenses) |

---

## 8. Reports (/reports)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/reports/page.tsx` |
| Type | `'use client'` |

### Data Flow

Uses `reportService.ts` which wraps `mockReportData` with async delays (300–800ms). Multiple service functions are called on filter change.

### Filters

| Field | Type | Default | Options |
|---|---|---|---|
| `periodType` | select | `'month'` | month / quarter / year |
| `selectedMonth` | number | `7` | 1–12 |
| `selectedQuarter` | number | `3` | 1–4 |
| `selectedYear` | number | `2024` | — |
| `buildingId` | string | `'all'` | 'all' or building name (incl. Khu D) |
| `compareWithPrevious` | boolean | `false` | Toggle — UI only, data unchanged |

### Charts

| Component | Library | Chart Type | X-axis | Data Keys |
|---|---|---|---|---|
| `RevenueExpenseChart` | Recharts `ComposedChart` | Bar + Line | `label` | `revenue` (bar), `expense` (bar), `profit` (line) |
| `ExpenseBreakdownChart` | Recharts `PieChart` | Pie | N/A | `amount` |
| `OccupancyChart` | Recharts `BarChart` | Horizontal Bar | `occupancyRate` | `buildingName` |
| `DebtTrendChart` | Recharts `AreaChart` | Area | `label` | `totalDebt`, `collected` |

### Detail Sections

| Section | Fields |
|---|---|
| `RoomOperationSection` | `totalRooms`, `occupiedRooms`, `vacantRooms`, `soonVacantRooms`, `occupancyRate` |
| `ContractSummarySection` | `activeContracts`, `expiringIn30Days`, `newContractsThisPeriod`, `endedContractsThisPeriod`, `expiringList` (per item: `tenantName`, `roomName`, `endDate`, `daysLeft`) |
| `FinancialSummarySection` | `expectedRent`, `collectedRent`, `uncollectedRent`, `totalExpense`, `estimatedProfit`, collection rate % |
| `TenantDebtTable` (5/page) | `tenantName`, `roomName`, `billingPeriod`, `amountDue`, `amountPaid`, `amountRemaining`, `status` (`DebtStatus`) |

### Export

`exportReports()` returns a mock success message with a "kết nối backend" note — no file is generated.

---

## 9. AI Agent (/agent)

### Route

| Property | Value |
|---|---|
| File | `frontend/src/app/agent/page.tsx` |
| Type | `'use client'` |

### Layout

- Desktop: CSS grid `3fr` (left) : `2fr` (right)
- Mobile: stacked single column
- Left panel: `AgentChatPanel` + `QuickActionsPanel`
- Right panel: `AgentAlertsPanel` + `AutomationList`
- Full-width below: `AgentTaskHistoryTable`, `AgentCapabilitiesSection`, `WorkflowTemplatesSection`

### Chat Mock AI

`sendAgentMessage(content)` performs keyword matching to select a canned response.

| Keyword(s) | Response Topic |
|---|---|
| phòng trống | Vacant room info |
| nợ / công nợ / chưa thanh toán | Debt/payment status |
| hợp đồng / hết hạn | Contract expiry |
| chi phí | Expense summary |
| bài đăng / đăng bài / lấp đầy | Post/marketing |
| báo cáo / vận hành / tình hình | Operations report |

Messages sent on `Enter` key. Quick prompt chips auto-submit to the same handler.

### Automation CRUD

Full service layer with in-memory store:

| Function | Behavior |
|---|---|
| `createAutomation` | Appends to store |
| `toggleAutomation` | Cycles `active` ↔ `paused` |
| `runAutomation` | Updates `lastRunAt` timestamp |
| `deleteAutomation` | Removes from store |

**AutomationFormModal fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | Yes | — |
| `description` | textarea | No | — |
| `triggerType` | select | Yes | — |
| `frequency` | select | No | — |
| `runTime` | time | No | Default: 08:00 |
| `module` | select | No | — |
| `condition` | text | No | — |
| `action` | text | Yes | — |
| `notifyRecipient` | text | No | — |
| `notifyChannel` | select | No | — |
| `enableImmediately` | checkbox | No | Default: true |

### Session Management

No `session_id` generated or used. No persistence between page refreshes.

### Header Actions

| Button | Behavior |
|---|---|
| Tạo automation | Opens `AutomationFormModal` — IMPLEMENTED |
| Xem lịch sử | Scrolls to `#task-history-section` — IMPLEMENTED |
| Cài đặt agent | No `onClick` handler — PLACEHOLDER |

---

## 10. Missing / Incomplete Pages

| Route | Status | Linked From |
|---|---|---|
| `/settings` | Page file missing | Sidebar, Topbar user menu |
| `/profile` | Page file missing | Topbar user menu |
| `/login` | Not implemented | Nowhere (no auth system) |

---

## 11. Global Patterns

| Concern | Status / Notes |
|---|---|
| State management | Local `useState` / `useMemo` per page. No global state — no Redux, Zustand, or Context API. |
| API calls | None. `axios` is installed (`^1.7.9`) but never called anywhere in the codebase. |
| Loading states | `LoadingSkeleton` components used in expenses and reports; inline loading booleans in agent module; no loading state in most other modules. |
| Error handling | Only the expenses module has an `error` boolean state. All other modules have no error handling. |
| Toast notifications | Expenses and agent modules use a custom inline toast queue. `sonner` is installed but not used as the primary toast mechanism. |
| Data persistence | None. All state resets on page refresh. No localStorage, sessionStorage, or IndexedDB usage. |
| Authentication | None. No route guards, no session tokens, no login page. All routes are publicly accessible. |
| Form validation | All validation is client-side JS in component logic. No schema validation library (e.g., Zod, Yup) used. |
| Date handling | Dates stored as ISO strings (`'2025-03-01'` format). No date library (e.g., date-fns, dayjs) standardized across modules. |
| Internationalization | Vietnamese labels are hardcoded in JSX. No i18n library used. |

---

*Last updated: 2026-05-18*
