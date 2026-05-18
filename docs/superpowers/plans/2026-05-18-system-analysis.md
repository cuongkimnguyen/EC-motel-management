# Current System Analysis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Analyze the MotelManage frontend codebase and planning docs, then produce 9 structured markdown documents under `docs/current-system-analysis/` that form a complete "Current System Feature Documentation."

**Architecture:** Dispatch 7 specialized read-only analysis agents in parallel (Agents A–G), each deeply analyzing their assigned files. A synthesis pass then writes all 9 output documents using the collected findings. No source code is modified at any step.

**Tech Stack:** Read-only analysis only. Output: GitHub-flavored Markdown. Source: Next.js 15 / TypeScript frontend (mock data), FastAPI backend plan doc (no code exists).

---

## Key Facts Every Agent Must Know

- `backend/` is **completely empty** — 0 files. No backend is implemented.
- `docs/backend-build-plan.md` is a **blueprint only** — architecture spec, DB schema, module design, no generated code.
- All frontend data is served from **in-memory mock stores** (`mockData.ts`, `mockExpenses.ts`, `mockReportData.ts`, `mockAgentData.ts`).
- `axios` is installed but **never called** anywhere in the frontend.
- Every service file contains `// Backend integration point:` comments marking where real API calls should replace mock logic.
- Known pre-spotted issue: **ExpenseCategory enum mismatch** between `src/lib/mockData.ts` and `src/app/expenses/types.ts` — document as data model gap.
- No authentication is implemented. No `/login` page. All routes are publicly accessible. User identity hardcoded as `Nguyễn Văn Chủ`.

---

## Output Directory

All 9 files go to: `docs/current-system-analysis/`

---

## Task 1: Create Output Directory

**Files:**
- Create: `docs/current-system-analysis/` (directory only)

- [ ] **Step 1: Create the output directory**

```bash
mkdir -p /Users/nguyenkimcuong/Workspace/src/motelmanage/docs/current-system-analysis
```

Expected: directory created with no output.

- [ ] **Step 2: Verify**

```bash
ls /Users/nguyenkimcuong/Workspace/src/motelmanage/docs/current-system-analysis
```

Expected: empty directory (no error).

---

## Task 2: Dispatch Parallel Analysis Agents (A–G)

**Files:** Read-only. Agents produce findings used in Tasks 3–11.

Dispatch all 7 agents simultaneously. Each agent must read its assigned files thoroughly and return structured findings in the format specified.

### Agent A — Core & Shared

**Assigned files:**
- `frontend/src/lib/mockData.ts`
- `frontend/src/components/AppLayout.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/Topbar.tsx`
- `frontend/src/components/FacebookChatPopup.tsx`
- `frontend/src/components/ui/Modal.tsx`
- `frontend/src/components/ui/StatusBadge.tsx`
- `frontend/src/components/ui/LoadingSkeleton.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/not-found.tsx`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/next.config.mjs` (if exists)
- `frontend/tailwind.config.js` (if exists)

**Return findings covering:**
1. Full dependency list with versions (from package.json)
2. All TypeScript interfaces/types defined in mockData.ts (Room, Tenant, Contract, FacebookPost, ChatConversation, Notification, etc.) — include every field, type, and whether it's optional
3. All navigation items in Sidebar (label, href, badge values, group)
4. App layout structure (sidebar + topbar + content areas)
5. Topbar features (search, notifications bell, user menu, hardcoded user identity)
6. FacebookChatPopup behavior (what it does, is it functional or mock)
7. Root layout metadata, html lang, body classes
8. All mock data exported from mockData.ts (mockRooms count, mockTenants count, mockContracts count, mockPosts count, mockConversations count, mockNotifications count, mockRevenueData)
9. All helper functions exported from mockData.ts
10. All shared type enums (RoomStatus, ContractStatus, PostStatus, ExpenseCategory in mockData.ts, TenantStatus, LeadStatus)
11. Note the ExpenseCategory enum in mockData.ts vs expenses/types.ts discrepancy
12. Routes registered in the sidebar vs routes that actually have page files

### Agent B — Room Management

**Assigned files:**
- `frontend/src/app/room-management/page.tsx`
- `frontend/src/app/room-management/components/RoomFilters.tsx`
- `frontend/src/app/room-management/components/RoomTable.tsx`
- `frontend/src/app/room-management/components/RoomCardGrid.tsx`
- `frontend/src/app/room-management/components/RoomFormModal.tsx`
- `frontend/src/app/room-management/components/DeleteRoomModal.tsx`
- `frontend/src/app/room-management/components/BulkActionBar.tsx`

**Return findings covering:**
1. All state variables in page.tsx (name, type, initial value)
2. All filter fields and how filtering logic works (which fields are filtered, filter operators)
3. Stats computed (total, vacant, occupied, maintenance, noPost) — exact computation
4. handleSaveRoom logic (create vs edit path, generated fields)
5. handleDeleteRoom logic
6. handleBulkDelete logic
7. handleBulkStatusChange logic
8. RoomFormModal: all form fields, required/optional, validation rules (if any client-side)
9. RoomTable: columns rendered, row actions available, checkbox behavior
10. RoomCardGrid: card fields displayed
11. BulkActionBar: what actions are available (delete, status options listed)
12. DeleteRoomModal: what it shows (confirmation text, room info)
13. Vacant-rooms-without-posts alert: exact condition and UI behavior
14. View toggle (table/card) — how it works
15. Backend integration point comments found in this module
16. Any hardcoded values (building options, floor options, status options, price multiplier)

### Agent C — Contracts + Tenants

**Assigned files:**
- `frontend/src/app/contract-management/page.tsx`
- `frontend/src/app/contract-management/components/ContractFilters.tsx`
- `frontend/src/app/contract-management/components/ContractTable.tsx`
- `frontend/src/app/contract-management/components/ContractStatsBar.tsx`
- `frontend/src/app/contract-management/components/ContractFormModal.tsx`
- `frontend/src/app/contract-management/components/ExpiryAlertBanner.tsx`
- `frontend/src/app/contract-management/components/TerminateContractModal.tsx`
- `frontend/src/app/tenant-management/page.tsx`

**Return findings covering (Contracts):**
1. All state variables in contract page.tsx
2. Filter fields and filter logic
3. Stats computation (active, expiring, expired, terminated counts)
4. handleCreateContract — generated fields, code format
5. handleEditContract logic
6. handleRenewContract logic — does it create a new record or mutate? exact state changes
7. handleTerminateContract logic — status set to what value? what fields added?
8. handleDeleteContract (single and bulk)
9. ExpiryAlertBanner: condition for showing (daysUntilExpiry threshold), urgency threshold
10. ContractFormModal: all fields, required/optional, validation rules
11. ContractTable: columns, row actions (Edit, Renew, Terminate, Delete)
12. Print and Export Excel mock behavior (what happens on click)
13. Backend integration point comments

**Return findings covering (Tenants):**
1. All state variables in tenant page.tsx (large inline file)
2. KPI cards computation (total, renting, expiringSoon, debtCases)
3. Filter fields and filter logic
4. Detail modal tabs (5 tabs: names, what each tab shows, fields in each)
5. Tenant form fields (create/edit)
6. All row actions: View detail, Edit, View rental history, Contact, Create contract, End rental, Delete
7. "End rental" logic — what state change occurs
8. Payment tab in detail modal: what data is displayed, where does mock payment history come from
9. Notes tab: read-only or editable
10. Status computation: how is tenant status determined (Đang thuê / Sắp hết hạn / Nợ tiền / Đã trả phòng)
11. Backend integration point comments

### Agent D — Expenses

**Assigned files:**
- `frontend/src/app/expenses/page.tsx`
- `frontend/src/app/expenses/expenseService.ts`
- `frontend/src/app/expenses/types.ts`
- `frontend/src/app/expenses/mockExpenses.ts`
- `frontend/src/app/expenses/components/ExpenseStats.tsx`
- `frontend/src/app/expenses/components/ExpenseFilterBar.tsx`
- `frontend/src/app/expenses/components/ExpenseTable.tsx`
- `frontend/src/app/expenses/components/ExpenseFormModal.tsx`
- `frontend/src/app/expenses/components/ExpenseDetailDrawer.tsx`
- `frontend/src/app/expenses/components/DeleteConfirmDialog.tsx`

**Return findings covering:**
1. Full Expense interface (all fields, types, optional flags)
2. ExpenseFormData interface (all fields)
3. ExpenseFilters interface (all fields)
4. All exported type enums from types.ts (categories, payment statuses, payment methods, BUILDINGS)
5. expenseService.ts: all exported functions, their signatures, logic, delay values
6. generateCode() function — format and uniqueness approach
7. mockExpenses.ts: count of records, range of categories/statuses/buildings used
8. All filter logic in getExpenses() — exact field comparisons
9. page.tsx: all state variables, how it calls service functions
10. ExpenseStats: 4 stat cards — exact computation from data
11. ExpenseFilterBar: all filter inputs, their types, options
12. ExpenseTable: columns, row actions (View, Edit, Mark Paid, Delete)
13. ExpenseFormModal: all fields, required/optional, validation (HTML5 or JS), isRecurring checkbox
14. ExpenseDetailDrawer: all fields shown, structure
15. DeleteConfirmDialog: what it displays
16. markExpensePaid: exact state change, what fields are updated
17. Backend integration point comments
18. BUILDINGS constant includes 'Khu D' — is this used anywhere else or only here?

### Agent E — Posts + Reports

**Assigned files:**
- `frontend/src/app/post-management/page.tsx`
- `frontend/src/app/reports/page.tsx`
- `frontend/src/app/reports/reportService.ts`
- `frontend/src/app/reports/types.ts`
- `frontend/src/app/reports/mockReportData.ts`
- `frontend/src/app/reports/components/ReportHeader.tsx`
- `frontend/src/app/reports/components/ReportFilterBar.tsx`
- `frontend/src/app/reports/components/ReportKpiCards.tsx`
- `frontend/src/app/reports/components/RevenueExpenseChart.tsx`
- `frontend/src/app/reports/components/ExpenseBreakdownChart.tsx`
- `frontend/src/app/reports/components/OccupancyChart.tsx`
- `frontend/src/app/reports/components/DebtTrendChart.tsx`
- `frontend/src/app/reports/components/RoomOperationSection.tsx`
- `frontend/src/app/reports/components/ContractSummarySection.tsx`
- `frontend/src/app/reports/components/FinancialSummarySection.tsx`
- `frontend/src/app/reports/components/TenantDebtTable.tsx`
- `frontend/src/app/reports/components/ReportStates.tsx`

**Return findings covering (Posts):**
1. All state variables in post-management/page.tsx
2. FacebookPost interface fields (from this file or imported)
3. ChatConversation interface fields
4. All post actions: Create, Edit, Duplicate, Post Now, Schedule, Delete — exact state changes per action
5. Filter fields and filter logic
6. KPI cards: exact computations (total, published, scheduled, draft+error, totalViews, totalLeads, conversionRate formula)
7. View toggle (table/card)
8. Analytics charts present (which chart types, what data)
9. Chat/Leads panel: what it shows, lead status update flow
10. Post form: all fields, required/optional, live preview behavior
11. Duplicate logic: which fields are copied, what changes
12. Schedule logic: what field is set, status change
13. "Post now" logic: what status/fields change
14. Row actions in table view vs card view
15. Backend integration point comments

**Return findings covering (Reports):**
1. All TypeScript interfaces in reports/types.ts
2. ReportFilters shape (all fields, types, defaults)
3. reportService.ts: all exported functions, what they do, delay values
4. mockReportData.ts: shape of mock data returned
5. All KPI cards shown and their field names
6. All 4 charts: type (bar/line/pie), X-axis, Y-axis, data field names
7. RoomOperationSection: fields shown
8. ContractSummarySection: fields shown, including expiring contract list
9. FinancialSummarySection: fields shown (expected rent, collected, uncollected, expense, profit)
10. TenantDebtTable: columns (tenant name, room, billing period, amount due, amount paid, remaining, status)
11. Export Excel/PDF: mock behavior
12. Filter params: periodType options, building options, compareWithPrevious toggle behavior
13. Loading/empty states: what ReportStates.tsx renders
14. Backend integration point comments

### Agent F — AI Agent Module

**Assigned files:**
- `frontend/src/app/agent/page.tsx`
- `frontend/src/app/agent/agentService.ts`
- `frontend/src/app/agent/types.ts`
- `frontend/src/app/agent/mockAgentData.ts`
- `frontend/src/app/agent/components/AgentSummaryCards.tsx`
- `frontend/src/app/agent/components/AgentChatPanel.tsx`
- `frontend/src/app/agent/components/QuickActionsPanel.tsx`
- `frontend/src/app/agent/components/AutomationList.tsx`
- `frontend/src/app/agent/components/AutomationFormModal.tsx`
- `frontend/src/app/agent/components/AgentAlertsPanel.tsx`
- `frontend/src/app/agent/components/AgentTaskHistoryTable.tsx`
- `frontend/src/app/agent/components/AgentCapabilitiesSection.tsx`
- `frontend/src/app/agent/components/WorkflowTemplatesSection.tsx`

**Return findings covering:**
1. All TypeScript interfaces from types.ts (complete field lists)
2. agentService.ts: all exported functions and their signatures
3. Chat keyword matching logic — exact keywords and response patterns
4. mockAgentData.ts: count of mock conversations, automations, alerts, task history items, workflow templates
5. Summary cards (6): exact field names displayed and where data comes from
6. AgentChatPanel: input behavior, message rendering, quick prompt chips (list them all)
7. QuickActionsPanel: all 6 action cards (title, description, what happens on click)
8. AutomationList: columns/fields shown, toggle behavior, run button behavior, delete behavior
9. AutomationFormModal: all fields, required/optional, field dependencies (e.g. frequency shows only when triggerType=schedule)
10. AgentAlertsPanel: severity levels, alert card structure, CTA behavior
11. AgentTaskHistoryTable: columns, pagination if any, retry behavior for failed tasks
12. WorkflowTemplatesSection: template card structure, "Use template" action behavior
13. AgentCapabilitiesSection: what 5 capabilities are shown
14. page.tsx layout: two-column layout structure, header actions
15. Backend integration point comments
16. session_id handling: is a session ID generated? where?

### Agent G — Backend Plan & API Mapping

**Assigned files:**
- `docs/backend-build-plan.md` (full file)
- `docs/frontend-business-spec.md` sections: §7 Frontend-to-Backend API Mapping, §11 Recommended Backend Build Order, §12 AI Backend Handoff

**Return findings covering:**
1. Full backend tech stack (language, framework, ORM, auth, scheduler, LLM, storage, testing)
2. Layered architecture: 4 layers, what each does, cross-cutting concerns
3. Planned folder structure (exact paths)
4. All module boundaries with: owned entities, exposed service methods, business rules, dependencies
5. For each module: list every planned endpoint (method, path, request shape, response shape)
6. Database schema: for every table — column names (snake_case), types, constraints, indexes, computed vs stored fields
7. Entity relationships (cardinalities table)
8. Authentication plan: JWT flow, roles (admin/manager/staff), route protection
9. APScheduler jobs planned: which modules, what they do, frequency
10. Phase rollout order (Phases 1–5)
11. Risk list from backend-build-plan.md
12. Enum values from backend plan vs frontend (identify mismatches)
13. Virtual/computed fields that are NOT stored in DB (list them all)
14. Partial unique indexes (e.g., one active contract per room)

- [ ] **Step 1: Dispatch all 7 agents in parallel**

Use the Agent tool with 7 simultaneous calls. Each call uses subagent_type "Explore". Each agent prompt must include:
- The "Key Facts Every Agent Must Know" section above
- The specific files assigned
- The specific findings to return
- Instruction: "This is a read-only analysis. Do not modify any files. Return your findings as structured text with clear section headings."

- [ ] **Step 2: Collect all 7 agent outputs**

Save each agent's findings in memory for use in Tasks 3–11.

---

## Task 3: Write `00-repository-overview.md`

**Files:**
- Create: `docs/current-system-analysis/00-repository-overview.md`

**Sources:** Agent A findings + Agent G findings

- [ ] **Step 1: Define completeness criteria**

This document must contain:
- [ ] Top-level monorepo structure (backend/, frontend/, docs/)
- [ ] Frontend tech stack table (framework, language, styling, icons, charts, forms, HTTP client, state, routing)
- [ ] Backend planned tech stack table (same categories)
- [ ] Main modules list (9 modules: auth, rooms, tenants, contracts, expenses, reports, posts, agent, notifications)
- [ ] Important config files (package.json, tsconfig.json, next.config.mjs, tailwind.config.js)
- [ ] Frontend entry points (app/layout.tsx, app/dashboard/page.tsx as default route)
- [ ] Backend entry point (planned: app/main.py — not yet created)
- [ ] Current implementation status (frontend: fully mock; backend: not implemented)

- [ ] **Step 2: Write the document**

Write `docs/current-system-analysis/00-repository-overview.md` using Agent A and G findings. Use tables for tech stacks. Mark backend as "Planned (not implemented)".

- [ ] **Step 3: Verify completeness**

Check all 8 criteria from Step 1 are present in the written document.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/00-repository-overview.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add repository overview (system analysis)"
```

---

## Task 4: Write `01-feature-inventory.md`

**Files:**
- Create: `docs/current-system-analysis/01-feature-inventory.md`

**Sources:** Agents B, C, D, E, F findings

- [ ] **Step 1: Define completeness criteria**

The feature inventory table must have one row per distinct feature. Minimum rows:
- Dashboard (view KPIs, charts, alerts, activity)
- Room CRUD (create, edit, delete single)
- Room bulk operations (bulk delete, bulk status change)
- Room filter/search
- Room view toggle (table/card)
- Contract CRUD
- Contract renew
- Contract terminate
- Contract filter/search
- Contract export/print (mock)
- Tenant CRUD
- Tenant detail modal (5 tabs)
- Tenant filter/search
- Post CRUD
- Post publish now (mock)
- Post schedule (mock)
- Post duplicate
- Post analytics view
- Chat/Leads management
- Expense CRUD
- Expense mark-as-paid
- Expense filter/search
- Expense export (mock)
- Report view with filters
- Report export Excel/PDF (mock)
- AI Agent chat
- Automation CRUD
- Automation toggle/run
- Workflow templates
- Notifications (topbar bell)

Columns required: Feature ID, Feature Name, User Role/Actor, Frontend Screen/Page, Components Involved, Planned Backend API, Planned DB Tables, Implementation Status, Confidence Level, Evidence Files

- [ ] **Step 2: Write the document**

Write the full feature inventory table. For "Implementation Status" use:
- `FE: Implemented (mock data)` for all frontend features
- `BE: Not implemented` for all backend features

For "Confidence Level" use High/Medium/Low per the spec.

- [ ] **Step 3: Verify completeness**

Check all 30+ feature rows are present with no empty cells in required columns.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/01-feature-inventory.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add feature inventory (system analysis)"
```

---

## Task 5: Write `02-frontend-analysis.md`

**Files:**
- Create: `docs/current-system-analysis/02-frontend-analysis.md`

**Sources:** Agents A, B, C, D, E, F findings

- [ ] **Step 1: Define completeness criteria**

Document must cover per module:
- [ ] Routes/pages (path, component file, 'use client' or server component)
- [ ] Screens description
- [ ] All form fields with types and validation rules
- [ ] All buttons/actions with what they trigger
- [ ] Client-side validation rules (explicit HTML5 required, min, max, or JS guards)
- [ ] API calls (currently: none — all mock service calls)
- [ ] State management approach (useState/useMemo, no global state)
- [ ] Navigation flows (sidebar links, modal triggers, row action navigation)
- [ ] UI behavior notes (loading states, empty states, error toasts)

- [ ] **Step 2: Write the document**

Structure by module: Dashboard, Rooms, Contracts, Tenants, Posts, Expenses, Reports, Agent. Include shared layout section (Sidebar, Topbar, AppLayout).

- [ ] **Step 3: Verify completeness**

Ensure every module section covers all 9 criteria from Step 1. Ensure every form field is listed with validation.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/02-frontend-analysis.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add frontend analysis (system analysis)"
```

---

## Task 6: Write `03-backend-analysis.md`

**Files:**
- Create: `docs/current-system-analysis/03-backend-analysis.md`

**Sources:** Agent G findings only

- [ ] **Step 1: Define completeness criteria**

Document must cover:
- [ ] Clear header: "Backend is NOT implemented — this document describes the planned architecture from `docs/backend-build-plan.md`"
- [ ] Planned tech stack with justifications
- [ ] Planned 4-layer architecture
- [ ] Planned folder structure
- [ ] Per module: planned endpoints table (method, path, request params, response shape), planned business rules, planned DB table(s), computed vs stored fields
- [ ] Planned authentication: JWT flow, roles, route protection
- [ ] Planned APScheduler jobs
- [ ] Planned DB schema (tables, columns, indexes, constraints)
- [ ] Phase rollout order
- [ ] Risk list

- [ ] **Step 2: Write the document**

Begin every section with "**[PLANNED — NOT IMPLEMENTED]**" prefix. Use tables for endpoint listings.

- [ ] **Step 3: Verify completeness**

All modules from the build plan are covered: auth, users, rooms, tenants, contracts, expenses, posts, conversations, reports, notifications, agent, automations, dashboard, activity.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/03-backend-analysis.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add backend analysis (system analysis)"
```

---

## Task 7: Write `04-fe-be-mapping.md`

**Files:**
- Create: `docs/current-system-analysis/04-fe-be-mapping.md`

**Sources:** Agents B, C, D, E, F (FE actions) + Agent G (planned APIs)

- [ ] **Step 1: Define completeness criteria**

Mapping table must have one row per FE action (not per module). Columns:
- Frontend Action
- Frontend File/Component (with line reference if meaningful)
- Mock Service Function Called
- Planned API Endpoint (method + path)
- Planned Backend Controller/Method
- Request Payload (fields)
- Expected Response Payload (fields)
- Success Behavior (what FE does on success)
- Error Behavior (what FE does on failure — if any error handling exists)
- Integration Status (`Gap: BE not implemented`)

- [ ] **Step 2: Write the document**

Write the full mapping table. Every row must have a value in every column. For "Error Behavior", if the current mock code has no error handling, write "No error handling in current mock implementation — integration risk."

- [ ] **Step 3: Verify completeness**

Check that all service function calls from expenseService.ts are mapped (getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense, markExpensePaid). Verify rooms, contracts, tenants, posts, reports, agent actions all have rows.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/04-fe-be-mapping.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add FE-BE mapping (system analysis)"
```

---

## Task 8: Write `05-business-rules.md`

**Files:**
- Create: `docs/current-system-analysis/05-business-rules.md`

**Sources:** All agents

- [ ] **Step 1: Define completeness criteria**

Document must have 4 sections:
1. **Confirmed from spec docs** — rules stated in frontend-business-spec.md or backend-build-plan.md
2. **Confirmed from frontend code** — rules visible in mock service logic or component logic
3. **Inferred from implementation** — rules implied by code behavior, not explicitly documented
4. **Missing/unclear** — rules referenced in UI but not defined in code or docs

Each rule entry must include: rule statement, source file/line evidence, confidence level.

Minimum rules to document:
- One active contract per room at a time
- Contract renew creates new record (old → Đã hết hạn)
- Sắp hết hạn = daysUntilExpiry ≤ 30
- Expiry banner urgency = daysUntilExpiry ≤ 7
- Room code must be unique
- Tenant cccd must be unique
- Expense code format: CP-YYYY-NNN
- Contract code format: HĐ-YYYY-NNN
- All monetary values in VND (integers)
- debt on Tenant is a denormalized balance (not computed from payment records in FE)
- hasActivePost is computed (not stored) — determined by LEFT JOIN in planned BE
- Building options: Khu A, Khu B, Khu C (note: expenses/types.ts adds Khu D)
- Post duplicate: deep copy, new id, status = Nháp
- markExpensePaid only changes paymentStatus field (not paymentMethod or date)

- [ ] **Step 2: Write the document**

- [ ] **Step 3: Verify completeness**

Confirm all 14+ rules from Step 1 are present.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/05-business-rules.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add business rules (system analysis)"
```

---

## Task 9: Write `06-gap-analysis.md`

**Files:**
- Create: `docs/current-system-analysis/06-gap-analysis.md`

**Sources:** All agents

- [ ] **Step 1: Define completeness criteria**

Document must cover these gap categories (with specific instances under each):
1. **Backend Not Implemented** — entire backend is missing; list every planned endpoint that has no implementation
2. **Data Model Mismatches** — ExpenseCategory enum in mockData.ts vs expenses/types.ts; any other field name mismatches between FE types and BE plan (camelCase vs snake_case naming)
3. **Missing Frontend Pages** — /login (not implemented), /settings (link exists, no page)
4. **Authentication Gap** — no auth implemented, no route guards, hardcoded user
5. **Real API Call Gap** — axios installed but unused; all 'Backend integration point:' locations
6. **Mock-Only Features** — Export Excel/PDF, Print contract, Post to Facebook/Zalo, SMS/Zalo notifications, File upload, Email notifications, Real LLM responses, Automation scheduler
7. **Validation Gaps** — form fields with no client-side validation that the BE plan adds server-side
8. **Error Handling Gaps** — places where mock code throws errors but FE has no try/catch
9. **State Persistence Gap** — all data resets on page refresh (no localStorage, no API)
10. **Navigation Gaps** — sidebar badge values are hardcoded (not computed from data)
11. **Settings Page Gap** — link in sidebar, no implementation
12. **Multi-user/Role Gap** — single hardcoded user, no role-based access

- [ ] **Step 2: Write the document**

Use subsections per gap category. Use tables where listing multiple items.

- [ ] **Step 3: Verify completeness**

All 12 gap categories from Step 1 are present with specific evidence.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/06-gap-analysis.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add gap analysis (system analysis)"
```

---

## Task 10: Write `07-integration-test-candidates.md`

**Files:**
- Create: `docs/current-system-analysis/07-integration-test-candidates.md`

**Sources:** All agents

- [ ] **Step 1: Define completeness criteria**

Must include at minimum these test scenarios (one table row per scenario):

Priority P1 (critical path):
- User login → JWT issued → protected route accessible
- Create room → GET /api/rooms returns it with correct shape
- Create tenant → Create contract linking them → contract appears in both room detail and tenant detail
- Contract renew → old contract status = Đã hết hạn, new contract created
- Contract terminate → status = Đã chấm dứt, room becomes Trống
- Create expense → mark as paid → paymentStatus = Đã thanh toán
- GET /api/reports/overview → all KPI fields present and non-null

Priority P2 (important flows):
- Bulk delete rooms → all selected rooms removed
- Bulk status change → all selected rooms updated
- Filter rooms by status/block → only matching rooms returned
- Duplicate post → new post with status = Nháp, same content
- Filter expenses by date range → only expenses in range returned
- Agent chat message → response returned with correct AgentConversationItem shape
- Automation toggle → isEnabled flipped, APScheduler job registered/removed

Columns: Scenario ID, Scenario Name, Priority, Preconditions, Test Data, Steps, Expected Result, Related FE Files, Related Planned BE Endpoints, Risk if Broken

- [ ] **Step 2: Write the document**

- [ ] **Step 3: Verify completeness**

All P1 scenarios (7) and P2 scenarios (7) are present with all columns filled.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/07-integration-test-candidates.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add integration test candidates (system analysis)"
```

---

## Task 11: Write `08-open-questions.md`

**Files:**
- Create: `docs/current-system-analysis/08-open-questions.md`

**Sources:** All agents (gaps, ambiguities, and inferences flagged during analysis)

- [ ] **Step 1: Define completeness criteria**

Must have 5 sections (questions for each stakeholder group):
1. **For BA/Product Owner** — business rule clarifications
2. **For Backend Developer** — implementation decisions implied by the plan
3. **For Frontend Developer** — code behavior ambiguities found during analysis
4. **For QA** — testing coverage and test data questions
5. **For DevOps/Infrastructure** — deployment and integration concerns

Minimum questions to include:
- BA: Is Khu D a real building or a placeholder in expenses/types.ts BUILDINGS constant?
- BA: What is the exact debt recalculation trigger — when does tenant.debt update?
- BA: Are payment records a separate tracked entity or is debt only the running balance?
- BA: Should room status auto-change to Đang thuê when a contract is created?
- BE Dev: How will session_id for AI agent chat be generated — frontend UUID or backend-issued?
- BE Dev: Is the expiry status (Sắp hết hạn) stored in DB or always computed at query time?
- BE Dev: Will APScheduler run in the same process as FastAPI or as a separate worker?
- FE Dev: ExpenseCategory enum in mockData.ts differs from expenses/types.ts — which is authoritative?
- FE Dev: Sidebar badge values (e.g., badge:5 on rooms) are hardcoded — should they be computed from API?
- FE Dev: Facebook Chat Popup — is this a placeholder or intended for real Facebook Messenger integration?
- QA: What test data seed script will be used for integration testing?
- QA: How should Vietnamese string values in status enums be tested across FE/BE boundary?
- DevOps: Will frontend and backend be deployed on the same origin (proxy) or different domains (CORS)?
- DevOps: Which Supabase environment (dev/prod) should be used for local development?

- [ ] **Step 2: Write the document**

- [ ] **Step 3: Verify completeness**

All 5 sections present with minimum questions per section.

- [ ] **Step 4: Commit**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/08-open-questions.md
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: add open questions (system analysis)"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Verify all 9 files exist**

```bash
ls /Users/nguyenkimcuong/Workspace/src/motelmanage/docs/current-system-analysis/
```

Expected output:
```
00-repository-overview.md
01-feature-inventory.md
02-frontend-analysis.md
03-backend-analysis.md
04-fe-be-mapping.md
05-business-rules.md
06-gap-analysis.md
07-integration-test-candidates.md
08-open-questions.md
```

- [ ] **Step 2: Spot-check cross-references**

Verify that the feature IDs in `01-feature-inventory.md` match references in `04-fe-be-mapping.md` and `07-integration-test-candidates.md`.

- [ ] **Step 3: Final commit with summary**

```bash
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage add docs/current-system-analysis/
git -C /Users/nguyenkimcuong/Workspace/src/motelmanage commit -m "docs: complete current system analysis (9 documents)"
```
