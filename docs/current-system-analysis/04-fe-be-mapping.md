# Frontend–Backend Action Mapping

**Purpose:** Maps every frontend action to its planned API endpoint.
**Integration Status for ALL rows:** ❌ Gap — BE not implemented.

---

## Mapping Table

### Dashboard Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load dashboard KPIs | `dashboard/page.tsx` | `getDashboardStats()` from `mockData.ts` | `GET /api/dashboard/stats` | `dashboard/router.py` | — | `{totalRooms, occupiedRooms, vacantRooms, occupancyRate, currentMonthRevenue, currentMonthExpenses, overdueAmount, expiringContracts}` | Populates KPIBentoGrid cards | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load activity feed | `dashboard/components/ActivityFeed.tsx` | `mockActivityItems` (hardcoded) | `GET /api/dashboard/activity?limit=8` | `activity/router.py` | — | `ActivityLog[]` | Renders ActivityFeed list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load expiry alerts | `dashboard/components/AlertPanel.tsx` | `mockContracts` filtered | `GET /api/contracts?expiringWithin=30` | `contracts/router.py` | — | `Contract[]` | Renders AlertPanel | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |

---

### Room Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load room list | `room-management/page.tsx` | `useState(mockRooms)` | `GET /api/rooms` | `rooms/router.py` | `?status=&block=&floor=&priceMin=&priceMax=&search=&page=&limit=` | `{data: Room[], total, page}` | Renders RoomTable or RoomCardGrid | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load room stats | `room-management/page.tsx` | `useMemo` on rooms array | `GET /api/rooms/stats` | `rooms/router.py` | — | `{total, vacant, occupied, maintenance, noPost}` | Renders header stats | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Create room | `RoomFormModal.tsx` + `page.tsx:handleSaveRoom` | local state mutation | `POST /api/rooms` | `rooms/router.py` | `{code, name, block, floor, area, rentPrice, deposit, electricityPrice, waterPrice, serviceFee, maxTenants, status, description}` | `Room` | Closes modal, prepends to list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Edit room | `RoomFormModal.tsx` + `page.tsx:handleSaveRoom` | local state mutation (merge) | `PUT /api/rooms/:id` | `rooms/router.py` | `{code, name, block, floor, area, rentPrice, deposit, electricityPrice, waterPrice, serviceFee, maxTenants, status, description}` | `Room` | Closes modal, updates list item | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Delete room | `DeleteRoomModal.tsx` + `page.tsx:handleDeleteRoom` | filter from state | `DELETE /api/rooms/:id` | `rooms/router.py` | — | `204 No Content` | Removes from list, closes modal | Note: FE blocks delete if `room.status === 'Đang thuê'`, but no API-level guard | ❌ Gap: BE not implemented |
| Bulk delete rooms | `BulkActionBar.tsx` + `page.tsx:handleBulkDelete` | filter from state | `POST /api/rooms/bulk-delete` | `rooms/router.py` | `{ids: string[]}` | `{deleted: number}` | Removes selected, clears selection | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Bulk status change | `BulkActionBar.tsx` + `page.tsx:handleBulkStatusChange` | map over state | `POST /api/rooms/bulk-status` | `rooms/router.py` | `{ids: string[], status: 'Bảo trì'}` | `{updated: number}` | Updates selected statuses, clears selection. Note: FE only offers `'Bảo trì'` as bulk status option | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |

---

### Contract Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load contract list | `contract-management/page.tsx` | `useState(mockContracts)` | `GET /api/contracts` | `contracts/router.py` | `?status=&month=&search=&page=&limit=` | `{data: Contract[], total, page}` | Renders ContractTable | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load contract stats | `ContractStatsBar.tsx` | `useMemo` on contracts | `GET /api/contracts/stats` | `contracts/router.py` | — | `{active, expiring, expired, terminated, critical}` | Renders ContractStatsBar | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load expiry alerts | `ExpiryAlertBanner.tsx` | `useMemo` on contracts | `GET /api/contracts/expiring?withinDays=30` | `contracts/router.py` | — | `Contract[]` with `daysUntilExpiry` | Renders ExpiryAlertBanner with 3 severity zones | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Create contract | `ContractFormModal.tsx` + `page.tsx:handleSaveContract` | local state mutation | `POST /api/contracts` | `contracts/router.py` | `{roomId, tenantId, startDate, endDate, monthlyRent, deposit, billingCycle, paymentDueDay, notes}` | `Contract` | Closes modal, prepends to list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Edit contract | `ContractFormModal.tsx` + `page.tsx:handleSaveContract` | merge into state | `PUT /api/contracts/:id` | `contracts/router.py` | same as create | `Contract` | Closes modal, updates list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Renew contract | `ContractFormModal.tsx` (renew mode) + `page.tsx:handleRenewContract` | creates new + marks old `Đã hết hạn` | `POST /api/contracts/:id/renew` | `contracts/router.py` | `{startDate, endDate, monthlyRent, deposit, billingCycle, paymentDueDay, notes}` | `{old: Contract(Đã hết hạn), new: Contract}` | Replaces old in list with updated + prepends new | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Terminate contract | `TerminateContractModal.tsx` + `page.tsx:handleTerminateContract` | sets `status=Đã chấm dứt`, `daysUntilExpiry=null` | `POST /api/contracts/:id/terminate` | `contracts/router.py` | `{reason?, terminationDate?}` | `Contract(Đã chấm dứt)` | Updates in list. NOTE: FE does NOT pass `terminationReason` or `terminationDate` — these fields are in BE plan but NOT in FE Contract interface | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Delete contract | `ContractTable` row action + `page.tsx:handleDeleteContract` | filter from state | `DELETE /api/contracts/:id` | `contracts/router.py` | — | `204` | Removes from list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Bulk delete contracts | `BulkActionBar` + `page.tsx:handleBulkDelete` | filter from state | `POST /api/contracts/bulk-delete` | `contracts/router.py` | `{ids: string[]}` | `{deleted: number}` | Removes selected, clears selection | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Export contracts Excel | `page.tsx` button | no handler (stub) | `GET /api/contracts/export?format=excel` | `contracts/router.py` | — | binary file | N/A — currently does nothing | N/A | ❌ Gap: BE not implemented |
| Print contract | `page.tsx` button | no handler (stub) | N/A | N/A | — | — | N/A — currently does nothing | N/A | ❌ Gap: BE not implemented |

---

### Tenant Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load tenant list | `tenant-management/page.tsx` | `useState(mockTenants)` | `GET /api/tenants` | `tenants/router.py` | `?status=&search=&page=&limit=` | `{data: Tenant[], total, page}` | Renders tenant table | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load tenant stats | `page.tsx:kpis` useMemo | `useMemo` on tenants | `GET /api/tenants/stats` | `tenants/router.py` | — | `{total, active, expiringSoon, debtCases}` | Renders KPI cards | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Create tenant | inline `TenantForm` + `page.tsx:handleCreate` | push to state | `POST /api/tenants` | `tenants/router.py` | `{fullName, phone, cccd, gender, dateOfBirth, permanentAddress, occupation?, licensePlate?, notes?}` | `Tenant` | Closes modal, prepends to list, `status='Đang thuê'` hardcoded | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Edit tenant | inline `TenantForm` + `page.tsx:handleEdit` | merge into state | `PUT /api/tenants/:id` | `tenants/router.py` | same fields | `Tenant` | Closes modal, updates list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Delete tenant | confirmation dialog + `page.tsx:handleDelete` | filter from state | `DELETE /api/tenants/:id` | `tenants/router.py` | — | `204` | Removes from list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| View tenant detail | inline `DetailModal` + `page.tsx` | reads from local state | `GET /api/tenants/:id` | `tenants/router.py` | — | `Tenant` (with virtual fields) | Opens 5-tab detail modal | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| View tenant contracts (tab) | `DetailModal` tab 2 | local `tenant.contractCode` | `GET /api/tenants/:id/contracts` | `tenants/router.py` | — | `Contract[]` | Renders contract tab | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| View tenant payments (tab) | `DetailModal` tab 4 | hardcoded mock array | `GET /api/tenants/:id/payments` | `tenants/router.py` | — | `PaymentRecord[]` | Renders payment history. NOTE: currently hardcodes 3 mock payments and `total_paid=10,500,000` | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| End rental | row action in `page.tsx` | empty handler — NOT IMPLEMENTED | N/A (no endpoint used) | N/A | — | — | Currently does nothing. Should: set `tenant.status=Đã trả phòng`, clear `currentRoomId` | N/A | ❌ Gap: BE not implemented (also FE unimplemented) |

---

### Expense Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load expenses | `expenses/page.tsx:useEffect` | `expenseService.getExpenses(appliedFilters)` | `GET /api/expenses` | `expenses/router.py` | `?category=&paymentStatus=&buildingName=&fromDate=&toDate=&search=&page=&limit=` | `{data: Expense[], total, page}` | Renders ExpenseTable (10/page) | Error state set (`error: boolean`) | ❌ Gap: BE not implemented |
| Load expense by ID | `ExpenseDetailDrawer` | `expenseService.getExpenseById(id)` | `GET /api/expenses/:id` | `expenses/router.py` | — | `Expense` | Opens detail drawer | No error handling for null — integration risk | ❌ Gap: BE not implemented |
| Create expense | `ExpenseFormModal` + `page.tsx:handleCreate` | `expenseService.createExpense(payload)` | `POST /api/expenses` | `expenses/router.py` | `{title, category, amount, expenseDate, paymentStatus, paymentMethod, buildingName, note, isRecurring}` | `Expense` | Toast success, closes modal, reloads list | Toast error on catch | ❌ Gap: BE not implemented |
| Edit expense | `ExpenseFormModal` + `page.tsx:handleEdit` | `expenseService.updateExpense(id, payload)` | `PUT /api/expenses/:id` | `expenses/router.py` | same fields | `Expense` | Toast success, closes modal, reloads | Toast error on catch | ❌ Gap: BE not implemented |
| Delete expense | `DeleteConfirmDialog` + `page.tsx:handleDelete` | `expenseService.deleteExpense(id)` | `DELETE /api/expenses/:id` | `expenses/router.py` | — | `204` | Toast success, removes from list | Toast error on catch | ❌ Gap: BE not implemented |
| Mark expense paid | `ExpenseTable` row action + `page.tsx:handleMarkPaid` | `expenseService.markExpensePaid(id)` | `PATCH /api/expenses/:id/mark-paid` | `expenses/router.py` | — | `Expense` (`paymentStatus=Đã thanh toán`, `updatedAt` updated) | Toast success, updates list item. NOTE: no `paymentDate` field | Toast error on catch | ❌ Gap: BE not implemented |
| Load expense stats | `ExpenseStats` | computed from loaded expenses list | `GET /api/expenses/stats` | `expenses/router.py` | — | `{thisMonthTotal, thisQuarterTotal, unpaidCount, largestCategory}` | Renders 4 stats cards | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Export expenses | `page.tsx` button | mock toast | `GET /api/expenses/export?format=excel` | `expenses/router.py` | — | binary file | Shows "mock" toast message | N/A | ❌ Gap: BE not implemented |

---

### Post Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load posts | `post-management/page.tsx` | `useState(mockPosts)` | `GET /api/posts` | `posts/router.py` | `?status=&channel=&postType=&search=&page=&limit=` | `{data: FacebookPost[], total, page}` | Renders post table/grid | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load post stats | `page.tsx` KPI useMemo | computed from `mockPosts` | `GET /api/posts/stats` | `posts/router.py` | — | `{total, published, scheduled, draft, error, totalViews, totalLeads, conversionRate}` | Renders 6 KPI cards | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Create post | `CreatePostModal` (save/schedule/post-now buttons) | local state — buttons are STUBS | `POST /api/posts` | `posts/router.py` | `{title, content, roomId?, postType, channel, plannedDate?, hashtags?, price?, area?, assignee?}` | `FacebookPost` | N/A — buttons do nothing currently | N/A | ❌ Gap: BE not implemented |
| Delete post | row action + `page.tsx:handleDelete` | filter from state | `DELETE /api/posts/:id` | `posts/router.py` | — | `204` | Removes from list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Edit post | row action | empty handler — STUB | `PUT /api/posts/:id` | `posts/router.py` | same as create | `FacebookPost` | N/A | N/A | ❌ Gap: BE not implemented |
| Duplicate post | row action | empty handler — STUB | `POST /api/posts/:id/duplicate` | `posts/router.py` | — | `FacebookPost` (new id, `status=Nháp`) | N/A | N/A | ❌ Gap: BE not implemented |
| Post now | row action | empty handler — STUB | `POST /api/posts/:id/publish` | `posts/router.py` | — | `FacebookPost` (`status=Đã đăng`, `postedDate=now`) | N/A | N/A | ❌ Gap: BE not implemented |
| Schedule post | row action | empty handler — STUB | `POST /api/posts/:id/schedule` | `posts/router.py` | `{scheduledAt: datetime}` | `FacebookPost` (`status=Đã lên lịch`) | N/A | N/A | ❌ Gap: BE not implemented |

---

### Report Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load report overview | `reports/page.tsx:useEffect` | `reportService.getReportOverview(filters)` | `GET /api/reports/overview` | `reports/router.py` | `?periodType=&selectedMonth=&selectedYear=&buildingId=&compareWithPrevious=` | `ReportData` (full composite) | Renders all report sections | Error state set | ❌ Gap: BE not implemented |
| Load revenue/expense trend | `page.tsx` | `reportService.getRevenueExpenseTrend(filters)` | `GET /api/reports/revenue-expense-trend` | `reports/router.py` | same filters | `RevenueExpenseTrendItem[]` | RevenueExpenseChart | Error state set | ❌ Gap: BE not implemented |
| Load expense breakdown | `page.tsx` | `reportService.getExpenseBreakdown(filters)` | `GET /api/reports/expense-breakdown` | `reports/router.py` | same filters | `ExpenseCategoryItem[]` | ExpenseBreakdownChart | Error state set | ❌ Gap: BE not implemented |
| Load occupancy by building | `page.tsx` | `reportService.getOccupancyByBuilding(filters)` | `GET /api/reports/occupancy-by-building` | `reports/router.py` | same filters | `OccupancyByBuildingItem[]` | OccupancyChart | Error state set | ❌ Gap: BE not implemented |
| Load debt trend | `page.tsx` | `reportService.getDebtTrend(filters)` | `GET /api/reports/debt-trend` | `reports/router.py` | same filters | `DebtTrendItem[]` | DebtTrendChart | Error state set | ❌ Gap: BE not implemented |
| Load tenant debt list | `page.tsx` | `reportService.getTenantDebtList(filters)` | `GET /api/reports/tenant-debt-list` | `reports/router.py` | same filters | `TenantDebtItem[]` | TenantDebtTable | Error state set | ❌ Gap: BE not implemented |
| Export report | `ReportHeader` buttons | `reportService.exportReports(format, filters)` | `GET /api/reports/export?format=excel\|pdf` | `reports/router.py` | same filters + format | binary file | Currently returns mock message, no file | Catch shows toast | ❌ Gap: BE not implemented |

---

### Agent Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load agent overview | `agent/page.tsx:useEffect` | `agentService.getAgentOverview()` | `GET /api/agent/overview` | `agent/router.py` | — | `AgentOverview` | Renders AgentSummaryCards | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load chat history | `AgentChatPanel` | `agentService.getAgentConversations()` | `GET /api/agent/chat` (with sessionId) | `agent/router.py` | `?sessionId=` | `AgentConversationItem[]` | Renders chat history | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Send chat message | `AgentChatPanel:handleSend` | `agentService.sendAgentMessage(content)` | `POST /api/agent/chat` | `agent/router.py` | `{message: string, sessionId?: string}` | `AgentConversationItem` (assistant response) | Appends user+assistant messages. NOTE: no sessionId generated in FE | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load quick actions | `QuickActionsPanel` | `agentService.getQuickActions()` | `GET /api/agent/quick-actions` | `agent/router.py` | — | `QuickActionItem[]` | Renders 6 action cards | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load automations | `AutomationList` | `agentService.getAutomations()` | `GET /api/automations` | `automations/router.py` | `?status=&module=` | `AutomationItem[]` | Renders automation list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Create automation | `AutomationFormModal` | `agentService.createAutomation(payload)` | `POST /api/automations` | `automations/router.py` | `{name, description, triggerType, frequency, runTime, module, condition, action, notifyRecipient, notifyChannel, enableImmediately}` | `AutomationItem` | Toast success, closes modal, prepends to list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Toggle automation | `AutomationList` toggle | `agentService.toggleAutomation(id)` | `PATCH /api/automations/:id/toggle` | `automations/router.py` | — | `AutomationItem` (`isEnabled` flipped, status active/paused) | Updates list item, toast | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Run automation | `AutomationList` run button | `agentService.runAutomation(id)` | `POST /api/automations/:id/run` | `automations/router.py` | — | void | Updates `lastRunAt`, toast | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Delete automation | `AutomationList` delete | `agentService.deleteAutomation(id)` | `DELETE /api/automations/:id` | `automations/router.py` | — | `204` | Toast, removes from list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load agent alerts | `AgentAlertsPanel` | `agentService.getAgentAlerts()` | `GET /api/agent/alerts` | `agent/router.py` | — | `AgentAlertItem[]` | Renders alert cards by severity | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load task history | `AgentTaskHistoryTable` | `agentService.getTaskHistory()` | `GET /api/agent/task-history` | `agent/router.py` | `?page=&limit=` | `AgentTaskHistoryItem[]` | Renders task table | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Load workflow templates | `WorkflowTemplatesSection` | `agentService.getWorkflowTemplates()` | `GET /api/workflow-templates` | `automations/router.py` | — | `WorkflowTemplateItem[]` | Renders template cards | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Use workflow template | `WorkflowTemplatesSection` "Dùng mẫu này" | sets `automationModalOpen=true` | `POST /api/workflow-templates/:id/use` | `automations/router.py` | — | `AutomationItem` (pre-filled) | Opens blank AutomationFormModal (does NOT pre-fill fields — gap) | N/A | ❌ Gap: BE not implemented |

---

### Notification Module

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load notifications | Topbar | reads `mockNotifications` directly | `GET /api/notifications?read=&type=&page=&limit=` | `notifications/router.py` | — | `Notification[]` | Renders notification dropdown | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Get unread count | Topbar (badge) | `mockNotifications.filter(n=>!n.read).length` | `GET /api/notifications/count` | `notifications/router.py` | — | `{unread: number}` | Shows badge on bell | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Mark notification read | Topbar dropdown item | local state toggle | `PATCH /api/notifications/:id/read` | `notifications/router.py` | — | `Notification` | Updates read state | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Mark all notifications read | Topbar "mark all" button | local state mutation | `POST /api/notifications/mark-all-read` | `notifications/router.py` | — | `{updated: number}` | Clears unread badges | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |

---

### Facebook Chat (Popup)

| Frontend Action | Frontend File | Mock Service Function | Planned API Endpoint | Planned BE Controller | Request Payload | Expected Response | Success Behavior | Error Behavior | Integration Status |
|---|---|---|---|---|---|---|---|---|---|
| Load conversations | `FacebookChatPopup` | reads `mockConversations` | `GET /api/conversations` | `conversations/router.py` | `?leadStatus=&search=` | `ChatConversation[]` | Renders conversation list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Send chat message | `FacebookChatPopup` compose | local state mutation | `POST /api/conversations/:id/messages` | `conversations/router.py` | `{text: string}` | `ChatMessage` | Appends staff message to thread | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |
| Update lead status | `FacebookChatPopup` lead panel | local state mutation | `PATCH /api/conversations/:id` | `conversations/router.py` | `{leadStatus, assignee, internalNote, tags}` | `ChatConversation` | Updates conversation in list | No error handling in current mock — integration risk | ❌ Gap: BE not implemented |

---

## Summary

| Metric | Count |
|---|---|
| Total mapped actions | 73 |
| Actions with working FE implementation | ~50 |
| Actions that are stubs (empty handlers) | ~15 |
| Actions with no FE implementation | 2 (End Rental, Agent Settings) |
| All backend endpoints | ❌ Not implemented |

---

## Critical Integration Risks

The following 10 mappings carry the highest integration risk due to either missing error handling combined with complex state transitions, or fundamental mismatches between FE and planned BE contract:

| # | Action | Risk Description |
|---|---|---|
| 1 | **Contract renew** | Two-step atomic operation: mark old contract `Đã hết hạn` AND create new contract. No transaction boundary in mock. If BE fails mid-way, FE state will be inconsistent. No error handling. |
| 2 | **Contract terminate** | `terminationReason` and `terminationDate` are planned BE fields but are NOT present in the FE `Contract` interface. FE does not pass these fields. Contract mismatch must be resolved before implementation. |
| 3 | **"Use workflow template"** | FE only sets `automationModalOpen=true` — it opens a blank `AutomationFormModal` and does not pre-fill fields from the selected template. Planned BE response is a pre-filled `AutomationItem`, but FE cannot consume it without refactor. |
| 4 | **Tenant "End rental"** | The row action handler is completely empty in the frontend. Both FE and BE work is required. No clear definition of side effects (should update room status, clear contract references, etc.). |
| 5 | **All report endpoints** | Report module has 7 separate aggregation endpoints. FE has `error` state but no loading skeleton or partial-failure handling. All 7 must succeed for the page to render correctly. |
| 6 | **Agent chat (sessionId)** | FE does not generate or persist a `sessionId` when sending messages. Without session continuity, the BE cannot maintain conversation context across requests. |
| 7 | **Expense code generation** | Expense codes use a `CP-2024-XXX` format hardcoded to `2024`. When the BE generates codes dynamically, the year must be derived from the current date or `expenseDate`, or codes will mismatch FE display expectations. |
| 8 | **Bulk room status change** | FE `BulkActionBar` only exposes `'Bảo trì'` as the bulk status option. BE endpoint `POST /api/rooms/bulk-status` should accept any valid status, but if FE never sends other values, the endpoint's broader contract is untested and the FE UI will need extension to use it. |
| 9 | **Tenant payment tab** | `DetailModal` tab 4 renders 3 hardcoded mock payments with a hardcoded `total_paid` of 10,500,000. When replaced with real `GET /api/tenants/:id/payments`, the response shape and aggregation logic must match exactly or the UI will break silently. |
| 10 | **Mark all notifications read** | FE performs an optimistic state update (clears all badges immediately). There is no rollback mechanism if the `POST /api/notifications/mark-all-read` call fails. This can leave the backend in a different read-state than the UI displays. |
