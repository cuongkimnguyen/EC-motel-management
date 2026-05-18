# Feature Inventory — MotelManage

This document provides a comprehensive inventory of all features identified in the MotelManage system. Each feature has been traced to its frontend implementation (screen, component, and evidence file), mapped to its planned backend API endpoint and database tables, and assigned a confidence level based on how thoroughly it is corroborated across the codebase, frontend mock data, and project specification documents. At the time of writing, the frontend is fully implemented with mock data and no backend exists.

---

## Feature Inventory Table

| Feature ID | Feature Name | User Role/Actor | Frontend Screen/Page | Key Components | Planned Backend API | Planned DB Tables | Implementation Status | Confidence | Evidence Files |
|---|---|---|---|---|---|---|---|---|---|
| **Dashboard Module** |
| F-001 | Dashboard KPI Overview | Admin | /dashboard | KPIBentoGrid, DashboardHeader | GET /api/dashboard/stats | rooms, contracts, expenses, tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/dashboard/page.tsx |
| F-002 | Revenue vs Expense Chart | Admin | /dashboard | RevenueChart | GET /api/dashboard/stats | contracts, expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/dashboard/components/RevenueChart.tsx |
| F-003 | Occupancy Chart | Admin | /dashboard | OccupancyChart | GET /api/dashboard/stats | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/dashboard/components/OccupancyChart.tsx |
| F-004 | Contract Expiry Alerts | Admin | /dashboard | AlertPanel | GET /api/contracts/expiring?withinDays=30 | contracts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/dashboard/components/AlertPanel.tsx |
| F-005 | Activity Feed | Admin | /dashboard | ActivityFeed | GET /api/dashboard/activity?limit=8 | activity_log | FE: ✅ Mock, BE: ❌ Not implemented | Medium | frontend/src/app/dashboard/components/ActivityFeed.tsx |
| **Room Management Module** |
| F-006 | View Rooms (Table/Card) | Admin | /room-management | RoomTable, RoomCardGrid | GET /api/rooms | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/room-management/page.tsx |
| F-007 | Filter/Search Rooms | Admin | /room-management | RoomFilters | GET /api/rooms?status=&block=&floor=&priceMin=&priceMax=&search= | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/room-management/components/RoomFilters.tsx |
| F-008 | Create Room | Admin | /room-management | RoomFormModal | POST /api/rooms | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/room-management/components/RoomFormModal.tsx |
| F-009 | Edit Room | Admin | /room-management | RoomFormModal | PUT /api/rooms/:id | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/room-management/components/RoomFormModal.tsx |
| F-010 | Delete Room (Single) | Admin | /room-management | DeleteRoomModal | DELETE /api/rooms/:id | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/room-management/components/DeleteRoomModal.tsx |
| F-011 | Bulk Delete Rooms | Admin | /room-management | BulkActionBar | POST /api/rooms/bulk-delete | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/room-management/components/BulkActionBar.tsx |
| F-012 | Bulk Status Change | Admin | /room-management | BulkActionBar | POST /api/rooms/bulk-status | rooms | FE: ✅ Mock (only Bảo trì option), BE: ❌ Not implemented | Medium | frontend/src/app/room-management/components/BulkActionBar.tsx |
| F-013 | Room Stats Summary | Admin | /room-management | page.tsx header | GET /api/rooms/stats | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/room-management/page.tsx |
| F-014 | Vacant-Without-Post Alert | Admin | /room-management | page.tsx banner | GET /api/rooms?status=Trống&hasActivePost=false | rooms, posts | FE: ✅ Mock, BE: ❌ Not implemented | Medium | frontend/src/app/room-management/page.tsx |
| **Contract Management Module** |
| F-015 | View Contracts | Admin | /contract-management | ContractTable, ContractStatsBar | GET /api/contracts | contracts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/contract-management/page.tsx |
| F-016 | Filter/Search Contracts | Admin | /contract-management | ContractFilters | GET /api/contracts?status=&month=&search= | contracts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/contract-management/components/ContractFilters.tsx |
| F-017 | Create Contract | Admin | /contract-management | ContractFormModal | POST /api/contracts | contracts, rooms, tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/contract-management/components/ContractFormModal.tsx |
| F-018 | Edit Contract | Admin | /contract-management | ContractFormModal | PUT /api/contracts/:id | contracts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/contract-management/components/ContractFormModal.tsx |
| F-019 | Renew Contract | Admin | /contract-management | ContractFormModal (renew mode) | POST /api/contracts/:id/renew | contracts | FE: ✅ Mock (creates new record, marks old Đã hết hạn), BE: ❌ Not implemented | High | frontend/src/app/contract-management/page.tsx |
| F-020 | Terminate Contract | Admin | /contract-management | TerminateContractModal | POST /api/contracts/:id/terminate | contracts | FE: ✅ Mock (sets Đã chấm dứt, no terminationReason/Date fields), BE: ❌ Not implemented | Medium | frontend/src/app/contract-management/components/TerminateContractModal.tsx |
| F-021 | Delete Contract | Admin | /contract-management | ContractTable row action | DELETE /api/contracts/:id | contracts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/contract-management/page.tsx |
| F-022 | Bulk Delete Contracts | Admin | /contract-management | BulkActionBar | POST /api/contracts/bulk-delete | contracts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/contract-management/page.tsx |
| F-023 | Contract Expiry Alert Banner | Admin | /contract-management | ExpiryAlertBanner | GET /api/contracts/expiring | contracts | FE: ✅ Mock (3 thresholds: 7/15/30 days), BE: ❌ Not implemented | High | frontend/src/app/contract-management/components/ExpiryAlertBanner.tsx |
| F-024 | Export Contract Excel | Admin | /contract-management | page.tsx button | GET /api/contracts/export?format=excel | contracts | FE: ✅ Mock (button exists, no handler), BE: ❌ Not implemented | Low | frontend/src/app/contract-management/page.tsx |
| F-025 | Print Contract | Admin | /contract-management | page.tsx button | N/A | N/A | FE: ✅ Mock (button exists, no handler), BE: ❌ Not implemented | Low | frontend/src/app/contract-management/page.tsx |
| **Tenant Management Module** |
| F-026 | View Tenants | Admin | /tenant-management | page.tsx table | GET /api/tenants | tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/tenant-management/page.tsx |
| F-027 | Filter/Search Tenants | Admin | /tenant-management | page.tsx filters | GET /api/tenants?status=&search= | tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/tenant-management/page.tsx |
| F-028 | Create Tenant | Admin | /tenant-management | TenantFormModal (inline) | POST /api/tenants | tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/tenant-management/page.tsx |
| F-029 | Edit Tenant | Admin | /tenant-management | TenantFormModal (inline) | PUT /api/tenants/:id | tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/tenant-management/page.tsx |
| F-030 | Delete Tenant | Admin | /tenant-management | confirmation inline | DELETE /api/tenants/:id | tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/tenant-management/page.tsx |
| F-031 | Tenant Detail Modal (5 tabs) | Admin | /tenant-management | DetailModal (inline, 5 tabs) | GET /api/tenants/:id, GET /api/tenants/:id/contracts, GET /api/tenants/:id/payments | tenants, contracts, payment_records | FE: ✅ Mock (payment data hardcoded), BE: ❌ Not implemented | Medium | frontend/src/app/tenant-management/page.tsx |
| F-032 | Tenant KPI Cards | Admin | /tenant-management | page.tsx header | GET /api/tenants/stats | tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/tenant-management/page.tsx |
| F-033 | End Rental | Admin | /tenant-management | row action | N/A (not implemented in FE) | tenants, contracts | FE: ❌ Stub (empty handler), BE: ❌ Not implemented | Low | frontend/src/app/tenant-management/page.tsx |
| **Post Management Module** |
| F-034 | View Posts (Table/Card) | Admin | /post-management | page.tsx table/grid | GET /api/posts | posts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/post-management/page.tsx |
| F-035 | Filter/Search Posts | Admin | /post-management | page.tsx filters | GET /api/posts?status=&channel=&postType=&search= | posts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/post-management/page.tsx |
| F-036 | Create Post (with live preview) | Admin | /post-management | CreatePostModal (inline) | POST /api/posts | posts | FE: ✅ Mock (save/schedule/post-now buttons exist), BE: ❌ Not implemented | Medium | frontend/src/app/post-management/page.tsx |
| F-037 | Delete Post | Admin | /post-management | row action | DELETE /api/posts/:id | posts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/post-management/page.tsx |
| F-038 | Edit Post | Admin | /post-management | row action | PUT /api/posts/:id | posts | FE: ✅ Mock (stub handler), BE: ❌ Not implemented | Low | frontend/src/app/post-management/page.tsx |
| F-039 | Duplicate Post | Admin | /post-management | row action | POST /api/posts/:id/duplicate | posts | FE: ✅ Mock (stub handler), BE: ❌ Not implemented | Low | frontend/src/app/post-management/page.tsx |
| F-040 | Post Now | Admin | /post-management | row action | POST /api/posts/:id/publish | posts | FE: ✅ Mock (stub handler), BE: ❌ Not implemented | Low | frontend/src/app/post-management/page.tsx |
| F-041 | Schedule Post | Admin | /post-management | row action | POST /api/posts/:id/schedule | posts | FE: ✅ Mock (stub handler), BE: ❌ Not implemented | Low | frontend/src/app/post-management/page.tsx |
| F-042 | Post Analytics Charts | Admin | /post-management | BarChart, LineChart, PieChart (inline) | GET /api/posts/stats | posts | FE: ✅ Mock (hardcoded chart data), BE: ❌ Not implemented | Low | frontend/src/app/post-management/page.tsx |
| F-043 | Post KPI Cards | Admin | /post-management | page.tsx header | GET /api/posts/stats | posts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/post-management/page.tsx |
| **Expense Management Module** |
| F-044 | View Expenses (Paginated) | Admin | /expenses | ExpenseTable | GET /api/expenses | expenses | FE: ✅ Mock (10/page pagination), BE: ❌ Not implemented | High | frontend/src/app/expenses/page.tsx, expenseService.ts |
| F-045 | Filter/Search Expenses | Admin | /expenses | ExpenseFilterBar | GET /api/expenses?category=&paymentStatus=&buildingName=&fromDate=&toDate=&search= | expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/expenses/components/ExpenseFilterBar.tsx |
| F-046 | Create Expense | Admin | /expenses | ExpenseFormModal | POST /api/expenses | expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/expenses/expenseService.ts:createExpense |
| F-047 | Edit Expense | Admin | /expenses | ExpenseFormModal | PUT /api/expenses/:id | expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/expenses/expenseService.ts:updateExpense |
| F-048 | Delete Expense | Admin | /expenses | DeleteConfirmDialog | DELETE /api/expenses/:id | expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/expenses/expenseService.ts:deleteExpense |
| F-049 | View Expense Detail | Admin | /expenses | ExpenseDetailDrawer | GET /api/expenses/:id | expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/expenses/expenseService.ts:getExpenseById |
| F-050 | Mark Expense Paid | Admin | /expenses | ExpenseTable row action | PATCH /api/expenses/:id/mark-paid | expenses | FE: ✅ Mock (changes paymentStatus+updatedAt only), BE: ❌ Not implemented | High | frontend/src/app/expenses/expenseService.ts:markExpensePaid |
| F-051 | Expense Stats Cards | Admin | /expenses | ExpenseStats | GET /api/expenses/stats | expenses | FE: ✅ Mock (computed from loaded data), BE: ❌ Not implemented | High | frontend/src/app/expenses/components/ExpenseStats.tsx |
| F-052 | Export Expenses | Admin | /expenses | page.tsx button | GET /api/expenses/export?format=excel | expenses | FE: ✅ Mock (toast message), BE: ❌ Not implemented | Low | frontend/src/app/expenses/page.tsx |
| **Reports Module** |
| F-053 | Report KPI Cards | Admin | /reports | ReportKpiCards | GET /api/reports/overview | rooms, contracts, expenses, tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/reportService.ts |
| F-054 | Revenue vs Expense Trend Chart | Admin | /reports | RevenueExpenseChart | GET /api/reports/revenue-expense-trend | contracts, expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/RevenueExpenseChart.tsx |
| F-055 | Expense Breakdown Chart | Admin | /reports | ExpenseBreakdownChart | GET /api/reports/expense-breakdown | expenses | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/ExpenseBreakdownChart.tsx |
| F-056 | Occupancy by Building Chart | Admin | /reports | OccupancyChart | GET /api/reports/occupancy-by-building | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/OccupancyChart.tsx |
| F-057 | Debt Trend Chart | Admin | /reports | DebtTrendChart | GET /api/reports/debt-trend | payment_records, tenants | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/DebtTrendChart.tsx |
| F-058 | Room Operation Summary | Admin | /reports | RoomOperationSection | GET /api/reports/overview | rooms | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/RoomOperationSection.tsx |
| F-059 | Contract Summary Section | Admin | /reports | ContractSummarySection | GET /api/reports/overview | contracts | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/ContractSummarySection.tsx |
| F-060 | Financial Summary Section | Admin | /reports | FinancialSummarySection | GET /api/reports/overview | contracts, expenses, payment_records | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/FinancialSummarySection.tsx |
| F-061 | Tenant Debt Table | Admin | /reports | TenantDebtTable | GET /api/reports/tenant-debt-list | tenants, payment_records | FE: ✅ Mock (5/page pagination), BE: ❌ Not implemented | High | frontend/src/app/reports/components/TenantDebtTable.tsx |
| F-062 | Report Period/Building Filter | Admin | /reports | ReportFilterBar | Appended to all report endpoints as query params | N/A | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/reports/components/ReportFilterBar.tsx |
| F-063 | Export Report (Excel/PDF) | Admin | /reports | ReportHeader | GET /api/reports/export?format=excel\|pdf | N/A | FE: ✅ Mock (returns message), BE: ❌ Not implemented | Low | frontend/src/app/reports/reportService.ts:exportReports |
| **AI Agent Module** |
| F-064 | AI Chat (Keyword-based mock) | Admin | /agent | AgentChatPanel | POST /api/agent/chat | agent_conversations | FE: ✅ Mock (6 keyword triggers + default), BE: ❌ Not implemented | High | frontend/src/app/agent/agentService.ts:sendAgentMessage |
| F-065 | Agent Summary Cards | Admin | /agent | AgentSummaryCards | GET /api/agent/overview | all modules | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/agent/components/AgentSummaryCards.tsx |
| F-066 | Quick Actions Panel | Admin | /agent | QuickActionsPanel | GET /api/agent/quick-actions | N/A | FE: ✅ Mock (6 chat-prompt actions), BE: ❌ Not implemented | High | frontend/src/app/agent/components/QuickActionsPanel.tsx |
| F-067 | Automation List | Admin | /agent | AutomationList | GET /api/automations | automations | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/agent/components/AutomationList.tsx |
| F-068 | Create Automation | Admin | /agent | AutomationFormModal | POST /api/automations | automations | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/agent/agentService.ts:createAutomation |
| F-069 | Toggle Automation | Admin | /agent | AutomationList | PATCH /api/automations/:id/toggle | automations | FE: ✅ Mock (status active/paused toggle), BE: ❌ Not implemented | High | frontend/src/app/agent/agentService.ts:toggleAutomation |
| F-070 | Run Automation Manually | Admin | /agent | AutomationList | POST /api/automations/:id/run | automations, agent_task_history | FE: ✅ Mock (updates lastRunAt), BE: ❌ Not implemented | High | frontend/src/app/agent/agentService.ts:runAutomation |
| F-071 | Delete Automation | Admin | /agent | AutomationList | DELETE /api/automations/:id | automations | FE: ✅ Mock, BE: ❌ Not implemented | High | frontend/src/app/agent/agentService.ts:deleteAutomation |
| F-072 | Agent Alerts Panel | Admin | /agent | AgentAlertsPanel | GET /api/agent/alerts | notifications | FE: ✅ Mock (5 alerts, 3 severity levels), BE: ❌ Not implemented | High | frontend/src/app/agent/components/AgentAlertsPanel.tsx |
| F-073 | Task History Table | Admin | /agent | AgentTaskHistoryTable | GET /api/agent/task-history | agent_task_history | FE: ✅ Mock (8 tasks, no pagination), BE: ❌ Not implemented | High | frontend/src/app/agent/components/AgentTaskHistoryTable.tsx |
| F-074 | Workflow Templates | Admin | /agent | WorkflowTemplatesSection | GET /api/workflow-templates | workflow_templates | FE: ✅ Mock (6 templates, opens blank form), BE: ❌ Not implemented | Medium | frontend/src/app/agent/components/WorkflowTemplatesSection.tsx |
| **Notifications Module** |
| F-075 | Notifications Bell (Topbar) | Admin | All pages (Topbar) | Topbar (notification dropdown) | GET /api/notifications, PATCH /api/notifications/:id/read, POST /api/notifications/mark-all-read | notifications | FE: ✅ Mock (from mockNotifications), BE: ❌ Not implemented | High | frontend/src/components/Topbar.tsx |
| **Facebook Chat Popup** |
| F-076 | Facebook Chat Popup | Admin | All pages | FacebookChatPopup | GET /api/conversations, POST /api/conversations/:id/messages | chat_conversations, chat_messages | FE: ✅ Mock (full UI, stateful), BE: ❌ Not implemented | Medium | frontend/src/components/FacebookChatPopup.tsx |

---

## Summary Statistics

| Metric | Count |
|---|---|
| Total features documented | 76 |
| FE implemented (mock) | 76 |
| BE implemented | 0 |
| High confidence | ~50 |
| Medium confidence | ~15 |
| Low confidence (stubs/mock-only) | ~11 |

---

## Feature Status Legend

### Implementation Status Values

- **`FE: ✅ Mock`** — The feature is fully implemented on the frontend using mock/in-memory data. The UI is complete, interactions work, but all data is local and no real API calls are made. This is the current state of all features in this project.

- **`BE: ❌ Not implemented`** — No backend implementation exists for this feature. The backend folder is empty and no API endpoints, database schemas, or server-side logic have been created.

- **`FE: ❌ Stub (empty handler)`** — The frontend includes a UI element (button, menu item, or action) for this feature but the event handler is empty or a no-op. The feature is not usable even with mock data.

### Confidence Levels

- **High** — The feature is confirmed by at least three sources: frontend code (screen + component), the frontend business specification (`docs/frontend-business-spec.md`), and the backend build plan. All three sources agree on the feature's scope and behavior.

- **Medium** — The feature is confirmed by frontend code and the specification document, but the backend plan is either silent or only partially addresses this feature. The expected API shape may require inference.

- **Low** — The feature is only visible in frontend code (typically as a stub handler, a UI button with no action, or hardcoded data with no service call). It is not mentioned in any spec or planning document. The backend API shape is an informed guess and must be validated before implementation.
