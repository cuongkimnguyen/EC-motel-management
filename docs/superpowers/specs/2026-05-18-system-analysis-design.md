# System Analysis Design — MotelManage Current State Documentation

**Date:** 2026-05-18  
**Author:** Claude Code (Senior Software Analyst + Solution Architect + QA Engineer role)  
**Objective:** Analyze the existing codebase and produce complete "Current System Feature Documentation" — 9 structured markdown files under `docs/current-system-analysis/`

---

## Context

The MotelManage monorepo currently contains:

| Layer | Status |
|---|---|
| `frontend/` | ✅ Fully implemented — Next.js 15, TypeScript, Tailwind CSS, mock data, no real API calls |
| `backend/` | ❌ Empty directory — 0 files |
| `docs/frontend-business-spec.md` | ✅ Complete frontend business specification |
| `docs/backend-build-plan.md` | ✅ Architecture blueprint (FastAPI/Python) — no code generated yet |

**Key implication:** The "backend analysis" document (doc 03) is entirely based on the backend build plan, not implemented code. Every backend feature is marked `Planned (not implemented)`.

---

## Analysis Approach

**Option A selected:** Frontend-only analysis + full gap report. Document what the frontend currently implements, then declare the entire backend layer as a gap, and map each frontend action to the *planned* API from `backend-build-plan.md`.

**Execution strategy:** Parallel agent dispatch (7 agents), then synthesis pass.

---

## Agent Dispatch Map

| Agent | Files Covered | Output Feeds Into |
|---|---|---|
| Agent A — Core & Shared | `mockData.ts`, `AppLayout`, `Sidebar`, `Topbar`, `layout.tsx`, `not-found.tsx`, `package.json`, `tsconfig.json` | docs 00, 02, 05 |
| Agent B — Rooms | `room-management/page.tsx`, all 6 room components | docs 01, 02, 04, 06 |
| Agent C — Contracts + Tenants | `contract-management/` (6 components + page), `tenant-management/page.tsx` | docs 01, 02, 04, 06 |
| Agent D — Expenses | `expenses/` (page, service, types, mock, 6 components) | docs 01, 02, 04, 05, 06 |
| Agent E — Posts + Reports | `post-management/page.tsx`, `reports/` (page, service, types, mock, 11 components) | docs 01, 02, 04, 06 |
| Agent F — Agent Module | `agent/` (page, service, types, mock, 9 components) | docs 01, 02, 04, 06 |
| Agent G — Backend Plan | `docs/backend-build-plan.md`, `docs/frontend-business-spec.md` §7 API mapping | docs 03, 04, 05, 06, 07, 08 |

---

## Synthesis Pass

After all 7 agents complete, a synthesis step writes the 9 output documents:

| Doc | Title | Primary Sources |
|---|---|---|
| `00-repository-overview.md` | Repository Overview | Agent A + G |
| `01-feature-inventory.md` | Feature Inventory Table | Agents B–F merged |
| `02-frontend-analysis.md` | Frontend Analysis | All module agents |
| `03-backend-analysis.md` | Backend Analysis | Agent G only (plan doc) |
| `04-fe-be-mapping.md` | FE → BE Mapping Table | FE agents + Agent G |
| `05-business-rules.md` | Business Rules | All agents |
| `06-gap-analysis.md` | Gap Analysis | All agents |
| `07-integration-test-candidates.md` | Integration Test Candidates | All agents |
| `08-open-questions.md` | Open Questions | All agents |

---

## Confidence Labeling Convention

| Level | Meaning |
|---|---|
| **High** | Confirmed in FE code + spec doc + backend plan all agree |
| **Medium** | Confirmed by FE code + spec, backend plan is silent |
| **Low** | Only visible in FE code, not mentioned in any doc |

Backend implementation status: `Planned (not implemented)` for all backend entries.

---

## Known Pre-Analysis Findings

### Enum Mismatch (pre-spotted)
- `src/lib/mockData.ts` exports `ExpenseCategory`: `'Bảo trì' | 'Điện' | 'Nước' | 'Internet' | 'Vệ sinh' | 'Lương' | 'Khác'`
- `src/app/expenses/types.ts` exports `ExpenseCategory`: `'Điện nước' | 'Internet' | 'Vệ sinh' | 'Sửa chữa' | 'Mua sắm' | 'Lương / quản lý' | 'Chi phí khác'`
- These two sets conflict — will be documented as a **data model mismatch gap** in `06-gap-analysis.md`

### No Authentication
- No `/login` page exists, no route guards, user identity hardcoded as `Nguyễn Văn Chủ`
- All routes are publicly accessible

### No Real HTTP Calls
- `axios` is installed but never called — all data uses in-memory mock stores
- All service files contain `// Backend integration point:` comments marking replacement points

---

## Deliverables

Output directory: `docs/current-system-analysis/`

All 9 files must:
- Use GitHub-flavored markdown with clear tables
- Trace every feature to source files with line-level evidence where meaningful
- Mark confidence level (High / Medium / Low)
- Separate "documented behavior" from "expected behavior"
- Separate "implemented feature" from "intended feature"
- Highlight integration risks clearly

---

## Out of Scope

- No source code modifications
- No refactoring
- No new backend implementation
- No hallucinated business rules not visible in code or docs
