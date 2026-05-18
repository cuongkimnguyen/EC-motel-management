# MotelManage — Frontend Business Specification

> **Purpose:** Developer handoff document for backend generation.  
> **Audience:** Backend developers, AI coding agents, future maintainers.  
> **Status of app:** Frontend-only, mock-data-driven. No backend integrated.  
> **All data is served from in-memory mock stores with simulated async delays.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder & Project Structure](#3-folder--project-structure)
4. [Route Map](#4-route-map)
5. [Module-by-Module Business Logic](#5-module-by-module-business-logic)
6. [Entity Model Overview](#6-entity-model-overview)
7. [Frontend-to-Backend API Mapping](#7-frontend-to-backend-api-mapping)
8. [Screen-to-Entity Relationship Map](#8-screen-to-entity-relationship-map)
9. [Mock Data & Current Limitations](#9-mock-data--current-limitations)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Recommended Backend Build Order](#11-recommended-backend-build-order)
12. [AI Backend Handoff](#12-ai-backend-handoff)

---

## 1. Project Overview

**MotelManage** is a Vietnamese-language property management system for motel/boarding-house owners. It is a single-page web application built with Next.js App Router.

### Business Domain
- Multi-block motel property (Khu A, Khu B, Khu C)
- Rooms rented to individual tenants under fixed-term contracts
- Monthly rent collection with overdue tracking
- Operational expenses (electricity, water, maintenance, salaries)
- Marketing via Facebook Page, Facebook Group, and Zalo
- AI-assisted operations and workflow automation

### Current Frontend Scope
- **Frontend-first:** All screens are built and functional with mock data
- **Mock-data-driven:** No real API calls. All services use in-memory stores with `setTimeout` delays
- **Backend-not-yet-integrated:** Service files contain `// Backend integration point:` comments marking where real API calls should replace mock logic

### Target Users
- **Chủ nhà (Owner/Admin):** Full access to all modules
- **Quản lý (Manager):** Implied by UI but role system not yet implemented
- **Nhân viên (Staff):** Implied by assignee fields in posts/conversations

---

## 2. Tech Stack

| Category | Technology | Notes |
|---|---|---|
| Framework | Next.js 15.1.11 | App Router, Server Components shell, Client Components for interactive pages |
| Language | TypeScript 5.x | Strict typing throughout |
| Styling | Tailwind CSS 3.4.6 | Utility-first, custom config in `tailwind.config.js` |
| Icons | @heroicons/react 2.x | Outline style used throughout |
| Charts | Recharts 2.15.2 | Bar, Line, Pie charts in Reports and Dashboard |
| Forms | react-hook-form 7.x | Available but not uniformly used; some modules use controlled state directly |
| Toasts | Custom inline toast + sonner available | Expenses and Agent use custom toast; sonner installed but not primary |
| HTTP | axios 1.7.x | Installed, not yet used — all data is mock |
| State | React useState/useMemo | No global state manager (no Redux, Zustand, Context) |
| Routing | Next.js App Router | File-based, no React Router |
| Fonts | System sans-serif via Tailwind | `font-sans antialiased` on body |

---

## 3. Folder & Project Structure

```
motelmanage/
├── public/
│   ├── favicon.ico
│   └── assets/images/
│       ├── app_logo.png
│       └── no_image.png
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout: html lang="vi", metadata, body classes
│   │   ├── not-found.tsx             # 404 fallback
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Dashboard page (Server Component shell)
│   │   │   └── components/
│   │   │       ├── DashboardHeader.tsx
│   │   │       ├── KPIBentoGrid.tsx
│   │   │       ├── RevenueChart.tsx
│   │   │       ├── OccupancyChart.tsx
│   │   │       ├── AlertPanel.tsx
│   │   │       └── ActivityFeed.tsx
│   │   ├── room-management/
│   │   │   ├── page.tsx              # 'use client' — full CRUD state
│   │   │   └── components/
│   │   │       ├── RoomFilters.tsx
│   │   │       ├── RoomTable.tsx
│   │   │       ├── RoomCardGrid.tsx
│   │   │       ├── RoomFormModal.tsx
│   │   │       ├── DeleteRoomModal.tsx
│   │   │       └── BulkActionBar.tsx
│   │   ├── contract-management/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── ContractFilters.tsx
│   │   │       ├── ContractTable.tsx
│   │   │       ├── ContractStatsBar.tsx
│   │   │       ├── ContractFormModal.tsx
│   │   │       ├── ExpiryAlertBanner.tsx
│   │   │       └── TerminateContractModal.tsx
│   │   ├── tenant-management/
│   │   │   └── page.tsx              # All components inline (large file ~646 lines)
│   │   ├── post-management/
│   │   │   └── page.tsx              # All components inline (~555 lines)
│   │   ├── expenses/
│   │   │   ├── page.tsx
│   │   │   ├── types.ts
│   │   │   ├── mockExpenses.ts
│   │   │   ├── expenseService.ts
│   │   │   └── components/
│   │   │       ├── ExpenseStats.tsx
│   │   │       ├── ExpenseFilterBar.tsx
│   │   │       ├── ExpenseTable.tsx
│   │   │       ├── ExpenseFormModal.tsx
│   │   │       ├── ExpenseDetailDrawer.tsx
│   │   │       └── DeleteConfirmDialog.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── types.ts
│   │   │   ├── mockReportData.ts
│   │   │   ├── reportService.ts
│   │   │   └── components/
│   │   │       ├── ReportHeader.tsx
│   │   │       ├── ReportFilterBar.tsx
│   │   │       ├── ReportKpiCards.tsx
│   │   │       ├── RevenueExpenseChart.tsx
│   │   │       ├── ExpenseBreakdownChart.tsx
│   │   │       ├── OccupancyChart.tsx
│   │   │       ├── DebtTrendChart.tsx
│   │   │       ├── RoomOperationSection.tsx
│   │   │       ├── ContractSummarySection.tsx
│   │   │       ├── FinancialSummarySection.tsx
│   │   │       ├── TenantDebtTable.tsx
│   │   │       └── ReportStates.tsx
│   │   └── agent/
│   │       ├── page.tsx
│   │       ├── types.ts
│   │       ├── mockAgentData.ts
│   │       ├── agentService.ts
│   │       └── components/
│   │           ├── AgentSummaryCards.tsx
│   │           ├── AgentChatPanel.tsx
│   │           ├── QuickActionsPanel.tsx
│   │           ├── AutomationList.tsx
│   │           ├── AutomationFormModal.tsx
│   │           ├── AgentAlertsPanel.tsx
│   │           ├── AgentTaskHistoryTable.tsx
│   │           ├── AgentCapabilitiesSection.tsx
│   │           └── WorkflowTemplatesSection.tsx
│   ├── components/
│   │   ├── AppLayout.tsx             # Sidebar + Topbar wrapper
│   │   ├── Sidebar.tsx               # Left nav with collapse support
│   │   ├── Topbar.tsx                # Top header: search, notifications, user menu
│   │   ├── FacebookChatPopup.tsx     # Floating chat widget (mock)
│   │   └── ui/
│   │       ├── AppImage.tsx          # Next/Image wrapper
│   │       ├── AppIcon.tsx           # Icon helper
│   │       ├── AppLogo.tsx           # Logo component
│   │       ├── Modal.tsx             # Generic modal wrapper
│   │       ├── StatusBadge.tsx       # Reusable status badge
│   │       └── LoadingSkeleton.tsx   # Skeleton loader
│   ├── lib/
│   │   └── mockData.ts               # Central mock data + shared types + helper functions
│   └── styles/
│       ├── index.css                 # Global CSS (do not modify)
│       └── tailwind.css              # Tailwind directives + CSS custom properties
├── tailwind.config.js
├── next.config.mjs
├── package.json
└── tsconfig.json
```

### Folder Responsibilities

| Folder | Purpose |
|---|---|
| `src/app/<module>/` | Route page + module-specific types, mock data, service, components |
| `src/components/` | Shared layout and UI components used across all modules |
| `src/lib/mockData.ts` | Central source of truth for shared mock data (rooms, tenants, contracts, posts, notifications) |
| `src/styles/` | Global and Tailwind CSS |

---

## 4. Route Map

### `/dashboard` — Overview Dashboard
- **Status:** ✅ Implemented
- **Components:** DashboardHeader, KPIBentoGrid, RevenueChart, OccupancyChart, AlertPanel, ActivityFeed
- **Business actions:** View KPIs, view revenue/occupancy charts, view expiry alerts, view recent activity
- **Data sources:** `getDashboardStats()` from mockData, `mockRevenueData`, `mockContracts`

### `/room-management` — Room Management
- **Status:** ✅ Implemented
- **Components:** RoomFilters, RoomTable, RoomCardGrid, RoomFormModal, DeleteRoomModal, BulkActionBar
- **Business actions:** Add/edit/delete rooms, filter by status/block/floor/price, toggle table/card view, bulk status change, bulk delete

### `/contract-management` — Contract Management
- **Status:** ✅ Implemented
- **Components:** ContractFilters, ContractTable, ContractStatsBar, ContractFormModal, ExpiryAlertBanner, TerminateContractModal
- **Business actions:** Create/edit/renew/terminate/delete contracts, filter by status/room/month, export Excel (mock), print (mock), bulk delete

### `/tenant-management` — Tenant Management
- **Status:** ✅ Implemented (all components inline in page.tsx)
- **Business actions:** Add/edit/delete tenants, view detail modal (5 tabs: info/contract/history/payment/notes), filter by status/search, export (mock)

### `/post-management` — Marketing Post Management
- **Status:** ✅ Implemented (all components inline in page.tsx)
- **Business actions:** Create/edit/delete/duplicate posts, schedule posts, view analytics (views/messages/leads/converted), filter by status/channel/type, live preview

### `/expenses` — Expense Management
- **Status:** ✅ Implemented (most complete service layer)
- **Components:** ExpenseStats, ExpenseFilterBar, ExpenseTable, ExpenseFormModal, ExpenseDetailDrawer, DeleteConfirmDialog
- **Business actions:** Add/edit/delete expenses, mark as paid, view detail drawer, filter by category/status/building/date range, export (mock)

### `/reports` — Business Reports
- **Status:** ✅ Implemented
- **Components:** ReportHeader, ReportFilterBar, ReportKpiCards, RevenueExpenseChart, ExpenseBreakdownChart, OccupancyChart, DebtTrendChart, RoomOperationSection, ContractSummarySection, FinancialSummarySection, TenantDebtTable
- **Business actions:** Filter by period (month/quarter/year) and building, export Excel/PDF (mock), view all KPI and chart data

### `/agent` — AI Agent Control Center
- **Status:** ✅ Implemented
- **Components:** AgentSummaryCards, AgentChatPanel, QuickActionsPanel, AutomationList, AutomationFormModal, AgentAlertsPanel, AgentTaskHistoryTable, AgentCapabilitiesSection, WorkflowTemplatesSection
- **Business actions:** Chat with AI assistant, run quick actions, create/toggle/run/delete automations, view alerts, view task history, use workflow templates

### `/settings` — System Settings
- **Status:** ⚠️ Sidebar link exists, no page file

### `/login` — Authentication
- **Status:** ⚠️ Not implemented

---

## 5. Module-by-Module Business Logic

---

### 5.1 Dashboard (`/dashboard`)

**Purpose:** Give the owner a real-time snapshot of the entire motel operation.

**UI Structure:**
- Page header with date and quick action buttons
- KPI Bento Grid: 6 stat cards (total rooms, occupancy rate, monthly revenue, monthly expenses, expiring contracts, overdue amount)
- Revenue vs Expense line/bar chart (last 7 months)
- Occupancy donut/pie chart (by status: occupied/vacant/reserved/maintenance)
- Alert Panel: contract expiry warnings, vacant rooms without posts
- Activity Feed: recent system events

**Data implied:**
- Aggregated room counts by status
- Monthly revenue, expense, profit figures
- Count of contracts expiring within 7 and 30 days
- Total overdue rent amount
- Recent activity log entries

**Expected backend behavior:**
- `GET /api/dashboard/stats` → aggregated KPIs
- `GET /api/activity?limit=8` → recent activity feed
- `GET /api/contracts?expiringWithin=30` → expiry alerts

---

### 5.2 Room Management (`/room-management`)

**Purpose:** Manage the full inventory of rentable rooms across all blocks.

**UI Structure:**
- Page header with room count summary (total/occupied/vacant/maintenance)
- Alert banner: vacant rooms without marketing posts
- Filter bar: search (code/name), status, block, floor, price range
- Toggle: table view / card grid view
- Table columns: Code, Name, Block/Floor, Area, Price, Status, Tenants, Post status, Actions
- Card grid: room card with status badge, price, area, tenant count
- Add/Edit modal: full room form
- Delete confirmation modal
- Bulk action bar (appears when rows selected): bulk delete, bulk status change

**User actions:**
- Create room (required: code, name, block, floor, area, rentPrice, deposit, electricityPrice, waterPrice, serviceFee, maxTenants, status)
- Edit room
- Delete room (single or bulk)
- Change room status (single or bulk): Trống / Đang thuê / Đã đặt / Bảo trì
- Filter/search rooms
- Toggle table/card view
- Navigate to "Đăng bài ngay" for vacant rooms without posts

**Data fields (Room entity):**
```typescript
{
  id: string
  code: string           // e.g. "P101", "PB03"
  name: string           // e.g. "Phòng 101"
  floor: string          // e.g. "Tầng 1"
  block: string          // e.g. "Khu A", "Khu B", "Khu C"
  area: number           // m²
  rentPrice: number      // VND/month
  deposit: number        // VND (typically 2x rent)
  electricityPrice: number  // VND/kWh
  waterPrice: number     // VND/m³
  serviceFee: number     // VND/month
  maxTenants: number
  currentTenants: number
  status: 'Trống' | 'Đang thuê' | 'Đã đặt' | 'Bảo trì'
  description: string
  images: string[]       // image URLs
  hasActivePost: boolean // whether a marketing post is active for this room
}
```

**Validation rules (implied by form):**
- code: required, unique
- name: required
- block, floor: required (select from existing options)
- area: required, positive number
- rentPrice, deposit: required, positive number
- electricityPrice, waterPrice, serviceFee: required, positive number
- maxTenants: required, min 1

---

### 5.3 Contract Management (`/contract-management`)

**Purpose:** Manage rental agreements between tenants and rooms.

**UI Structure:**
- Page header with contract count and last-updated timestamp
- Action buttons: Print (mock), Export Excel (mock), Create contract
- Expiry Alert Banner: shows contracts expiring within 7 days (urgent) and 30 days
- Stats bar: counts by status (active, expiring, expired, terminated)
- Filter bar: search (code/tenant name/CCCD/phone/room), status, month
- Contract table with columns: Code, Room, Tenant, Start/End date, Monthly rent, Status, Days until expiry, Actions
- Row actions: Edit, Renew, Terminate, Delete
- Bulk selection with bulk delete
- Create/Edit/Renew modal (same form, different mode)
- Terminate confirmation modal

**User actions:**
- Create contract (links room + tenant)
- Edit contract
- Renew contract (marks old as expired, creates new)
- Terminate contract (marks as "Đã chấm dứt")
- Delete contract
- Filter/search contracts
- Bulk delete
- Export Excel (mock)
- Print (mock)

**Data fields (Contract entity):**
```typescript
{
  id: string
  code: string              // e.g. "HĐ-2025-001"
  roomId: string
  roomCode: string          // e.g. "P101"
  roomName: string
  tenantId: string
  tenantName: string
  tenantPhone: string
  tenantCCCD: string        // National ID number
  startDate: string         // ISO date
  endDate: string           // ISO date
  monthlyRent: number       // VND
  deposit: number           // VND
  billingCycle: number      // months (typically 1)
  paymentDueDay: number     // day of month (1-31)
  status: 'Đang hiệu lực' | 'Sắp hết hạn' | 'Đã hết hạn' | 'Đã chấm dứt'
  daysUntilExpiry: number | null
  notes: string
}
```

**Validation rules:**
- roomId: required (select from available rooms)
- tenantName, tenantPhone, tenantCCCD: required
- startDate, endDate: required, endDate > startDate
- monthlyRent, deposit: required, positive
- paymentDueDay: 1-31
- billingCycle: positive integer

**Business rules:**
- A room can only have one active contract at a time
- Renewing creates a new contract and marks the old one as "Đã hết hạn"
- "Sắp hết hạn" = daysUntilExpiry <= 30
- Expiry banner shows contracts with daysUntilExpiry <= 7 as urgent

---

### 5.4 Tenant Management (`/tenant-management`)

**Purpose:** Manage all current and past tenants with personal info, contract history, and payment tracking.

**UI Structure:**
- KPI cards: total tenants, currently renting, expiring soon, debt cases
- Search bar + status filter + export button
- Tenant table: Name, Phone, CCCD, Room, Status, Debt, Actions
- Row actions dropdown: View detail, Edit, View rental history, Contact, Create contract, End rental, Delete
- Detail modal (5 tabs):
  - **Thông tin cá nhân:** personal fields
  - **Hợp đồng:** current contract summary
  - **Lịch sử thuê:** rental history timeline
  - **Thanh toán:** total paid, current debt, payment history list
  - **Ghi chú nội bộ:** internal notes
- Create/Edit form modal

**User actions:**
- Add/edit/delete tenant
- View tenant detail (5-tab modal)
- Filter by status (Đang thuê / Sắp hết hạn / Nợ tiền / Đã trả phòng)
- Search by name/phone/CCCD
- Export (mock)
- Navigate to create contract for tenant
- Mark tenant as "Kết thúc thuê"

**Data fields (Tenant entity):**
```typescript
{
  id: string
  fullName: string
  phone: string
  cccd: string              // National ID
  gender: 'Nam' | 'Nữ'
  dateOfBirth: string       // ISO date
  permanentAddress: string
  currentRoomId: string | null
  currentRoomCode: string | null
  occupation?: string
  licensePlate?: string
  contractCode?: string
  startDate?: string
  status: 'Đang thuê' | 'Đã trả phòng' | 'Sắp hết hạn' | 'Nợ tiền'
  debt: number              // VND outstanding
  notes?: string
}
```

**Validation rules:**
- fullName, phone, cccd: required
- gender: required (Nam/Nữ)
- dateOfBirth: required, valid date
- permanentAddress: required

---

### 5.5 Post Management (`/post-management`)

**Purpose:** Create and manage marketing posts for vacant rooms on Facebook and Zalo.

**UI Structure:**
- KPI cards: total posts, published, scheduled, draft/error, total views, total leads, conversion rate
- Filter bar: search, status, channel, post type
- Toggle: table view / card grid view
- Table columns: Title, Room, Type, Channel, Status, Views, Messages, Leads, Converted, Actions
- Row actions: View, Edit, Duplicate, Post now, Schedule, Delete
- Create post modal (left: form, right: live Facebook preview)
- Analytics charts: posts by status (pie), performance over time (bar/line)
- Chat/Leads panel: incoming messages from Facebook/Zalo with lead status tracking

**User actions:**
- Create post (with live preview)
- Edit/duplicate/delete post
- Post immediately (mock)
- Schedule post (datetime picker)
- Filter/search posts
- View post analytics (views, messages, leads, conversions)
- Manage incoming chat leads (assign, tag, update lead status)

**Data fields (FacebookPost entity):**
```typescript
{
  id: string
  title: string
  content: string
  roomId: string | null
  roomCode: string | null
  postType: 'Tuyển khách' | 'Khuyến mãi' | 'Thông báo'
  channel: 'Facebook Page' | 'Facebook Group' | 'Zalo'
  plannedDate: string | null
  postedDate: string | null
  status: 'Nháp' | 'Đã lên lịch' | 'Đã đăng' | 'Lỗi'
  fbLink: string | null
  views: number
  messages: number
  leads: number
  converted: number
  hashtags?: string
  price?: number
  area?: number
  assignee?: string
  thumbnail?: string
}
```

**ChatConversation entity (leads from posts):**
```typescript
{
  id: string
  customerName: string
  customerAvatar: string    // initials
  source: 'Facebook Page' | 'Facebook Group' | 'Zalo'
  lastMessage: string
  lastTime: string
  unreadCount: number
  tags: string[]
  leadStatus: 'Mới' | 'Đang tư vấn' | 'Quan tâm cao' | 'Đã chốt' | 'Không quan tâm'
  phone?: string
  interestedRoom?: string
  budget?: number
  appointmentDate?: string
  internalNote?: string
  assignee?: string
  interestLevel: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất cao'
  messages: ChatMessage[]
}
```

---

### 5.6 Expenses (`/expenses`)

**Purpose:** Track all operational costs for the motel.

**UI Structure:**
- Page header with export button and "Thêm chi phí" button
- Summary stat cards: total expenses, paid, unpaid, pending
- Filter bar: search, category, payment status, building, date range (from/to)
- Expense table: Code, Title, Category, Amount, Date, Building, Payment Status, Actions
- Row actions: View detail, Edit, Mark paid, Delete
- Detail drawer (right side panel): full expense info
- Create/Edit modal form
- Delete confirmation dialog

**User actions:**
- Add/edit/delete expense
- Mark expense as paid
- View expense detail (drawer)
- Filter by category/status/building/date range
- Search by title/code/note
- Export (mock)

**Data fields (Expense entity):**
```typescript
{
  id: string
  expenseCode: string       // e.g. "CP-2024-001"
  title: string
  category: 'Điện nước' | 'Internet' | 'Vệ sinh' | 'Sửa chữa' | 'Mua sắm' | 'Lương / quản lý' | 'Chi phí khác'
  amount: number            // VND
  expenseDate: string       // ISO date
  paymentStatus: 'Đã thanh toán' | 'Chưa thanh toán' | 'Chờ xử lý'
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản' | 'Khác'
  buildingName: string      // e.g. "Khu A"
  note: string
  attachmentCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
  isRecurring?: boolean
  receiptImage?: string
}
```

**Validation rules:**
- title: required
- category: required
- amount: required, positive number
- expenseDate: required, valid date
- paymentStatus: required
- paymentMethod: required

**Note:** The expenses module has the most complete service layer (`expenseService.ts`) with full CRUD operations, filtering, and `markExpensePaid`. This is the best reference for how other service layers should be structured.

---

### 5.7 Reports (`/reports`)

**Purpose:** Provide financial and operational reporting for a selected period.

**UI Structure:**
- Report header with export Excel/PDF buttons
- Filter bar: period type (month/quarter/year), year, month/quarter selector, building filter, compare with previous toggle
- KPI cards: total revenue, total expense, net profit, occupancy rate, total debt, expiring contracts (with trend indicators)
- Charts:
  - Revenue vs Expense trend (line/bar, multi-month)
  - Expense breakdown by category (pie chart)
  - Occupancy by building (bar chart)
  - Debt trend over time (line chart)
- Detail sections:
  - Room operation summary (total/occupied/vacant/soon-vacant, occupancy rate)
  - Contract summary (active, expiring in 30 days, new this period, ended this period, expiring list)
  - Financial summary (expected rent, collected, uncollected, total expense, estimated profit)
- Tenant debt table: tenant name, room, billing period, amount due, amount paid, remaining, status

**User actions:**
- Select period (month/quarter/year) and building
- Apply/reset filters
- Export Excel (mock)
- Export PDF (mock)

**Filter parameters:**
```typescript
{
  periodType: 'month' | 'quarter' | 'year'
  selectedMonth: number     // 1-12
  selectedQuarter: number   // 1-4
  selectedYear: number
  buildingId: string        // 'all' or specific building
  compareWithPrevious: boolean
}
```

**Report data shape:**
```typescript
{
  kpi: ReportKPI            // aggregated metrics
  revenueTrend: RevenueExpenseTrendItem[]
  expenseBreakdown: ExpenseCategoryItem[]
  occupancyByBuilding: OccupancyByBuildingItem[]
  debtTrend: DebtTrendItem[]
  roomOperation: RoomOperationReport
  contractReport: ContractReport
  financialReport: FinancialReport
  tenantDebtList: TenantDebtItem[]
}
```

---

### 5.8 AI Agent (`/agent`)

**Purpose:** AI-powered operational assistant and automation control center.

**UI Structure:**
- Page header: title, subtitle, status badges (active/mock/running automations count)
- Header actions: Tạo automation, Xem lịch sử, Cài đặt agent
- Summary cards (6): today tasks, running automations, pending alerts, AI assisted, overdue tenants, expiring contracts
- Two-column layout (3:2 on desktop, stacked on mobile):
  - **Left column:**
    - AI Chat Panel: welcome message, conversation history, input box, quick prompt chips
    - Quick Actions Panel: 6 action cards with icon/title/description/CTA
  - **Right column:**
    - Alerts Panel: severity-coded alert cards with CTA buttons
    - Automation List: list of automations with toggle/run/edit/delete
- Below two-column:
  - Task History Table: execution log with status badges
  - Agent Capabilities Section: 5 capability category cards
  - Workflow Templates Section: 6 ready-made workflow templates

**User actions:**
- Send message to AI assistant (mock responses based on keyword matching)
- Click quick prompt chips (populates chat)
- Run quick actions (triggers chat prompt)
- Toggle automation on/off
- Run automation manually
- Delete automation
- Create new automation (modal form)
- Use workflow template (opens create automation modal)
- View task history
- Retry failed tasks (mock)
- Navigate to related modules from alerts

**Automation data fields:**
```typescript
{
  id: string
  name: string
  description: string
  triggerType: 'schedule' | 'event' | 'condition'
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  status: 'active' | 'paused' | 'error' | 'draft'
  lastRunAt: string | null
  nextRunAt: string | null
  module: 'rooms' | 'contracts' | 'tenants' | 'expenses' | 'reports' | 'posts' | 'general'
  isEnabled: boolean
  runCount: number
}
```

**Create Automation form fields:**
- name (required)
- description
- triggerType (required): schedule / event / condition
- frequency: daily / weekly / monthly / custom
- runTime: time string
- module (required): rooms / contracts / tenants / expenses / reports / posts
- condition: free text
- action (required): free text describing what AI should do
- notifyRecipient: free text
- notifyChannel: in_app / email / sms / zalo
- enableImmediately: boolean

**AI Chat mock response logic (in agentService.ts):**
- Keywords "phòng trống" → room vacancy summary
- Keywords "nợ / công nợ / chưa thanh toán" → overdue tenant list
- Keywords "hợp đồng / hết hạn" → expiring contract list
- Keywords "chi phí" → expense breakdown
- Keywords "bài đăng / đăng bài / lấp đầy" → post suggestion
- Keywords "báo cáo / vận hành / tình hình" → weekly operations report
- Default → generic help message

---

## 6. Entity Model Overview

### Room
- Represents a physical rentable unit
- Belongs to a Block (Khu A/B/C) and Floor
- Has pricing: rent, deposit, electricity rate, water rate, service fee
- Status: Trống / Đang thuê / Đã đặt / Bảo trì
- Tracks current tenant count vs max capacity
- Has a flag `hasActivePost` linking to marketing status
- **Relationships:** 1 Room → many Contracts (over time), 1 Room → many Expenses (room-specific), 1 Room → many Posts

### Tenant
- Represents a person renting a room
- Has personal info: name, phone, CCCD (national ID), DOB, gender, address, occupation, license plate
- Tracks current room assignment and contract code
- Has a `debt` field (VND outstanding)
- Status: Đang thuê / Đã trả phòng / Sắp hết hạn / Nợ tiền
- **Relationships:** 1 Tenant → many Contracts (over time), 1 Tenant → 1 active Room (via active Contract)

### Contract
- Represents a rental agreement
- Links exactly 1 Room to 1 Tenant
- Has financial terms: monthly rent, deposit, billing cycle, payment due day
- Has lifecycle: Đang hiệu lực → Sắp hết hạn → Đã hết hạn / Đã chấm dứt
- `daysUntilExpiry` is computed from endDate
- **Relationships:** 1 Contract → 1 Room, 1 Contract → 1 Tenant

### Expense
- Represents an operational cost
- May be linked to a specific room (room-specific maintenance) or building-wide
- Has category, amount, date, payment status, payment method
- Has `buildingName` for building-level filtering
- Can be recurring (`isRecurring`)
- **Relationships:** 1 Expense → 0 or 1 Room, 1 Expense → 1 Building

### FacebookPost
- Represents a marketing post for social media
- May be linked to a specific vacant room
- Has channel (Facebook Page / Facebook Group / Zalo)
- Tracks engagement: views, messages, leads, conversions
- Has scheduling: plannedDate, postedDate, status
- **Relationships:** 1 Post → 0 or 1 Room, 1 Post → many ChatConversations (leads)

### ChatConversation
- Represents an incoming lead conversation
- Linked to a source channel and optionally a room of interest
- Has lead lifecycle: Mới → Đang tư vấn → Quan tâm cao → Đã chốt / Không quan tâm
- Has assignee (staff member)
- **Relationships:** 1 Conversation → many ChatMessages, 1 Conversation → 0 or 1 Room

### Notification
- System-generated alert
- Types: contract_expiry, vacant_room, overdue_payment, maintenance
- Priority: high / medium / low
- Has read/unread state
- **Relationships:** Cross-cutting, references rooms/contracts/tenants

### AutomationItem
- Represents a scheduled or event-triggered AI workflow
- Has trigger type, frequency, status, last/next run times
- Linked to a business module
- **Relationships:** 1 Automation → 1 Module (rooms/contracts/tenants/expenses/reports/posts)

### AgentConversationItem
- Represents a single message in the AI chat
- Role: user or assistant
- Has messageType: text / summary / list / action_suggestion
- May have suggestedActions (navigate, create_task, send_reminder, view_detail)
- May have listItems (bullet points in response)
- **Relationships:** Many messages → 1 conversation session (no persistent session ID currently)

### AgentTaskHistoryItem
- Represents a completed or failed AI/automation task execution
- Has taskType, triggerSource, status, resultSummary
- **Relationships:** 1 Task → 1 Module

### User (inferred — not yet implemented)
- Currently hardcoded as "Nguyễn Văn Chủ" (Admin/Chủ nhà)
- Implied fields: id, name, email, role, avatar
- Roles implied: Admin (Chủ nhà), Manager (Quản lý), Staff (Nhân viên)

---

## 7. Frontend-to-Backend API Mapping

### Auth
```
POST   /api/auth/login          { email, password } → { token, user }
POST   /api/auth/logout
GET    /api/auth/me             → { user }
POST   /api/auth/refresh
```

### Rooms
```
GET    /api/rooms               ?status=&block=&floor=&priceMin=&priceMax=&search=&page=&limit=
GET    /api/rooms/:id
POST   /api/rooms               { code, name, block, floor, area, rentPrice, deposit, electricityPrice, waterPrice, serviceFee, maxTenants, status, description }
PUT    /api/rooms/:id
DELETE /api/rooms/:id
PATCH  /api/rooms/:id/status    { status }
POST   /api/rooms/bulk-delete   { ids: string[] }
POST   /api/rooms/bulk-status   { ids: string[], status }
GET    /api/rooms/stats         → { total, vacant, occupied, maintenance, noPost }
```

### Tenants
```
GET    /api/tenants             ?status=&search=&page=&limit=
GET    /api/tenants/:id
POST   /api/tenants             { fullName, phone, cccd, gender, dateOfBirth, permanentAddress, occupation?, licensePlate?, notes? }
PUT    /api/tenants/:id
DELETE /api/tenants/:id
GET    /api/tenants/:id/contracts
GET    /api/tenants/:id/payments
GET    /api/tenants/stats       → { total, active, expiringSoon, debtCases }
```

### Contracts
```
GET    /api/contracts           ?status=&roomId=&tenantId=&month=&search=&page=&limit=
GET    /api/contracts/:id
POST   /api/contracts           { roomId, tenantId, tenantName, tenantPhone, tenantCCCD, startDate, endDate, monthlyRent, deposit, billingCycle, paymentDueDay, notes }
PUT    /api/contracts/:id
DELETE /api/contracts/:id
POST   /api/contracts/:id/renew { startDate, endDate, monthlyRent, deposit, ... }
POST   /api/contracts/:id/terminate { reason, terminationDate }
GET    /api/contracts/expiring  ?withinDays=30 → expiring contracts list
GET    /api/contracts/stats     → { active, expiring, expired, terminated }
POST   /api/contracts/bulk-delete { ids: string[] }
GET    /api/contracts/export    ?format=excel → file download
```

### Expenses
```
GET    /api/expenses            ?category=&paymentStatus=&buildingName=&fromDate=&toDate=&search=&page=&limit=
GET    /api/expenses/:id
POST   /api/expenses            { title, category, amount, expenseDate, paymentStatus, paymentMethod, buildingName, note, isRecurring }
PUT    /api/expenses/:id
DELETE /api/expenses/:id
PATCH  /api/expenses/:id/mark-paid
GET    /api/expenses/stats      → { total, paid, unpaid, pending, totalAmount }
GET    /api/expenses/export     ?format=excel → file download
```

### Posts
```
GET    /api/posts               ?status=&channel=&postType=&roomId=&search=&page=&limit=
GET    /api/posts/:id
POST   /api/posts               { title, content, roomId?, postType, channel, plannedDate?, hashtags?, price?, area?, assignee? }
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/publish   → publish immediately
POST   /api/posts/:id/schedule  { scheduledAt: datetime }
POST   /api/posts/:id/duplicate
GET    /api/posts/stats         → { total, published, scheduled, draft, error, totalViews, totalLeads }
```

### Chat / Leads
```
GET    /api/conversations       ?leadStatus=&assignee=&search=
GET    /api/conversations/:id
PATCH  /api/conversations/:id   { leadStatus, assignee, internalNote, tags }
POST   /api/conversations/:id/messages { text }
GET    /api/conversations/stats → { total, unread, byLeadStatus }
```

### Reports
```
GET    /api/reports/overview    ?periodType=&selectedMonth=&selectedQuarter=&selectedYear=&buildingId=&compareWithPrevious=
GET    /api/reports/revenue-expense-trend  ?...filters
GET    /api/reports/expense-breakdown      ?...filters
GET    /api/reports/occupancy-by-building  ?...filters
GET    /api/reports/debt-trend             ?...filters
GET    /api/reports/tenant-debt-list       ?...filters
GET    /api/reports/export      ?format=excel|pdf&...filters → file download
```

### Notifications
```
GET    /api/notifications       ?read=&type=&page=&limit=
PATCH  /api/notifications/:id/read
POST   /api/notifications/mark-all-read
GET    /api/notifications/count → { unread: number }
```

### AI Agent
```
POST   /api/agent/chat          { message: string, sessionId?: string } → { reply: AgentConversationItem }
GET    /api/agent/overview      → AgentOverview
GET    /api/agent/alerts        → AgentAlertItem[]
GET    /api/agent/task-history  ?page=&limit= → AgentTaskHistoryItem[]
GET    /api/agent/quick-actions → QuickActionItem[]
```

### Automations
```
GET    /api/automations         ?status=&module=
GET    /api/automations/:id
POST   /api/automations         { name, description, triggerType, frequency, runTime, module, condition, action, notifyRecipient, notifyChannel, enableImmediately }
PUT    /api/automations/:id
DELETE /api/automations/:id
PATCH  /api/automations/:id/toggle
POST   /api/automations/:id/run → trigger manual execution
GET    /api/automations/:id/logs → execution log entries
```

### Workflow Templates
```
GET    /api/workflow-templates  → WorkflowTemplateItem[]
POST   /api/workflow-templates/:id/use → creates automation from template
```

### Dashboard
```
GET    /api/dashboard/stats     → aggregated KPIs
GET    /api/dashboard/activity  ?limit=8 → recent activity feed
```

---

## 8. Screen-to-Entity Relationship Map

| Screen | Creates | Reads | Updates | Depends On |
|---|---|---|---|---|
| Dashboard | — | Room, Contract, Expense, Revenue aggregates | — | All modules |
| Room Management | Room | Room | Room | — |
| Contract Management | Contract | Contract, Room (for room picker), Tenant | Contract | Room, Tenant |
| Tenant Management | Tenant | Tenant, Contract (in detail tab), Payment history | Tenant | Contract, Room |
| Post Management | Post, ChatConversation | Post, Room (vacant rooms for picker), ChatConversation | Post, ChatConversation | Room |
| Expenses | Expense | Expense | Expense | Room (optional link) |
| Reports | — | Room, Contract, Expense, Tenant (aggregated) | — | All modules |
| AI Agent | Automation, AgentTaskHistoryItem | All modules (via AI queries), Automation, Alert, TaskHistory | Automation | All modules |
| Notifications (Topbar) | — | Notification | Notification (mark read) | Contract, Room, Tenant |

**Cross-cutting dependencies:**
- **Contract** depends on **Room** (room must exist and be available) and **Tenant** (tenant must exist)
- **Reports** aggregates data from **Room + Contract + Expense + Tenant**
- **AI Agent** can query and reference all modules
- **Post Management** uses **Room** vacancy data to populate room picker
- **Dashboard** aggregates from all modules

---

## 9. Mock Data & Current Limitations

### Mock Data Locations

| Module | File | What's mocked |
|---|---|---|
| Rooms | `src/lib/mockData.ts` → `mockRooms` | 20 rooms across Khu A, B, C |
| Tenants | `src/lib/mockData.ts` → `mockTenants` | 12 tenants (active, expired, debt) |
| Contracts | `src/lib/mockData.ts` → `mockContracts` | 15 contracts (various statuses) |
| Posts | `src/lib/mockData.ts` → `mockPosts` | 8 posts (various statuses/channels) |
| Chat Conversations | `src/lib/mockData.ts` → `mockConversations` | 8 lead conversations |
| Revenue trend | `src/lib/mockData.ts` → `mockRevenueData` | 7 months of revenue/expense data |
| Notifications | `src/lib/mockData.ts` → `mockNotifications` | 6 notifications |
| Expenses | `src/app/expenses/mockExpenses.ts` | 15 expense records |
| Reports | `src/app/reports/mockReportData.ts` | Full report data object |
| AI Agent | `src/app/agent/mockAgentData.ts` | Conversations, automations, alerts, history, templates |

### Service Layer Pattern

Each module that has a service file follows this pattern:
```typescript
// In-memory store (mutable)
let store: Entity[] = [...mockData];

// Async function with delay simulation
export async function getItems(filters?: Filters): Promise<Entity[]> {
  await delay(400);
  // filter logic
  return [...store];
}

// CRUD operations mutate the in-memory store
export async function createItem(payload: FormData): Promise<Entity> {
  await delay(400);
  const newItem = { id: generateId(), ...payload };
  store = [newItem, ...store];
  return newItem;
}
```

**Modules with full service layers:** Expenses (`expenseService.ts`), Reports (`reportService.ts`), AI Agent (`agentService.ts`)

**Modules without service layers (state managed directly in page.tsx):** Rooms, Contracts, Tenants, Posts

### What is Currently Fake / UI-Only

| Feature | Status |
|---|---|
| All data persistence | ❌ In-memory only, resets on page refresh |
| Authentication / login | ❌ Not implemented |
| Route guards | ❌ Not implemented |
| Export Excel/PDF | ❌ Mock toast only |
| Print contract | ❌ Mock button only |
| Post to Facebook/Zalo | ❌ Mock button only |
| Send SMS/Zalo notifications | ❌ Mock only |
| Real AI/LLM responses | ❌ Keyword-matching mock responses |
| Automation scheduler | ❌ Mock toggle/run only |
| File/image upload | ❌ UI only, no actual upload |
| Email notifications | ❌ Not implemented |
| Settings page | ❌ Not implemented |
| User profile page | ❌ Not implemented |
| Multi-user / roles | ❌ Single hardcoded user |

### Missing for Real Backend Integration

1. Replace all `mockData.ts` imports with API calls using `axios` or `fetch`
2. Add authentication (JWT) with route guards
3. Implement real file upload for room images and expense receipts
4. Connect post publishing to Facebook Graph API / Zalo API
5. Connect AI chat to real LLM (OpenAI/Gemini/Anthropic — API keys already in `.env`)
6. Implement automation scheduler (cron jobs or workflow engine)
7. Add WebSocket or polling for real-time notifications
8. Implement export functionality (Excel via `xlsx`, PDF via `puppeteer` or similar)

---

## 10. Authentication & Authorization

### Current State
- **No authentication implemented**
- No login page, no logout flow, no session management
- No route guards or middleware
- User identity hardcoded: `Nguyễn Văn Chủ`, role `Chủ nhà · Admin`
- Email shown in Topbar: `chuNha@motelmanage.vn` (hardcoded)

### Implied Auth Design (for backend)

**Login flow:**
1. `POST /api/auth/login` with email + password
2. Backend returns JWT access token + refresh token
3. Frontend stores token in `httpOnly` cookie or `localStorage`
4. All subsequent API calls include `Authorization: Bearer <token>`
5. Route guard middleware checks token validity

**Implied roles:**
- `admin` / `Chủ nhà` — Full access to all modules
- `manager` / `Quản lý` — Access to rooms, contracts, tenants, expenses, reports (implied by assignee fields)
- `staff` / `Nhân viên` — Access to posts, chat conversations (implied by post assignee)

**Route protection:**
- All `/dashboard`, `/room-management`, `/contract-management`, `/tenant-management`, `/post-management`, `/expenses`, `/reports`, `/agent` routes require authentication
- Redirect to `/login` if not authenticated

---

## 11. Recommended Backend Build Order

Build in this order to support frontend dependency chain:

### Phase 1 — Foundation
1. **Database schema** — Create tables for all entities
2. **Auth** — JWT login, user management, role system
3. **Rooms** — CRUD + status management (most other modules depend on rooms)

### Phase 2 — Core Operations
4. **Tenants** — CRUD + debt tracking
5. **Contracts** — CRUD + renewal + termination + expiry scanning
6. **Expenses** — CRUD + payment status + category filtering

### Phase 3 — Reporting & Marketing
7. **Reports** — Aggregation queries (revenue, occupancy, debt trends)
8. **Posts** — CRUD + scheduling + channel management
9. **Chat/Leads** — Conversation management + lead tracking

### Phase 4 — Intelligence & Automation
10. **Notifications** — Real-time alerts (contract expiry, overdue payment, vacant rooms)
11. **AI Agent chat** — LLM integration (OpenAI/Gemini/Anthropic)
12. **Automations** — Scheduler + workflow engine + execution logging

### Phase 5 — Integrations
13. **Facebook Graph API** — Post publishing
14. **Zalo API** — Post publishing + notifications
15. **Email service** — Tenant reminders, reports
16. **File storage** — Room images, expense receipts (S3 or similar)

---

## 12. AI Backend Handoff

> **This section is written for an AI coding assistant (Claude, GPT-4, etc.) that will generate the backend for this application.**

### How to Read This Project

1. **Start with `src/lib/mockData.ts`** — This is the single source of truth for shared entity types and mock data. All TypeScript interfaces for Room, Tenant, Contract, Post, Expense, Notification are defined here.

2. **Read module-specific `types.ts` files** — Each module under `src/app/<module>/types.ts` defines the TypeScript interfaces specific to that module (Expense types, Report types, Agent types).

3. **Read service files** — `src/app/expenses/expenseService.ts` is the most complete example of the service layer pattern. Use it as the reference for how all other modules should have their service layers structured.

4. **Read page files** — Each `page.tsx` shows exactly what data the frontend expects, what filters are applied, and what CRUD operations are performed. Look for `// Backend integration point:` comments — these mark exactly where API calls should replace mock logic.

### Entities to Implement First

Priority order based on dependency:
1. `User` (auth foundation)
2. `Room` (referenced by Contract, Expense, Post)
3. `Tenant` (referenced by Contract)
4. `Contract` (references Room + Tenant)
5. `Expense` (references Room optionally)
6. `Report` (aggregates Room + Contract + Expense + Tenant)
7. `Post` / `ChatConversation` (references Room)
8. `Notification` (cross-cutting)
9. `Automation` / `AgentTaskHistory` (references all modules)

### Safe Assumptions

- **One active contract per room at a time** — A room can only have one contract with status `Đang hiệu lực` or `Sắp hết hạn`
- **One room per tenant at a time** — A tenant's `currentRoomId` points to their active room
- **Contract renewal creates a new record** — Old contract is marked `Đã hết hạn`, new contract is created
- **Expenses are mostly building-wide** — `roomId` is nullable; many expenses apply to the whole property
- **Posts are optional room links** — Promotional posts (Khuyến mãi, Thông báo) have no room link
- **Debt is tracked on Tenant** — The `debt` field on Tenant is the total outstanding amount
- **All monetary values are in VND (Vietnamese Dong)** — Store as integers (no decimals)
- **All dates are ISO 8601 strings** — `YYYY-MM-DD` format used throughout
- **Buildings are string identifiers** — "Khu A", "Khu B", "Khu C" (not a separate entity currently)

### Inferred (Not Confirmed from UI)

- Building as a separate entity (currently just a string field on Room)
- Payment records as a separate entity (currently implied by Tenant.debt and mock payment history in detail modal)
- Activity log as a separate entity (currently mock in Dashboard ActivityFeed)
- User roles/permissions system (currently single hardcoded user)
- Notification delivery channels (currently only in-app notifications shown)

### How to Generate Compatible Backend APIs

1. **Match the TypeScript interfaces exactly** — The frontend TypeScript types in `types.ts` files define the exact shape of data the frontend expects. Backend responses must match these shapes.

2. **Support all filter parameters** — Each module's filter bar implies specific query parameters. See Section 7 for the full API mapping.

3. **Use the service file pattern** — Each `*Service.ts` file shows the exact function signatures the frontend calls. Replace the mock implementations with real `axios` calls to your backend.

4. **Preserve Vietnamese field values** — Status enums, category names, and labels are in Vietnamese. Backend should store and return these exact string values (or map them consistently).

5. **Pagination** — All list endpoints should support `?page=&limit=` query params. The frontend currently loads all data at once (no pagination UI), but the API should be paginated for production.

6. **The `// Backend integration point:` comments** — Search for this string across all files. Each occurrence marks exactly where a real API call should be made. The comment often includes the suggested endpoint path.

### Key Files for Backend Generation

| File | Why Important |
|---|---|
| `src/lib/mockData.ts` | All shared entity types and 20+ mock records per entity |
| `src/app/expenses/types.ts` | Best-structured type file — use as template |
| `src/app/expenses/expenseService.ts` | Most complete service layer — use as template |
| `src/app/reports/types.ts` | Complex report data shapes |
| `src/app/agent/types.ts` | AI/automation entity types |
| `src/app/agent/agentService.ts` | AI service layer with mock LLM response logic |
| `src/app/contract-management/page.tsx` | Complex CRUD with renew/terminate flows |
| `src/app/reports/page.tsx` | Shows all filter params and data shape expectations |

### Environment Variables Available

The following API keys are already configured in `.env` and can be used for backend integration:

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase database
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase auth
OPENAI_API_KEY                  # OpenAI for AI Agent chat
GEMINI_API_KEY                  # Google Gemini alternative
ANTHROPIC_API_KEY               # Claude/Anthropic alternative
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Payments (not yet used in UI)
```

### Suggested Backend Architecture

```
Backend (Node.js / Next.js API Routes or separate Express/Fastify):
├── /api/auth/          → JWT auth endpoints
├── /api/rooms/         → Room CRUD
├── /api/tenants/       → Tenant CRUD
├── /api/contracts/     → Contract CRUD + business logic
├── /api/expenses/      → Expense CRUD
├── /api/posts/         → Post CRUD + scheduling
├── /api/conversations/ → Chat/lead management
├── /api/reports/       → Aggregation queries
├── /api/notifications/ → Alert system
├── /api/agent/         → LLM proxy + chat history
├── /api/automations/   → Workflow management
└── /api/dashboard/     → Aggregated stats

Database: PostgreSQL (recommended) or Supabase
ORM: Prisma (recommended for TypeScript compatibility)
Auth: JWT + bcrypt
File storage: Supabase Storage or AWS S3
Scheduler: node-cron or BullMQ for automations
LLM: OpenAI GPT-4 or Anthropic Claude (keys available in .env)
```

---

*Document generated from actual codebase inspection. All module descriptions, entity fields, and API suggestions are based on the real frontend implementation as of 2026-03-31.*
