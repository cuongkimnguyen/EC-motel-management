.PHONY: install dev test migrate seed

install:
	cd backend && uv sync

dev:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

test:
	cd backend && uv run pytest -v

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m scripts.seed
