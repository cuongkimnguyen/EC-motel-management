# Migration Runbook

## Overview

This project uses Alembic for schema migrations. Migrations are sequential and numbered (`0001`, `0002`, ...). Each migration is idempotent only in the forward direction — running `alembic upgrade head` on a clean database always works.

---

## Scenario 1: Fresh database (standard path)

No prior schema exists. Run:

```bash
cd backend
alembic upgrade head
```

All migrations apply in order. Done.

---

## Scenario 2: Legacy schema collision

**Symptom:** `alembic upgrade head` fails with `DuplicateTableError` or `relation "rooms" already exists`.

**Cause:** The database has an incompatible prior schema (different column types, constraints, or missing columns) that Alembic doesn't know about.

### Option A — Stamp and migrate (preferred for staging/production)

If the existing tables are structurally compatible (same column names and types), stamp the database at the last known good revision and let Alembic continue from there:

```bash
# Check current DB state
alembic current

# Stamp at a known baseline (e.g., if rooms/tenants/contracts already exist as 0004)
alembic stamp 0004

# Verify and run any remaining migrations
alembic upgrade head
```

### Option B — Drop and recreate (only for dev/test environments with no real data)

If the existing tables have an incompatible schema (wrong column types, missing columns) and the data is disposable:

```sql
-- Run in psql or any SQL client. Drop in dependency order:
DROP TABLE IF EXISTS rental_bills CASCADE;
DROP TABLE IF EXISTS facebook_posts CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS alembic_version CASCADE;
```

Then run migrations fresh:

```bash
alembic upgrade head
```

> **WARNING:** Only use Option B on databases with no real tenant or contract data. Verify row counts before dropping.

---

## Checking migration status

```bash
# Show current revision
alembic current

# Show pending revisions
alembic history --indicate-current

# Show SQL that would be applied (dry run)
alembic upgrade head --sql
```

---

## Known legacy table dependencies

If dropping tables manually, the correct order due to foreign key constraints is:

```
rental_bills
facebook_posts
contracts       ← references rooms + tenants
tenants         ← references rooms (current_room_id)
rooms
users
```
