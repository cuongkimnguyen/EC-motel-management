# Phase 7a — Export (Excel + PDF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real Excel and PDF export to three existing endpoints: `GET /api/expenses/export`, `GET /api/contracts/export`, and `GET /api/reports/export`. All endpoints stream a file download response.

**Architecture:** A shared `app/common/export.py` module wraps `openpyxl` (Excel) and `WeasyPrint` (PDF). Each module's router adds an `/export` endpoint that calls its service, gets structured data, passes it to the exporter, and returns a `StreamingResponse`. No new DB tables required.

**Tech Stack:** `openpyxl` 3.x (Excel), `WeasyPrint` 62.x (PDF via HTML template), FastAPI `StreamingResponse`

---

## File Map

**Create:**
- `backend/app/common/export.py`
- `backend/tests/test_export.py`

**Modify:**
- `backend/app/modules/expenses/router.py` — add `GET /export`
- `backend/app/modules/expenses/service.py` — add `export_excel()`
- `backend/app/modules/contracts/router.py` — add `GET /export`
- `backend/app/modules/contracts/service.py` — add `export_excel()`
- `backend/app/modules/reports/router.py` — add `GET /export`
- `backend/app/modules/reports/service.py` — add `export_excel()` and `export_pdf()`
- `backend/requirements.txt`

---

## Task 1: Install Dependencies

- [ ] **Step 1: Install openpyxl and WeasyPrint**

```bash
cd backend
pip install openpyxl weasyprint
```

- [ ] **Step 2: Add to requirements.txt**

Add these two lines to `backend/requirements.txt`:
```
openpyxl==3.1.5
weasyprint==62.3
```

- [ ] **Step 3: Verify imports**

```bash
python -c "import openpyxl; import weasyprint; print('OK')"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt
git commit -m "chore(deps): add openpyxl and weasyprint for export"
```

---

## Task 2: Shared Export Utilities

**Files:**
- Create: `backend/app/common/export.py`

- [ ] **Step 1: Write export.py**

```python
# backend/app/common/export.py
"""Shared helpers for streaming Excel and PDF responses.

Usage:
    wb = build_excel_workbook("Sheet1", headers, rows)
    return excel_response(wb, "expenses_2025-06.xlsx")

    html = "<html>...</html>"
    return pdf_response(html, "report_2025-06.pdf")
"""
import io
from typing import Any

import openpyxl
from fastapi.responses import StreamingResponse
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter


def build_excel_workbook(
    sheet_name: str,
    headers: list[str],
    rows: list[list[Any]],
    col_widths: list[int] | None = None,
) -> openpyxl.Workbook:
    """Build an openpyxl Workbook with a header row and data rows.

    Args:
        sheet_name: Name of the worksheet tab.
        headers: Column header labels.
        rows: List of row value lists; length must match headers.
        col_widths: Optional list of column widths in characters; defaults to 18.

    Returns:
        Configured openpyxl.Workbook (not yet saved to disk).
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet_name

    # Header style
    header_fill = PatternFill(start_color="1E40AF", end_color="1E40AF", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=11)
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_align
        width = (col_widths[col_idx - 1] if col_widths and col_idx <= len(col_widths) else 18)
        ws.column_dimensions[get_column_letter(col_idx)].width = width

    ws.row_dimensions[1].height = 30

    # Data rows
    data_align = Alignment(vertical="center", wrap_text=True)
    for row_idx, row in enumerate(rows, start=2):
        for col_idx, value in enumerate(row, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.alignment = data_align

    return wb


def excel_response(wb: openpyxl.Workbook, filename: str) -> StreamingResponse:
    """Serialize workbook to bytes and return as a streaming download."""
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def pdf_response(html: str, filename: str) -> StreamingResponse:
    """Render HTML to PDF via WeasyPrint and return as a streaming download."""
    from weasyprint import HTML

    buffer = io.BytesIO()
    HTML(string=html).write_pdf(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
```

- [ ] **Step 2: Verify utilities import**

```bash
cd backend
python -c "from app.common.export import build_excel_workbook, excel_response, pdf_response; print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/common/export.py
git commit -m "feat(export): add shared Excel/PDF streaming utilities"
```

---

## Task 3: Expense Export Endpoint

**Files:**
- Modify: `backend/app/modules/expenses/service.py`
- Modify: `backend/app/modules/expenses/router.py`
- Test: `backend/tests/test_export.py` (expenses section)

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_export.py
from datetime import date
from httpx import AsyncClient


# ── Expenses ──────────────────────────────────────────────────────────────────

async def test_export_expenses_excel_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/expenses/export?format=excel", headers=auth_headers)
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]
    assert "expenses_" in resp.headers["content-disposition"]


async def test_export_expenses_excel_with_data(client: AsyncClient, auth_headers: dict):
    await client.post(
        "/api/expenses",
        json={
            "title": "Tiền điện tháng 6",
            "category": "Điện nước",
            "amount": 2_500_000,
            "expense_date": str(date.today()),
            "payment_status": "Đã thanh toán",
            "payment_method": "Chuyển khoản",
            "building_name": "Khu A",
            "note": "",
        },
        headers=auth_headers,
    )
    resp = await client.get("/api/expenses/export?format=excel", headers=auth_headers)
    assert resp.status_code == 200
    # Verify file is non-empty
    assert len(resp.content) > 5000


async def test_export_expenses_unsupported_format(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/expenses/export?format=csv", headers=auth_headers)
    assert resp.status_code == 400


async def test_export_expenses_requires_auth(client: AsyncClient):
    resp = await client.get("/api/expenses/export?format=excel")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend
pytest tests/test_export.py::test_export_expenses_excel_empty tests/test_export.py::test_export_expenses_requires_auth -v
```
Expected: errors — route doesn't exist yet

- [ ] **Step 3: Add export_excel() to ExpenseService**

Append to `backend/app/modules/expenses/service.py`:

```python
    async def export_excel(self) -> tuple[list[str], list[list]]:
        """Return headers + rows for Excel export (all expenses, no pagination)."""
        expenses, _ = await self.repo.list_expenses(page=1, limit=10_000)
        headers = [
            "Mã chi phí", "Tiêu đề", "Danh mục", "Số tiền (VND)",
            "Ngày chi", "Trạng thái", "Phương thức", "Tòa nhà", "Ghi chú",
        ]
        rows = [
            [
                e.expense_code, e.title, e.category, e.amount,
                str(e.expense_date), e.payment_status, e.payment_method,
                e.building_name, e.note,
            ]
            for e in expenses
        ]
        return headers, rows
```

- [ ] **Step 4: Add export endpoint to expenses router**

Add to `backend/app/modules/expenses/router.py`:

```python
from datetime import date as _date
from fastapi.responses import StreamingResponse
from app.common.export import build_excel_workbook, excel_response

@router.get("/export")
async def export_expenses(
    format: str = Query("excel", pattern="^(excel)$"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
) -> StreamingResponse:
    if format != "excel":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Định dạng không hỗ trợ. Dùng: excel")
    headers, rows = await ExpenseService(db).export_excel()
    filename = f"expenses_{_date.today().strftime('%Y-%m')}.xlsx"
    wb = build_excel_workbook(
        sheet_name="Chi phí",
        headers=headers,
        rows=rows,
        col_widths=[14, 30, 16, 16, 12, 18, 16, 10, 30],
    )
    return excel_response(wb, filename)
```

Note: add the `Query` import if not already present in the router file:
```python
from fastapi import APIRouter, Depends, HTTPException, Query
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend
pytest tests/test_export.py -k "expenses" -v
```
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/expenses/service.py backend/app/modules/expenses/router.py backend/tests/test_export.py
git commit -m "feat(expenses): add GET /export?format=excel endpoint"
```

---

## Task 4: Contract Export Endpoint

**Files:**
- Modify: `backend/app/modules/contracts/service.py`
- Modify: `backend/app/modules/contracts/router.py`
- Test: `backend/tests/test_export.py` (contracts section)

- [ ] **Step 1: Add contract export tests**

Append to `backend/tests/test_export.py`:

```python
# ── Contracts ─────────────────────────────────────────────────────────────────

async def test_export_contracts_excel_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/contracts/export?format=excel", headers=auth_headers)
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]
    assert "contracts_" in resp.headers["content-disposition"]


async def test_export_contracts_requires_auth(client: AsyncClient):
    resp = await client.get("/api/contracts/export?format=excel")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend
pytest tests/test_export.py::test_export_contracts_excel_empty -v
```
Expected: error — route doesn't exist

- [ ] **Step 3: Add export_excel() to ContractService**

Append to `backend/app/modules/contracts/service.py`:

```python
    async def export_excel(self) -> tuple[list[str], list[list]]:
        """Return headers + rows for Excel export."""
        contracts, _ = await self.repo.list_contracts(
            page=1, limit=10_000,
            status=None, room_id=None, tenant_id=None,
            month=None, search=None,
        )
        headers = [
            "Mã hợp đồng", "Phòng", "Khách thuê", "SĐT", "CCCD",
            "Ngày bắt đầu", "Ngày kết thúc", "Tiền thuê (VND)",
            "Đặt cọc (VND)", "Trạng thái", "Còn lại (ngày)", "Ghi chú",
        ]
        today = date.today()
        rows = []
        for c in contracts:
            days_left = (c.end_date - today).days if c.end_date >= today and c.terminated_at is None else None
            rows.append([
                c.code,
                getattr(c, "room_code", ""),
                getattr(c, "tenant_name", ""),
                getattr(c, "tenant_phone", ""),
                getattr(c, "tenant_cccd", ""),
                str(c.start_date),
                str(c.end_date),
                c.monthly_rent,
                c.deposit,
                c.status,
                days_left if days_left is not None else "–",
                c.notes or "",
            ])
        return headers, rows
```

- [ ] **Step 4: Add export endpoint to contracts router**

Add to `backend/app/modules/contracts/router.py`:

```python
from datetime import date as _date
from fastapi.responses import StreamingResponse
from app.common.export import build_excel_workbook, excel_response

@router.get("/export")
async def export_contracts(
    format: str = Query("excel", pattern="^(excel)$"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
) -> StreamingResponse:
    headers, rows = await ContractService(db).export_excel()
    filename = f"contracts_{_date.today().strftime('%Y-%m-%d')}.xlsx"
    wb = build_excel_workbook(
        sheet_name="Hợp đồng",
        headers=headers,
        rows=rows,
        col_widths=[16, 10, 24, 14, 14, 12, 12, 16, 16, 18, 12, 30],
    )
    return excel_response(wb, filename)
```

- [ ] **Step 5: Run tests**

```bash
cd backend
pytest tests/test_export.py -k "contracts" -v
```
Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/contracts/service.py backend/app/modules/contracts/router.py backend/tests/test_export.py
git commit -m "feat(contracts): add GET /export?format=excel endpoint"
```

---

## Task 5: Reports Export Endpoint (Excel + PDF)

**Files:**
- Modify: `backend/app/modules/reports/service.py`
- Modify: `backend/app/modules/reports/router.py`
- Test: `backend/tests/test_export.py` (reports section)

- [ ] **Step 1: Add reports export tests**

Append to `backend/tests/test_export.py`:

```python
# ── Reports ───────────────────────────────────────────────────────────────────

async def test_export_reports_excel(client: AsyncClient, auth_headers: dict):
    resp = await client.get(
        "/api/reports/export?format=excel&period_type=month&selected_year=2025&selected_month=6",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]
    assert "report_" in resp.headers["content-disposition"]


async def test_export_reports_pdf(client: AsyncClient, auth_headers: dict):
    resp = await client.get(
        "/api/reports/export?format=pdf&period_type=month&selected_year=2025&selected_month=6",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "report_" in resp.headers["content-disposition"]


async def test_export_reports_requires_auth(client: AsyncClient):
    resp = await client.get("/api/reports/export?format=excel")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend
pytest tests/test_export.py -k "reports" -v
```
Expected: errors — route doesn't exist

- [ ] **Step 3: Add export methods to ReportsService**

Append to `backend/app/modules/reports/service.py`:

```python
    async def export_excel(
        self,
        period_type: str,
        selected_month: int,
        selected_quarter: int,
        selected_year: int,
        building_id: str,
    ) -> tuple[list[str], list[list]]:
        """Build KPI summary sheet for Excel export."""
        overview = await self.get_overview(
            period_type=period_type,
            selected_month=selected_month,
            selected_quarter=selected_quarter,
            selected_year=selected_year,
            building_id=building_id,
            compare_with_previous=False,
        )
        kpi = overview.kpi
        headers = ["Chỉ số", "Giá trị"]
        rows = [
            ["Tổng doanh thu (VND)", f"{kpi.total_revenue:,}"],
            ["Tổng chi phí (VND)", f"{kpi.total_expense:,}"],
            ["Lợi nhuận ròng (VND)", f"{kpi.net_profit:,}"],
            ["Tỷ lệ lấp đầy (%)", f"{kpi.occupancy_rate:.1f}%"],
            ["Tổng công nợ (VND)", f"{kpi.total_debt:,}"],
            ["Hợp đồng sắp hết hạn", str(kpi.expiring_contracts)],
        ]
        return headers, rows

    async def export_pdf(
        self,
        period_type: str,
        selected_month: int,
        selected_quarter: int,
        selected_year: int,
        building_id: str,
    ) -> str:
        """Build an HTML string for PDF export."""
        overview = await self.get_overview(
            period_type=period_type,
            selected_month=selected_month,
            selected_quarter=selected_quarter,
            selected_year=selected_year,
            building_id=building_id,
            compare_with_previous=False,
        )
        kpi = overview.kpi

        period_label = f"Tháng {selected_month}/{selected_year}" if period_type == "month" else str(selected_year)
        building_label = f"Tòa {building_id}" if building_id != "all" else "Tất cả tòa nhà"

        html = f"""
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; color: #1e293b; margin: 40px; }}
  h1 {{ color: #1e40af; font-size: 22px; }}
  h2 {{ color: #374151; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
  th {{ background: #1e40af; color: white; padding: 8px 12px; text-align: left; font-size: 13px; }}
  td {{ padding: 7px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }}
  tr:nth-child(even) td {{ background: #f8fafc; }}
  .meta {{ color: #64748b; font-size: 12px; margin-bottom: 20px; }}
</style>
</head>
<body>
<h1>Báo cáo vận hành — MotelManage</h1>
<p class="meta">Kỳ: {period_label} &nbsp;|&nbsp; Khu vực: {building_label}</p>

<h2>Chỉ số tài chính</h2>
<table>
  <tr><th>Chỉ số</th><th>Giá trị</th></tr>
  <tr><td>Tổng doanh thu</td><td>{kpi.total_revenue:,} VND</td></tr>
  <tr><td>Tổng chi phí</td><td>{kpi.total_expense:,} VND</td></tr>
  <tr><td>Lợi nhuận ròng</td><td>{kpi.net_profit:,} VND</td></tr>
  <tr><td>Tỷ lệ lấp đầy</td><td>{kpi.occupancy_rate:.1f}%</td></tr>
  <tr><td>Tổng công nợ</td><td>{kpi.total_debt:,} VND</td></tr>
  <tr><td>Hợp đồng sắp hết hạn</td><td>{kpi.expiring_contracts}</td></tr>
</table>
</body>
</html>
"""
        return html
```

- [ ] **Step 4: Add export endpoint to reports router**

Add to `backend/app/modules/reports/router.py`:

```python
from datetime import date as _date
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from app.common.export import build_excel_workbook, excel_response, pdf_response

@router.get("/export")
async def export_report(
    format: str = Query("excel", pattern="^(excel|pdf)$"),
    period_type: str = Query("month", pattern="^(month|quarter|year)$"),
    selected_month: int = Query(7, ge=1, le=12),
    selected_quarter: int = Query(1, ge=1, le=4),
    selected_year: int = Query(2025, ge=2000, le=2100),
    building_id: str = Query("all"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
) -> StreamingResponse:
    svc = ReportsService(db)
    period_label = f"{selected_year}-{selected_month:02d}" if period_type == "month" else str(selected_year)
    filename_base = f"report_{period_label}"

    if format == "excel":
        headers, rows = await svc.export_excel(
            period_type=period_type,
            selected_month=selected_month,
            selected_quarter=selected_quarter,
            selected_year=selected_year,
            building_id=building_id,
        )
        wb = build_excel_workbook(
            sheet_name="Báo cáo",
            headers=headers,
            rows=rows,
            col_widths=[35, 20],
        )
        return excel_response(wb, f"{filename_base}.xlsx")
    else:
        html = await svc.export_pdf(
            period_type=period_type,
            selected_month=selected_month,
            selected_quarter=selected_quarter,
            selected_year=selected_year,
            building_id=building_id,
        )
        return pdf_response(html, f"{filename_base}.pdf")
```

- [ ] **Step 5: Run all export tests**

```bash
cd backend
pytest tests/test_export.py -v
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/reports/service.py backend/app/modules/reports/router.py backend/tests/test_export.py
git commit -m "feat(reports): add GET /export?format=excel|pdf endpoint"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All three export endpoints from spec section 7 covered (`/expenses/export`, `/contracts/export`, `/reports/export` with both excel and pdf).
- [x] **No placeholders:** All code blocks are complete with real column definitions and actual workbook logic.
- [x] **Type consistency:** `build_excel_workbook` signature is consistent across all three usages. `excel_response` and `pdf_response` always receive a filename string.
- [x] **Streaming:** All responses use `StreamingResponse` — no in-memory accumulation in the router layer.
