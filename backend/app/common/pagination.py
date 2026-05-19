import math
from dataclasses import dataclass


@dataclass
class PaginationParams:
    page: int = 1
    limit: int = 20

    def __post_init__(self):
        if self.page < 1:
            self.page = 1
        if self.limit < 1:
            self.limit = 1
        if self.limit > 100:
            self.limit = 100

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


def make_paginated_response(data: list, total: int, params: PaginationParams) -> dict:
    return {
        "data": data,
        "total": total,
        "page": params.page,
        "limit": params.limit,
        "total_pages": math.ceil(total / params.limit) if params.limit else 1,
    }
