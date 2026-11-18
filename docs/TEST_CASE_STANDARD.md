# Test Case Standard (the same format in every module)

The test cases of every module and sub-module are written in **this format and structure**, so that anyone new can understand them easily.
The language of test cases is **simple English**. Short sentences, no difficult words.

## 1. Folder structure (the same for every module)

| Item | Location | Example |
| --- | --- | --- |
| Test cases document (English) | `docs/test-cases/<module>-<submodule>.md` | `docs/test-cases/auth-login.md` |
| Automation code | `tests/<module>/<submodule>.spec.ts` | `tests/auth/login.spec.ts` |
| Page object | `pages/<Name>Page.ts` | `pages/LoginPage.ts` |
| Report (a new file for every run, created automatically) | `reports/<module>/<submodule> test <DD-MM-YYYY>_<HH-mm>.html` | `reports/auth/login test 17-11-2026_03-05.html` |
| **Master CSV** (for regression, one fixed file) | `docs/test-cases/<module>-<submodule>.csv` | `docs/test-cases/auth-login.csv` |
| Test cases CSV (before the run, only the cases that will run) | `reports/<module>/<submodule> test cases <DD-MM-YYYY>_<HH-mm>.csv` | `reports/auth/login test cases 17-11-2026_03-05.csv` |
| Index of all reports (history + latest) | `reports/index.html` | |

One sub-module = one doc + one spec file + one report.
If a module has only one sub-module (e.g. theme), give the sub-module the same name as the module: `tests/theme/theme.spec.ts`, doc `docs/test-cases/theme.md`, report `reports/theme/theme test <DD-MM-YYYY>_<HH-mm>.html`.

## 2. Test case ID

`TC_<SUBMODULE>_<NN>`  (NN = 01, 02, 03 ...). Example: `TC_LOGIN_06`.
The same ID is never used twice. Data-driven cases use `TC_LOGIN_16.1`, `16.2` ...
In code, the test title looks like this: `TC_LOGIN_06 - valid credentials + Sign in button open the workspace`.

## 3. Document format (in the file of every sub-module)

Every file has these sections, in this order:

1. **Title:** `# <Module> - <Sub-module> Test Cases`
2. **Overview:** 2-3 lines. What this sub-module does.
3. **Scope / Notes:** what is tested, what is not, and any risk (e.g. lockout, live data).
4. **Test case tables:** groups by type (UI, Positive, Negative, Security, Access).
5. **Summary table:** how many cases, how many automated.

### Columns of the test case table (never change them)

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |

- **ID:** the rule above.
- **Title:** one short sentence, like "User can ..." or "System shows ...".
- **Priority:** `High` (core feature, the app is unusable if it fails), `Medium`, `Low` (cosmetic).
- **Preconditions:** what must be true before the test (e.g. "User is logged out"). `None` if nothing.
- **Steps:** numbered, short, action-based: `1. Open the login page. 2. Type the email. 3. Click Sign in.`
- **Expected result:** clear and checkable (e.g. "The workspace page opens.").

### Writing rules
0. **Title rule (this is what shows in the report):** the title must be a full English sentence that says *what is done* and *which data is used*. Example: `Login with unknown email "no.such.user.qa@theitzon.com" and password "WrongPass#123"`. Never write the real email/password in a title; write `valid email and valid password` there. The test title in the code and the Title column in the doc must be exactly the same.
1. Simple English, active voice: "Click Sign in", not "Sign in should be clicked".
2. One test case = checking one thing.
3. Write exact UI text in quotes: "Incorrect email or password".
4. Do not hardcode numbers that keep changing (counts, dates); write the relation ("All = sum of statuses").
5. Keep test cases read-only where the data is live (no create/delete).
6. When you add a new case, give it a new ID; never reuse old IDs.

## 4. Checklist for adding a new sub-module
- [ ] Wrote `docs/test-cases/<module>-<submodule>.md` in this format
- [ ] Created / updated the page object (`pages/`)
- [ ] Created `tests/<module>/<submodule>.spec.ts`, IDs match the doc
- [ ] If the module is new, added it to the `testMatch` of the `chromium` project in `playwright.config.ts`
- [ ] The ID of every test case in the doc is in a spec test title (the CSV is generated from the doc, otherwise "Not documented yet" appears)
- [ ] Ran the tests, the report `reports/<module>/<submodule> test <DD-MM-YYYY>_<HH-mm>.html` was created and shows in `reports/index.html`
- [ ] Updated `PLAN.md` and `GUIDELINES.md`

## 5. Master CSV (for regression)
- Every sub-module has one **master CSV**: `docs/test-cases/<module>-<submodule>.csv` (no date in the name). It is the full list of all test cases and is used in regression testing.
- This file is **only updated when a test case changes or a new one is added**. Change the test cases in the `.md` doc, then run `npm run cases:csv`. Rows that did not change keep their `Last Updated` date; a changed or new row gets today's date.
- `npm run cases:check` tells you whether the doc and the master CSV are the same. When a run starts, a NOTE is also printed if they differ (the run is not blocked).
- Columns of the master CSV: ID, Module, Sub-module, Group, Title, Priority, Preconditions, Steps, Expected Result, Automation, Regression, Last Updated.
- The **Run CSV** (`reports/<module>/<sub> test cases <date>_<time>.csv`) is a different thing: for every run it contains only the cases that ran in that run.
- Do not edit the CSV by hand.
