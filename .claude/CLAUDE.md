# MotelManage - Claude Project Instructions

## Project overview
This repository is a monorepo with separate frontend and backend folders.

- `frontend/`: existing Next.js frontend, already implemented with mock data
- `backend/`: new backend to be generated and maintained
- `docs/`: shared business specs, API contracts, and architecture notes

## Source of truth
When implementing backend:
1. First read `docs/frontend-business-spec.md`
2. Then inspect `frontend/src/app/**` and related mock/service/types files
3. Treat frontend behavior and docs as the source of truth
4. Do not invent business flows that are not implied by FE or docs

## Backend generation rules
- Never modify frontend unless explicitly asked
- Generate backend code only under `backend/`
- Create or update API contracts in `docs/api-contracts/` before implementing endpoints
- Keep naming aligned with frontend modules:
  - auth
  - rooms
  - tenants
  - contracts
  - expenses
  - reports
  - posts
  - agent
  - notifications

## Required implementation order
For each module:
1. Analyze frontend screens and mock data
2. Infer entities and business rules
3. Write API contract markdown
4. Create DB schema / migration
5. Implement controller/service/repository
6. Add validation and error model
7. Add tests
8. Update docs with endpoint mapping

## Architecture preferences
Prefer:
- clean layered backend architecture
- DTO + validation + service layer
- explicit error handling
- role-ready auth design even if only admin is used first
- pagination, filtering, sorting support
- production-ready structure, not demo-only structure

## Safety rules
- Do not run destructive commands without confirmation
- Do not delete folders outside `backend/`
- Do not overwrite docs blindly; preserve user-authored content
- Before large refactors, propose the plan first

## Definition of done
A backend task is done only when:
- code compiles
- tests pass
- API contract is updated
- README/docs are updated
- frontend mapping is preserved

## Non-negotiable rules
- Never start coding backend before writing or updating the module API contract
- Always inspect the frontend mock service and mock data before defining DTOs
- Preserve Vietnamese business terminology in docs where meaningful
- For reports, design aggregation endpoints, not only CRUD
- For agent module, separate chat, automation, alerts, and task history concerns
- For auth, prepare role-based design even if only admin is active initially
- Every module must include validation and standard error responses