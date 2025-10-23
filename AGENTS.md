# Repository Guidelines

## Project Structure & Module Organization
- Backend (Go): `e2ee_sync_back/`
  - Entry: `e2ee_sync_back/main.go`
  - HTTP: Echo handlers in `handlers/`, session in `middleware/`, models in `models/`, in‑memory stores in `store/`
- Frontend (React + TS + Vite): `e2ee_sync_front/`
  - Entry: `src/main.tsx`, app shell: `src/App.tsx`
  - Features in `src/features/{auth,dashboard,debug}/` with `api/`, `components/`, `types/`
  - Shared constants: `src/shared/constants/`
- Local dev via Docker Compose: `compose.yml` (frontend 5173, backend 8080)

## Build, Test, and Development Commands
- Compose dev (hot reload both): `docker compose up`
- Backend
  - Run: `cd e2ee_sync_back && go run .`
  - Build: `cd e2ee_sync_back && go build`
  - Hot reload (Air): `cd e2ee_sync_back && air`
- Frontend
  - Dev server: `cd e2ee_sync_front && pnpm dev`
  - Build: `cd e2ee_sync_front && pnpm build`
  - Lint: `cd e2ee_sync_front && pnpm lint`

## Coding Style & Naming Conventions
- Go: follow standard Go style; run `go fmt ./...` before pushing. Package names lower_snake, files lower_snake, exported types `PascalCase`, locals `camelCase`.
- TypeScript/React: 2‑space indent, components `PascalCase` (e.g., `LoginForm.tsx`), hooks/utilities `camelCase` (`messageApi.ts`). Keep feature‑first folders. Use Biome (`pnpm lint`) to format/lint.
- API paths and constants live in `src/shared/constants/` (e.g., `api.ts`).

## Testing Guidelines
- Current PoC has no formal tests. If adding:
  - Backend: place `_test.go` alongside code; run `go test ./...`.
  - Frontend: prefer Vitest + React Testing Library, colocate tests as `*.test.ts[x]`.
  - Aim for unit tests on handlers/stores and feature APIs; keep tests deterministic.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subjects (≤ 50 chars). Examples: `impl message sending`, `fix login error`, `refactor store`.
- Branches: `feat/<short-topic>`, `fix/<issue-id>`, `chore/<task>`.
- PRs must include:
  - Clear description and rationale; reference issues (e.g., `Closes #12`).
  - Screenshots/GIFs for UI changes (login, dashboard, debug).
  - Test plan: exact commands and expected results.

## Security & Configuration Tips
- PoC warning: in‑memory stores, public debug endpoint, no passwords/E2EE. Do not deploy as‑is.
- CORS allows `http://localhost:5173`; frontend reads API base from `VITE_API_URL` (see `compose.yml`). Adjust for non‑docker dev in `e2ee_sync_front/src/shared/constants/api.ts`.
