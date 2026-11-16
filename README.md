# ITZ Flow - Playwright Automation (Page Object Model)

## Framework kya hai? (Beginner guide)

Playwright browser ko code se control karta hai (click, type, check). Tests ko saaf rakhne ke liye hum **POM (Page Object Model)** use karte hain:
**har web page ke liye ek class** jisme us page ke elements aur actions hon. Test sirf in actions ko call karta hai.

```
ITZ Flow/
├── config/env.ts           .env se URL/email/password parhta hai
├── pages/                  PAGE OBJECTS (POM) - elements + actions
│   ├── BasePage.ts         common kaam (goto, url)
│   ├── LoginPage.ts        login page ke elements + login()
│   └── WorkspacePage.ts    workspace page
├── fixtures/test-fixtures.ts  tests ko ready page objects deta hai
├── test-data/users.ts      test data (valid/invalid users)
├── utils/                  helper functions (abhi khali)
├── tests/auth/login.spec.ts  TEST CASES
├── playwright.config.ts    Playwright settings (URL, browser, report)
├── .env                    secrets (email/password) - git me nahi jata
└── package.json            scripts (npm test)
```

## Flow samjhiye
`test (login.spec.ts)` -> fixture se `loginPage` milta hai -> `loginPage.login(email, pass)` -> page object andar locators se browser chalata hai.
UI badle to sirf `pages/` update karni hoti hai, tests nahi.

## Naya test kaise likhein
1. Naye page ke liye `pages/XPage.ts` banao (locators + methods).
2. `fixtures/test-fixtures.ts` me us page ko add karo.
3. `tests/<feature>/x.spec.ts` me test likho.

## Setup aur run
1. `npm install`
2. `npx playwright install chromium`
3. `.env` me `ITZ_EMAIL` aur `ITZ_PASSWORD` bharo
4. `npm test` (headless) | `npm run test:headed` (browser dikhe) | `npm run report` (HTML report)

Note: PC ko usi local network (172.16.10.x) se connected hona chahiye.
