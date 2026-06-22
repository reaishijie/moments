# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript/Vue full-stack project. `frontend/` contains the Vue 3 + Vite client: source in `frontend/src/`, assets in `frontend/public/`, API wrappers in `frontend/src/api/`, routing in `frontend/src/router/`, stores in `frontend/src/store/`, and UI in `frontend/src/views/` and `frontend/src/components/`. `backend/` contains the Express + Prisma API: routes in `backend/src/routes/`, services in `backend/src/services/`, and schema/migrations in `backend/prisma/`. Deployment assets live in `momentsQuickDeploy/`; docs in `doc/`.

## Build, Test, and Development Commands

Run commands from the relevant subproject:

- `cd frontend && pnpm run dev`: start Vite.
- `cd frontend && pnpm run build`: type-check and build.
- `cd backend && pnpm run dev`: run the API with `tsx watch`.
- `cd backend && pnpm run build`: generate Prisma client and compile TypeScript.
- `cd backend && pnpm run db:setup`: generate Prisma, migrate, and seed data.
- `./build.sh`: prepare deployable output.

## Coding Style & Naming Conventions

Use TypeScript and ES modules with two-space indentation. Name Vue components/views in PascalCase, such as `AdminLayout.vue`; name API modules/utilities in lower camelCase, such as `articles.ts` and `request.ts`. Keep backend routes resource-based and shared logic in `services/`. Avoid whole-file churn where CRLF line endings exist.

## Frontend Patterns

Keep new UI consistent with the existing style. Pages under `FrontLayout` should compose shared pieces such as `Header` and `Brief`. Use `AvatarImage.vue` so broken user images fall back to `/img/avatar.jpg`. Prefer Vue Router `scrollBehavior` for route-level scroll restoration.

## Backend Logging Guidelines

Backend uses the reusable contextual logger in `backend/src/utils/logger.ts` and the HTTP request logger middleware in `backend/src/middleware/httpLogger.middleware.ts`. Prefer `Logger` over direct `console.log/warn/error/debug` in backend code.

```ts
import { Logger } from '../utils/logger.js'

const logger = new Logger('UserService')

logger.log('message')
logger.warn('message')
logger.error('message', error instanceof Error ? error.stack : String(error))
logger.debug('message')
```

Use clear context names such as `APP`, `HTTP`, `AuthService`, and `ExceptionFilter`. Do not log secrets, tokens, passwords, raw credentials, or full request bodies. Keep HTTP request logging wired near app creation before routes.

## Testing Guidelines

No dedicated test runner is configured. For UI changes, run `cd frontend && pnpm run build`. For API, Prisma, or backend changes, run `cd backend && pnpm run build`; for database changes, include a migration and verify with `cd backend && pnpm run db:setup`. Frontend mixed-import warnings for `frontend/src/store/user.ts` are not failures.

## Commit & Pull Request Guidelines

Recent commits use short imperative messages, often prefixed with `fix` or `feat`, such as `fix user home profile display`. Keep commits focused. PRs should include a summary, verification commands, linked issues, screenshots for UI changes, and migration or deployment notes.

## Agent-Specific Instructions

Convert Windows paths such as `C:\Users\huiho\Documents\demo` to WSL paths like `/mnt/c/Users/huiho/Documents/demo`. Prefer structural refactors for structural problems. Before code changes, create a lowercase hyphenated branch: `fix/xxx` or `feat/xxx`.

## Security & Configuration Tips

Keep secrets out of git. Use `backend/.env.example` as the configuration template and do not commit `backend/.env`. Review Docker changes against `momentsQuickDeploy/docker-compose.yml` and `doc/` before publishing deployment updates.
