# Phase 4 — Module B: Dashboard + Activity Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement `GET /api/dashboard/stats`, `GET /api/dashboard/activity`, and a cross-cutting `ActivityService.log_event()` wired into all mutating operations.

**Architecture:** Two sub-modules. `activity` owns the `activity_log` table and exposes `log_event()` as a utility called by other services. `dashboard` is a read-only aggregation module with no own tables — it queries rooms, contracts, expenses, tenants, and activity_log. Dashboard stats reuse ReportsRepository helpers.

**Tech Stack:** FastAPI, SQLAlchemy 2.x async, Pydantic v2, Alembic for migration.

---

## File Map

| Action | Path |
|--------|------|
| Create | `docs/api-contracts/dashboard.md` |
| Create | `backend/alembic/versions/0008_create_activity_log.py` |
| Create | `backend/app/modules/activity/__init__.py` |
| Create | `backend/app/modules/activity/models.py` |
| Create | `backend/app/modules/activity/schemas.py` |
| Create | `backend/app/modules/activity/repository.py` |
| Create | `backend/app/modules/activity/service.py` |
| Create | `backend/app/modules/dashboard/__init__.py` |
| Create | `backend/app/modules/dashboard/schemas.py` |
| Create | `backend/app/modules/dashboard/service.py` |
| Create | `backend/app/modules/dashboard/router.py` |
| Modify | `backend/app/main.py` |
| Modify | `backend/app/modules/rooms/service.py` |
| Modify | `backend/app/modules/contracts/service.py` |
| Modify | `backend/app/modules/tenants/service.py` |
| Modify | `backend/app/modules/expenses/service.py` |
| Modify | `backend/app/modules/posts/service.py` |
| Modify | `backend/tests/conftest.py` |
| Create | `backend/tests/modules/test_dashboard.py` |

---

## Tasks

### Task 1: API Contract
### Task 2: Alembic migration + ActivityLog model
### Task 3: Activity repository + service
### Task 4: Dashboard schemas + service + router
### Task 5: Wire log_event into existing services
### Task 6: Tests + full suite
### Task 7: Commit + push notes
