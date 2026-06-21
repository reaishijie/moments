# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript/Vue full-stack project. `frontend/` contains the Vue 3 + Vite client: source in `frontend/src/`, assets in `frontend/public/`, API wrappers in `frontend/src/api/`, routing in `frontend/src/router/`, stores in `frontend/src/store/`, and UI in `frontend/src/views/` and `frontend/src/components/`. Reusable UI helpers belong in `frontend/src/components/utils/`; prefer shared components such as `AvatarImage.vue` over repeated fallback logic. `backend/` contains the Express + Prisma API: code in `backend/src/`, routes in `backend/src/routes/`, services in `backend/src/services/`, and schema/migrations in `backend/prisma/`. `momentsQuickDeploy/` is the Docker package. Documentation lives in `doc/`.

## Build, Test, and Development Commands

Run commands from the relevant subproject:

- `cd frontend && npm run dev`: start the Vite development server.
- `cd frontend && npm run build`: type-check Vue files and build the client.
- `cd frontend && npm run preview`: preview the production frontend build.
- `cd backend && npm run dev`: run the API with `tsx watch`.
- `cd backend && npm run build`: generate Prisma client and compile TypeScript to `dist/`.
- `cd backend && npm run start`: run the compiled backend.
- `cd backend && npm run db:setup`: generate Prisma client, migrate, and seed local data.
- `./build.sh`: prepare deployable output from the repository script.

## Coding Style & Naming Conventions

Use TypeScript and ES modules throughout. Follow the existing two-space indentation style in Vue, TypeScript, and JSON files. Name Vue components and views in PascalCase, such as `AdminLayout.vue`; name API modules and utilities in lower camelCase or concise domain names, such as `articles.ts` and `request.ts`. Keep backend routes organized by resource and place shared business logic in `services/`. Some files use CRLF endings; avoid whole-file churn and review suspicious diffs with `git diff --ignore-space-at-eol`.

## Frontend Patterns

Keep behavior in the right layer. Use Vue Router `scrollBehavior` for route-level scroll restoration instead of per-click `window.scrollTo()`. Pages under `FrontLayout` should compose existing pieces like `Header` and `Brief` when they need the standard public shell. Use `AvatarImage.vue` for user images so empty or broken URLs fall back to `/img/avatar.jpg`. For text lists, prefer explicit punctuation, such as `张三、李四`, over spacing-only separation when punctuation is part of the copy.

## Testing Guidelines

No dedicated test runner is configured. Before submitting changes, run `npm run build` in `frontend/` for UI changes and `npm run build` in `backend/` for API or Prisma changes. The frontend build may warn that `frontend/src/store/user.ts` is both dynamically and statically imported; note it, but do not treat it as failure. After route or Vite source changes, restart any running `npm run dev` before browser checks, since old dev servers can serve stale code. For database changes, include a Prisma migration and verify with `npm run db:setup`.

## Commit & Pull Request Guidelines

Recent commits use short imperative messages, often prefixed with `fix` or `Update`, for example `fix image's url for loaclStorage` and `Update docker-readme.md`. Keep commits focused and describe the user-visible change. Pull requests should include a summary, verification commands, linked issues when applicable, screenshots for UI changes, and notes for migration, configuration, or deployment impacts.

## Security & Configuration Tips

Keep secrets out of git. Use `backend/.env.example` as the template for configuration and do not commit `backend/.env`. Review Docker and quick-deploy changes against `momentsQuickDeploy/docker-compose.yml` and `doc/` before publishing deployment updates. Local brainstorming output under `.superpowers/` is temporary tooling state and should not be committed.
