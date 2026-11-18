# ITZ Flow - Test Automation Framework (Playwright + TypeScript, POM)

QA for the ITZ Flow web app (`http://172.16.10.2:8300`, local network only): manual analysis + automation, module by module, from the framework all the way to the sign-off report.

## 1. How we work (QA process)
Every module goes through the same life cycle (details: [docs/QA_PROCESS.md](docs/QA_PROCESS.md)):

`Framework → Analysis → Test Plan → Test Cases → Automation → Execution (CSV + Report) → Defects → Sign-off`

| Item | Location |
| --- | --- |
| Test plan (one per module) | `docs/test-plans/<module>.md` |
| Test cases (plain English, standard format) | `docs/test-cases/<module>-<sub>.md` ([standard](docs/TEST_CASE_STANDARD.md)) |
| **Master test case CSV** (used for regression, updated only when a test case changes) | `docs/test-cases/<module>-<sub>.csv` |
| Defects and observations | `docs/defects/<module>.md` |
| Sign-off report | `docs/signoff/<module> signoff <DD-MM-YYYY>.md` |
| Templates | `docs/templates/` |
| Module tracker and status | [PLAN.md](PLAN.md) |
| Lessons learned (app behaviour, gotchas) | [GUIDELINES.md](GUIDELINES.md) |

## 2. Framework structure (layers)

```
Tests (tests/<module>/<sub>.spec.ts)        "what to check" (steps and assertions only, no locators)
   │  use
Fixtures (fixtures/test-fixtures.ts)        ready objects: loginPage, workspacePage, theme, authApi ...
   │  use
Pages (pages/) + Components (components/)   model of the UI: locators + actions. Page = a whole page, Component = a reusable part (ThemeSwitcher)
API layer (api/)                            REST wrappers (AuthApi): fast setup and API tests
Config / Data / Utils                       config/env.ts (multi-environment), test-data/, utils/constants.ts
Playwright (playwright.config.ts)           projects: setup, auth (no session), chromium (saved session)
Reporting (reporters/, scripts/, reports/)  module-wise report, run CSV, history, master CSV, sign-off generator
Process (docs/)                             QA_PROCESS, test plans, test cases, defects, sign-off, templates
Quality gates (CI, lint, typecheck)         .github/workflows/ci.yml, eslint.config.mjs, .prettierrc.json, tsconfig.json
```

```
ITZ Flow/
├── api/                           AuthApi (login, me)
├── components/                    ThemeSwitcher (reusable UI component)
├── config/env.ts                  URL, workspace id, email, password from .env / .env.<TEST_ENV>
├── fixtures/test-fixtures.ts      gives tests their ready objects
├── pages/                         Page Objects (POM): BasePage, LoginPage, WorkspacePage, ProjectPage, MyWorkPage
├── test-data/                     users, stable app names
├── utils/constants.ts             LOGGED_OUT, ROUTE patterns
├── tests/<module>/<sub>.spec.ts   test cases (auth, workspace, project, my-work, theme)
├── tests/setup/auth.setup.ts      API login, saves the session (.auth/, gitignored)
├── reporters/offline-report.ts    module-wise HTML report + pre-run CSV + history
├── scripts/                       export-test-cases (CSV, traceability), run-regression, new-module, signoff
├── docs/                          process, plans, test cases (md + master csv), defects, sign-off, templates
├── reports/                       (gitignored) reports/<module>/..., index.html, history.json
├── .github/workflows/ci.yml       CI: typecheck, lint, format, cases:check, --list (+ manual smoke on a self-hosted runner)
└── CLAUDE.md, PLAN.md, GUIDELINES.md
```

**Rules:** locators live only in pages/components; keep logic in tests to a minimum; shared values go in utils/constants; when the UI changes, update only pages/components.
**Multi-environment:** set `TEST_ENV=staging` and `.env.staging` is loaded first (then `.env`).

## 3. Setup
1. `npm install` and `npx playwright install chromium`
2. Create `.env` (see `.env.example`): fill in `ITZ_EMAIL` and `ITZ_PASSWORD` (never committed)
3. The PC must be connected to the same local network (172.16.10.x)

## 4. Run commands

| What to run | Command |
| --- | --- |
| All tests | `npm test` |
| Watch the browser | `npm run test:headed` |
| One module | `npm run test:login`, `test:signout`, `test:theme`, `test:workspace`, `test:project`, `test:my-work`, `test:auth` |
| One test, by name | `npx playwright test -g "TC_THEME_04" --headed` |
| Slow motion (to watch) | PowerShell: `$env:SLOWMO=250; npm run test:headed` |
| **Smoke** (High priority only, from the master CSV) | `npm run test:smoke` |
| **Regression** (all Regression cases) | `npm run test:regression` |
| Update the master CSV (after a test case changes) | `npm run cases:csv` |
| Check docs / CSV / code test IDs (traceability) | `npm run cases:check` |
| TypeScript check | `npm run typecheck` |
| Lint / format | `npm run lint`, `npm run format`, `npm run format:check` |
| **All quality gates at once** | `npm run check` |
| Scaffold a new module | `npm run module:new -- <module> [sub]` |
| Sign-off draft (numbers filled in automatically) | `npm run signoff -- <module>` |
| Open the reports history | `npm run reports` |

In VS Code there are also tasks under Terminal > Run Task > "Test: ...". Running from the extension's play button is not guaranteed to produce a report.

## 5. Execution outputs (every run)
- **Before the run:** a CSV of the test cases that are about to run: `reports/<module>/<sub> test cases <DD-MM-YYYY>_<HH-mm>.csv`
- **After the run:** a report (with screenshots): `reports/<module>/<sub> test <DD-MM-YYYY>_<HH-mm>.html`
- **History:** `reports/index.html`, newest date and time on top, grouped by module below. Old reports are never overwritten.

## 6. Important conventions
- Test case ID: `TC_<SUB>_<NN>`. Titles are in plain English, with the test data (never the real password).
- Locators only in `pages/`. Prefer `getByRole`, `getByPlaceholder`, `getByLabel`.
- The app is live: tests are read-only. Keep wrong login attempts low (15-minute lockout). No more than 2 workers.
- In login, type the email with real typing (`pressSequentially`), not `fill()`.
- Credentials only in `.env`.

## 7. Adding a new module (quick way)
1. `npm run module:new -- <module> [sub]`: creates the test plan, test case doc, spec, page object and defect log.
2. Explore the app once, write a short `docs/test-plans/<module>.md`, fill in the test case doc (~15-25 cases).
3. Add the page object and the entry in `fixtures/test-fixtures.ts`, write the spec (the ID in the title must match the doc).
4. `npm run cases:csv`, `npm run cases:check`, `npm run typecheck`. Add a `test:<module>` script to `package.json`.
5. Run it, review the reports, and log defects in `docs/defects/<module>.md`.
6. `npm run signoff -- <module>` (the draft is generated automatically; review it and add the narrative).
7. Update the `PLAN.md` tracker and `GUIDELINES.md`, then commit and push.
