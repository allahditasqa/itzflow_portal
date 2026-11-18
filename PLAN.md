# ITZ Flow - QA Plan and Module Tracker

Last updated: 17-11-2026
Reading order (for a new session or agent): `CLAUDE.md` -> `PLAN.md` (this file) -> `docs/QA_PROCESS.md` -> `GUIDELINES.md` -> `README.md`.

## 1. Goal and role
Module-wise QA of ITZ Flow (`http://172.16.10.2:8300`, a project-management app: workspace, projects, sprints, tickets). Role: Senior SQA / SDET (manual + automation). The full lifecycle of every module: **Test Plan -> Test Cases -> Automation -> Execution (CSV + report) -> Defects -> Sign-off** ([docs/QA_PROCESS.md](docs/QA_PROCESS.md)).

## 2. Module tracker

| Module | Sub-module | Test plan | Test cases | Automated | Last result | Defects / Obs | Sign-off |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | Login | Done | 33 | 33 (5 opt-in) | 28 pass, 5 not run (17-11-2026) | 4 obs | **Conditional** (17-11-2026) |
| Auth | Sign out | Done | 1 | 1 | 1 pass (17-11-2026) | - | Part of Auth |
| Theme | Theme | Done | 16 | 16 | 16 pass (17-11-2026) | none | **Conditional** (manual dark-mode check pending) |
| Workspace | Workspace | Not started | not in new format | 7 old specs | not re-run | - | - |
| Project | Project page | Not started | not in new format | 5 old specs | not re-run | - | - |
| My work | My work | Not started | not in new format | 1 old spec | not re-run | - | - |
| (more) | Ticket detail, Sprint detail, Search, Notifications, Settings | Not explored | - | - | - | - | - |

Note: The old specs of Workspace, Project and My work (`TC_WS_*`, `TC_PRJ_*`, `TC_MW_*`) were written before this process. When these modules start, they will be brought back to the standard with plan -> doc -> new titles.

## 3. Documents per module

| Module | Test plan | Defects | Sign-off |
| --- | --- | --- | --- |
| Auth | `docs/test-plans/auth.md` | `docs/defects/auth.md` | `docs/signoff/auth signoff 17-11-2026.md` |
| Theme | `docs/test-plans/theme.md` | none | `docs/signoff/theme signoff 17-11-2026.md` |

Test case docs and master CSV: `docs/test-cases/` (`auth-login`, `auth-signout`, `theme`, each with a `.md` and a `.csv`).

## 4. Open items (next steps)
- [ ] Auth: manual check of autofill and paste (`OBS_AUTH_01`), ask the TPM about the lockout rule, then run the 5 opt-in security cases once, then finalize the Auth sign-off.
- [ ] Theme: manual visual check of dark mode, and one case for "first time with a dark computer theme".
- [ ] Choose the next module: Workspace (or Project / My work).
- [ ] Credentials are set in `.env` (never in docs or chat).

## 5. Environment and constraints
- The app is only on the local network (172.16.10.x). Live data: tests are read-only; never create/delete or ClickUp sync.
- Login locks for 15 minutes (HTTP 429) after wrong attempts. The default login suite makes at most 3 wrong attempts.
- The server slows down with parallel logins: no more than 2 workers.
- Browser: Chromium, desktop 1440 x 900.

## 6. Handoff checklist (before ending a session)
- [ ] Ran the tests and checked the reports and CSV (`reports/index.html`)
- [ ] `npm run typecheck` and `npm run cases:check` (if a test case changed, run `npm run cases:csv` first)
- [ ] Defects/observations in `docs/defects/<module>.md`
- [ ] Sign-off report (if the module is complete)
- [ ] Update this file's tracker, the `CLAUDE.md` status and `GUIDELINES.md`
- [ ] Commit and push
