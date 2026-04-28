# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Plato is a workout tracking app focused on hypertrophy and load progression. It manages workout plans (intention) and live session logging (execution), with analytics for e1RM and volume over time.

## Commands

### Root (run from monorepo root)
```bash
npm install                  # Install all workspace dependencies
npm run dev                  # Run API + Web simultaneously
npm run build                # Build all workspaces
npm run db:sync              # Prisma db push + generate + build database package
npm run db:studio            # Open Prisma Studio
npm run clean                # Full clean reinstall (rm -rf node_modules + npm install)
```

### Web (apps/web)
```bash
npm run dev -w apps/web      # Vite dev server
npm run build -w apps/web    # tsc -b && vite build
npm run lint -w apps/web     # ESLint
npm run preview -w apps/web  # Vite preview server
```

### API (apps/api)
```bash
npm run dev -w apps/api      # ts-node-dev with --respawn --transpile-only
npm run build -w apps/api    # TypeScript compilation
```

### Database (packages/database)
```bash
npx prisma generate --schema=./packages/database/prisma/schema.prisma
npx prisma db push --schema=./packages/database/prisma/schema.prisma
npx prisma studio --schema=./packages/database/prisma/schema.prisma
```

## Architecture

### Monorepo Structure
- `apps/api` — Express 5 backend (CommonJS, TypeScript)
- `apps/web` — React 19 + Vite frontend (ESM, TypeScript)
- `packages/database` — Shared Prisma client (`@plato/database`), imported by the API

### API (`apps/api/src`)
Domain-based modules under `modules/` — each has `controller`, `routes`, `schema` (Zod), `service`, and optionally `utils`. Shared infrastructure lives in `shared/`: custom `AppError`/`PrismaError` classes, JWT utilities, and middleware (auth, validation, global error handler).

Auth is JWT-based. The auth middleware attaches the decoded user to `req.user` and protects all non-public routes.

### Frontend (`apps/web/src`)
Two-layer feature organization:

**`core/`** — cross-cutting infrastructure:
- `api/` — Axios instance with JWT interceptors; on 401, clears auth store and redirects to login
- `constants/` — typed path constants used everywhere for routing (never raw strings)
- `guards/` — auth guard wrapping protected routes
- `hooks/` — `useCheckSession` (validates token on mount), `useAppMutation` (React Query mutation wrapper)

**`features/`** — domain features (`auth`, `user`, `workouts`), each with pages, components, hooks, stores, and services as needed.

### State Management (strict rules)
- **React Query is the primary source of truth** for all server state. Zustand is subordinate and restricted to ephemeral/session state only (e.g., `auth.store`, `active-workout.store`, `workout-editor.store`).
- **Derived UI states** (`COMPLETED`, `ACTIVE`, `PENDING`) must be computed client-side by crossing `WorkoutExercise.targetSets` with `SessionSet`. Never persist derived states to the DB.
- **Zustand selectors must be granular**: always `useStore(state => state.specificItem)`, never subscribe to the whole store object.

### Database Schema
Seven Prisma models: `User`, `Exercise`, `Workout`, `WorkoutExercise`, `WorkoutSession`, `SessionSet`, `PersonalRecord`. Prisma types are the canonical type source — all TypeScript extensions must compose over them. `any` is forbidden.

### Routing
Wouter is used for routing. All path strings are defined as constants in `apps/web/src/core/constants/path.ts`.

## Development Methodology

**Bottom-up:** DB model → API routes/services → TypeScript contracts → UI.

**Component architecture:** Views are purely declarative. Complex logic (business logic, side effects, store access) lives exclusively in dedicated custom hooks, not in components.

**Refactoring order** (when touching existing code):
1. DRY — abstract duplicated logic/JSX
2. Logical redundancy — eliminate unnecessary derived states
3. Component bloat — break up deep JSX trees or components with excessive local state
4. Logic decoupling — extract to custom hooks
5. SRP subdivision — split into atomic single-responsibility components
6. Zustand optimization — audit store subscriptions for re-render performance

## Environment Variables

**`apps/api/.env`**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=8080
```

**`apps/web/.env`** (optional)
```
VITE_API_URL=/api   # defaults to /api; in dev, Vite proxies /api → localhost:8080
```

**`packages/database/.env`**
```
DATABASE_URL=postgresql://...
```