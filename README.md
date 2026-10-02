# Shift Scheduling App

pnpm monorepo for the React/Vite web client and Hono/SQLite API.

## Requirements

- Node.js 22 or later
- pnpm 12 (Corepack can provide it)

## Local development

1. Install dependencies from the repository root: `corepack pnpm install`
2. Copy `apps/api/.env.example` to `apps/api/.env` and set a random `BETTER_AUTH_SECRET` (at least 32 characters).
3. Create and migrate the local database: `pnpm --filter api db:push` for development, or generate and apply committed migrations with `pnpm db:generate` and `pnpm db:migrate`.
4. Start the API and web app in separate terminals: `pnpm dev:api` and `pnpm dev:web`.

The Vite server proxies `/api` to `http://localhost:8787` by default. Set `API_PROXY_TARGET` only when the API is hosted elsewhere, and set `WEB_ORIGIN=http://localhost:5173` in the API environment for local development.

## Docker

Set `BETTER_AUTH_SECRET` in the root `.env` to a cryptographically random value (for example, generate one with `openssl rand -base64 32`). Optionally set `ADMIN_EMAILS` to a comma-separated list of administrator email addresses. Then run `docker compose up --build` and open <http://localhost:8080>. SQLite is persisted in the `db-data` volume. Docker applies the Drizzle migrations on API startup.

## Structure

- `apps/web`: React, Vite, React Router, TanStack Query
- `apps/api`: Hono, Better Auth, Drizzle ORM, SQLite
- `Dockerfile.web`, `Dockerfile.api`, `docker-compose.yml`: container setup

## Admin access

New accounts default to the `staff` role. Only email addresses listed in `ADMIN_EMAILS` receive the `admin` role at signup. FAQ approvals are restricted to administrators.
