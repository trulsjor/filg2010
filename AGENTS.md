# Repository Guidelines

## Project Structure & Module Organization
The app is a React + Vite + TypeScript site. Pages live in `src/pages/`, handball data services in `src/handball/`, and squad/season resolution in `src/squads/`. Automation scripts are under `src/scripts/`. Public assets stay in `public/`, Playwright specs live in `tests/`, and generated datasets (`terminliste.json`, `metadata.json`) are kept in `data/` to keep git-friendly diffs.

## Build, Test, and Development Commands
- `npm run dev`: launch Vite dev server with hot reload.
- `npm run update-all`: fetch schedules, tables and player stats for every squad in `config.json`.
- `npm run update-squad <kull>`: same, but for a single squad (e.g. `j2010`).
- `npm run update-schedule`: schedules and tables only, skipping player stats.
- `npm run build`: run TypeScript check then Vite build using the data already in `data/`.
- `npm run build:fresh`: combine `update-all` and production build for deployment pipelines.
- `npm run preview`: serve the built `/dist` folder locally.
- `npm test`: run Vitest unit tests followed by the Playwright e2e suite.
- `npm run test:unit`: execute helper/unit specs via Vitest.
- `npm run test:e2e`: run the Playwright suites headless.

## Coding Style & Naming Conventions
Use TypeScript everywhere (no implicit `any`) and prefer small pure helpers. Keep two-space indentation, double quotes in JSON, and single quotes in TS/TSX to match the current files. Favor descriptive camelCase for variables (`teamColorsMap`) and PascalCase for types (`Match`, `HandballUrlService`).

## Testing Guidelines
Playwright is configured via `playwright.config.ts`. Mirror the structure `tests/*.spec.ts` and keep filenames descriptive (e.g., `homepage.spec.ts`). Every UI change should have either a new selector assertion or screenshot comparison. Run `npm test` before pushing. Parsers are covered by fixture-based unit tests in `tests-unit/`, so scraping regressions surface without hitting the network.

## Commit & Pull Request Guidelines
Follow the existing concise, imperative, Norwegian commit style (`Flytt URL-logikk fra utils til HandballUrlService`). Each commit should bundle a logical unit: refresh data separately from UI tweaks. Pull requests should describe the scenario, list commands executed (`npm run build`, `npm test`), and link the relevant Trello/Jira issue. Include screenshots or terminal snippets whenever UI or data output changes.

**Viktig:** Bruk aldri `--no-verify` ved commit. Pre-commit hooks (lint, tester) skal alltid kjøres. Hvis det er feil, fiks dem – ikke omgå dem.

## Data Refresh & Configuration Tips
`config.json` defines the current season and one entry per squad, each with its own teams, colours and cups. Generated data lives under `data/<kull>/<sesong>/`, with `data/index.json` listing every squad and season the site can show. Regenerate via `npm run update-all` whenever league data changes, then verify timestamps in the squad's `metadata.json`. Never edit generated JSON manually—adjust `src/handball` or `src/scripts` instead so the pipeline stays the single source of truth.

Data is read from handball.no's JSON endpoints under `/api/AjaxData/`, which require the header `x-requested-with: XMLHttpRequest`, and from Vue component props embedded in the server-rendered HTML. No browser is involved; Playwright is only used for the e2e suite and for Profixio cup scraping.
