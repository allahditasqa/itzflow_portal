# QA Process: the same lifecycle for every module (from Framework to Sign-off)

**Role:** Senior SQA / SDET (10+ years, manual + automation, multi-domain). Every task follows this process, module-wise.
No shortcuts in any module: first the plan, then the test cases, then automation, then execution, then sign-off.

## 1. Lifecycle and deliverables (for every module)

| # | Phase | What happens | Deliverable (file) |
| --- | --- | --- | --- |
| 0 | Framework (once) | Playwright + TypeScript + Page Object Model, reporters, CSV, history | `README.md`, `playwright.config.ts`, `pages/`, `fixtures/`, `reporters/` |
| 1 | Analysis | Explore the app (manual), note flows, rules, risks | `GUIDELINES.md` (learnings), analysis notes in the "Understanding" section of the test plan |
| 2 | Test Plan | Scope, approach, environment, data, entry/exit criteria, risks | `docs/test-plans/<module>.md` ([template](templates/test-plan.md)) |
| 3 | Test Design | Test cases in simple English, standard format, using the design techniques | `docs/test-cases/<module>-<submodule>.md` and master CSV `...csv` ([standard](TEST_CASE_STANDARD.md)) |
| 4 | Automation | Page objects, spec files; automate only stable and repeatable cases | `pages/`, `tests/<module>/<submodule>.spec.ts` |
| 5 | Execution | CSV before the run, report after the run, history | `reports/<module>/<sub> test cases <date>_<time>.csv`, `... test <date>_<time>.html`, `reports/index.html` |
| 6 | Defects / Observations | Log of every bug or doubt found, with evidence | `docs/defects/<module>.md` ([template](templates/defect-log.md)) |
| 7 | Sign-off | Final report of the module: coverage, results, defects, risks, decision | `docs/signoff/<module> signoff <DD-MM-YYYY>.md` ([template](templates/signoff-report.md)) |
| 8 | Handoff | Update plan/status/learnings, commit, push | `PLAN.md`, `GUIDELINES.md`, `CLAUDE.md` |

Inside a module, sub-modules are tested one at a time. A module is signed off once the execution of all its sub-modules is done.

## 2. Test design techniques (when writing test cases)
- **Equivalence partitioning** and **boundary values** (e.g. empty, 1 char, a very long input).
- Both **positive and negative** cases, and **error guessing** (spaces, special characters, emoji).
- **State transition** (logged out → logged in → logged out, theme light → dark → system).
- **Security basics** (injection text, script text, access without login, lockout).
- **Persistence** (reload, another page, a new session) and **cross-page consistency**.
- **UI checks** (elements visible, correct text, keyboard use).
- Where automation is hard (visual look, accessibility, multiple browsers), write a **manual checklist** in the test plan.

## 3. Entry and exit criteria (defaults; a module's plan may change them)

**Entry (before starting execution):**
- The test plan and test case docs are ready and reviewed.
- The app is reachable (`172.16.10.2:8300`) and the credentials are in `.env`.
- The automation code compiles (`npx playwright test --list`).

**Exit (for sign-off):**
- All **High priority** cases are executed and passed.
- Overall pass rate is **95% or more** (of the executed cases).
- No **Critical or High** defect is open.
- The reason for every skipped case is written down and the risk is accepted in the plan.
- The sign-off report is written.

## 4. Severity and priority

| Severity | Meaning | Example |
| --- | --- | --- |
| Critical | App or core flow is down, data loss, security hole | Login can be bypassed |
| High | A major feature does not work, no workaround | A valid user cannot log in |
| Medium | A feature works partially or has a workaround | Login fails with autofill |
| Low | Cosmetic or minor | Spelling, alignment |

Priority (in test cases): **High** = core flow, the app is unusable if it fails; **Medium**; **Low** = cosmetic.
**Observation** = something that does not look like a defect but needs to be confirmed with the product team (the expected behaviour has to be asked).

## 5. The 3 outcomes of a sign-off decision
- **Signed off:** exit criteria met, no blocker.
- **Conditional sign-off:** exit criteria are almost met, but there are known gaps: pending manual checks, open observations, or cases that were not run (skipped). Once all of these are closed, it becomes Signed off.
- **Not signed off:** a Critical/High defect is open or High cases failed/were not executed.

The final approval belongs to the product owner / TPM. QA only gives a recommendation.

## 6. Speed rules (to save time)
A QA with 10 years of experience works fast: tools remove the repeat work, docs stay short, and it is done right the first time.
- **Scaffold:** for a new module use `npm run module:new -- <module> [sub]`: plan, test case doc, spec, page object, defect log in one command.
- **The sign-off draft is generated:** `npm run signoff -- <module>`: numbers, High-priority check, exit criteria, defects, evidence archive, recommendation. QA only reviews it and adds 2-3 lines of narrative.
- **Regression / smoke from the master CSV:** `npm run test:smoke` (High only, quick check), `npm run test:regression` (all with Regression = Yes).
- **Time-box:** explore once (~15 min at most per sub-module), a 1-page test plan, ~15 to 25 cases per sub-module, one run, one fix cycle. Prefer a quick sign-off over perfection, and write down the gaps.
- **Fast runs:** retries 0, trace/video off, workers 2, serial only for login. Run only what changed (`npm run test:<module>` or `-g`).
- **Short docs:** do not write by hand what comes from automation or a generator (counts, results).

## 7. Quality gates (before commit, a 10-second job)
- [ ] `npm run check` (typecheck + lint + format check + cases:check) in one command
- [ ] `npm run cases:check` (docs, master CSV and code test IDs agree; no duplicate IDs)
- [ ] Ran only the module that changed and saw it pass

## 8. Daily rules (checklist)
- [ ] New module: write the test plan first.
- [ ] Test cases doc in the standard format, simple English, with the data in the titles.
- [ ] If a test case changed or a new one was added, run `npm run cases:csv` (master CSV), then `npm run cases:check`.
- [ ] After automation, run `npx playwright test --list` and a safe run.
- [ ] The app is live: read-only tests, few wrong login attempts (15 min lockout).
- [ ] After the run, check the CSV + report + index, and write the defects/observations.
- [ ] Sign-off report, update the module tracker in `PLAN.md`, update `GUIDELINES.md`, commit and push.
