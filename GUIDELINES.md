# ITZ Flow - Guidelines & Learnings

This file is a **living notebook**. Whenever you learn something new during testing (app behavior, locator trick, bug, Playwright gotcha), write it here. Claude is also instructed (CLAUDE.md) to update this file after every new learning.

Format: each entry has **Date | Area | Learning | Action**. Add new entries at the top.

---

## Entries

| Date | Area | Learning | Action / Rule |
|------|------|----------|---------------|
| 2026-11-17 | Security incident | When the repo was made public, it turned out that sign-off evidence (report HTML) containing screenshots of the app (company, internal app names, user names) had been committed. It was removed from history and force-pushed; the evidence is now local and gitignored | Never commit reports or screenshots. Keep the repo private. Before making it public, run `git grep -l "data:image/"` and scan for secrets |
| 2026-11-17 | Framework layers | Full automation structure: tests -> fixtures -> pages/components -> api/config/data/utils, plus reporting, process docs, quality gates (lint, format, typecheck, CI). ThemeSwitcher is now in `components/` (a reusable part, not a page). Setup now uses API login (fast) | README "Framework structure (layers)" |
| 2026-11-17 | Tooling versions | `typescript-eslint` does not support TypeScript 7 yet (peer <6.1), so TypeScript is kept on 6.0.x. ESLint 10 flat config + `defineConfig` | Upgrade to TypeScript 7 only when typescript-eslint supports it |
| 2026-11-17 | Login API | `POST /api/auth/login` JSON `{email, password}` -> 200 + cookie `session_token`; `GET /api/auth/me` -> user profile (role, permissions) | `api/AuthApi.ts`; API tests are the next step |
| 2026-11-17 | Audit | The framework audit found: no tsconfig (so no type-check), retries 1 + video/trace on every test (slow and hides flaky tests), every new module added by hand in the config regex, no check of docs/code test IDs, no way to run regression from the master CSV, sign-off numbers written by hand | All fixed: tsconfig + `typecheck`, retries 0, trace/video off, the chromium project picks up all modules automatically, `cases:check` traceability, `test:smoke`/`test:regression`, `module:new`, `signoff` |
| 2026-11-17 | TypeScript 7 | `moduleResolution: node` was removed in TS 7 (error TS5108) | Do not set moduleResolution in tsconfig |
| 2026-11-17 | Limits | No GitHub CI for the tests: the app is only on the local network (172.16.10.x) and a hosted runner cannot reach it | Self-hosted runner or local runs; for now manual + npm scripts |
| 2026-11-17 | QA process | The user said: every task module-wise, like a Senior SQA/SDET, from framework to sign-off report. The master CSV (for regression) is a separate file, updated only when a test case changes | Process `docs/QA_PROCESS.md`, tracker `PLAN.md`, master CSV `npm run cases:csv` |
| 2026-11-17 | Autofill risk | `fill()` in the script on the email field gives a "does not look like an email" error and login does not happen; real typing works. Paste or a password manager may behave the same way | `OBS_AUTH_01`: check paste/autofill by hand (`docs/defects/auth.md`) |
| 2026-11-17 | Test case CSV | As soon as the run starts (reporter `onBegin`), a per-module CSV of the test cases that are about to run is created at `reports/<module>/<sub> test cases <date>_<time>.csv`; only the selected cases (after the `-g` filter). Details come from the docs tables. It is not created on `--list` | Write the doc for a new test first, otherwise the CSV says "Not documented yet" |
| 2026-11-17 | Reports index | `reports/index.html`: date+time at the top (newest first), module-wise below; the history is rebuilt from `history.json` + the report files. Sorted by date/time (the ts format can be mixed) | Never hand-edit the index; the reporter generates it |
| 2026-11-17 | Reports | The user kept the old folder structure (`reports/<module>/`); every run creates a new file with the date-time in the name: `<sub> test DD-MM-YYYY_HH-mm.html`. The user rejected the `reports/runs/...` structure. For manual runs use npm scripts (`test:login`...) and VS Code tasks | The play button of the VS Code extension does not guarantee a report (its own reporter), so use scripts/tasks |
| 2026-11-17 | Theme | Theme buttons Light/Dark/System: the selected button has `aria-pressed=true`; `html[data-theme]` is light/dark/system; background light `rgb(246, 247, 250)`, dark `rgb(10, 12, 16)`; the choice is saved in the `localStorage` key `itzflow-theme`; it persists across reload, from login into the app and on other pages; the default is Light the first time; System follows the computer theme live | Locators/checks in `pages/ThemeSwitcher.ts`. Tests: `tests/theme/theme.spec.ts` |
| 2026-11-17 | Locators | A button like "Lighten Image AI Photo" in the app also matches `name: 'Light'` | Always locate theme buttons with `getByRole('button', { name, exact: true })` |
| 2026-11-16 | Login lockout | There is a limit on wrong logins: "Too many failed attempts. 15 minutes." (HTTP 429). It also triggered with an unknown email (probably IP-based), after 9 wrong attempts across the whole suite | At most 3 wrong attempts in the default suite (TC_12/18/19). Extra security tests are opt-in: `$env:RUN_LOCKOUT_TESTS=1`. The test is skipped on 429 |
| 2026-11-16 | Server load | After 28 parallel login tests the server returned ERR_CONNECTION_REFUSED (down for a while) | Keep `workers: 2` or serial (`--workers=1`); do not run many parallel logins |
| 2026-11-16 | Reports | With `--reporter=list` the HTML/offline report is not created (config reporters get overridden) | Do not pass the `--reporter` flag for reports; just run `npm test`. The offline report opens in the browser by itself after the run (turn off with `OFFLINE_REPORT_OPEN=0`) |
| 2026-11-16 | Typing | Typing 1000 chars with `pressSequentially` times out | Use `fill()` for a long password value; always use `pressSequentially` for the email |
| 2026-11-16 | Login | `locator.fill()` gives the email validation "does not look like an email" and login does not happen; real typing works | `LoginPage.login()` uses `pressSequentially` |
| 2026-11-16 | App | ITZFlow = project-management app (140 projects, status tabs, Cards/Table views, `/my-work`, project tabs Sprints/History/Settings). It has live data | Tests are read-only; never create/delete or use "Sync with ClickUp" |
| 2026-11-16 | Data | Counts (tabs, tickets) are 0 at first on page load and then appear | Wait with `expect.poll`; do not hardcode counts, check relations (All = sum of statuses) |
| 2026-11-16 | Locators | Table headers have the `columnheader` role (text is title-case, uppercase via CSS); status tabs are buttons "Name count"; the Cards button appears in 2 places | `getByRole('columnheader')`, regex tab names, `.last()` for the lower Cards toggle |
| 2026-11-16 | Session | Login happens once in `tests/setup/auth.setup.ts`, session `.auth/user.json` (gitignored). `tests/auth/*` runs without a session | Add a new feature folder to the `testMatch` of the `chromium` project |
| 2026-11-16 | Environment | The app only runs on the local network 172.16.10.x; the PC must be connected to that network | Before testing, check `Test-NetConnection 172.16.10.2 -Port 8300` |
| 2026-11-16 | Auth | Opening the workspace URL without login redirects to `/login` | TC_LOGIN_01 verifies this; logged-in tests need to log in first |
| 2026-11-16 | Login UI | The login page has Light/Dark/System theme buttons; the password field has a Show password toggle (type password <-> text) | Locators are in `LoginPage.ts` |
| 2026-11-16 | Login UI | An empty submit and a malformed email both stay on `/login` (client-side validation) | The assertion is on the URL, not on the error text, until the exact message is confirmed |
| 2026-11-16 | Performance | The first load of the app is slow (some tests took 20s+) and the config timeout is 30s | If flaky timeouts appear, increase `timeout` or `expect.timeout` |
| 2026-11-16 | Shell | On Windows, bash heredoc/quoting sometimes fails | Create files with the `Write` tool, not from the shell |
| 2026-11-16 | Secrets | `.env` has the credentials, gitignored | Never write credentials in chat, the README or code |

## Locator rules (learned)
1. First `getByRole`, `getByPlaceholder`, `getByLabel`; CSS/XPath as a last resort.
2. Locators only in `pages/`, not in specs.

## Open questions (move to entries when answered)
- What is the exact error message on a login failure?
- Which modules/features in the workspace need to be tested?

## Pitfalls checklist (before writing a new test)
- [ ] Is the test independent (does not depend on any other test)?
- [ ] If it needs credentials, is `test.skip(!ENV.hasCredentials, ...)` in place?
- [ ] Was auto-wait / `expect` used instead of a hard `waitForTimeout`?
- [ ] Was the new learning written in this file?
