# MotelManage — Hệ thống Quản lý Nhà trọ Thông minh

> **Developer Handoff Document** — Frontend-first, mock-data-driven application.  
> Backend has NOT yet been integrated. All data is served from in-memory mock stores.

---

## What is MotelManage?

**MotelManage** is a Vietnamese-language web application for motel/boarding-house owners to manage their entire rental property operation from a single dashboard. The system covers:

- Room inventory management across multiple blocks (Khu A, B, C)
- Tenant registration and lifecycle tracking
- Rental contract creation, renewal, and termination
- Expense tracking and financial reporting
- Marketing post management (Facebook, Zalo)
- AI-powered operational assistant with automation workflows

**Target users:** Vietnamese motel owners / property managers (single admin role currently implied)  
**Language:** Vietnamese (UI text, labels, mock data)  
**Current state:** Frontend-only, mock-data-driven, no backend integration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.1.11 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 3.4.6 |
| Icons | @heroicons/react 2.x |
| Charts | Recharts 2.15.2 |
| Forms | react-hook-form 7.x (available, partially used) |
| Toasts | sonner 2.x (available), custom inline toasts used in some modules |
| HTTP client | axios (available, not yet used — all data is mock) |
| State management | Local React state (useState/useMemo) — no global store |
| Routing | Next.js App Router file-based routing |

---

## Route Map

| Route | Screen | Status |
|---|---|---|
| `/dashboard` | Overview Dashboard | ✅ Implemented |
| `/room-management` | Room Management | ✅ Implemented |
| `/contract-management` | Contract Management | ✅ Implemented |
| `/tenant-management` | Tenant Management | ✅ Implemented |
| `/post-management` | Marketing Post Management | ✅ Implemented |
| `/expenses` | Expense Management | ✅ Implemented |
| `/reports` | Business Reports | ✅ Implemented |
| `/agent` | AI Agent Control Center | ✅ Implemented |
| `/settings` | System Settings | ⚠️ Sidebar link exists, page not scaffolded |
| `/login` | Authentication | ⚠️ Not implemented (no auth guard) |
| `/profile` | User Profile | ⚠️ Topbar link exists, page not scaffolded |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (html/body, metadata)
│   ├── not-found.tsx             # 404 page
│   ├── dashboard/                # /dashboard route
│   ├── room-management/          # /room-management route
│   ├── contract-management/      # /contract-management route
│   ├── tenant-management/        # /tenant-management route
│   ├── post-management/          # /post-management route
│   ├── expenses/                 # /expenses route
│   ├── reports/                  # /reports route
│   └── agent/                    # /agent route (AI Agent)
├── components/
│   ├── AppLayout.tsx             # Shell: Sidebar + Topbar + main content
│   ├── Sidebar.tsx               # Left navigation
│   ├── Topbar.tsx                # Top header bar
│   ├── FacebookChatPopup.tsx     # Floating chat widget
│   └── ui/                       # Shared UI primitives
│       ├── AppImage.tsx
│       ├── AppIcon.tsx
│       ├── AppLogo.tsx
│       ├── Modal.tsx
│       ├── StatusBadge.tsx
│       └── LoadingSkeleton.tsx
├── lib/
│   └── mockData.ts               # Central mock data + shared types + helpers
└── styles/
    ├── index.css                 # Global CSS (do not modify)
    └── tailwind.css              # Tailwind directives + CSS variables
```

Each route module follows this internal structure:
```
app/<module>/
├── page.tsx          # Page component (state, filtering, CRUD handlers)
├── types.ts          # TypeScript interfaces for this module
├── mock*.ts          # Mock data arrays
├── *Service.ts       # Fake service layer (async functions with delays)
└── components/       # Module-specific components
```

---

## Core Business Entities

| Entity | Description |
|---|---|
| `Room` | A rentable unit with code, block, floor, price, status |
| `Tenant` | A person renting a room, with personal info and debt tracking |
| `Contract` | A rental agreement linking one Room to one Tenant |
| `Expense` | An operational cost item (electricity, maintenance, salary, etc.) |
| `FacebookPost` | A marketing post for vacant rooms on social channels |
| `ChatConversation` | Incoming lead conversations from Facebook/Zalo |
| `Notification` | System alerts (contract expiry, overdue payment, etc.) |
| `AutomationItem` | A scheduled/event-triggered AI workflow |
| `AgentConversationItem` | An AI chat message (user or assistant) |

---

## Key Relationships

```
Building/Block (Khu A/B/C)
  └── Room (1 block : many rooms)
        └── Contract (1 room : many contracts over time, 1 active at a time)
              └── Tenant (1 contract : 1 primary tenant)

Tenant ──────── Contract (1 tenant can have multiple contracts over time)
Expense ──────── Room (optional: expense may be room-specific or building-wide)
FacebookPost ─── Room (optional: post may be linked to a specific vacant room)
ChatConversation ─ FacebookPost (leads from marketing posts)
AgentAlertItem ─── all modules (cross-cutting alerts)
AutomationItem ──── module (rooms/contracts/tenants/expenses/reports/posts)
```

---

## Mock Data Locations

| Data | File |
|---|---|
| Rooms, Tenants, Contracts, Posts, Revenue, Notifications | `src/lib/mockData.ts` |
| Expenses | `src/app/expenses/mockExpenses.ts` |
| Reports | `src/app/reports/mockReportData.ts` |
| AI Agent (conversations, automations, alerts, history) | `src/app/agent/mockAgentData.ts` |

---

## Authentication

- **Status:** ⚠️ Not implemented
- No login page, no route guards, no session management
- User identity is hardcoded: `Nguyễn Văn Chủ` (Admin/Chủ nhà)
- Sidebar and Topbar show static user info
- Future: JWT-based auth with roles (Admin, Manager, Staff)

---

## Recommended Backend Build Order

1. **Auth** — JWT login, user roles
2. **Rooms** — CRUD, status management, block/floor structure
3. **Tenants** — CRUD, debt tracking
4. **Contracts** — CRUD, renewal, termination, expiry scanning
5. **Expenses** — CRUD, payment status, category filtering
6. **Reports** — Aggregation endpoints (revenue, occupancy, debt trends)
7. **Posts** — CRUD, scheduling, channel management
8. **Notifications** — Real-time alerts for contracts/payments
9. **Agent + Automations** — LLM integration, scheduler, workflow engine

---

## Detailed Documentation

See [`docs/frontend-business-spec.md`](docs/frontend-business-spec.md) for:
- Module-by-module business logic
- All data model field definitions
- Frontend-to-backend API mapping
- Screen-to-entity dependency map
- AI backend handoff instructions