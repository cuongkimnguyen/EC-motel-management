"""Export endpoint tests for expenses, contracts, and reports."""
from datetime import date

from httpx import AsyncClient


# -- Expenses ----------------------------------------------------------------


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
    assert len(resp.content) > 4000


async def test_export_expenses_unsupported_format(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/expenses/export?format=csv", headers=auth_headers)
    assert resp.status_code == 400


async def test_export_expenses_requires_auth(client: AsyncClient):
    resp = await client.get("/api/expenses/export?format=excel")
    assert resp.status_code == 401


# -- Contracts ---------------------------------------------------------------


async def test_export_contracts_excel_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/contracts/export?format=excel", headers=auth_headers)
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]
    assert "contracts_" in resp.headers["content-disposition"]


async def test_export_contracts_requires_auth(client: AsyncClient):
    resp = await client.get("/api/contracts/export?format=excel")
    assert resp.status_code == 401


# -- Reports ----------------------------------------------------------------


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
