# API Contract: Rooms, Tenants, Contracts

> Generated from Phase 2 implementation. All endpoints require `Authorization: Bearer <token>` with `admin` role.

---

## Rooms — `/api/rooms`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/rooms | 200 | List rooms (paginated, filterable) |
| POST | /api/rooms | 201 | Create room |
| PUT | /api/rooms/{id} | 200 | Update room fields |
| DELETE | /api/rooms/{id} | 204 | Delete room (409 if occupied) |
| PATCH | /api/rooms/{id}/status | 200 | Update room status manually |

### GET /api/rooms query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 100) |
| search | str | Substring match on code/name |
| status | str | Exact match: `Trống`, `Đang thuê`, `Đã đặt`, `Bảo trì` |
| block | str | Exact match on block name |
| floor | str | Exact match on floor |
| priceMin | int | Minimum rent_price (VND) |
| priceMax | int | Maximum rent_price (VND) |

### RoomResponse shape
```json
{
  "id": "uuid",
  "code": "P101",
  "name": "Phòng 101",
  "floor": "Tầng 1",
  "block": "Khu A",
  "area": 25,
  "rent_price": 3500000,
  "deposit": 7000000,
  "electricity_price": 3500,
  "water_price": 15000,
  "service_fee": 100000,
  "max_tenants": 2,
  "current_tenants": 0,
  "status": "Trống",
  "description": null,
  "images": [],
  "has_active_post": false,
  "created_at": "2026-05-19T...",
  "updated_at": "2026-05-19T..."
}
```

> **Note:** `current_tenants` is computed at read time (count of active contracts). Not stored in DB.

---

## Tenants — `/api/tenants`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/tenants | 200 | List tenants (paginated, filterable) |
| POST | /api/tenants | 201 | Create tenant |
| PUT | /api/tenants/{id} | 200 | Update tenant fields |
| DELETE | /api/tenants/{id} | 204 | Delete tenant (409 if active contract) |

### GET /api/tenants query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| search | str | Substring match on full_name/phone/cccd |
| status | str | `Đang thuê`, `Sắp hết hạn`, `Nợ tiền`, `Đã trả phòng` |
| gender | str | `Nam` or `Nữ` |

### TenantResponse shape
```json
{
  "id": "uuid",
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "cccd": "001234567890",
  "gender": "Nam",
  "date_of_birth": "1995-03-15",
  "permanent_address": "45 Phố Huế, Hà Nội",
  "current_room_id": null,
  "current_room_code": null,
  "occupation": "Kỹ sư",
  "license_plate": null,
  "debt": 0,
  "status": "Đã trả phòng",
  "notes": null,
  "created_at": "2026-05-19T...",
  "updated_at": "2026-05-19T..."
}
```

### Validation rules
- `phone`: 10 digits, starts with `0` — regex `^0[0-9]{9}$`
- `cccd`: exactly 12 digits
- `gender`: `Nam` or `Nữ`
- Duplicate `phone` or `cccd` → 409

---

## Contracts — `/api/contracts`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/contracts | 200 | List contracts (paginated, filterable) |
| POST | /api/contracts | 201 | Create contract (side-effects: room+tenant updated) |
| PUT | /api/contracts/{id} | 200 | Update rent/deposit/notes |
| POST | /api/contracts/{id}/renew | 200 | Renew contract → creates new contract |
| POST | /api/contracts/{id}/terminate | 200 | Terminate contract (side-effects: room+tenant freed) |
| DELETE | /api/contracts/{id} | 204 | Delete (409 if active/expiring) |

### GET /api/contracts query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| search | str | Substring match on contract code |
| status | str | `Đang hiệu lực`, `Sắp hết hạn`, `Đã hết hạn`, `Đã chấm dứt` |

### ContractResponse shape
```json
{
  "id": "uuid",
  "code": "HĐ-2026-00001",
  "room_id": "uuid",
  "room_code": "C101",
  "room_name": "Phòng C101",
  "tenant_id": "uuid",
  "tenant_name": "Trần Thị B",
  "tenant_phone": "0912345678",
  "tenant_cccd": "098765432109",
  "start_date": "2026-05-20",
  "end_date": "2027-05-20",
  "monthly_rent": 3500000,
  "deposit": 7000000,
  "billing_cycle": 1,
  "payment_due_day": 5,
  "terminated_at": null,
  "status": "Đang hiệu lực",
  "days_until_expiry": 365,
  "notes": null,
  "created_at": "2026-05-20T...",
  "updated_at": "2026-05-20T..."
}
```

### Contract status computation
Status is NOT stored in the DB. It is computed at Python-level from two fields:

| Condition | Status |
|-----------|--------|
| `terminated_at IS NOT NULL` | `Đã chấm dứt` |
| `terminated_at IS NULL` AND `end_date < today` | `Đã hết hạn` |
| `terminated_at IS NULL` AND `end_date <= today+30` | `Sắp hết hạn` |
| `terminated_at IS NULL` AND `end_date > today+30` | `Đang hiệu lực` |

### Side effects on create
- `room.status` → `Đang thuê`
- `tenant.current_room_id` → room.id
- `tenant.status` → `Đang thuê` (or `Sắp hết hạn` if ≤30 days)

### Side effects on terminate
- `room.status` → `Trống`
- `tenant.current_room_id` → null
- `tenant.status` → `Đã trả phòng`

### billing_cycle valid values
`1`, `3`, `6`, `12` (months). Any other value returns 422.

### Contract code format
Auto-generated as `HĐ-YYYY-NNNNN` where NNNNN is a 5-digit zero-padded sequential number per calendar year.
