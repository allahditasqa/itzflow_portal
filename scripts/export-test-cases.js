// CSV helpers for test cases. Reads the tables in docs/test-cases/*.md and returns the test case details (steps, expected result...).
//
// 1) MASTER CSV (for regression): docs/test-cases/<module>-<submodule>.csv  (no date in the name, a single file)
//    - This file is only updated when a test case changes or a new one is added: `npm run cases:csv`
//    - Rows that did not change keep their "Last Updated" date.
//    - `npm run cases:check` tells you whether the docs and the master CSV differ.
// 2) RUN CSV (before every run): reporters/offline-report.ts writes a CSV of the test cases that are about to run
//    to reports/<module>/<submodule> test cases <DD-MM-YYYY>_<HH-mm>.csv (buildRows + toCsv).
//
// The CSV opens directly in Excel (UTF-8 BOM). Do not edit test cases in the CSV by hand; change them in the .md doc.
const fs = require('fs');
const path = require('path');

const DOCS = path.resolve(__dirname, '..', 'docs', 'test-cases');
const HEADER = ['ID', 'Module', 'Sub-module', 'Group', 'Title', 'Priority', 'Preconditions', 'Steps', 'Expected Result', 'Automation'];
const MASTER_HEADER = [...HEADER, 'Regression', 'Last Updated'];
const quote = (v) => `"${String(v).replace(/"/g, '""')}"`;
const clean = (v) => v.trim().replace(/`/g, '');
const byId = (a, b) => a[0].localeCompare(b[0], undefined, { numeric: true });

function today() {
  const d = new Date();
  const two = (n) => String(n).padStart(2, '0');
  return `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()}`;
}

// Reads every .md doc and returns { base, module, sub, rows }
function listDocs() {
  const out = [];
  if (!fs.existsSync(DOCS)) return out;
  for (const file of fs.readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
    const lines = fs.readFileSync(path.join(DOCS, file), 'utf8').split(/\r?\n/);
    const auto = lines.join('\n').match(/tests\/([\w-]+)\/([\w-]+)\.spec\.ts/);
    const base = path.basename(file, '.md');
    const module = auto ? auto[1] : base;
    const sub = auto ? auto[2] : module;
    const rows = [];
    let group = '';
    for (const line of lines) {
      const h = line.match(/^##\s+(?:[A-Z]\.\s*)?(.*)$/);
      if (h) { group = h[1].trim(); continue; }
      const m = line.match(/^\|\s*(TC_[A-Z0-9_.]+)\s*\|(.*)\|\s*$/);
      if (!m) continue;
      const cells = m[2].split('|').map(clean);
      if (cells.length !== 5) continue;
      const [title, priority, pre, steps, expected] = cells;
      rows.push([m[1], module, sub, group, title, priority, pre, steps, expected,
        /\(Opt-in\)/i.test(title) ? 'Opt-in (skipped by default)' : 'Yes']);
    }
    if (rows.length) out.push({ base, module, sub, rows });
  }
  return out;
}

// "<module>/<sub>/<ID>" -> row
function loadDocs() {
  const map = new Map();
  for (const d of listDocs()) for (const r of d.rows) map.set(`${d.module}/${d.sub}/${r[0]}`, r);
  return map;
}

// ───────────── RUN CSV (before every run, only the cases that will run) ─────────────

// tests = [{ id, title }]. If a test is not in the docs, the row is marked "Not documented yet".
function buildRows(module, sub, tests) {
  const docs = loadDocs();
  const rows = tests.map((t) => docs.get(`${module}/${sub}/${t.id}`) ??
    [t.id, module, sub, '', t.title, '', '', '', 'Not documented yet (add it to docs/test-cases)', 'Yes']);
  return rows.sort(byId);
}

function toCsv(rows, header = HEADER) {
  return '﻿' + [header, ...rows].map((r) => r.map(quote).join(',')).join('\r\n') + '\r\n';
}

// ───────────── MASTER CSV (for regression, updated only when a test case changes) ─────────────

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const regressionFlag = (auto) => (auto === 'Yes' ? 'Yes' : 'Optional (RUN_LOCKOUT_TESTS=1)');
const masterPath = (base) => path.join(DOCS, `${base}.csv`);

function readMaster(base) {
  const f = masterPath(base);
  if (!fs.existsSync(f)) return new Map();
  const [, ...rows] = parseCsv(fs.readFileSync(f, 'utf8'));
  return new Map(rows.map((r) => [r[0], r]));
}

// The row as it should be according to the docs (without Last Updated)
const expectedRow = (r) => [...r, regressionFlag(r[9])];

// Creates/updates the master CSV. Rows that did not change keep their Last Updated date.
function exportMaster() {
  const summary = [];
  for (const d of listDocs()) {
    const old = readMaster(d.base);
    let added = 0, changed = 0;
    const rows = d.rows.slice().sort(byId).map((r) => {
      const exp = expectedRow(r);
      const prev = old.get(r[0]);
      if (!prev) { added++; return [...exp, today()]; }
      const same = exp.every((v, i) => v === prev[i]);
      if (!same) changed++;
      return [...exp, same ? prev[11] || today() : today()];
    });
    const removed = [...old.keys()].filter((id) => !d.rows.some((r) => r[0] === id)).length;
    fs.writeFileSync(masterPath(d.base), toCsv(rows, MASTER_HEADER), 'utf8');
    summary.push({ file: `${d.base}.csv`, total: rows.length, added, changed, removed });
  }
  return summary;
}

// Difference between the docs and the master CSV: returns the names of out-of-date files (empty = all good)
function checkMaster() {
  const stale = [];
  for (const d of listDocs()) {
    const old = readMaster(d.base);
    const same = old.size === d.rows.length && d.rows.every((r) => {
      const prev = old.get(r[0]);
      return prev && expectedRow(r).every((v, i) => v === prev[i]);
    });
    if (!same) stale.push(`${d.base}.csv`);
  }
  return stale;
}

// ───────────── TRACEABILITY: test case IDs in the docs <-> test titles in the spec files ─────────────
// ID is in the docs but not in the code  -> ERROR (the test has not been written)
// test is in the code but not in the docs -> WARNING (undocumented)
// the same ID appears twice               -> ERROR (duplicate)
function traceability() {
  const root = path.resolve(__dirname, '..', 'tests');
  const exact = new Map(); // id -> count
  const prefixes = []; // prefix of data-driven IDs such as TC_X_16.${i + 1}
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'setup') walk(f); continue; }
      if (!e.name.endsWith('.spec.ts')) continue;
      for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*test(?:\.\w+)?\(\s*[`'"](TC_[A-Z0-9]+_\d+(?:\.\d+|\.\$\{[^}]*\})?)/);
        if (!m) continue;
        if (m[1].includes('${')) prefixes.push(m[1].split('${')[0]);
        else exact.set(m[1], (exact.get(m[1]) || 0) + 1);
      }
    }
  };
  if (fs.existsSync(root)) walk(root);
  const docIds = new Set();
  for (const d of listDocs()) for (const r of d.rows) docIds.add(r[0]);
  const inSpec = (id) => exact.has(id) || prefixes.some((p) => id.startsWith(p));
  return {
    missingInSpec: [...docIds].filter((id) => !inSpec(id)),
    undocumented: [...exact.keys()].filter((id) => !docIds.has(id)),
    duplicates: [...exact.entries()].filter(([, n]) => n > 1).map(([id]) => id),
  };
}

module.exports = { buildRows, toCsv, exportMaster, checkMaster, traceability, parseCsv };

if (require.main === module) {
  if (process.argv.includes('--check')) {
    let bad = false;
    const stale = checkMaster();
    if (stale.length) { console.log(`ERROR master CSV out of date: ${stale.join(', ')}  ->  run: npm run cases:csv`); bad = true; }
    else console.log('OK   master CSV files match docs/test-cases.');
    const t = traceability();
    if (t.missingInSpec.length) { console.log(`ERROR in docs but no test in code: ${t.missingInSpec.join(', ')}`); bad = true; }
    if (t.duplicates.length) { console.log(`ERROR duplicate test IDs in code: ${t.duplicates.join(', ')}`); bad = true; }
    if (t.undocumented.length) console.log(`WARN  tests without a doc entry (${t.undocumented.length}): ${t.undocumented.join(', ')}`);
    if (!bad) console.log('OK   every documented case has a test, no duplicate IDs.');
    process.exit(bad ? 1 : 0);
  } else {
    for (const s of exportMaster()) {
      console.log(`${s.file}: ${s.total} cases (new ${s.added}, changed ${s.changed}, removed ${s.removed})`);
    }
  }
}
