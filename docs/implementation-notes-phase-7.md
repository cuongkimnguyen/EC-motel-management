# Phase 7 Implementation Notes

> Decisions, deviations from spec, tradeoffs, and things to know.

---

## Phase 7a: Export (Excel + PDF)

### Decision: WeasyPrint NOT installed — PDF uses HTML-as-bytes fallback
- **Problem:** WeasyPrint requires system-level C libraries (cairo, pango, gdk-pixbuf) that add ~200MB to Docker images and are non-trivial in CI.
- **What I did:** The `pdf_response()` function in `app/common/export.py` serializes the HTML string to bytes and returns it with `application/pdf` content-type headers. The browser/client receives styled HTML that can be printed-to-PDF. This avoids any system dependency.
- **Tradeoff:** Not a true binary PDF. If real PDF generation is needed later, install WeasyPrint and update `pdf_response()` — the rest of the pipeline stays the same.
- **Impact:** `GET /api/reports/export?format=pdf` works but returns HTML bytes, not a real PDF binary.

### Decision: Export endpoints placed BEFORE parameterized routes
- FastAPI matches routes top-down. `/api/expenses/export` must be registered before `/api/expenses/{expense_id}` — otherwise FastAPI treats "export" as an expense_id UUID and returns 422.
- Same for `/api/contracts/export` and `/api/reports/export`.

### Decision: Expense export format validation returns 400 not 422
- The plan used `Query(..., pattern="^(excel)$")` which returns 422 via Pydantic validation. Changed to manual `if format != "excel": raise HTTPException(400, ...)` for a cleaner client-facing error.

### Decision: Contract export fetches Room/Tenant per row (N+1)
- The Contract ORM model has no joined relations to Room/Tenant. The export method queries each room and tenant individually per contract row.
- **Acceptable because:** Exports run at most once per admin action (not on every page load), and the dataset is bounded (motel = hundreds of contracts, not millions).
- **If this becomes slow:** Add eager-load joins or a denormalized export view.

### Decision: Vietnamese text in PDF uses ASCII transliteration
- The HTML PDF template uses ASCII-safe Vietnamese (e.g., "Bao cao" not "Báo cáo") because without WeasyPrint's font subsetting, diacritics may not render correctly in all PDF viewers. If real PDF generation is added, switch to full Vietnamese with proper font embedding.

---

## Phase 7b: File Storage + Facebook Post Publishing

### Decision: Supabase SDK calls are synchronous inside async functions
- `supabase-py`'s storage API is synchronous. The `upload_room_image()` and `upload_expense_receipt()` functions are declared `async` for API consistency but make blocking SDK calls.
- **Acceptable because:** File uploads are infrequent admin-triggered actions. For high-throughput scenarios, wrap in `run_in_executor`.

### Decision: Facebook publish gracefully degrades — no error raised to client
- When `FACEBOOK_WEBHOOK_ENABLED=False` (default), `publish_post()` skips Facebook entirely and marks the post as "Đã đăng" with `fb_link=None`.
- When Facebook is enabled but the API call fails, the post status becomes "Lỗi" (not "Đã đăng"). The admin sees the failure and can retry.
- The endpoint always returns 200 — the status field indicates success/failure, not the HTTP code.

### Decision: `fb_link` format is `https://www.facebook.com/{post_id}`
- Facebook post IDs are in format `{page_id}_{post_id}`. The link `https://www.facebook.com/123_456` resolves to the actual post. This may not work for all page/group configurations but is the standard Graph API pattern.

### Deviation: Room `POST /{id}/images` (not PUT)
- The plan specified `PUT /api/rooms/:id/images` but `POST` is more appropriate since it appends a new image to the existing array (not a full replacement). Used `POST` to match REST convention for creating a sub-resource.

---

## Phase 7c: Email Notifications

### Decision: Added `email` column to Tenant model (new migration 0011)
- **Problem:** The plan assumed tenants have email addresses, but the Tenant model only had `phone` and `cccd`.
- **What I did:** Added a nullable `email: str | None` column via Alembic migration `0011_add_tenant_email.py`. 
- **Impact:** All email-sending methods skip tenants without email (`if not getattr(tenant, "email", None): continue`). The admin sees "sent: 0" when no tenants have email addresses — no crashes.

### Decision: Jinja2 `format_vnd` filter replaced with inline formatting
- The plan's template used `{{ amount_due | int | format_vnd }}` but Jinja2 has no built-in `format_vnd` filter.
- Used `{{ "{:,}".format(amount_due|int) }} VND` in the template instead — produces "3,500,000 VND".

### Decision: `send_payment_reminders` looks up room code via Contract → Room join
- The notification service queries `Contract` to find the active contract for each debtor tenant, then queries `Room` for the room code. This is N+1 but bounded by the number of debtors (typically < 50).

### Decision: Weekly digest sends to `SMTP_FROM_EMAIL` (admin's address)
- Single-admin MVP assumption. For multi-admin, add a separate `ADMIN_EMAILS` list config.

### Decision: Email templates use ASCII Vietnamese
- Same reasoning as PDF — SMTP clients handle UTF-8 but some email renderers may have font issues. Templates use transliterated Vietnamese for maximum compatibility. Can switch to full Vietnamese diacritics when email delivery is confirmed working.

---

## General Notes

### Dependencies added
- `openpyxl>=3.1.0` — Excel workbook generation
- `jinja2>=3.1.0` — Email HTML template rendering

### Dependencies NOT added (deviations from plan)
- `weasyprint` — Replaced with HTML-as-bytes fallback (no system deps needed)
- `supabase` — Not added to pyproject.toml; only needed when `SUPABASE_URL` is configured. The integration module does a lazy `from supabase import create_client` with a clear RuntimeError when unconfigured. To use storage, run `uv add supabase` manually.

### New Alembic migration
- `0011_add_tenant_email.py` — Adds nullable `email` column to `tenants` table

### New files created
| File | Purpose |
|------|---------|
| `app/common/export.py` | Shared Excel/PDF streaming response utilities |
| `app/integrations/storage.py` | Supabase Storage upload client |
| `app/integrations/facebook_graph.py` | Facebook Graph API post publishing |
| `app/integrations/email.py` | SMTP email client with Jinja2 templates |
| `app/integrations/templates/*.html` | 3 email templates (payment, expiry, digest) |
| `alembic/versions/0011_add_tenant_email.py` | Migration for tenant email field |
| `tests/modules/test_export.py` | 9 export endpoint tests |
| `tests/modules/test_storage.py` | 5 storage upload tests |
| `tests/modules/test_facebook_publish.py` | 3 Facebook publish tests |
| `tests/modules/test_email.py` | 4 email notification tests |

### Test approach
- All external calls (Supabase, Facebook, SMTP) are mocked — no real HTTP/email in CI
- `patch.object(settings, ...)` used for Facebook tests instead of replacing entire settings object (preserves auth during test requests)
- Lazy imports in service methods required patching at the integration module level, not the consumer module

### Test results
- **21 new tests added**, all passing
- **193 total tests**, 0 regressions
