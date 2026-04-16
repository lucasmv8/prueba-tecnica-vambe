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
pnpm prisma migrate dev   # create + apply a new migration (needs DIRECT_URL)
pnpm prisma studio        # GUI to inspect the database
```

## Environment

Copy `.env.example` to `.env.local` at the repo root and fill in the values:
```
# Supabase pooler URL — used at runtime by Vercel serverless (port 6543)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase direct URL — used ONLY by prisma migrate CLI (port 5432)
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Anthropic API Key — https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...
```

Set `DRY_RUN=true` to intercept all Claude API calls and return mock data — useful for testing the analysis pipeline without spending tokens.

## Architecture

This is a pnpm monorepo with **Screaming Architecture** — code is organized by feature/domain, not by technical layer.

```
apps/
  web/              — Next.js 16 app (single-page dashboard)
packages/
  database/         — Prisma client + schema (PostgreSQL via @prisma/adapter-pg)
  domain/           — All business logic, LLM calls, services
  ui-system/        — Shared React components (shadcn-style, Base UI)
scripts/            — One-off data scripts (seed, reset-analysis)
data/               — vambe_clients.csv (source data)
```

### Package responsibilities

**`@vambe/database`** — Prisma schema with a single `Client` model. The model stores both the raw CSV data and the LLM-extracted dimensions (`industria`, `tamanioEmpresa`, `volumenMensajes`, `canalDescubrimiento`, `painPoint`, `integraciones`, `objeciones`, `urgencia`, `etapaDecision`, `resumenLLM`). Null on those fields means the client has not been analyzed yet. Uses `@prisma/adapter-pg` for PostgreSQL (Supabase).

**`@vambe/domain`** — Pure business logic, no React. Key services:
- `analysis/analysis.service.ts` — orchestrates batch LLM analysis, exposes `analyzeAll(force, onProgress)` and `analyzeOne(id)`
- `analysis/llm.service.ts` — calls Claude Haiku with `tool_use` (forced JSON), uses `cache_control: ephemeral` on the system prompt to reduce retry costs, handles 429/529 with backoff
- `analysis/prompts/categorize.prompt.ts` — system prompt and tool schema for batch categorization
- `clients/clients.service.ts` — paginated client listing with filters
- `metrics/metrics.service.ts` — aggregates all dashboard metrics from the DB

**`@vambe/ui-system`** — Shared UI primitives (Button, Card, Badge, Table, etc.) plus UI utilities like `capitalizeFirst`, `formatDate`, `URGENCY_COLORS`, `CHART_COLORS`. Note: UI utilities live here (not in `@vambe/domain`) to keep client bundles free of Node.js dependencies.

**`apps/web`** — Next.js 16 app with a single route (`/`). The page is a client component that:
1. Fetches metrics and clients via REST API routes on load
2. Auto-triggers `POST /api/analysis` (SSE stream) if there are pending clients
3. Renders three views: **Resumen** (KPIs + data quality), **Análisis** (charts), **Clientes** (filterable table)

API routes in `apps/web/src/app/api/`:
- `GET /api/metrics` — returns `MetricsData`
- `GET /api/clients` — paginated/filtered client list
- `POST /api/analysis` — starts batch analysis, streams `BatchProgress` as SSE
- `POST /api/analysis/[id]` — re-analyzes a single client

### Data flow

1. `pnpm seed` reads `data/vambe_clients.csv`, detects duplicate emails, and upserts all clients with `analyzedAt: null`.
2. On dashboard load, if `pendingAnalysis > 0`, the frontend calls `POST /api/analysis` and streams progress.
3. `analyzeAll` batches unanalyzed clients, calls Claude Haiku (batch tool_use), and writes the LLM dimensions back to the DB.
4. Metrics and charts automatically reflect the newly analyzed data.

### Next.js note

This project uses **Next.js 16**, which has breaking changes from earlier versions. Before writing any Next.js-specific code, read the relevant guide in `apps/web/node_modules/next/dist/docs/`.
