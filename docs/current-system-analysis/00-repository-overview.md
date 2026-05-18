# Repository Overview — MotelManage

MotelManage is a Vietnamese property management system designed for motel and boarding-house operators. This document provides a high-level snapshot of the monorepo structure, technology choices, module inventory, and current implementation status. It is intended as the entry point for anyone picking up backend development: the frontend is fully operational with mock data; the backend has not yet been written.

---

## 1. Top-level Repository Structure

```
motelmanage/
├── backend/          # EMPTY — no implementation
├── docs/
│   ├── frontend-business-spec.md
│   ├── backend-build-plan.md
│   └── current-system-analysis/   # this folder
└── frontend/         # Next.js 15 application
```

---

## 2. Frontend Tech Stack

| Category | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 15.1.11 | App Router, file-based routing |
| Language | TypeScript | ^5 | Strict mode enabled |
| Styling | Tailwind CSS | 3.4.6 | Custom CSS vars, @tailwindcss/typography |
| Icons | @heroicons/react | ^2.2.0 | Used across the app |
| Icons | lucide-react | ^0.577.0 | Supplementary icon set |
| Charts | Recharts | ^2.15.2 | Used in reports and dashboard |
| Forms | react-hook-form | ^7.71.2 | Form validation and state |
| HTTP Client | axios | ^1.7.9 | Installed but **never called** — all data is mocked |
| Toasts | sonner | ^2.0.7 | Notification toasts |
| State | React useState / useMemo | — | No global state manager (no Redux/Zustand) |
| Routing | Next.js App Router | — | File-based, `src/app/` directory |
| Fonts | DM Sans / JetBrains Mono | — | Loaded via Tailwind config |

---

## 3. Backend Planned Tech Stack

**[PLANNED — NOT IMPLEMENTED]**

| Category | Technology | Rationale |
|---|---|---|
| Language | Python 3.12 | Modern async support, type hints |
| Framework | FastAPI | High performance, OpenAPI generation, async-native |
| Database | PostgreSQL via Supabase | Managed hosting, row-level security ready |
| ORM | SQLAlchemy 2.x async | Async session support, declarative models |
| Migrations | Alembic | Schema versioning with SQLAlchemy integration |
| Validation | Pydantic v2 | DTO validation, OpenAPI schema generation |
| Auth | python-jose JWT + passlib bcrypt | JWT access/refresh tokens, password hashing |
| Scheduler | APScheduler AsyncIOScheduler | Background tasks, recurring jobs (e.g. rent reminders) |
| LLM | anthropic SDK + openai fallback | Agent module — AI chat and automation |
| File Storage | supabase-py | Room photos, contract attachments, export files |
| Excel | openpyxl | Export reports to .xlsx |
| PDF | WeasyPrint | Export reports and contracts to PDF |
| HTTP Client | httpx | Async HTTP for external service calls |
| Testing | pytest + pytest-asyncio | Unit and integration tests |

---

## 4. Main Modules

| Module | Description |
|---|---|
| **auth** | Login, JWT token issuance and refresh, role-based access control (admin-first, multi-role ready) |
| **rooms** | Room inventory — floor/unit management, status tracking (available, occupied, maintenance), pricing |
| **tenants** | Tenant profiles, contact info, identification documents, tenancy history |
| **contracts** | Lease agreements linking rooms to tenants, rent/deposit terms, start/end dates, renewal and termination |
| **expenses** | Operational cost tracking — categories, receipts, monthly summaries |
| **reports** | Aggregated financial and occupancy reports — revenue, vacancy rate, expense breakdowns, date-range filters |
| **posts** | Listing advertisements for vacant rooms; includes lead capture and chat/messaging with prospective tenants |
| **agent** | AI-powered assistant — chat interface, automation rules, alert triggers, task history (separate concerns) |
| **notifications** | In-app and push notifications — rent due reminders, contract expiry alerts, new lead alerts |
| **dashboard** | Summary overview — key metrics, recent activity, occupancy snapshot (aggregates data from all modules) |

---

## 5. Important Config Files

| File | Purpose / Key Details |
|---|---|
| `frontend/package.json` | NPM dependencies and scripts; `dev` script runs on **port 4028** |
| `frontend/tsconfig.json` | TypeScript config; path alias `@/*` maps to `./src/*` |
| `frontend/next.config.mjs` | Redirects `/` → `/dashboard`; TypeScript errors **ignored** in build; ESLint **ignored** in build |
| `frontend/tailwind.config.js` | Custom colors via CSS variables; DM Sans font family; custom animations; includes `@tailwindcss/typography` plugin |

---

## 6. Frontend Entry Points

| Concern | Location | Details |
|---|---|---|
| Root layout | `frontend/src/app/layout.tsx` | Sets `html lang="vi"`, global metadata, body font classes |
| Default route | `/` | Redirects to `/dashboard` via `next.config.mjs` redirect rule |
| App shell | `frontend/src/components/AppLayout.tsx` | Persistent sidebar + topbar wrapper shared by all authenticated pages |

---

## 7. Backend Entry Point

**[PLANNED — NOT IMPLEMENTED]**

| Concern | Planned Location | Details |
|---|---|---|
| Application factory | `backend/app/main.py` | FastAPI app instance, CORS middleware, lifespan hooks (DB connection, scheduler start/stop) |

---

## 8. Current Implementation Status

| Layer | Status | Notes |
|---|---|---|
| Frontend | ✅ Implemented | All 8 feature modules complete; all data is mocked locally |
| Backend | ❌ Not Implemented | Directory exists but is entirely empty |
| Authentication | ❌ Not Implemented | No login page, no route guards; user identity is hardcoded in the frontend |
| Database | ❌ Not Implemented | Schema designed in `docs/backend-build-plan.md`; no tables created |
| API | ❌ Not Implemented | `axios` is installed in `package.json` but is never imported or called anywhere |

---

## 9. Route Map

| Route | Page File | Status |
|---|---|---|
| `/dashboard` | `frontend/src/app/dashboard/page.tsx` | ✅ Implemented |
| `/room-management` | `frontend/src/app/room-management/page.tsx` | ✅ Implemented |
| `/contract-management` | `frontend/src/app/contract-management/page.tsx` | ✅ Implemented |
| `/tenant-management` | `frontend/src/app/tenant-management/page.tsx` | ✅ Implemented |
| `/post-management` | `frontend/src/app/post-management/page.tsx` | ✅ Implemented |
| `/expenses` | `frontend/src/app/expenses/page.tsx` | ✅ Implemented |
| `/reports` | `frontend/src/app/reports/page.tsx` | ✅ Implemented |
| `/agent` | `frontend/src/app/agent/page.tsx` | ✅ Implemented |
| `/settings` | — | ❌ Missing page file (link exists in sidebar) |
| `/profile` | — | ❌ Missing page file (link in topbar user menu) |
| `/login` | — | ❌ Not implemented (no auth flow) |

---

*Last updated: 2026-05-18*
