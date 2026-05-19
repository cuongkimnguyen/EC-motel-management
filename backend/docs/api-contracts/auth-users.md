# API Contract: Auth & Users

**Module:** auth, users  
**Base URL:** `/api`  
**Date:** 2026-05-18  
**Status:** Draft  

---

## Overview

Stateless JWT-based authentication for the MotelManage property management system. All tokens are Bearer JWTs — no server-side session storage. The role system is designed for three roles (`admin`, `manager`, `staff`) though only `admin` is active in the initial release.

**Vietnamese business context:**
- `admin` → Chủ nhà (Owner) — full access to all modules
- `manager` → Quản lý (Manager) — access to rooms, contracts, tenants, expenses, reports
- `staff` → Nhân viên (Staff) — access to posts and chat conversations

---

## Shared Shapes

### UserResponse

```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "role": "admin | manager | staff",
  "avatar_url": "string | null",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### TokenResponse

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

### PaginatedResponse[T]

```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "total_pages": 3
}
```

### ErrorResponse

```json
{
  "error": "string",
  "message": "string",
  "status_code": 400
}
```

---

## Auth Endpoints

### POST /api/auth/login

Authenticate a user and issue JWT tokens.

**Auth required:** No

**Request body:**

```json
{
  "email": "chuNha@motelmanage.vn",
  "password": "string"
}
```

| Field    | Type   | Required | Constraints               |
|----------|--------|----------|---------------------------|
| email    | string | Yes      | Valid email format        |
| password | string | Yes      | Min 8 characters          |

**Response 200 — Success:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Response 400 — Validation error:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "email is required",
  "status_code": 400
}
```

**Response 401 — Invalid credentials:**

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Email hoặc mật khẩu không đúng",
  "status_code": 401
}
```

**Response 403 — Account inactive:**

```json
{
  "error": "ACCOUNT_INACTIVE",
  "message": "Tài khoản đã bị vô hiệu hóa",
  "status_code": 403
}
```

---

### GET /api/auth/me

Get the currently authenticated user's profile.

**Auth required:** Yes (Bearer token)

**Response 200 — Success:** [UserResponse](#userresponse)

**Response 401 — Unauthorized:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "status_code": 401
}
```

---

### POST /api/auth/refresh

Exchange a valid refresh token for a new access token and refresh token pair (token rotation).

**Auth required:** No

**Request body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field         | Type   | Required | Constraints  |
|---------------|--------|----------|--------------|
| refresh_token | string | Yes      | Non-empty    |

**Response 200 — Success:** [TokenResponse](#tokenresponse)

**Response 401 — Invalid or expired refresh token:**

```json
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token không hợp lệ hoặc đã hết hạn",
  "status_code": 401
}
```

---

### POST /api/auth/logout

Invalidate the current session. Stateless — client is responsible for discarding stored tokens. This endpoint exists to support future server-side token blacklisting.

**Auth required:** Yes (Bearer token)

**Request body:** None

**Response 200 — Success:**

```json
{
  "message": "Đăng xuất thành công"
}
```

**Response 401 — Unauthorized:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "status_code": 401
}
```

---

## Users Endpoints

### GET /api/users/me

Get the authenticated user's own profile. Identical to `GET /api/auth/me` but under the users resource for consistency.

**Auth required:** Yes (Bearer token)

**Response 200 — Success:** [UserResponse](#userresponse)

**Response 401 — Unauthorized:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "status_code": 401
}
```

---

### PATCH /api/users/me

Update the authenticated user's own profile. Only non-sensitive fields are allowed (cannot change email, password, or role via this endpoint).

**Auth required:** Yes (Bearer token)

**Request body (all fields optional):**

```json
{
  "full_name": "Nguyễn Văn Chủ",
  "avatar_url": "https://example.com/avatar.png"
}
```

| Field      | Type          | Required | Constraints                       |
|------------|---------------|----------|-----------------------------------|
| full_name  | string        | No       | Min 2, max 100 characters         |
| avatar_url | string \| null | No      | Valid URL or null to remove avatar |

**Response 200 — Success:** [UserResponse](#userresponse)

**Response 400 — Validation error:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "full_name must be at least 2 characters",
  "status_code": 400
}
```

**Response 401 — Unauthorized:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "status_code": 401
}
```

---

### GET /api/users

List all users. Admin only.

**Auth required:** Yes (Bearer token, role: `admin`)

**Query parameters:**

| Parameter | Type    | Default | Description                             |
|-----------|---------|---------|-----------------------------------------|
| page      | integer | 1       | Page number (1-indexed)                 |
| limit     | integer | 20      | Items per page (max 100)                |
| role      | string  | —       | Filter by role: `admin|manager|staff`   |
| is_active | boolean | —       | Filter by active status                 |
| search    | string  | —       | Search by full_name or email (partial)  |

**Response 200 — Success:** [PaginatedResponse[UserResponse]](#paginatedresponset)

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "chuNha@motelmanage.vn",
      "full_name": "Nguyễn Văn Chủ",
      "role": "admin",
      "avatar_url": null,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

**Response 401 — Unauthorized:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "status_code": 401
}
```

**Response 403 — Forbidden (non-admin caller):**

```json
{
  "error": "FORBIDDEN",
  "message": "Chỉ admin mới có quyền xem danh sách người dùng",
  "status_code": 403
}
```

---

### POST /api/users

Create a new user. Admin only.

**Auth required:** Yes (Bearer token, role: `admin`)

**Request body:**

```json
{
  "email": "nhanvien@motelmanage.vn",
  "password": "string",
  "full_name": "Trần Thị Nhân Viên",
  "role": "staff"
}
```

| Field     | Type   | Required | Constraints                         |
|-----------|--------|----------|-------------------------------------|
| email     | string | Yes      | Valid email format, must be unique  |
| password  | string | Yes      | Min 8 characters                    |
| full_name | string | Yes      | Min 2, max 100 characters           |
| role      | string | Yes      | One of: `admin`, `manager`, `staff` |

**Response 201 — Created:** [UserResponse](#userresponse)

```json
{
  "id": "uuid",
  "email": "nhanvien@motelmanage.vn",
  "full_name": "Trần Thị Nhân Viên",
  "role": "staff",
  "avatar_url": null,
  "is_active": true,
  "created_at": "2026-05-18T00:00:00Z",
  "updated_at": "2026-05-18T00:00:00Z"
}
```

**Response 400 — Validation error:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "password must be at least 8 characters",
  "status_code": 400
}
```

**Response 401 — Unauthorized:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "status_code": 401
}
```

**Response 403 — Forbidden (non-admin caller):**

```json
{
  "error": "FORBIDDEN",
  "message": "Chỉ admin mới có quyền tạo người dùng",
  "status_code": 403
}
```

**Response 409 — Email already exists:**

```json
{
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "Email này đã được sử dụng",
  "status_code": 409
}
```

---

## Endpoint Summary

| Method | Path              | Auth    | Role  | Description                  |
|--------|-------------------|---------|-------|------------------------------|
| POST   | /api/auth/login   | No      | —     | Login, receive JWT tokens    |
| GET    | /api/auth/me      | Bearer  | Any   | Get own user profile         |
| POST   | /api/auth/refresh | No      | —     | Refresh token rotation       |
| POST   | /api/auth/logout  | Bearer  | Any   | Logout (stateless)           |
| GET    | /api/users/me     | Bearer  | Any   | Get own user profile         |
| PATCH  | /api/users/me     | Bearer  | Any   | Update own profile           |
| GET    | /api/users        | Bearer  | admin | List all users (paginated)   |
| POST   | /api/users        | Bearer  | admin | Create a new user            |

---

## Notes

- `GET /api/auth/me` and `GET /api/users/me` return identical data. Both are kept for semantic clarity (auth vs. users resource).
- Passwords are never returned in any response.
- Access tokens should have a short TTL (e.g., 15 minutes). Refresh tokens should have a longer TTL (e.g., 7 days).
- The `is_active` flag allows soft-disabling accounts without deletion.
- Future password management endpoints (`POST /api/users/me/change-password`, `POST /api/auth/forgot-password`) are not in scope for this release but should be accounted for in the router structure.
