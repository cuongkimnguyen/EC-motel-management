# Frontend — Login Page + Settings Page + Route Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/login` authentication page, the `/settings` user profile page, and a Next.js middleware route guard that redirects unauthenticated users to `/login`. Wire both pages to the live backend (`POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/users/me`).

**Architecture:** JWT stored in `localStorage` (`access_token`). A shared `src/lib/api.ts` axios instance auto-attaches `Authorization: Bearer <token>` to every request. A Next.js `middleware.ts` at the repo root runs on every protected route and redirects to `/login` if no token cookie is present. The settings page replaces the hardcoded user identity in `Topbar.tsx`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, axios (already installed), `@heroicons/react` (already installed), `js-cookie` for cookie-based token storage readable by middleware

---

## File Map

**Create:**
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/settings/page.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.ts`
- `frontend/middleware.ts`

**Modify:**
- `frontend/src/components/Topbar.tsx` — replace hardcoded user with live `useCurrentUser()` hook
- `frontend/src/components/Sidebar.tsx` — add logout action

---

## Task 1: API Client + Auth Utilities

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/auth.ts`

- [ ] **Step 1: Install js-cookie**

```bash
cd frontend
npm install js-cookie @types/js-cookie
```

- [ ] **Step 2: Write api.ts**

```typescript
// frontend/src/lib/api.ts
/**
 * Shared axios instance.
 * - Reads the Bearer token from localStorage on every request.
 * - On 401, clears the token and redirects to /login.
 */
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      document.cookie = 'access_token=; Max-Age=0; path=/';
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 3: Write auth.ts**

```typescript
// frontend/src/lib/auth.ts
/**
 * Auth helpers used across login page, Topbar, and middleware.
 */
import Cookies from 'js-cookie';
import { api } from './api';

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
  avatar_url: string | null;
}

/** Store token in both localStorage (for axios) and cookie (for middleware). */
export function saveToken(token: string): void {
  localStorage.setItem('access_token', token);
  // 1-day cookie, readable by Next.js middleware (no httpOnly so JS can read it too)
  Cookies.set('access_token', token, { expires: 1, path: '/' });
}

export function clearToken(): void {
  localStorage.removeItem('access_token');
  Cookies.remove('access_token');
}

export function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  const resp = await api.post<{ access_token: string; user: CurrentUser }>(
    '/api/auth/login',
    { email, password }
  );
  saveToken(resp.data.access_token);
  return resp.data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // ignore errors — we clear state regardless
  }
  clearToken();
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const resp = await api.get<CurrentUser>('/api/auth/me');
  return resp.data;
}
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
cd frontend
npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```
Expected: no errors related to `src/lib/api.ts` or `src/lib/auth.ts`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/lib/auth.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend/auth): add axios API client and auth utilities"
```

---

## Task 2: Middleware Route Guard

**Files:**
- Create: `frontend/middleware.ts`

- [ ] **Step 1: Write middleware.ts**

```typescript
// frontend/middleware.ts
/**
 * Next.js Edge middleware — redirects unauthenticated requests to /login.
 *
 * Reads the 'access_token' cookie (set by auth.ts saveToken()).
 * Protected routes: everything except /login and Next.js internals.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/assets'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Verify the file is recognised by Next.js (no TS errors)**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -10
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/middleware.ts
git commit -m "feat(frontend/auth): add Next.js middleware route guard — redirects to /login"
```

---

## Task 3: Login Page

**Files:**
- Create: `frontend/src/app/login/page.tsx`

- [ ] **Step 1: Write login/page.tsx**

```typescript
// frontend/src/app/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/auth';
import AppLogo from '@/components/ui/AppLogo';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <AppLogo size="lg" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Đăng nhập</h1>
          <p className="text-sm text-slate-500 mb-6">Hệ thống quản lý nhà trọ MotelManage</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chuNha@motelmanage.vn"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang đăng nhập…
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          MotelManage © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors in `login/page.tsx`

- [ ] **Step 3: Manual smoke test**

```bash
cd frontend
npm run dev &
sleep 5
# Open http://localhost:3000/login in browser
# Verify: logo renders, email + password fields visible, form submits
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/login/page.tsx
git commit -m "feat(frontend): add /login page with JWT authentication flow"
```

---

## Task 4: Update Topbar — Live User Identity

**Files:**
- Modify: `frontend/src/components/Topbar.tsx`

- [ ] **Step 1: Replace hardcoded user with live fetchCurrentUser()**

At the top of `frontend/src/components/Topbar.tsx`, add the import:
```typescript
import { fetchCurrentUser, logout, type CurrentUser } from '@/lib/auth';
```

Inside the `Topbar` component, replace the hardcoded user block with:
```typescript
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetchCurrentUser()
      .then(setCurrentUser)
      .catch(() => {
        // fetchCurrentUser triggers 401 interceptor → redirects to /login
      });
  }, []);
```

In the JSX, replace any hardcoded `"Nguyễn Văn Chủ"` / `"Chủ nhà · Admin"` / `"chuNha@motelmanage.vn"` with:
```typescript
// Display name
{currentUser?.full_name ?? '...'}

// Role badge
{currentUser?.role === 'admin' ? 'Chủ nhà · Admin' : currentUser?.role ?? ''}

// Email
{currentUser?.email ?? ''}
```

Replace the mock logout handler with:
```typescript
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };
```

Wire `handleLogout` to the "Đăng xuất" menu item's `onClick`.

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Topbar.tsx
git commit -m "feat(frontend): wire Topbar user identity to live GET /api/auth/me"
```

---

## Task 5: Settings Page

**Files:**
- Create: `frontend/src/app/settings/page.tsx`

- [ ] **Step 1: Write settings/page.tsx**

```typescript
// frontend/src/app/settings/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import AppLayout from '@/components/AppLayout';
import { fetchCurrentUser, type CurrentUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { UserIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type Tab = 'profile' | 'password';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [user, setUser] = useState<CurrentUser | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      setUser(u);
      setFullName(u.full_name);
      setEmail(u.email);
    });
  }, []);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const resp = await api.patch<CurrentUser>('/api/users/me', {
        full_name: fullName,
        email,
      });
      setUser(resp.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setProfileError(axiosErr?.response?.data?.detail || 'Cập nhật thất bại');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    setPwLoading(true);
    try {
      await api.patch('/api/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setPwError(axiosErr?.response?.data?.detail || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  }

  const roleLabel: Record<string, string> = {
    admin: 'Chủ nhà · Admin',
    manager: 'Quản lý',
    staff: 'Nhân viên',
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Cài đặt</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'profile'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'password'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyIcon className="w-4 h-4" />
            Đổi mật khẩu
          </button>
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Thông tin tài khoản</h2>

            {/* Role badge (read-only) */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-slate-500">Vai trò:</span>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                {roleLabel[user?.role ?? ''] ?? user?.role ?? '—'}
              </span>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                Cập nhật thành công
              </div>
            )}
            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                >
                  {profileLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Đổi mật khẩu</h2>

            {pwSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                Đổi mật khẩu thành công
              </div>
            )}
            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                {pwError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-slate-400 mt-1">Ít nhất 8 ký tự</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                >
                  {pwLoading ? 'Đang đổi…' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Verify settings page requires a backend endpoint: PATCH /api/users/me/password**

The settings page calls `PATCH /api/users/me/password`. Verify this endpoint exists in the backend:

```bash
grep -r "me/password" backend/app/modules/users/router.py
```

If the endpoint does not exist, add it to `backend/app/modules/users/router.py`:

```python
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.patch("/me/password", response_model=dict)
async def change_password(
    payload: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    from app.core.security import hash_password, verify_password
    from app.modules.users.repository import UserRepository
    repo = UserRepository(db)
    user = await repo.get_by_id(str(current_user["id"]))
    if not user or not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    await repo.update(user, password_hash=hash_password(payload.new_password))
    return {"ok": True}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/settings/page.tsx
git commit -m "feat(frontend): add /settings page with profile + password change tabs"
```

---

## Task 6: Add NEXT_PUBLIC_API_URL to frontend env

- [ ] **Step 1: Create frontend/.env.local**

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 2: Verify .gitignore excludes .env.local**

```bash
grep -n ".env.local" frontend/.gitignore || grep -n ".env.local" .gitignore
```
Expected: `.env.local` is listed — do not commit this file.

- [ ] **Step 3: Commit the env example**

```bash
cat > frontend/.env.example << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
git add frontend/.env.example
git commit -m "chore(frontend): add .env.example with API URL"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** `/login` page (form, error state, redirect), `/settings` page (profile tab, password tab), route guard middleware redirecting unauthenticated requests to `/login`, Topbar live user identity — all from spec section 10 covered.
- [x] **No placeholders:** All JSX is complete and styled with Tailwind. All API calls use the shared `api.ts` axios instance.
- [x] **Type consistency:** `CurrentUser` interface defined once in `auth.ts`, imported everywhere (Topbar, settings page, auth.ts). `login()` returns `CurrentUser`; `fetchCurrentUser()` returns `CurrentUser`.
- [x] **Token flow:** `saveToken()` writes to both `localStorage` (for axios interceptor) and a 1-day cookie (for middleware `request.cookies`). `clearToken()` removes both. Logout calls backend then clears and redirects.
- [x] **Graceful error:** 401 from any API call triggers the axios interceptor → clears token → redirects to `/login`. No silent failures.
- [x] **Backend dependency:** Settings page `PATCH /api/users/me/password` — Task 5 step 3 checks if the endpoint exists and provides the implementation if missing.
