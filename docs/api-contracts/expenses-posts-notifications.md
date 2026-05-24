# API Contract: Expenses, Posts, Notifications

> Generated from Phase 3 implementation. All endpoints require `Authorization: Bearer <token>` with `admin` role.

---

## Expenses — `/api/expenses`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/expenses | 200 | List expenses (paginated, filterable) |
| GET | /api/expenses/stats | 200 | Aggregate stats |
| GET | /api/expenses/{id} | 200 | Get single expense |
| POST | /api/expenses | 201 | Create expense |
| PUT | /api/expenses/{id} | 200 | Update expense |
| DELETE | /api/expenses/{id} | 204 | Delete expense |
| PATCH | /api/expenses/{id}/mark-paid | 200 | Mark as paid |

### GET /api/expenses query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 100) |
| search | str | Substring on title / code / note |
| category | str | Exact match on category enum |
| payment_status | str | Exact match on payment status |
| building_name | str | Exact match: Khu A / Khu B / Khu C / Khu D |
| from_date | date | expense_date >= from_date |
| to_date | date | expense_date <= to_date |

### GET /api/expenses/stats response
```json
{
  "total": 42,
  "paid": 30,
  "unpaid": 8,
  "pending": 4,
  "total_amount": 125000000
}
```

### ExpenseResponse shape
```json
{
  "id": "uuid",
  "code": "CP-2026-001",
  "title": "Tiền điện tháng 5 khu A",
  "category": "Điện nước",
  "amount": 2850000,
  "expense_date": "2026-05-05",
  "payment_status": "Đã thanh toán",
  "payment_method": "Chuyển khoản",
  "building_name": "Khu A",
  "note": "Hóa đơn EVN tháng 5",
  "is_recurring": true,
  "receipt_image": null,
  "created_at": "2026-05-20T...",
  "updated_at": "2026-05-20T..."
}
```

### Validation rules
- `category`: must be one of `Điện nước | Internet | Vệ sinh | Sửa chữa | Mua sắm | Lương / quản lý | Chi phí khác`
- `payment_status`: must be one of `Đã thanh toán | Chưa thanh toán | Chờ xử lý`
- `payment_method`: must be one of `Tiền mặt | Chuyển khoản | Khác`
- `amount`: positive integer (VND)
- `expense_date`: valid ISO date
- Expense code auto-generated as `CP-YYYY-NNN` (3-digit zero-padded sequential per calendar year)

---

## Posts — `/api/posts`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/posts | 200 | List posts (paginated, filterable) |
| GET | /api/posts/stats | 200 | Aggregate stats |
| GET | /api/posts/{id} | 200 | Get single post |
| POST | /api/posts | 201 | Create post (status=Nháp) |
| PUT | /api/posts/{id} | 200 | Update post fields (draft only) |
| DELETE | /api/posts/{id} | 204 | Delete post |
| POST | /api/posts/{id}/publish | 200 | Publish immediately |
| POST | /api/posts/{id}/schedule | 200 | Schedule for later |
| POST | /api/posts/{id}/duplicate | 201 | Duplicate as new draft |

### GET /api/posts query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| search | str | Substring on title |
| status | str | `Nháp \| Đã lên lịch \| Đã đăng \| Lỗi` |
| channel | str | `Facebook Page \| Facebook Group \| Zalo` |
| post_type | str | `Tuyển khách \| Khuyến mãi \| Thông báo` |
| room_id | uuid | Filter by linked room |

### GET /api/posts/stats response
```json
{
  "total": 12,
  "published": 5,
  "scheduled": 3,
  "draft": 3,
  "error": 1,
  "total_views": 4821,
  "total_leads": 23
}
```

### PostResponse shape
```json
{
  "id": "uuid",
  "title": "Cho thuê phòng P103 - Khu A",
  "content": "Phòng rộng 25m²...",
  "room_id": "uuid or null",
  "room_code": "P103 or null",
  "post_type": "Tuyển khách",
  "channel": "Facebook Page",
  "planned_date": null,
  "posted_date": "2026-05-10T14:00:00Z",
  "status": "Đã đăng",
  "fb_link": null,
  "views": 1241,
  "messages": 12,
  "leads": 5,
  "converted": 1,
  "hashtags": "#chothuephong #nhatro",
  "price": 3500000,
  "area": 25,
  "assignee": null,
  "thumbnail": null,
  "created_at": "2026-05-09T...",
  "updated_at": "2026-05-10T..."
}
```

### Status lifecycle
- `Nháp` → publish → `Đã đăng`
- `Nháp` → schedule → `Đã lên lịch`
- `Đã lên lịch` → publish → `Đã đăng`
- Any status → duplicate → new `Nháp`
- `Đã đăng` or `Đã lên lịch` → cannot be edited (409)

### Side effects
- publish with `room_id`: sets `room.has_active_post = true`
- delete where `status = Đã đăng` with `room_id`: sets `room.has_active_post = false` if no other published posts for that room

### schedule payload
```json
{ "scheduled_at": "2026-05-25T10:00:00Z" }
```

### Business rules
- Posts with `post_type = Khuyến mãi` or `Thông báo` must have `room_id = null`

---

## Notifications — `/api/notifications`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/notifications | 200 | List notifications (triggers refresh first) |
| GET | /api/notifications/count | 200 | Unread count |
| PATCH | /api/notifications/{id}/read | 200 | Mark single as read |
| POST | /api/notifications/mark-all-read | 200 | Mark all as read |

### GET /api/notifications query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20) |
| read | bool | Filter by read state |
| type | str | `contract_expiry \| vacant_room \| maintenance` |

### NotificationResponse shape
```json
{
  "id": "uuid",
  "type": "contract_expiry",
  "reference_id": "uuid-string",
  "title": "Hợp đồng sắp hết hạn",
  "message": "Hợp đồng HĐ-2026-00001 hết hạn sau 7 ngày",
  "date": "2026-05-20",
  "read": false,
  "priority": "high",
  "created_at": "2026-05-20T...",
  "updated_at": "2026-05-20T..."
}
```

### Notification generation rules (triggered on every GET /api/notifications and GET /api/notifications/count)
| Type | Source | Condition | Priority |
|------|--------|-----------|----------|
| `contract_expiry` | contracts | terminated_at IS NULL AND end_date in [today, today+30] | high if ≤7d, medium if ≤30d |
| `vacant_room` | rooms | status='Trống' AND has_active_post=false | high |
| `maintenance` | rooms | status='Bảo trì' | low |

### Upsert key
`(type, reference_id)` — unique constraint. Refresh updates existing notifications or creates new ones. `read` state is preserved across refreshes.

### GET /api/notifications/count response
```json
{ "unread": 4 }
```
