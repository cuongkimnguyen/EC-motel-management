.PHONY: install dev test migrate seed

install:
	uv sync --dev

dev:
	uv run uvicorn app.main:app --reload --port 8000

test:
	uv run pytest -v

migrate:
	uv run alembic upgrade head

seed:
	uv run python -m scripts.seed
