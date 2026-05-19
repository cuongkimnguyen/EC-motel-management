import math
from app.common.schemas import PaginatedResponse, MessageResponse
from app.common.pagination import PaginationParams, make_paginated_response
from app.common.exceptions import AppException


def test_paginated_response():
    resp = PaginatedResponse[str](data=["a", "b"], total=10, page=1, limit=2, total_pages=5)
    assert resp.total_pages == 5
    assert len(resp.data) == 2


def test_make_paginated_response():
    params = PaginationParams(page=2, limit=5)
    result = make_paginated_response(["x"], total=13, params=params)
    assert result["page"] == 2
    assert result["total_pages"] == math.ceil(13 / 5)
    assert result["data"] == ["x"]


def test_pagination_offset():
    p = PaginationParams(page=3, limit=10)
    assert p.offset == 20


def test_app_exception():
    exc = AppException(status_code=404, detail="Not found", code="NOT_FOUND")
    assert exc.status_code == 404
    assert exc.code == "NOT_FOUND"
