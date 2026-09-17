[Português](README.md) · **English**

[![CI](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/fwlipebueno/meninas-digitais-simulator/actions/workflows/ci.yml)

# Interactive Web Simulator for Basic Computer Skills
A practice environment for participants in **Meninas Digitais UTFPR-CP**, an outreach project at UTFPR, Cornélio Procópio Campus. Primarily intended for girls aged 12–18, it helps build basic computer skills for activities such as Technovation Girls.

The planned activities follow **instruction → participant action → validation → immediate feedback**, using temporary session data without changing real files, accounts or services.

## Current status
Initial repository foundation, corresponding to **PB-04** in the schedule: development environment, tests and CI with artifact delivery. The web app presents the four modules, using the colors, layout and logo supplied in the validated prototype. **The activities are not implemented yet.**

| Planned module     | Content                                                                            | Requirements        |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------- |
| Programs / Windows | Open, close, switch and manage programs and windows                                | RF-01 through RF-21 |
| Files / Notepad    | Create, save, rename and delete files                                              | RF-22 through RF-30 |
| Email / Gmail      | Create an account, sign in, compose, send and discard simulated messages           | RF-31 through RF-45 |
| Google Docs        | Interface, formatting, insertion, export, tools and simulated collaboration/review | RF-46 through RF-75 |

The API exposes only `GET /health`, returning `200` with `{"status":"ok"}`. Startup checks the PostgreSQL connection through Drizzle without creating tables. The endpoint indicates that the process responds; it is not a continuous database check. The home page does not depend on the API.

The data model awaits the analysis and validation phase. There is no real authentication, personal data persistence, external integration or selected hosting provider.

### Development requirements
Prototype validation on September 12, 2026 identified three changes for the activities: add a way to go back, highlight the shortcut control, and enable minimize, maximize and close in simulated Notepad.

Development targets a maximum of **500 ms** for simple interactions (RNF-01) and **200 ms** for search and filter updates (RNF-02). Modules must provide fonts of at least 14px and adequate contrast (RNF-06), conflict-free shortcuts (RNF-08), clear, age-appropriate feedback (RNF-09) and masked simulated passwords (RNF-10). The current screen uses a 16px base font and visible keyboard focus; activity performance will be measured once implemented.

## Stack and structure
React, TypeScript and Vite for the web; Node.js, TypeScript and Express for the API; PostgreSQL and Drizzle for the database; Zod for environment validation. Vitest and Playwright handle tests; Docker Compose provisions the database. The monorepo uses npm workspaces, Git and GitHub, with ESLint, Prettier and TypeScript strict mode.

```text
apps/
  web/                 React home page and custom CSS
  api/                 Express, environment and database connection
tests/e2e/             Smoke test of the built web app
.github/workflows/     CI and tag-based delivery
compose.yaml          Development PostgreSQL
```

## Local setup
Requirements: **Node.js 24.x**, **npm 11.x**, Git and Docker with Compose v2 or later running. `.nvmrc` records the recommended and tested Node version (**24.21.0**), and `packageManager` in `package.json` records the npm version that generated the lockfile (**11.19.0**). Ports 5173, 3001 and 5432 must be available.

```sh
git clone https://github.com/fwlipebueno/meninas-digitais-simulator.git
cd meninas-digitais-simulator
npm ci
```

Copy `.env.example` to `.env` at the root: `cp .env.example .env` on macOS/Linux or `Copy-Item .env.example .env` in PowerShell. Example values are for local development only.

```sh
npm run db:up
npm run dev
```

Open [localhost:5173](http://localhost:5173). The API responds at [localhost:3001/health](http://localhost:3001/health). `db:up` waits until the database is ready; web and API run locally and reload when files change. Stop them with `Ctrl+C`. Use `npm run db:down` to stop the database while preserving its volume.

If the API fails to start, check the Docker service, ports and `DATABASE_URL`. You can run only the web interface with `npm run dev -w apps/web`, without the database.

### Environment variables
The API reads the root `.env` in development and start scripts. Variables already defined in the process take precedence. Zod validates `PORT` and `DATABASE_URL` before connecting, without displaying credentials in errors. The web app receives no credentials and needs no variables at this stage.

| Variable            | Purpose / example value                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `PORT`              | API HTTP port; defaults to `3001`, integer from 1 to 65535                                          |
| `DATABASE_URL`      | Required PostgreSQL connection: `postgresql://simulator:local-development@localhost:5432/simulator` |
| `POSTGRES_USER`     | User created by Compose: `simulator`                                                                |
| `POSTGRES_PASSWORD` | Example local password: `local-development`                                                         |
| `POSTGRES_DB`       | Database created by Compose: `simulator`                                                            |

When changing the user, password or database, update `DATABASE_URL` as well. The `POSTGRES_*` variables initialize a new volume; changing them does not update credentials in an existing volume. `.env` is not versioned.

## Commands and tests
Run from the root:

| Command             | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Start web and API together                                      |
| `npm run build`     | Generate `apps/web/dist` and `apps/api/dist`                    |
| `npm run lint`      | Check ESLint and Prettier formatting                            |
| `npm run format`    | Apply formatting                                                |
| `npm run typecheck` | Check application, configuration and test types                 |
| `npm test`          | Test `/health` over HTTP and environment validation with Vitest |
| `npm run test:e2e`  | Test the built web app with Playwright; requires a prior build  |
| `npm run check`     | Run lint, types, Vitest, build and Playwright, in that order    |
| `npm run db:up`     | Start PostgreSQL and wait until ready                           |
| `npm run db:down`   | Stop PostgreSQL without deleting its volume                     |

Before running Playwright for the first time, install the browser:

```sh
npx playwright install chromium
npm run check
```

On Linux, use `npx playwright install --with-deps chromium` to install system dependencies as well. The smoke test starts its server on port 4173 and checks the modules, their unavailable status, keyboard access, runtime errors and the absence of horizontal scrolling at two widths. Tests do not require a database and cover only the current foundation. The report is written to `playwright-report/`.

## CI and delivery
The `CI` workflow runs `npm ci` and `npm run check` on pull requests and pushes to `main`. Tags matching `v*` undergo the same validation and publish `web-<tag>` and `api-<tag>` artifacts in the workflow itself. Smoke test failures retain the report for diagnosis.

The web artifact contains static files. The API artifact includes compiled JavaScript, manifests, lockfile and an example environment. After extracting it, configure `.env` at the root and run `npm ci --workspace apps/api --omit=dev`, followed by `npm start -w apps/api`, with PostgreSQL accessible. It includes neither installed dependencies nor secrets. There is no automatic deployment: hosting selection remains for the deployment phase.

## Contributing
Keep branches and PRs small, follow Conventional Commits for commit messages, and reference the requirement when applicable. Merging requires review and passing CI. See [CONTRIBUTING.md](CONTRIBUTING.md). Tasks are tracked in Trello.

## Team
- Felipe de Almeida Bueno
- Emmanuely Antonia Brandão
- Samuel Ueno Fernandes
- Antonio Carlos Ferreira
