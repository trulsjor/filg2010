# Repository Guidelines

## Project Structure & Module Organization
The app is an Astro + TypeScript site. `src/pages/index.astro` reads match JSON from `data/` and renders the schedule, while shared helpers live in `src/services/` and `src/utils/`. Automation scripts (scraping, refresh, debug) are under `src/scripts/`. Public assets stay in `public/`, Playwright specs live in `tests/`, and generated datasets (`terminliste.json`, `metadata.json`) are kept in `data/` to keep git-friendly diffs.

## Build, Test, and Development Commands
- `npm run dev` / `npm start`: launch Astro at http://localhost:4321 with hot reload.
- `npm run refresh`: execute `src/scripts/fetchAllTeamsData.ts` to pull the latest fixtures before building.
- `npm run build`: run `astro check` then build using the data already in `data/`.
- `npm run build:fresh`: combine `refresh`, linting, and production build for deployment pipelines.
- `npm run preview`: serve the built `/dist` folder locally.
- `npm test`: run Vitest unit tests followed by the Playwright e2e suite.
- `npm run test:unit`: execute helper/unit specs via Vitest.
- `npm run test:e2e`, `npm run test:e2e -- --project=ui-tests`, `npm run test:ui`: run the Playwright suites headless or in UI mode.

## Coding Style & Naming Conventions
Use TypeScript everywhere (no implicit `any`) and prefer small pure helpers. Keep two-space indentation, double quotes in JSON, and single quotes in TS/ Astro to match the current files. Favor descriptive camelCase for variables (`teamColorsMap`) and PascalCase for types (`Match`, `HandballUrlService`). Astro components should export top-level script blocks and minimal inline styles.

## Testing Guidelines
Playwright is configured via `playwright.config.ts`. Mirror the structure `tests/*.spec.ts` and keep filenames descriptive (e.g., `homepage.spec.ts`). Every UI change should have either a new selector assertion or screenshot comparison. Run `npm test` before pushing; aim to keep coverage of both `data-tests` and `ui-tests` projects since regressions tend to arise in scraping as well as rendering.

## Commit & Pull Request Guidelines
Follow the existing concise, imperative, Norwegian commit style (`Flytt URL-logikk fra utils til HandballUrlService`). Each commit should bundle a logical unit: refresh data separately from UI tweaks. Pull requests should describe the scenario, list commands executed (`npm run build`, `npm test`), and link the relevant Trello/Jira issue. Include screenshots or terminal snippets whenever UI or data output changes.

**Viktig:** Bruk aldri `--no-verify` ved commit. Pre-commit hooks (lint, tester) skal alltid kjøres. Hvis det er feil, fiks dem – ikke omgå dem.

## Data Refresh & Configuration Tips
`config.json` defines teams, lag IDs, and brand colors; keep sensitive IDs out of source control by using `.env` only if a future API requires authentication. Regenerate JSON via `npm run refresh` whenever league data changes, then verify timestamps in `data/metadata.json`. Never edit generated JSON manually—adjust `src/scripts` instead to keep the scraping pipeline trustworthy.
