[Português](README.md) · **English**

[![CI](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml)

# Interactive Web Simulator for Basic Computer Skills

A practice environment for participants in **Meninas Digitais UTFPR-CP**, an outreach project at UTFPR, Cornélio Procópio Campus. Primarily intended for girls aged 12–18, it helps build basic computer skills for activities such as Technovation Girls.

The planned activities follow **instruction → participant action → validation → immediate feedback**. Data handled within activities is temporary, and only progress per anonymous session is recorded, without changing real files, accounts or services.

## Current status

The **PB-04** foundation provides the development environment, tests and CI. **Increment 1 — Programs (RF-01 through RF-21)** supports opening, closing and switching programs, with instructions, feedback, repetition and return to activity selection. **Increment 2 — Files (RF-22 through RF-30)** is available for creating, saving, renaming and deleting files. **Increment 3 — Email (RF-31 through RF-45)** is available for creating accounts, signing in, composing, sending and discarding simulated messages. **Increment 4 — Google Docs (RF-46 through RF-75)** provides four guided activities: exploring the interface, inserting elements, exporting and using editor tools. The interface preserves the validated prototype's colors and logo. The web app already integrates with the API to record and restore activity progress per anonymous session.

Reserved computer shortcuts are taught through controls within the page. Window state is local and resets when changing methods, repeating or leaving an activity. In Programs, Notepad supports minimizing, maximizing, restoring and closing. In Files, the document and saved file exist only in the activity state; repeating or leaving discards them. In Email, created accounts stay only in memory while the module is open; leaving it or reloading discards accounts. Messages and drafts exist only within the activity and are discarded when repeating or leaving it. Registration checks username availability and passwords with at least 8 characters, letters and numbers; password fields are always masked. Progress is recorded only when clicking “Concluir atividade” after reaching the objective. In Google Docs, documents, inserted elements and sharing exist only within the activity and are discarded when repeating or leaving it. Export creates a representation in simulated Downloads, without a real download. Search counts matches in the content and the table of contents derives from applied headings. Insertions use guided cursor positions without free editing. The minimum zoom is 90% (14.4px), preserving RNF-06 readability. Each activity keeps its individual completion screen, repetition and return to selection. Once all activities are completed, “Ver resumo do módulo” opens an additional summary. Repeating an activity or module never clears completions; selection marks completed activities. The API stores progress (which activities were completed) per anonymous session, but does not write, download or persist files, accounts or other real data.

| Planned module     | Content                                                                            | Requirements        |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------- |
| Programs / Windows | Open, close, switch and manage programs and windows                                | RF-01 through RF-21 |
| Files / Notepad    | Create, save, rename and delete files                                              | RF-22 through RF-30 |
| Email / Gmail      | Create an account, sign in, compose, send and discard simulated messages           | RF-31 through RF-45 |
| Google Docs        | Interface, formatting, insertion, export, tools and simulated collaboration/review | RF-46 through RF-75 |

The API exposes `GET /health` (returns `200` with `{"status":"ok"}`), `GET /progress?sessionId=<uuid>` (returns `{"completedActivityIds":[...]}`, the activities already completed in the session) and `POST /completions` (records a completion; takes `{"sessionId":"<uuid>","activityId":"<id>"}` and is idempotent). Invalid identifiers or additional fields return `400`; JSON bodies are limited to 4kb; compressed JSON is rejected with `415`. CORS accepts the exact origin configured in `CORS_ORIGIN`; when omitted, it stays open for development and tests. The home page does not depend on the API: if it is unavailable, the simulator keeps working, only without restoring or recording progress.

The data model is defined in `apps/api/src/schema.ts` (Drizzle), with three tables: `training_session` (anonymous session, `id` UUID), `activity` (catalog, `id` text) and `activity_completion` (completions, composite key `sessionId` + `activityId`). `db:seed` populates 14 activities across the four modules. The UUID is kept in `sessionStorage`, preserved across tab reloads; if storage fails, one UUID stays in memory while the page is in use. The database session is created on the first recorded completion. There is no real authentication, personal data persistence or real external integration. Publication on Render + Neon is prepared but has not been performed.

### Development requirements

Prototype validation on September 12, 2026 identified three changes for the activities: add a way to go back, highlight the shortcut control, and enable minimize, maximize and close in simulated Notepad.

Development targets a maximum of **500 ms** for simple interactions (RNF-01) and **500 ms** for search and filter updates (RNF-02). Modules must provide fonts of at least 14px and adequate contrast (RNF-06), conflict-free shortcuts (RNF-08), clear, age-appropriate feedback (RNF-09) and masked simulated passwords (RNF-10). The interface uses a 16px base font, supporting text of at least 14px and visible keyboard focus. Modules use local updates; Docs export includes simulated visual progress as required by RF-62; tests validate behavior without machine-dependent timing limits.

## Stack and structure

React, TypeScript and Vite for the web; Node.js, TypeScript and Express for the API; PostgreSQL and Drizzle for the database; Zod for environment validation. Vitest and Playwright handle tests; Docker Compose provisions the database. The monorepo uses npm workspaces, Git and GitHub, with ESLint, Prettier and TypeScript strict mode.

```text
apps/
  web/                       React home page and four modules with custom CSS
    src/api.ts               Anonymous session (sessionStorage or memory) and /progress and /completions clients
    src/ModuleCompletion.tsx Module completion screen
    src/programs/            Navigation, window state and Open/Close/Switch activities
    src/files/               Navigation, temporary document/file and Create/Save/Rename/Delete activities
    src/mail/                Registration, login, composition and temporary messages; progress for 3 activities
    src/docs/                Guided editor, interface, insertion, export and tools; temporary document
  api/                       Express, environment, database connection (Drizzle) and endpoints
    src/schema.ts            Tables training_session, activity and activity_completion
    src/migrate.ts           Applies the migrations in drizzle/
    src/seed.ts              Populates the catalog with the 14 activities
    drizzle/                 Migrations generated by drizzle-kit
tests/e2e/                   Home page, modules, summary and simulated API integration
tests/integration/           Real PostgreSQL persistence, separate from npm run check
.github/workflows/           CI and tag-based delivery
compose.yaml                Development PostgreSQL
```

## Local setup

Requirements: **Node.js 24.x**, **npm 11.x**, Git and Docker with Compose v2 or later running. `.nvmrc` records the recommended and tested Node version (**24.21.0**), and `packageManager` in `package.json` records the npm version that generated the lockfile (**11.19.0**). Ports 5173, 3001 and 5433 must be available.

```sh
git clone https://github.com/fwlipebueno/meninas-digitais-simulator.git
cd meninas-digitais-simulator
npm ci
```

Copy `.env.example` to `.env` at the root: `cp .env.example .env` on macOS/Linux or `Copy-Item .env.example .env` in PowerShell. Example values are for local development only.

```sh
npm run db:up
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
npm run dev
```

Open [localhost:5173](http://localhost:5173). The API responds at [localhost:3001/health](http://localhost:3001/health). `db:up` waits until the database is ready; `db:migrate` and `db:seed` prepare the schema and the activity catalog and are idempotent — run them the first time or after schema changes. Web and API run locally and reload when files change. Stop them with `Ctrl+C`. Use `npm run db:down` to stop the database while preserving its volume.

If the API fails to start, check the Docker service, ports and `DATABASE_URL`. You can run only the web interface with `npm run dev -w apps/web`, without the database — in that case, progress is neither recorded nor restored.

### Environment variables

The API reads the root `.env` when present and also accepts process environment variables without a file. Variables already defined in the process take precedence. Zod validates `PORT` and `DATABASE_URL` before connecting, without displaying credentials in errors. The web app receives no credentials; it accepts `VITE_API_URL` (read at build time by Vite) to point to the API. The `http://127.0.0.1:3001` default exists only in the development server. A production build without this variable keeps activities available locally without progress requests; the console reports the missing configuration. The build does not fail. Set `VITE_API_URL` in the process starting Vite or in `apps/web/.env.local`; Vite does not read the root `.env`. Never use `VITE_*` variables for credentials.

| Variable            | Purpose / example value                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `PORT`              | API HTTP port; defaults to `3001`, integer from 1 to 65535                                          |
| `DATABASE_URL`      | Required PostgreSQL connection: `postgresql://simulator:local-development@localhost:5433/simulator` |
| `POSTGRES_USER`     | User created by Compose: `simulator`                                                                |
| `POSTGRES_PASSWORD` | Example local password: `local-development`                                                         |
| `POSTGRES_DB`       | Database created by Compose: `simulator`                                                            |
| `VITE_API_URL`      | Web: API base URL; required for progress in production builds                                       |

When changing the user, password or database, update `DATABASE_URL` as well. The `POSTGRES_*` variables initialize a new volume; changing them does not update credentials in an existing volume. `.env` is not versioned.

## Commands and tests

Run from the root:

| Command                                | Purpose                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                          | Start web and API together                                          |
| `npm run build`                        | Generate `apps/web/dist` and `apps/api/dist`                        |
| `npm run lint`                         | Check ESLint and Prettier formatting                                |
| `npm run format`                       | Apply formatting                                                    |
| `npm run typecheck`                    | Check application, configuration and test types                     |
| `npm test`                             | Test health, HTTP contracts and environment with Vitest             |
| `npm run test:integration`             | Test real persistence; requires the API build and TEST_DATABASE_URL |
| `npm run test:e2e`                     | Build and test the web app with Playwright in a separate artifact   |
| `npm run check`                        | Run lint, types, Vitest, build and Playwright, in that order        |
| `npm run db:up`                        | Start PostgreSQL and wait until ready                               |
| `npm run db:down`                      | Stop PostgreSQL without deleting its volume                         |
| `npm run db:generate -w apps/api`      | Generate a migration from the schema (`drizzle-kit`)                |
| `npm run db:migrate -w apps/api`       | Apply the migrations to PostgreSQL                                  |
| `npm run db:seed -w apps/api`          | Populate the catalog with the 14 activities                         |
| `npm run db:migrate:built -w apps/api` | Apply migrations from the dist build                                |
| `npm run db:seed:built -w apps/api`    | Populate the catalog from the dist build                            |

Before running Playwright for the first time, install the browser:

```sh
npx playwright install chromium
npm run check
```

On Linux, use `npx playwright install --with-deps chromium` to install system dependencies as well. Playwright builds a separate artifact in `test-results/web`, explicitly setting `VITE_API_URL=http://127.0.0.1:3001` for mocks and preserving `apps/web/dist` without this fallback. It starts its server on port 4173 and checks the home page, Open, Close and Switch flows, Create, Save, Rename and Delete activities, email registration, login, sending and discarding, the four Google Docs activities and each module's completion screen, plus API integration through simulated requests, including keyboard access, return, repetition, confirmation for an unresponsive program and consistency between windows, tasks and previews. Scenarios run on desktop and at 390 × 844 without a database. Updates are immediate and local; tests do not rely on machine-dependent timing. The report is written to `playwright-report/`.

The PostgreSQL test is separate from `npm run check`. Set `TEST_DATABASE_URL` for a test PostgreSQL instance with `CREATE DATABASE` permission, never for production. The test creates and removes its own isolated database, runs compiled migration/seed twice, and checks duplicate completions, timestamps and isolation between two sessions. Example with a disposable container:

```sh
docker run --rm -d --name simulator-progress-test -e POSTGRES_USER=simulator -e POSTGRES_PASSWORD=integration-test -e POSTGRES_DB=simulator_test -p 127.0.0.1:55432:5432 postgres:17.11-alpine
docker exec simulator-progress-test pg_isready -U simulator -d simulator_test
npm run build -w apps/api
npm run test:integration
docker stop simulator-progress-test
```

Wait for `pg_isready` to report readiness and set `TEST_DATABASE_URL=postgresql://simulator:integration-test@127.0.0.1:55432/simulator_test` in the process before running the test.

## CI and delivery

The `CI` workflow runs `npm ci`, `npm run check` and the integration test against ephemeral PostgreSQL on pull requests and pushes to `main`. Tags matching `v*` undergo the same validation and publish `web-<tag>` and `api-<tag>` artifacts in the workflow itself. Smoke test failures retain the report for diagnosis.

The web artifact contains static files. The API artifact includes compiled JavaScript, migrations in `apps/api/drizzle/`, manifests, lockfile and an example environment. After extracting it, configure process variables or the root `.env` and run `npm ci --workspace apps/api --omit=dev`. With PostgreSQL accessible, run `npm run db:migrate:built -w apps/api` and `npm run db:seed:built -w apps/api` before `npm start -w apps/api`. The migration path is relative to the code, independent of the working directory. It includes neither installed dependencies nor secrets. There is no automatic deployment; Render + Neon configuration is described below.

## Contributing

Keep branches and PRs small, follow Conventional Commits for commit messages, and reference the requirement when applicable. Merging requires review and passing CI. See [CONTRIBUTING.md](CONTRIBUTING.md). Tasks are tracked in Trello.

## Team

- Felipe de Almeida Bueno
- Emmanuely Antonia Brandão
- Samuel Ueno Fernandes
- Antonio Carlos Ferreira

## Final deployment — Render + Render + Neon

**Ready for configuration; not published.** No service, public URL or external smoke test was created or verified in this step.

Order: provision Neon Free, prepare its new database, register the API (Render Web Service Free) and web (Render Static Site), configure their actual assigned origins, then publish after review/PR/CI/merge. Update both configurations with their actual URLs before the final smoke test.

| Service | Root directory                | Build command                                       | Start / publish                    |
| ------- | ----------------------------- | --------------------------------------------------- | ---------------------------------- |
| API     | repository root (leave blank) | `npm ci --include=dev && npm run build -w apps/api` | `npm start -w apps/api`            |
| Web     | repository root (leave blank) | `npm ci --include=dev && npm run build -w apps/web` | Publish directory: `apps/web/dist` |

Use Node 24.x per `.nvmrc` and npm 11.x per `package.json`. Production does not require Docker. The compiled API uses production dependencies only; its artifact must retain `apps/api/dist`, `apps/api/drizzle` and workspace manifests/lockfile.

- **API:** `DATABASE_URL` is a backend-only secret. Use the direct Neon PostgreSQL URL with TLS (`sslmode=verify-full`, certificate/hostname validation by the current `pg` driver). Keep other parameters supplied by Neon. The same direct URL works for migrations/seed and API; local PostgreSQL does not require TLS.
- **API:** set `NODE_ENV=production` and use the platform's `PORT`, not a fixed production port. The existing listener without an explicit HOST accepts external IPv4 connections on dual-stack systems, verified by a local smoke test. Set `CORS_ORIGIN` to the exact HTTPS web origin, without a path or trailing slash. CORS does not authenticate clients. Health path `/health` checks the process, not a fresh database query on each request.
- **Web:** set `VITE_API_URL` to the actual absolute HTTPS API URL **at build time**. Do not append `/api`; endpoints are at the root. Trailing slashes are normalized. Changing this value requires rebuilding. Never put database credentials or secrets in `VITE_*` variables.

Before the first release, use a controlled terminal to verify and set process `DATABASE_URL` to the **intended new database**, avoiding accidental reuse of development or another environment. After building the API, run once:

```sh
npm run db:migrate:built -w apps/api
npm run db:seed:built -w apps/api
```

These scripts are idempotent and are not part of normal startup. Production execution requires separate authorization. Local `.env` remains ignored and process variables take precedence. Set `CORS_ORIGIN` in production to restrict browser access to the published frontend; omitting it retains open development CORS.

Post-deployment smoke test: `/health` returns 200; web opens all four modules; reaching an objective sends no POST until Concluir is clicked; verify POST `/completions`, leave/re-enter and check GET `/progress` restoring the completion. Check JSON OPTIONS/preflight across both origins and absence of CORS errors. Repeat with an unavailable API and blocked storage: local training must remain usable. After free API hibernation, verify recording/restoration again; network cold start is separate from the 500 ms local interaction target. No client-side routes exist, so no SPA rewrite is needed.

Operational references: [Render Web Services](https://render.com/docs/web-services), [Render Static Sites](https://render.com/docs/static-sites), [node-postgres TLS](https://node-postgres.com/features/ssl), [Neon connections](https://neon.com/docs/connect/connect-from-any-app).

The isolated production install reports three pre-existing advisories (`body-parser`, Zod and `qs`). The API rejects compressed JSON (`415`, `inflate: false`), the official mitigation for the [decompression DoS](https://github.com/advisories/GHSA-27r3-jxmh-p828), with a regression test. The affected Zod collection and `qs.stringify` paths are not used by current contracts. Versions/lockfile remain unchanged; this is not a claim of a zero-advisory dependency audit.
