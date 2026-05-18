# Open Questions: MotelManage System

## Overview

This document captures unresolved questions and ambiguities in the MotelManage system that must be clarified before or during backend implementation. Questions are organized by audience (Business Analysts, Backend Developers, Frontend Developers, QA, DevOps) and marked as blocking or non-blocking.

---

## Section 1: Business Analyst Questions

### Q-BA-001: Contract Termination Data Capture

**Question:** When terminating a contract, should `terminationReason` and `terminationDate` be captured as structured form input?

**Context:** The frontend's `TerminateContractModal` (in `frontend/src/features/contracts/modals/TerminateContractModal.tsx`) currently has no input fields for termination reason or date. However, the backend build plan (`docs/backend-build-plan.md`) includes both fields in the contract schema. This creates a mismatch between what the FE collects and what the BE expects to store.

**Blocking?** Yes — BE cannot design the contract termination endpoint without knowing whether to require these fields.

**Owner:** BA / BE Dev

---

### Q-BA-002: "End Rental" Semantics on Tenant Screen

**Question:** What should the "End Rental" (Kết thúc thuê) button on the Tenant detail screen actually do?

**Context:** The button exists in `frontend/src/features/tenants/modals/TenantDetailModal.tsx` but its handler is empty. Should it:
- Terminate the associated contract?
- Set the tenant status to `Đã trả phòng` (vacated)?
- Do both?
- Trigger a checkout workflow?

**Blocking?** Yes — This is core tenant lifecycle functionality.

**Owner:** BA

---

### Q-BA-003: Multiple Concurrent Contracts Per Tenant

**Question:** Can a single tenant have multiple concurrent active contracts in different rooms?

**Context:** The data model supports a many-to-many tenant-contract relationship, but business rules are unclear. Is this a legitimate scenario (e.g., a family renting multiple adjacent rooms) or an error state?

**Blocking?** Yes — Affects contract termination logic, tenant status rules, and reporting.

**Owner:** BA

---

### Q-BA-004: Billing Cycle Definition and Variation

**Question:** What values can the `billingCycle` field on contracts take (monthly, bi-monthly, quarterly), and why is it present if mock data shows no variation?

**Context:** The contract schema includes `billingCycle` as a field, but all mock contracts in `frontend/src/features/contracts/mockData.ts` use the same value. Either this is unused, or test data does not reflect production scenarios.

**Blocking?** No — Affects only invoice/billing module design.

**Owner:** BA

---

### Q-BA-005: Contract Status Rules

**Question:** What are the exact business rules for contract statuses, specifically the distinction between "Sắp hết hạn" (expiring soon) vs "Đang hiệu lực" (active)?

**Context:** The frontend defines these statuses in `frontend/src/types/contract.ts`, but the threshold is assumed to be `daysUntilExpiry ≤ 30`. Is this the correct rule? Are there other status transitions (e.g., "Pending", "Terminated") that must be handled?

**Blocking?** No — Clarifies reporting and notification rules.

**Owner:** BA

---

## Section 2: Backend Developer Questions

### Q-BE-001: Canonical ExpenseCategory Enum

**Question:** Which ExpenseCategory enum should be the source of truth?

**Context:** Two conflicting definitions exist:
- `mockData.ts` uses: `['Bảo trì', 'Điện', 'Nước', 'Internet', 'Vệ sinh', 'Lương', 'Khác']`
- `expenses/types.ts` uses: `['Điện nước', 'Internet', 'Vệ sinh', 'Sửa chữa', 'Mua sắm', 'Lương / quản lý', 'Chi phí khác']`

The BE implementation must pick one canonical list or define a migration strategy if they differ intentionally.

**Blocking?** Yes — BE cannot implement the expense module without a single source of truth.

**Owner:** BA / BE Dev

---

### Q-BE-002: Atomic Contract Renewal

**Question:** Should `POST /api/contracts/:id/renew` be an atomic transaction that updates both the old contract (status = terminated) and creates a new contract in one operation?

**Context:** The FE mock implementation in `ContractDetailModal.tsx` performs this as a single logical operation, suggesting it should be atomic from the BE perspective to maintain consistency.

**Blocking?** Yes — Affects transaction design and API contract.

**Owner:** BE Dev

---

### Q-BE-003: JWT Authentication Strategy

**Question:** Should the backend use access tokens only, or an access+refresh token pair?

**Context:** No authentication details are documented in the backend build plan. Clarifying this affects session management, token expiry, and refresh logic.

**Blocking?** Yes — Blocks auth middleware design.

**Owner:** BE Dev / DevOps

---

### Q-BE-004: Activity Log Retention Policy

**Question:** What is the retention policy for entries in the `activity_log` table?

**Context:** The backend plan includes an activity_log module for auditing, but does not specify how long logs should be retained. Relevant for data cleanup, archiving, and compliance.

**Blocking?** No — Affects long-term operational procedures.

**Owner:** BE Dev / DevOps

---

### Q-BE-005: Reports Module Aggregation Strategy

**Question:** Does the `reports` module require pre-computed aggregation tables, or is real-time aggregation acceptable for MVP?

**Context:** The backend plan mentions a reports module but does not specify whether analytics queries should be served from materialized views / cache or computed on-demand.

**Blocking?** No — Affects performance and data warehouse architecture post-MVP.

**Owner:** BE Dev

---

## Section 3: Frontend Developer Questions

### Q-FE-001: Sidebar Badge Counts

**Question:** Should the hardcoded sidebar badge counts (5, 4, 2) be replaced with live API values? What do they represent?

**Context:** In `frontend/src/components/layout/Sidebar.tsx`, badge counts are hardcoded. They may represent expiring contracts, unread notifications, or pending tasks, but the semantics are undefined.

**Blocking?** No — Affects UX polish and API integration scope.

**Owner:** FE Dev

---

### Q-FE-002: Workflow Template Pre-filling

**Question:** When the "Dùng mẫu này" (Use this template) button is clicked in `WorkflowTemplatesSection`, should the `AutomationFormModal` be pre-filled with template fields?

**Context:** The button currently opens the modal but does not pass template data, so the form starts blank. This seems like an incomplete implementation.

**Blocking?** No — Affects UX quality.

**Owner:** FE Dev / BA

---

### Q-FE-003: HTTP Client Strategy for API Integration

**Question:** When integrating real APIs, should the frontend use React Query, SWR, or raw fetch?

**Context:** `axios` is installed but never used; all current data is mocked. Clarifying this early prevents rework when transitioning to real APIs.

**Blocking?** No — Affects code quality and maintainability during integration.

**Owner:** FE Dev

---

### Q-FE-004: Payment History Data Model

**Question:** What is the real data model for tenant payment records?

**Context:** The Tenant detail modal in `TenantDetailModal.tsx` hardcodes a payment history with 3 records and a fixed `total_paid` value. When integrated with the BE, what fields should payment records contain? (date, amount, method, status, reference?)

**Blocking?** No — Affects payment history view implementation.

**Owner:** FE Dev / BE Dev

---

### Q-FE-005: Export and Print Implementation Location

**Question:** Should Export Excel / Print actions be handled client-side or server-side?

**Context:** Buttons for exporting and printing exist (e.g., in reports and tenant lists) but have empty handlers. Clarify whether the BE should generate reports or the FE should construct them from API data.

**Blocking?** No — Affects feature scope and performance.

**Owner:** FE Dev / BE Dev

---

## Section 4: QA Questions

### Q-QA-001: Test Database Environment

**Question:** What test environment will be used: a real PostgreSQL instance, SQLite in-memory, or containerized database?

**Context:** No test infrastructure is documented. This affects test setup, teardown, and CI/CD pipeline design.

**Blocking?** Yes — Blocks test automation setup.

**Owner:** QA / DevOps

---

### Q-QA-002: Test Data Seeding Strategy

**Question:** Is there a seed script for the test database, or must tests create all their own data fixtures?

**Context:** Necessary to determine how to set up repeatable test conditions.

**Blocking?** Yes — Blocks integration test design.

**Owner:** QA / BE Dev

---

### Q-QA-003: Agent Module Testing

**Question:** Should integration tests use the actual Anthropic API for the agent module, or a mock?

**Context:** The backend plan includes an agent module (presumably using Anthropic APIs). Using real APIs in tests introduces cost and latency; mocking avoids this.

**Blocking?** No — Affects test cost and execution time.

**Owner:** QA / BE Dev

---

### Q-QA-004: Performance SLAs

**Question:** Are there performance SLAs that integration tests should verify (e.g., "GET /api/rooms must return in < 200ms")?

**Context:** Without defined SLAs, performance tests lack clear pass/fail criteria.

**Blocking?** No — Affects non-functional testing.

**Owner:** QA / BE Dev

---

## Section 5: DevOps / Deployment Questions

### Q-DO-001: Backend Hosting Plan

**Question:** Where will the backend be hosted: local VPS, cloud function (Lambda/Cloud Run), or Docker container?

**Context:** No deployment target is documented. This affects database connectivity, scaling strategy, and CI/CD design.

**Blocking?** Yes — Blocks infrastructure planning.

**Owner:** DevOps / BE Dev

---

### Q-DO-002: Database Hosting Strategy

**Question:** What is the database hosting plan: managed service (Supabase), self-hosted PostgreSQL, or SQLite for MVP?

**Context:** This affects setup complexity, scalability, and cost. SQLite is simpler for MVP but unsuitable for production.

**Blocking?** Yes — Blocks infrastructure planning.

**Owner:** DevOps / BA

---

### Q-DO-003: CI/CD Pipeline

**Question:** Is there a CI/CD pipeline planned? Currently, no `.github/workflows/` directory exists.

**Context:** Necessary for automated testing and deployment. Current setup assumes manual deployments.

**Blocking?** No — Affects development velocity post-MVP.

**Owner:** DevOps

---

### Q-DO-004: CORS Policy

**Question:** What is the CORS policy: same-origin deployment, or will the frontend and backend be on different domains/origins?

**Context:** Affects authentication, cookie policies, and API security configuration.

**Blocking?** Yes — Blocks API configuration.

**Owner:** DevOps / BE Dev

---

## Summary Table

| ID | Question | Owner | Section | Blocking? |
|---|---|---|---|---|
| Q-BA-001 | Contract termination data capture | BA / BE Dev | Business Analyst | Yes |
| Q-BA-002 | "End Rental" semantics | BA | Business Analyst | Yes |
| Q-BA-003 | Multiple concurrent contracts per tenant | BA | Business Analyst | Yes |
| Q-BA-004 | Billing cycle definition | BA | Business Analyst | No |
| Q-BA-005 | Contract status rules | BA | Business Analyst | No |
| Q-BE-001 | Canonical ExpenseCategory enum | BA / BE Dev | Backend Developer | Yes |
| Q-BE-002 | Atomic contract renewal | BE Dev | Backend Developer | Yes |
| Q-BE-003 | JWT authentication strategy | BE Dev / DevOps | Backend Developer | Yes |
| Q-BE-004 | Activity log retention | BE Dev / DevOps | Backend Developer | No |
| Q-BE-005 | Reports aggregation strategy | BE Dev | Backend Developer | No |
| Q-FE-001 | Sidebar badge counts | FE Dev | Frontend Developer | No |
| Q-FE-002 | Workflow template pre-filling | FE Dev / BA | Frontend Developer | No |
| Q-FE-003 | HTTP client strategy | FE Dev | Frontend Developer | No |
| Q-FE-004 | Payment history data model | FE Dev / BE Dev | Frontend Developer | No |
| Q-FE-005 | Export/print implementation | FE Dev / BE Dev | Frontend Developer | No |
| Q-QA-001 | Test database environment | QA / DevOps | QA | Yes |
| Q-QA-002 | Test data seeding | QA / BE Dev | QA | Yes |
| Q-QA-003 | Agent module testing | QA / BE Dev | QA | No |
| Q-QA-004 | Performance SLAs | QA / BE Dev | QA | No |
| Q-DO-001 | Backend hosting plan | DevOps / BE Dev | DevOps | Yes |
| Q-DO-002 | Database hosting | DevOps / BA | DevOps | Yes |
| Q-DO-003 | CI/CD pipeline | DevOps | DevOps | No |
| Q-DO-004 | CORS policy | DevOps / BE Dev | DevOps | Yes |

---

## Next Steps

1. **Prioritize Blocking Questions:** Address all questions marked as "Blocking? Yes" before backend development begins.
2. **BA Sign-off:** Business Analysts should clarify Q-BA-001 through Q-BA-005 to ensure feature alignment.
3. **Infrastructure Planning:** DevOps should answer Q-DO-001, Q-DO-002, and Q-DO-004 to finalize the deployment architecture.
4. **API Contract:** Once blocking questions are answered, use `design-api-contract` skill to document backend endpoints.
5. **Periodic Review:** Revisit this document during sprint planning; move resolved questions to a "Resolved" archive.

---

**Document version:** 1.0  
**Last updated:** 2026-05-18  
**Status:** In Review
