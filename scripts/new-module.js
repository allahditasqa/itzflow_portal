// Full scaffold for a new module in one command (saves time):
//   npm run module:new -- <module> [sub-module]
//   Example: npm run module:new -- workspace          (sub-module = module)
//            npm run module:new -- ticket detail
// Creates: test plan, test case doc (empty table), spec skeleton, page object skeleton, defect log.
// Files that already exist are left untouched.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const [module_, subArg] = process.argv.slice(2);
if (!module_) {
  console.log('Usage: npm run module:new -- <module> [sub-module]   (e.g. npm run module:new -- workspace)');
  process.exit(1);
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pretty = (s) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const pascal = (s) => pretty(s).replace(/\s+/g, '');
const m = slug(module_);
const sub = slug(subArg || module_);
const idPrefix = `TC_${sub.replace(/-/g, '').toUpperCase()}`;

function write(rel, content) {
  const f = path.join(ROOT, rel);
  if (fs.existsSync(f)) { console.log(`skip (already exists): ${rel}`); return; }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content, 'utf8');
  console.log(`created: ${rel}`);
}
const tpl = (name) => fs.readFileSync(path.join(ROOT, 'docs', 'templates', name), 'utf8');
const today = (() => { const d = new Date(); const t = (n) => String(n).padStart(2, '0'); return `${t(d.getDate())}-${t(d.getMonth() + 1)}-${d.getFullYear()}`; })();

write(`docs/test-plans/${m}.md`, tpl('test-plan.md').replace(/<Module>/g, pretty(m)).replace(/<module>/g, m).replace(/<sub>/g, sub).replace('DD-MM-YYYY', today));
write(`docs/defects/${m}.md`, tpl('defect-log.md').replace(/<Module>/g, pretty(m)).replace(/MODULE/g, m.replace(/-/g, '').toUpperCase()).replace('DD-MM-YYYY', today));

write(`docs/test-cases/${m}-${sub}.md`, `# ${pretty(m)} - ${pretty(sub)} Test Cases

**Automation:** \`tests/${m}/${sub}.spec.ts\`  |  **Report:** \`reports/${m}/${sub} test <DD-MM-YYYY>_<HH-mm>.html\` (all reports: \`reports/index.html\`)

## Overview
A 2-3 line introduction to this sub-module.

## Scope and notes
- What is tested, what is not, and any risk (live data, lockout).

## A. Group name

| ID | Title | Priority | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |

> ID format: \`${idPrefix}_01\`, \`${idPrefix}_02\` ... Title in simple English, with the data. Rules: docs/TEST_CASE_STANDARD.md
> After writing the cases: \`npm run cases:csv\` (master CSV) and \`npm run cases:check\`.
`);

write(`tests/${m}/${sub}.spec.ts`, `// ${pretty(m)} - ${pretty(sub)}. Test cases doc: docs/test-cases/${m}-${sub}.md
import { test, expect } from '../../fixtures/test-fixtures';

test.describe('${pretty(m)} - ${pretty(sub)}', () => {
  // Each test title: "${idPrefix}_NN - <simple English sentence with data>" and it must match the ID in the doc exactly.
  // test('${idPrefix}_01 - ...', async ({ page }) => { ... });
  void expect; // remove this line when you write the first test
});
`);

write(`pages/${pascal(sub)}Page.ts`, `// Page Object for the ${pretty(sub)} page: locators and actions live only here. No locators in test files.
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ${pascal(sub)}Page extends BasePage {
  // readonly someElement: Locator;

  constructor(page: Page) {
    super(page);
    // this.someElement = page.getByRole('button', { name: '...' });
  }

  async open(): Promise<void> {
    await this.goto('/'); // TODO: correct URL
  }
}

void expect;
export type { Locator };
`);

console.log(`
Next: 1) write docs/test-plans/${m}.md  2) explore the app and write the test cases doc  3) add pages/${pascal(sub)}Page.ts to fixtures/test-fixtures.ts
      4) write the spec  5) npm run cases:csv && npm run cases:check  6) npm run test:${m} (add the script to package.json) 7) npm run signoff -- ${m}`);
