// Custom reporter: creates a SEPARATE single-file HTML report for every module/sub-module (screenshots embedded as base64).
//
// Structure (unchanged): every module has its own folder, and the report file NAME contains the date and time:
//   reports/<module>/<submodule> test <DD-MM-YYYY>_<HH-mm>.html
//   Example: reports/theme/theme test 17-11-2026_03-05.html
//            reports/theme/theme test 17-11-2026_03-17.html
// An old report is never overwritten (a new run = a new file, because the name contains the time).
// reports/index.html holds the history of all reports (by date) and a link to the latest report of every module.
// Reports open with a double-click, without a server or internet.
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
// Test case details come from docs/test-cases/*.md (for the CSV)
const { buildRows, toCsv, checkMaster } = require('../scripts/export-test-cases.js') as {
  buildRows: (module: string, sub: string, tests: { id: string; title: string }[]) => string[][];
  toCsv: (rows: string[][]) => string;
  checkMaster: () => string[];
};

interface Row {
  id: string;
  title: string;
  group: string;
  status: string;
  duration: number;
  retry: number;
  error: string;
  shots: { name: string; src: string }[];
}

interface Group {
  module: string;
  sub: string;
  rows: Map<string, Row>;
}

// One history.json entry = one report file
interface Entry {
  module: string;
  sub: string;
  csv?: string; // CSV of this run's test cases (path relative to the reports folder)
  results?: Record<string, string>; // test case ID -> status (passed, failed, skipped...)
  file: string; // path relative to the reports folder (e.g. theme/theme test 17-11-2026_03-05.html)
  ts: string; // ISO time (for sorting)
  date: string; // DD-MM-YYYY
  time: string; // HH:mm
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

/* eslint-disable no-control-regex -- intentional: used to strip ANSI colour codes (\u001b) */
const esc = (s: string) =>
  s
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
/* eslint-enable no-control-regex */

const pretty = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const two = (n: number) => String(n).padStart(2, '0');

const STYLE = `
:root{--bg:#f6f7f9;--fg:#1c1f24;--card:#fff;--line:#dde1e6;--pass:#1a7f37;--fail:#cf222e;--skip:#8a6d00;--mute:#6b7380}
@media(prefers-color-scheme:dark){:root{--bg:#14161a;--fg:#e6e8eb;--card:#1d2026;--line:#2e333b;--pass:#3fb950;--fail:#ff7b72;--skip:#d4a72c;--mute:#9aa3b0}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,Segoe UI,sans-serif}
main{max-width:1100px;margin:auto}h1{margin:0 0 4px}h2{margin:28px 0 8px}.meta{color:var(--mute);font-size:13px}a{color:inherit}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 16px}
.sum b{font-size:22px;display:block}.card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0}
.card.pass{border-left-color:var(--pass)}.card.fail{border-left-color:var(--fail)}.card.skip{border-left-color:var(--skip)}
.head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.badge{font-size:12px;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
.badge.pass{color:var(--pass)}.badge.fail{color:var(--fail)}.badge.skip{color:var(--skip)}
pre{background:var(--bg);padding:10px;border-radius:6px;overflow:auto;white-space:pre-wrap;color:var(--fail)}
.shots{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}figure{margin:0}img{max-width:300px;border:1px solid var(--line);border-radius:6px;cursor:zoom-in}
img.big{max-width:100%;cursor:zoom-out}figcaption{font-size:12px;color:var(--mute)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line)}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line)}
.pass-t{color:var(--pass)}.fail-t{color:var(--fail)}.skip-t{color:var(--skip)}
`;

export default class OfflineReporter implements Reporter {
  private groups = new Map<string, Group>();
  private startedAt = new Date();
  private bases = new Map<string, string>(); // module/sub -> report file name (without .html)
  private csvFiles = new Map<string, string>(); // module/sub -> relative path of the CSV
  private reportsDir: string;
  private autoOpen: boolean;

  constructor(options: { outputDir?: string; open?: boolean } = {}) {
    this.reportsDir = path.resolve(options.outputDir ?? 'reports');
    // Open the report in the browser automatically after the run (not on CI or when OFFLINE_REPORT_OPEN=0)
    this.autoOpen = (options.open ?? true) && !process.env.CI && process.env.OFFLINE_REPORT_OPEN !== '0';
  }

  // As soon as the run starts (BEFORE the tests run): writes a per-module CSV of the test cases that are about to run
  onBegin(_config: FullConfig, suite: Suite): void {
    this.startedAt = new Date();
    if (process.argv.includes('--list')) return; // only listing tests, so do not create a CSV
    // If the master CSV (for regression) has drifted from the docs, show a reminder. The run is not blocked.
    try {
      const stale = checkMaster();
      if (stale.length)
        console.log(`\nNOTE: master test case CSV out of date (${stale.join(', ')}). Run: npm run cases:csv`);
    } catch {
      /* ignore it if the check fails */
    }
    const d = this.startedAt;
    const stamp = `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()}_${two(d.getHours())}-${two(d.getMinutes())}`;

    const planned = new Map<string, { module: string; sub: string; tests: { id: string; title: string }[] }>();
    for (const t of suite.allTests()) {
      const rel = path.relative(process.cwd(), t.location.file).split(path.sep);
      const module = rel[1] ?? 'general';
      if (module === 'setup') continue;
      const sub = (rel[2] ?? rel[1] ?? 'tests').replace(/\.spec\.ts$/, '');
      const key = `${module}/${sub}`;
      if (!planned.has(key)) planned.set(key, { module, sub, tests: [] });
      planned.get(key)!.tests.push({ id: t.title.match(/TC_[A-Z0-9_.]+/)?.[0] ?? '', title: t.title });
    }

    for (const [key, p] of planned) {
      const dir = path.join(this.reportsDir, p.module);
      fs.mkdirSync(dir, { recursive: true });
      // Name: "<sub> test DD-MM-YYYY_HH-mm". If it runs again in the same minute, seconds are appended (nothing is overwritten)
      let base = `${p.sub.replace(/[-_]/g, ' ')} test ${stamp}`;
      if (fs.existsSync(path.join(dir, `${base}.html`)) || fs.existsSync(path.join(dir, this.csvName(base))))
        base += `-${two(d.getSeconds())}`;
      this.bases.set(key, base);
      try {
        fs.writeFileSync(path.join(dir, this.csvName(base)), toCsv(buildRows(p.module, p.sub, p.tests)), 'utf8');
        this.csvFiles.set(key, `${p.module}/${this.csvName(base)}`);
        console.log(`Test cases CSV (${p.tests.length} cases): ${path.join(dir, this.csvName(base))}`);
      } catch (err) {
        console.log('Test cases CSV could not be created:', (err as Error).message);
      }
    }
  }

  // "login test 17-11-2026_15-20" -> "login test cases 17-11-2026_15-20.csv"
  private csvName(base: string): string {
    return `${base.replace(' test ', ' test cases ')}.csv`;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Get the module and sub-module from the file path: tests/<module>/<sub>.spec.ts
    const rel = path.relative(process.cwd(), test.location.file).split(path.sep);
    const module = rel[1] ?? 'general';
    if (module === 'setup') return; // login setup is internal, so it gets no report
    const sub = (rel[2] ?? rel[1] ?? 'tests').replace(/\.spec\.ts$/, '');
    const key = `${module}/${sub}`;
    if (!this.groups.has(key)) this.groups.set(key, { module, sub, rows: new Map() });

    const shots = result.attachments
      .filter((a) => a.contentType.startsWith('image/'))
      .map((a) => {
        const buf = a.body ?? (a.path ? fs.readFileSync(a.path) : null);
        return buf ? { name: a.name, src: `data:${a.contentType};base64,${buf.toString('base64')}` } : null;
      })
      .filter((x): x is { name: string; src: string } => x !== null);

    const fullTitle = test.title; // only the test's own title (no file/describe path)
    const group = test.titlePath().slice(2, -1).join(' › ');
    const id = fullTitle.match(/TC_[A-Z0-9_.]+/)?.[0] ?? '';
    // When there are retries, keep the result of the last attempt
    this.groups.get(key)!.rows.set(test.id, {
      id,
      title: fullTitle,
      group,
      status: result.status,
      duration: result.duration,
      retry: result.retry,
      error: result.error ? (result.error.message ?? String(result.error)) : '',
      shots,
    });
  }

  onEnd(result: FullResult): void {
    if (this.groups.size === 0) return; // no test ran at all (e.g. --list): no report is created

    const d = this.startedAt;
    const date = `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()}`; // DD-MM-YYYY
    const stamp = `${date}_${two(d.getHours())}-${two(d.getMinutes())}`; // 17-11-2026_03-05
    const durationSec = Math.round((Date.now() - d.getTime()) / 1000);

    const historyFile = path.join(this.reportsDir, 'history.json');
    let history: Entry[] = [];
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch {
      /* first run */
    }

    const written: string[] = [];
    for (const g of [...this.groups.values()].sort((a, b) =>
      `${a.module}/${a.sub}`.localeCompare(`${b.module}/${b.sub}`),
    )) {
      const rows = [...g.rows.values()].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      const dir = path.join(this.reportsDir, g.module);
      fs.mkdirSync(dir, { recursive: true });

      const name = `${this.bases.get(`${g.module}/${g.sub}`) ?? `${g.sub.replace(/[-_]/g, ' ')} test ${stamp}`}.html`;
      const full = path.join(dir, name);

      const e: Entry = {
        module: g.module,
        sub: g.sub,
        file: `${g.module}/${name}`,
        csv: this.csvFiles.get(`${g.module}/${g.sub}`),
        results: Object.fromEntries(rows.filter((r) => r.id).map((r) => [r.id, r.status])),
        ts: d.toISOString(),
        date,
        time: `${two(d.getHours())}:${two(d.getMinutes())}`,
        total: rows.length,
        passed: rows.filter((r) => r.status === 'passed').length,
        failed: rows.filter((r) => r.status === 'failed' || r.status === 'timedOut').length,
        skipped: rows.filter((r) => r.status === 'skipped').length,
      };
      fs.writeFileSync(full, this.renderModule(g, rows, e, durationSec, result.status), 'utf8');
      history.push(e);
      written.push(full);
    }

    history = this.syncWithFiles(history);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
    const indexFile = this.writeIndex(history);

    for (const w of written) console.log(`\nModule report: ${w}`);
    console.log(`All reports index: ${indexFile}`);
    // If only one module ran, open its report directly; otherwise open the index
    const toOpen = written.length === 1 ? written[0] : indexFile;
    if (this.autoOpen) {
      exec(`start "" "${toOpen}"`, (err) => {
        if (err) console.log('Report auto-open failed:', err.message);
      });
    }
  }

  // ───────────── HTML generation helpers ─────────────

  private renderModule(g: Group, rows: Row[], e: Entry, durationSec: number, overall: string): string {
    const cards = rows
      .map((r) => {
        const cls = r.status === 'passed' ? 'pass' : r.status === 'skipped' ? 'skip' : 'fail';
        const imgs = r.shots
          .map(
            (x) =>
              `<figure><img src="${x.src}" alt="${esc(x.name)}" onclick="this.classList.toggle('big')"><figcaption>${esc(x.name)}</figcaption></figure>`,
          )
          .join('');
        return `<section class="card ${cls}">
  <div class="head"><span class="badge ${cls}">${esc(r.status)}</span><b>${esc(r.title)}</b>
  <span class="meta">${esc(r.group)} · ${(r.duration / 1000).toFixed(1)}s${r.retry ? ` · retry #${r.retry}` : ''}</span></div>
  ${r.error ? `<pre>${esc(r.error)}</pre>` : ''}
  ${imgs ? `<div class="shots">${imgs}</div>` : '<p class="meta">No screenshot (test was skipped)</p>'}
</section>`;
      })
      .join('\n');

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pretty(g.sub))} Test Report ${esc(e.date)} ${esc(e.time)}</title><style>${STYLE}</style></head><body><main>
<p class="meta"><a href="../index.html">&larr; All reports</a></p>
<h1>${esc(pretty(g.module))} &rsaquo; ${esc(pretty(g.sub))}</h1>
<div class="meta">Run: ${esc(e.date)} ${esc(e.time)} · duration ${durationSec}s · overall: ${esc(overall)} · click a screenshot to enlarge</div>
<div class="sum"><div><b>${e.total}</b>total</div><div><b class="pass-t">${e.passed}</b>passed</div><div><b class="fail-t">${e.failed}</b>failed</div><div><b class="skip-t">${e.skipped}</b>skipped</div></div>
${cards}
</main></body></html>`;
  }

  // Syncs history.json with the reports/<module>/*.html files:
  //  - a report file that exists but is not in history (e.g. history.json was deleted) is added back
  //  - an entry whose file has been deleted is removed (so the index has no dead links)
  private syncWithFiles(history: Entry[]): Entry[] {
    const kept = history.filter((e) => fs.existsSync(path.join(this.reportsDir, e.file)));
    const known = new Set(kept.map((e) => e.file));
    const nameRe = /^(.*) test (\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})(?:-(\d{2}))?\.html$/;
    const sumRe =
      /<div class="sum"><div><b>(\d+)<\/b>total<\/div><div><b class="pass-t">(\d+)<\/b>passed<\/div><div><b class="fail-t">(\d+)<\/b>failed<\/div><div><b class="skip-t">(\d+)<\/b>skipped/;
    for (const module of fs.existsSync(this.reportsDir) ? fs.readdirSync(this.reportsDir) : []) {
      const dir = path.join(this.reportsDir, module);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const name of fs.readdirSync(dir)) {
        const file = `${module}/${name}`;
        const m = name.match(nameRe);
        if (!m || known.has(file)) continue;
        const [, sub, dd, mm, yyyy, hh, mi, ss] = m;
        const counts = fs.readFileSync(path.join(dir, name), 'utf8').match(sumRe);
        kept.push({
          module,
          sub: sub.replace(/ /g, '-'),
          file,
          csv: fs.existsSync(path.join(dir, this.csvName(name.replace(/\.html$/, ''))))
            ? `${module}/${this.csvName(name.replace(/\.html$/, ''))}`
            : undefined,
          ts: `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss ?? '00'}`,
          date: `${dd}-${mm}-${yyyy}`,
          time: `${hh}:${mi}`,
          total: Number(counts?.[1] ?? 0),
          passed: Number(counts?.[2] ?? 0),
          failed: Number(counts?.[3] ?? 0),
          skipped: Number(counts?.[4] ?? 0),
        });
      }
    }
    return kept;
  }

  // reports/index.html: date + time at the top (newest first), with the module-wise reports under each date-time
  private writeIndex(history: Entry[]): string {
    // Sort by date (DD-MM-YYYY) and time (HH:mm): newest run on top. (The ts format may differ in older entries)
    const sortKey = (e: Entry) => `${e.date.split('-').reverse().join('')}${e.time}`;
    const sorted = [...history].sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || b.ts.localeCompare(a.ts));

    // Group by date-time (minute)
    const runs = new Map<string, Entry[]>();
    for (const e of sorted) {
      const key = `${e.date} ${e.time}`;
      if (!runs.has(key)) runs.set(key, []);
      runs.get(key)!.push(e);
    }

    let body = '';
    for (const [when, list] of runs) {
      const total = list.reduce((n, e) => n + e.total, 0);
      const passed = list.reduce((n, e) => n + e.passed, 0);
      const failed = list.reduce((n, e) => n + e.failed, 0);
      const skipped = list.reduce((n, e) => n + e.skipped, 0);
      const rows = list
        .sort((a, b) => `${a.module}/${a.sub}`.localeCompare(`${b.module}/${b.sub}`))
        .map(
          (
            e,
          ) => `<tr><td>${esc(pretty(e.module))}</td><td><a href="${esc(encodeURI(e.file))}">${esc(pretty(e.sub))}</a></td><td>${e.total}</td>
<td class="pass-t">${e.passed}</td><td class="${e.failed ? 'fail-t' : ''}">${e.failed}</td><td class="skip-t">${e.skipped}</td>
<td class="${e.failed ? 'fail-t' : 'pass-t'}">${e.failed ? 'Failed' : 'Passed'}</td><td>${e.csv ? `<a href="${esc(encodeURI(e.csv))}">CSV</a>` : ''}</td></tr>`,
        )
        .join('\n');
      body += `<h2>${esc(when.replace(' ', '  •  '))} <span class="meta">&nbsp;total ${total} · <span class="pass-t">${passed} pass</span> · <span class="${failed ? 'fail-t' : ''}">${failed} fail</span> · <span class="skip-t">${skipped} skip</span></span></h2>
<table><thead><tr><th>Module</th><th>Sub-module</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Result</th><th>Test cases</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const file = path.join(this.reportsDir, 'index.html');
    fs.mkdirSync(this.reportsDir, { recursive: true });
    fs.writeFileSync(
      file,
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ITZ Flow - Test Reports</title><style>${STYLE}</style></head><body><main>
<h1>ITZ Flow - Test Reports</h1><div class="meta">History: newest run on top. Module-wise reports are listed under each date-time. Old entries are never overwritten or deleted.</div>
${body}
</main></body></html>`,
      'utf8',
    );
    return file;
  }
}
