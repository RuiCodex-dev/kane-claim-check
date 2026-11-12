#!/usr/bin/env node
// claimcheck: prove what a page promises about its store listings, in a real browser, with Kane CLI.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkUrl, VERSION } from '../src/check.mjs';
import { toMarkdown } from '../src/report.mjs';
import { startServer } from '../src/server.mjs';
import { exitCodeFor, summarise } from '../src/judge.mjs';
import { Browser, findChrome } from '../src/chrome.mjs';
import { kaneStatus } from '../src/kane.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const positional = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] || '').match(/^--(out|max-targets|port|match|limit)$/));

const C = (process.stdout.isTTY || process.env.CLAIMCHECK_COLOR) && !process.env.NO_COLOR
  ? { PROVED: '\x1b[32m', REFUTED: '\x1b[31m', INCONCLUSIVE: '\x1b[33m', UNTRUSTED: '\x1b[35m', ABSENT: '\x1b[90m', off: '\x1b[0m' }
  : { PROVED: '', REFUTED: '', INCONCLUSIVE: '', UNTRUSTED: '', ABSENT: '', off: '' };

function printEvent(e) {
  if (e.type === 'stage') console.log(`  > ${e.text}`);
  if (e.type === 'extracted') {
    console.log(`  product: ${e.productName || '(no heading)'}`);
    console.log(`  claims found: ${e.claims.length ? e.claims.join('; ') : 'none'}`);
    console.log(`  store links: ${e.targets.length ? e.targets.join(' , ') : 'none'}`);
  }
  if (e.type === 'kane_start') console.log(`  kane-cli judging ${e.conditions.length} conditions on ${e.label} ...`);
  if (e.type === 'kane_end') console.log(`  kane-cli ${e.label}: ${e.trust}${e.why ? ` (${e.why})` : ''}${e.credits ? `, ${Math.round(e.credits * 100) / 100} credits` : ''}`);
}

function printLedger(l) {
  console.log('');
  for (const r of l.rows) {
    console.log(`  ${C[r.verdict]}${r.verdict.padEnd(12)}${C.off} ${r.store.padEnd(12)} ${r.statement}${r.reasked ? '  [re-asked]' : ''}`);
  }
  if (!l.rows.length) console.log(`  ${C.ABSENT}NOTHING TO CHECK${C.off} (not a pass)`);
  for (const n of l.notes) console.log(`  note: ${n}`);
  const s = l.summary;
  console.log(`\n  ${s.PROVED} proved, ${s.REFUTED} refuted, ${s.INCONCLUSIVE} inconclusive, ${s.UNTRUSTED} untrusted, ${s.ABSENT} absent | ${l.credits} credits`);
  if (l.files) console.log(`  ledger: ${l.files.json}\n  report: ${l.files.md}`);
}

async function cmdCheck(urls, opts) {
  let worst = 0;
  const all = [];
  for (const url of urls) {
    console.log(`\nclaimcheck ${url}`);
    const l = await checkUrl(url, { ...opts, onEvent: printEvent });
    printLedger(l);
    all.push(l);
    if (l.exitCode === 1 || (l.exitCode === 2 && worst === 0)) worst = l.exitCode;
  }
  return { worst, all };
}

async function cmdCrawl(indexUrl, opts) {
  const match = flag('match', '/');
  const limit = Number(flag('limit', 10));
  const html = await (await fetch(indexUrl, { headers: { 'user-agent': 'kane-claim-check' } })).text();
  const base = new URL(indexUrl);
  const urls = [...new Set([...html.matchAll(/href="([^"#]+)"/g)]
    .map((m) => { try { return new URL(m[1], base).href; } catch { return null; } })
    .filter((u) => u && new URL(u).origin === base.origin && new URL(u).pathname.startsWith(match) && u !== indexUrl))]
    .slice(0, limit);
  if (!urls.length) {
    console.error(`No links under ${match} found on ${indexUrl}. That is an extraction problem, not a clean result.`);
    return 2;
  }
  console.log(`crawl: ${urls.length} page(s) under ${match}`);
  const { worst, all } = await cmdCheck(urls, opts);
  const rows = all.flatMap((l) => l.rows.map((r) => ({ page: l.url, ...r })));
  const summary = summarise(rows);
  const out = flag('out', 'runs');
  mkdirSync(out, { recursive: true });
  const file = join(out, `crawl_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify({ indexUrl, match, pages: all.map((l) => ({ url: l.url, summary: l.summary, exitCode: l.exitCode, credits: l.credits, files: l.files })), summary, exitCode: exitCodeFor(rows) }, null, 2));
  console.log(`\ncrawl total: ${summary.PROVED} proved, ${summary.REFUTED} refuted, ${summary.INCONCLUSIVE} inconclusive, ${summary.UNTRUSTED} untrusted, ${summary.ABSENT} absent\n  ${file}`);
  return worst;
}

// End-to-end self-test against local fixtures with known answers.
async function cmdDemo(opts) {
  const expected = JSON.parse(readFileSync(join(ROOT, 'fixtures', 'expected.json'), 'utf8'));
  const srv = await startServer({ port: 0, quiet: true });
  let failures = 0;
  try {
    for (const [path, want] of Object.entries(expected.pages)) {
      const url = `http://127.0.0.1:${srv.port}${path}`;
      const { all } = await cmdCheck([url], opts);
      const got = Object.fromEntries(all[0].rows.map((r) => [`${r.claimType}`, r.verdict]));
      // A WRONG verdict always fails: the opposite decision, an untrusted or absent
      // run, or a missing claim. An abstention (INCONCLUSIVE, Kane contradicted itself)
      // is allowed claim by claim, but most of the page must be decided correctly,
      // or the demo proves nothing and is not a pass.
      let decided = 0;
      const types = Object.entries(want);
      for (const [type, verdict] of types) {
        const g = got[type];
        const ok = g === verdict;
        const abstained = g === 'INCONCLUSIVE';
        if (ok) decided++;
        else if (!abstained) failures++;
        console.log(`  ${ok ? 'ok  ' : abstained ? 'abst' : 'FAIL'} ${path} ${type}: expected ${verdict}, got ${g || 'missing'}`);
      }
      const need = Math.ceil(types.length * 0.6);
      if (decided < need) {
        failures++;
        console.log(`  FAIL ${path}: only ${decided} of ${types.length} claims decided correctly (need ${need}); too many abstentions to prove anything`);
      }
    }
  } finally {
    await srv.close();
  }
  console.log(failures ? `\ndemo: ${failures} expectation(s) failed` : '\ndemo: no wrong verdict, and every page was decided');
  return failures ? 1 : 0;
}

// Everything a first run needs, checked before any credit is spent.
async function cmdDoctor() {
  let bad = 0;
  const line = (ok, what, detail) => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? `: ${detail}` : ''}`); };
  const major = Number(process.versions.node.split('.')[0]);
  line(major >= 22, 'Node.js 22+', `found ${process.versions.node}`);
  let chrome = null;
  try { chrome = findChrome(); line(true, 'Chrome', chrome); } catch (e) { line(false, 'Chrome', e.message); }
  if (chrome) {
    try {
      const b = await Browser.launch();
      const v = b.version?.Browser || 'unknown version';
      await b.close();
      line(true, 'Chrome starts headless with a DevTools port', v);
    } catch (e) { line(false, 'Chrome starts headless with a DevTools port', e.message); }
  }
  const k = await kaneStatus();
  line(k.ok, 'Kane CLI installed and logged in', k.ok ? `${Math.floor(k.credits)} credits available` : k.why);
  console.log(bad ? `\ndoctor: ${bad} problem(s); fix them before \`claimcheck check\`.` : '\ndoctor: ready. Try `claimcheck demo`, then `claimcheck check <your page>`.');
  return bad ? 2 : 0;
}

const opts = {
  outDir: flag('out', 'runs'),
  maxTargets: Number(flag('max-targets', 4)),
  headless: !flag('headed', false),
  reask: !flag('no-reask', false),
};

let code = 0;
try {
  if (cmd === 'check' && positional.length) code = (await cmdCheck(positional, opts)).worst;
  else if (cmd === 'crawl' && positional.length) code = await cmdCrawl(positional[0], opts);
  else if (cmd === 'demo') code = await cmdDemo(opts);
  else if (cmd === 'doctor') code = await cmdDoctor();
  else if (cmd === 'report' && positional.length) console.log(toMarkdown(JSON.parse(readFileSync(positional[0], 'utf8'))));
  else if (cmd === 'serve') {
    const srv = await startServer({ port: Number(flag('port', 4317)) });
    console.log(`Claim Check UI on http://127.0.0.1:${srv.port}  (Ctrl+C to stop)`);
    await new Promise(() => {});
  } else if (cmd === '--version' || cmd === '-v') console.log(VERSION);
  else {
    console.log(`kane-claim-check ${VERSION}: prove what a page promises, in a real browser, with Kane CLI.

  claimcheck doctor                 check Node, Chrome and Kane CLI login (spends no credits)
  claimcheck check <url...>         check one or more pages (exit 0 proved, 1 refuted, 2 not established)
  claimcheck crawl <index> --match /Products/ [--limit 10]
  claimcheck demo                   end-to-end self-test against local fixtures with known answers
  claimcheck serve [--port 4317]    local web UI
  claimcheck report <ledger.json>   print the Markdown report (fix tasks for your coding agent)

  options: --out runs  --max-targets 4  --headed  --no-reask`);
  }
} catch (e) {
  console.error(`claimcheck: ${e.message}`);
  code = 2;
}
process.exit(code);
