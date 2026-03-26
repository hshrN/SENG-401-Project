# Software Architecture Overview

This project follows a layered architecture on both the frontend and backend so that UI, use cases, core rules, and external I/O stay separated.

The short version is:

- Presentation handles UI and API entry.
- Application handles use cases and orchestration.
- Domain holds core game rules and shared concepts.
- Infrastructure handles databases, HTTP, hashing, and third-party APIs.

## Dependency Direction

Dependencies should point inward toward the core rules.

```text
Frontend Presentation (pages, components, context)
        |
        v
Frontend Application (src/application)
        |
        v
Frontend Domain (src/domain)
        ^
        |
Frontend Infrastructure (src/infrastructure/api)
        |
        v
HTTP
        |
        v
Backend Presentation (backend/app.py routes)
        |
        v
Backend Application (backend/application)
        |
        v
Backend Domain (backend/domain)
        ^
        |
Backend Infrastructure (models, DB, password hashing, AI providers, migrations)
```

Allowed dependency flow:

- Frontend presentation -> frontend application
- Frontend application -> frontend domain and frontend infrastructure
- Backend presentation -> backend application
- Backend application -> backend domain and backend infrastructure
- Backend infrastructure -> backend domain when needed
- Domain -> no framework, transport, database, or UI concerns

Not allowed:

- React pages/components calling the database directly
- Flask routes containing business logic
- Domain code importing Flask, SQLAlchemy, `fetch`, or third-party SDKs
- Frontend presentation calling API clients directly instead of going through application services

## Layer Responsibilities

### Presentation

Purpose:

- Render UI
- Accept user input
- Parse HTTP requests and return HTTP responses
- Trigger application-layer use cases

Lives in:

- Backend: `backend/app.py`
- Frontend: `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/context/`

Should contain:

- Flask routes
- React pages and UI components
- UI-only state and animation state
- Request parsing and response formatting

Should not contain:

- Direct SQLAlchemy queries from routes beyond wiring concerns
- Core game rules
- Reusable business logic
- Direct HTTP calls from pages/components when an application service exists

Examples in this repo:

- `backend/app.py` maps HTTP routes to application services
- `frontend/src/pages/Game.tsx` renders the game flow and calls `gameService`

### Application

Purpose:

- Orchestrate use cases
- Coordinate domain rules and infrastructure
- Validate use-case inputs
- Return data in a form presentation can use

Lives in:

- Backend: `backend/application/`
- Frontend: `frontend/src/application/`

Should contain:

- Auth, session, round, scenario, leaderboard, and AI orchestration logic
- Frontend service functions that wrap infrastructure API calls
- Cross-step workflow logic

Should not contain:

- Raw UI rendering logic
- Framework-specific route handling
- Low-level database schema definitions
- Pure core rules that belong in domain

Examples in this repo:

- `backend/application/round_service.py`
- `backend/application/scenario_service.py`
- `frontend/src/application/gameService.ts`

### Domain

Purpose:

- Hold the core rules of the game and shared conceptual types
- Stay independent of transport, framework, and storage details

Lives in:

- Backend: `backend/domain/`
- Frontend: `frontend/src/domain/`

Should contain:

- Metric clamping
- Game-over conditions
- Score calculations
- Other pure rule calculations
- Shared frontend type definitions

Should not contain:

- Flask imports
- SQLAlchemy models
- API request logic
- Browser/UI code

Examples in this repo:

- `backend/domain/game.py`
- `frontend/src/domain/types.ts`

### Infrastructure

Purpose:

- Talk to external systems
- Persist and retrieve data
- Wrap external SDKs and transport concerns

Lives in:

- Backend: `backend/models.py`, `backend/migrations/`, environment/config wiring in `backend/app.py`, provider integrations inside backend application services where no separate adapter exists yet
- Frontend: `frontend/src/infrastructure/api/`

Should contain:

- SQLAlchemy models and database access primitives
- HTTP client calls
- Password hashing setup
- Third-party AI provider calls
- Migration files and seeding support

Should not contain:

- React rendering
- Route orchestration
- Pure rule calculations

Examples in this repo:

- `backend/models.py`
- `backend/migrations/`
- `frontend/src/infrastructure/api/gameApi.ts`

## Repo Placement Guide

When adding new code:

- New page or visual component: put it in `frontend/src/pages/` or `frontend/src/components/`
- New frontend use case or workflow wrapper: put it in `frontend/src/application/`
- New frontend API client: put it in `frontend/src/infrastructure/api/`
- New backend route: add it to `backend/app.py`, but keep it thin
- New backend use case: put it in `backend/application/`
- New pure backend rule: put it in `backend/domain/`
- New schema or persistence model: put it in `backend/models.py` and add a migration

Rule of thumb:

- If it answers "how does the game work?" it probably belongs in domain.
- If it answers "what happens when the user does X?" it probably belongs in application.
- If it answers "how do we render or transport this?" it belongs in presentation or infrastructure.

## Current Notes For This Repo

The project already follows the layered shape reasonably well, but a few infrastructure concerns are still pragmatic rather than fully extracted:

- `backend/models.py` acts as the main persistence layer instead of living under a larger infrastructure package
- Some infrastructure wiring still lives in `backend/app.py`
- AI provider calls currently live in `backend/application/ai_service.py`, which is acceptable for now, but could later be split into clearer provider adapters if the integration grows

This is still consistent with the architecture as long as dependency direction stays intact and business rules remain outside presentation.

## Keeping It Consistent

When changing architecture-sensitive code:

- Prefer thin routes and thin pages
- Put reusable workflows in application services
- Keep rule calculations pure where possible
- Avoid bypassing the application layer
- Update this document and the README architecture link if the layer boundaries change

## Onboarding

Start here when contributing:

1. Read the main [README](../README.md)
2. Read this architecture overview
3. Find the layer your change belongs to before creating files
4. If a change crosses layers, keep each layer focused on its own responsibility

If you are unsure where code belongs, default to:

- UI in presentation
- use-case orchestration in application
- pure game logic in domain
- external calls and persistence in infrastructure
