# ITZ Flow - Playwright Automation

Web app testing using Playwright (TypeScript) with Page Object Model (POM).
The user speaks Hinglish (Roman Urdu + English); reply in the same style. Code, locators and test names are in English.

## Role and working model (applies to every task)
- In this project you work as a **Senior SQA / SDET (10+ years, manual + automation, multi-domain)**. Every task is done **module-wise** with a proper structure: Framework -> Analysis -> Test Plan -> Test Cases -> Automation -> Execution (CSV + report) -> Defects -> Sign-off report. Full process: `docs/QA_PROCESS.md`, module tracker: `PLAN.md`.
- Before starting a new module or sub-module: explore it, write `docs/test-plans/<module>.md` (template in `docs/templates/`), then the test cases doc (simple English, standard format), then automation, then a run, then defects/observations (`docs/defects/<module>.md`), and finally the sign-off (`docs/signoff/<module> signoff <DD-MM-YYYY>.md`). No shortcuts.
- When a test case changes or a new one is added, update the master CSV: `npm run cases:csv` (and `npm run cases:check`). The master CSV `docs/test-cases/<module>-<sub>.csv` is for regression and is only updated when a test case changes.
- **Work fast (user requirement):** do repeat work with tools: `npm run module:new -- <module> [sub]` (scaffold), `npm run signoff -- <module>` (sign-off draft + evidence), `npm run test:smoke` / `test:regression` (from the master CSV). Time-box: explore once, ~15-25 cases per sub-module, one run, one fix cycle. Prefer a quick sign-off over perfection, and write down the gaps. Details: `docs/QA_PROCESS.md` section 6.
- **Quality gates (before commit):** `npm run check` (typecheck + lint + format:check + cases:check). CI (`.github/workflows/ci.yml`) runs the same. Code format: `npm run format`.
- The sign-off decision is a recommendation (Signed off / Conditional / Not signed off); final approval belongs to the product owner / TPM.

## App under test
- URL: http://172.16.10.2:8300 (only reachable on the local network 172.16.10.x; the PC must be connected to that network)
- Workspace: `/workspaces/1e214489-71f0-4ec2-ad5d-de3a0dd2c0d1`
- An unauthenticated user is redirected to `/login` (TC_LOGIN_01)
- Login page: heading "Welcome back", email placeholder `you@theitzon.com`, Sign in button, Light/Dark/System theme buttons

## Structure
- `config/env.ts` - BASE_URL, WORKSPACE_ID, ITZ_EMAIL, ITZ_PASSWORD from `.env` (`ENV.hasCredentials`)
- `pages/` - Page Objects (BasePage, LoginPage, WorkspacePage...). Locators and actions live only here; `components/` - reusable UI parts (ThemeSwitcher); `api/` - REST wrappers (AuthApi); `utils/constants.ts` - shared constants (LOGGED_OUT, ROUTE)
- `fixtures/test-fixtures.ts` - gives tests ready-made page objects (`loginPage`, `workspacePage`)
- `test-data/users.ts` - validUser, invalidUser, malformedEmail
- `tests/<feature>/<feature>.spec.ts` - test cases by feature: `auth/` (login, signout; without a session), `workspace/`, `project/`, `my-work/` (saved session), `setup/auth.setup.ts` (login once). Naming: `TC_<FEATURE>_NN - description`. A new module = a new folder (`npm run module:new`), and `playwright.config.ts` does not need to change (the chromium project picks up every folder except `auth` and `setup` automatically)
- `utils/` - helpers (empty for now)
- `PLAN.md` - module tracker and status; `GUIDELINES.md` - learnings notebook
- `docs/` - `QA_PROCESS.md`, `TEST_CASE_STANDARD.md`, `test-plans/`, `test-cases/` (md + master csv), `defects/`, `signoff/`, `templates/`

## Rules
1. Locators go only in `pages/`, never in test files. If the UI changes, only the page object is updated.
2. New page: create `pages/XPage.ts`, add it to `fixtures/test-fixtures.ts`, then write the spec.
3. Prefer role/label/placeholder locators (`getByRole`, `getByPlaceholder`); CSS/XPath as a last resort.
4. **Never commit:** credentials, `.env`, reports or screenshots of the app (internal data: company and app names, user names). `reports/` and `docs/signoff/evidence/` are gitignored. Keep the repo private. Never write credentials in code, the README or chat output. Only in `.env` (gitignored). `.env.example` has empty values.
5. Tests that need credentials should use `test.skip(!ENV.hasCredentials, ...)`.
6. Code comments should be beginner-friendly English (follow the existing style).
7. When a new feature is added, update the README and the plan doc.

## Commands
- `npm run check` - all quality gates; `npm run typecheck` - TypeScript check; `npm run lint` / `npm run format`; `npm run cases:check` - traceability check of test IDs across docs/CSV/code
- `npm run test:smoke` - High priority only (from the master CSV); `npm run test:regression` - all Regression cases
- `npm run module:new -- <module> [sub]` - scaffold a new module; `npm run signoff -- <module>` - sign-off draft
- `npm run cases:csv` - update the master CSV (after a test case changes)
- `npm test` - headless run (retries 0, workers 2)
- `npm run test:headed` - show the browser
- `npm run report` - HTML report
- `npx playwright test tests/auth/login.spec.ts` - single file

## Reports (keep the effort low, user preference)
- A screenshot of every test is included in the report (`screenshot: 'on'`).
- **The folder structure stays as it was** (every module has its own folder `reports/<module>/`). Every run creates a **new file**, with the date and time in the name: `reports/<module>/<submodule> test <DD-MM-YYYY>_<HH-mm>.html`. Example: `reports/theme/theme test 17-11-2026_03-05.html`, `reports/theme/theme test 17-11-2026_03-17.html`. An old file is never overwritten (if it runs again in the same minute, seconds are appended to the end of the name). Never create a new folder structure like `reports/runs/...`.
- **Test cases CSV (BEFORE the run, per module):** as soon as the run starts, a CSV of the test cases that are about to run is also created in `reports/<module>/`, named with the same date-time as the report: `reports/theme/theme test cases 17-11-2026_15-33.csv` (report: `theme test 17-11-2026_15-33.html`). It contains only the cases running in this run (for example, picking 2 with `-g` gives 2 rows). Columns: ID, Module, Sub-module, Group, Title, Priority, Preconditions, Steps, Expected Result, Automation. The details come from `docs/test-cases/*.md` ("Not documented yet" if a case is not in the doc), so write the doc before writing a new test. Do not edit the CSV by hand; change the doc. Code: `scripts/export-test-cases.js` + reporter `onBegin`.
- `reports/index.html` = history: date + time at the top (newest first), with the module-wise reports under each date-time (links, pass/fail counts). Every run adds an entry; old ones are never overwritten or deleted. The data is in `reports/history.json`; if it gets deleted, the history is rebuilt from the `reports/<module>/*.html` files when the index is generated. `npm run reports` opens it.
- Reports are single files with embedded screenshots and open with a double-click.
- The report is produced by the **config's reporter**, so never pass a `--reporter=...` flag. The report opens automatically in the browser (turn it off with `OFFLINE_REPORT_OPEN=0`; keep it off for background runs).
- **Manual run (with a report):** in the terminal use `npm run test:login`, `test:theme`, `test:workspace`, `test:project`, `test:my-work`, `test:auth`, `npm test`, `npm run test:headed`; or in VS Code use Terminal > Run Task > "Test: ..." (`.vscode/tasks.json`). The play button of the VS Code Playwright extension does not guarantee a report (it uses its own reporter), so use the commands/tasks above for manual runs.
- Do not spend extra time/effort on reporting; leave `reporters/offline-report.ts` as it is unless something breaks.

## Status (17-11-2026)
- Auth/Login: 33 cases, 28 pass, 5 opt-in (lockout risk) not run. Auth/Sign out: 1 pass. Auth sign-off: **Conditional** (`docs/signoff/auth signoff 17-11-2026.md`, obs `docs/defects/auth.md`).
- Theme: 16/16 pass, sign-off **Conditional** (manual dark-mode visual check pending, `docs/signoff/theme signoff 17-11-2026.md`).
- Workspace, Project, My work: old specs (written before the process); when the module starts, bring them back to the standard: plan -> doc -> new titles.
- Credentials are set in `.env`; login uses `pressSequentially`, not `fill()` (GUIDELINES.md). All tests are read-only: the app is live.
- Next: ask the user for the next module (Workspace / Project / My work); open Auth items are in `PLAN.md`.

## Test case format (the same in every module)
- Format and rules: `docs/TEST_CASE_STANDARD.md`. Every sub-module has an English test case doc: `docs/test-cases/<module>-<submodule>.md` (ID, Title, Priority, Preconditions, Steps, Expected result).
- Modules are tested one at a time; every sub-module = one doc + one spec + one report. Follow the standard's checklist before adding a new module.

## Lockout warning
The login page locks for 15 min after wrong attempts (HTTP 429). The default login suite makes at most 3 wrong attempts; run the extra security tests only with `$env:RUN_LOCKOUT_TESTS=1`, and even then sparingly. Do not use more than 2 parallel workers.

## Learnings file
`GUIDELINES.md` is the project's living notebook. Whenever you learn something new (app behavior, locator trick, bug, gotcha, user's answer), add an entry to `GUIDELINES.md` right away (Date | Area | Learning | Action). Before writing a new test, check that file's pitfalls checklist.

## Plan
**Reading order for a new session/agent:** `CLAUDE.md` -> `PLAN.md` -> `GUIDELINES.md` -> `README.md`.
- `PLAN.md` - local plan (goal, status, phases, blockers, handoff checklist). Source of truth.
- Online copy: https://claude.ai/artifact/FAtB3ENWneLY3MYwj56jbD (Claude Docs, "ITZ Flow - Playwright Automation Plan")
- After finishing work, update the status/phases in `PLAN.md` and the "Status" section of this file; before ending a session, follow the handoff checklist in PLAN.md.
