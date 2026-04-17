# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (from repo root)
pnpm install

# Dev server (runs apps/web)
pnpm dev

# Seed the database from data/vambe_clients.csv
pnpm seed

# Reset all LLM analysis (marks clients as pending, triggers re-analysis on next load)
pnpm reset-analysis

# Build production
pnpm build

# Lint (run from apps/web or root)
pnpm --filter @vambe/web lint
```

**Database migrations** are managed from `packages/database/`:
```bash
cd packages/database
pnpm prisma migrate dev   # create + apply a new migration
pnpm prisma studio        # GUI to inspect the database
```

There is no test suite in this project.

## Environment

Copy `.env.example` to `.env.local` at the repo root and fill in the values:
```
# Supabase pooler URL — used at runtime by Vercel serverless (port 6543)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Anthropic API Key — https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...
```

`DIRECT_URL` is no longer needed. `packages/database/prisma.config.ts` auto-converts `DATABASE_URL` from port 6543 → 5432 and strips PgBouncer flags for migration operations (Prisma 7 migration adapter pattern).

Set `DRY_RUN=true` to intercept all Claude API calls and return mock data (logs estimated token costs) — useful for testing the analysis pipeline without spending tokens.

## Architecture

This is a pnpm monorepo with **Screaming Architecture** — code is organized by feature/domain, not by technical layer.

```
apps/
  web/              — Next.js 16 app (single-page dashboard)
packages/
  database/         — Prisma client + schema (PostgreSQL via @prisma/adapter-pg)
  domain/           — All business logic, LLM calls, services
  ui-system/        — Shared React components + UI utilities
scripts/            — One-off data scripts (seed, reset-analysis)
data/               — vambe_clients.csv (source data)
```

### Database schema

Two models with a 1-1 relationship:
- **`Client`** — raw CSV data (`nombre`, `correo`, `telefono`, `fechaReunion`, `vendedor`, `closed`, `transcripcion`, `hasDuplicateEmail`). Unique constraint on `(nombre, correo)`.
- **`ClientAnalysis`** — LLM-extracted dimensions with `clientId` unique FK (CASCADE delete). Fields: `industria`, `volumenMensajes`, `canalDescubrimiento`, `painPoint`, `integraciones`, `potencial`, `conclusionEjecutiva`, `proximaAccion`. A missing `ClientAnalysis` record means the client has not been analyzed yet.

### Package responsibilities

**`@vambe/database`** — Prisma schema + singleton `prisma` client. Exports Prisma types and the client instance. Uses `@prisma/adapter-pg` for PostgreSQL (Supabase).

**`@vambe/domain`** — Pure business logic, no React. Key services:
- `analysis/analysis.service.ts` — orchestrates batch LLM analysis, exposes `analyzeAll(force, onProgress)` and `analyzeOne(id)`
- `analysis/llm.service.ts` — calls Claude Haiku with forced `tool_use` (guaranteed JSON), uses `cache_control: ephemeral` on system prompt to reduce retry costs to ~10% on retries; handles 429 (exponential backoff via `retry-after` header) and 529 (30s wait)
- `analysis/prompts/categorize.prompt.ts` — system prompt and tool schema for batch categorization (15 clients per batch)
- `clients/clients.service.ts` — paginated client listing with filters; computes `leadScore` dynamically: `potencial` (alta=60, media=35, baja=10) + `volumenMensajes` (alto=40, medio=22, bajo=8); returns `null` for unanalyzed clients
- `metrics/metrics.service.ts` — aggregates KPIs, charts, alerts, and pain point analysis from the DB
- `compose/compose.service.ts` — generates contextual B2B sales emails via Claude Haiku for two scenarios: `potencial_no_cerrado` (follow-up) and `cierre_bajo_potencial` (post-sale check-in)
- `filters/` — shared filter type definitions used across clients API and frontend

**`@vambe/ui-system`** — Shared UI primitives (Button, Card, Badge, Table, etc.) plus UI utilities (`capitalizeFirst`, `formatDate`, `URGENCY_COLORS`, `CHART_COLORS`). UI utilities live here (not in `@vambe/domain`) to keep client bundles free of Node.js dependencies.

**`apps/web`** — Next.js 16 app with a single route (`/`). The page is a client component that:
1. Fetches metrics and clients via REST API routes on load
2. Auto-triggers `POST /api/analysis` (SSE stream) if there are pending clients
3. Renders three views: **Resumen** (KPIs + data quality), **Análisis** (charts), **Clientes** (filterable table)

API routes in `apps/web/src/app/api/` — all use `export const dynamic = "force-dynamic"`:
- `GET /api/metrics` — returns `MetricsData`
- `GET /api/clients` — paginated/filtered client list
- `POST /api/analysis` — starts batch analysis, streams `BatchProgress` as SSE
- `POST /api/analysis/[id]` — re-analyzes a single client

### Client-side hooks

The React page uses custom hooks for API integration:
- `useMetrics()` — fetches on mount, exposes `fetchMetrics()` for manual refresh
- `useClients()` — applies 350ms debounced search on `q` param, syncs filter state
- `useAnalysis()` — manages SSE stream, abortable via `AbortController`, tracks `{ processed, total, currentName }`

### Data flow

1. `pnpm seed` reads `data/vambe_clients.csv`, pre-processes to detect duplicate emails (sets `hasDuplicateEmail` on all affected records), and upserts clients with no `ClientAnalysis`.
2. On dashboard load, if `pendingAnalysis > 0`, the frontend calls `POST /api/analysis` and streams progress.
3. `analyzeAll` batches unanalyzed clients (15 per call), calls Claude Haiku (batch tool_use), and writes the LLM dimensions into `ClientAnalysis` rows.
4. Metrics and charts automatically reflect the newly analyzed data.

### Alerts generated by metrics service

- `potencial_no_cerrado` (warning): unclosed clients with `potencial = alta`
- `cierre_bajo_potencial` (info): closed clients with `potencial = baja`

### Next.js note

This project uses **Next.js 16**, which has breaking changes from earlier versions. Before writing any Next.js-specific code, read the relevant guide in `apps/web/node_modules/next/dist/docs/`.
