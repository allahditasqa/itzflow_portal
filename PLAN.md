# ITZ Flow - Playwright Automation Plan

Last updated: 2026-11-16 (workspace E2E suite executed)
Online copy (Claude Docs): https://claude.ai/artifact/FAtB3ENWneLY3MYwj56jbD
Local copy yehi file hai. Agar dono mein farq ho to **is file ko source of truth maano** aur status badalne par dono update karo.

Padhne ka order for any new session/agent: `CLAUDE.md` -> `PLAN.md` (ye file) -> `GUIDELINES.md` -> `README.md`.

## 1. Goal aur scope
ITZ Flow web app (http://172.16.10.2:8300, sirf local network 172.16.10.x par) ki end-to-end testing Playwright (TypeScript) aur Page Object Model (POM) se automate karna.

- Pehla workspace: `/workspaces/1e214489-71f0-4ec2-ad5d-de3a0dd2c0d1`
- Project folder: `D:\Automation Claude\ITZ Flow`
- Is waqt scope: login suite pura karna, phir login ke baad workspace features

## 2. Status (2026-11-16): 22/22 pass (1 setup, 7 login, 1 sign out, 7 workspace, 5 project, 1 my-work)

Sab tests `npm test` se pass. Detail test cases section 4b mein. Test files feature-wise: `tests/<feature>/<feature>.spec.ts`.

## 3. Framework structure

| Folder / file | Kaam |
| --- | --- |
| `config/env.ts` | `.env` se URL, workspace id, email, password parhta hai |
| `pages/` | Page Objects: BasePage, LoginPage, WorkspacePage (locators + actions) |
| `fixtures/test-fixtures.ts` | Tests ko ready page objects deta hai |
| `test-data/users.ts` | valid, invalid aur malformed users |
| `tests/<feature>/<feature>.spec.ts` | Test cases feature folder ke hisab se: `auth/`, `workspace/`, `project/`, `my-work/`, `setup/` (login session). Naming `TC_<FEATURE>_NN` |
| `utils/` | Helpers (abhi khali) |
| `CLAUDE.md` | Project rules aur status (Claude ke liye) |
| `PLAN.md` | Ye plan |
| `GUIDELINES.md` | Living notebook: jo seekhen wo yahan note hota hai |

UI badle to sirf `pages/` update hoti hai, tests nahi.

## 4. Aage ka plan (phases)
- [x] **Phase 1, credentials:** `.env` mein ITZ_EMAIL aur ITZ_PASSWORD bharna, TC_LOGIN_07 chalana, login ke baad ka redirect confirm karna.
- [x] **Phase 2, login reuse:** Login ek baar karke `storageState` save karna taake baqi tests har baar login na karen.
- [x] **Phase 3, explore:** Logged-in workspace explore karna aur `WorkspacePage` mein locators add karna.
- [ ] **Phase 4, feature tests:** Workspace ke modules ke test cases (modules user se confirm hone ke baad).
- [ ] **Phase 5, hardening:** Flaky tests theek karna, negative cases, report review, README aur GUIDELINES update.

Phase complete hone par checkbox tick karo aur section 2 ka status update karo.

## 4b. End-to-end test cases (workspace flow)
App: ITZFlow, project-management tool (140 projects, sprints, tickets). **Live data hai, isliye sab tests read-only**: koi create/edit/delete nahi, "Sync with ClickUp" nahi dabana. Data-dependent asserts avoid karo (counts badalte rehte hain), relation check karo.
Stable test project: "Water drink Reminder App" (`test-data/apps.ts`).

| ID | Area | Test case | Expected |
| --- | --- | --- | --- |
| TC_LOGIN_07 | Auth | Valid credentials se login | Workspace URL khulta hai |
| TC_AUTH_01 | Auth | Logged-in user Sign out dabaye | `/login` par redirect |
| TC_WS_01 | Workspace | Workspace page load | Workspace name, "Sync with ClickUp" button visible |
| TC_WS_02 | Workspace | Status tabs ke counts | All count = baqi tabs ke counts ka jama |
| TC_WS_03 | Workspace | Production status filter click | Tab selected, project list dikhti hai |
| TC_WS_04 | Workspace | Cards se Table view | Table headers (PROJECT, STATUS, SPRINT, DEV, QA...) visible |
| TC_WS_05 | Workspace | Project name search | Matching project dikhta hai |
| TC_WS_06 | Workspace | Sidebar se app click | `/projects/<id>` khulta hai, project name sahi |
| TC_WS_07 | Workspace | "Your work" link | `/my-work` khulta hai |
| TC_PRJ_01 | Project | Project page header | Name aur tabs Sprints/History/Settings visible |
| TC_PRJ_02 | Project | Sprints tab | Sprint 1 card visible |
| TC_PRJ_03 | Project | History tab | CHANGES log visible |
| TC_PRJ_04 | Project | Settings tab | "Project settings" aur Documents section visible |
| TC_PRJ_05 | Project | Back button | Workspace par wapas |
| TC_MW_01 | My work | `/my-work` load | "Your work", Open / Overdue / Due today counters visible |

Login ek baar `tests/setup/auth.setup.ts` mein hoga aur `.auth/user.json` (storageState) baqi tests reuse karenge. Login tests bina session ke chalte hain.

## 5. Blockers aur open questions
- [x] Valid email aur password (`.env` mein set)
- [ ] Workspace ke kaun se modules/features test karne hain?
- [ ] Login failure par exact error message kya hai?
- [ ] Kya koi test/staging user hai jis par create/delete safe ho?

## 6. Run aur conventions
- `npm test` headless, `npm run test:headed` browser ke saath, `npm run report` HTML report.
- Locators sirf `pages/` mein; `getByRole`, `getByPlaceholder`, `getByLabel` pehle.
- Credentials sirf `.env` mein (gitignored). Credentials wale tests `test.skip(!ENV.hasCredentials, ...)` se guard hote hain.
- App sirf local network par: test se pehle `Test-NetConnection 172.16.10.2 -Port 8300` se check karo.
- Har naya learning `GUIDELINES.md` mein date ke saath likho.

## 7. Handoff checklist (session khatam karne se pehle)
- [ ] `npm test` chala kar result section 2 mein update kiya
- [ ] Phase checkboxes update kiye
- [ ] Naye learnings `GUIDELINES.md` mein add kiye
- [ ] `CLAUDE.md` ka "Status" section update kiya
- [ ] Online doc mein bhi major changes copy kiye
