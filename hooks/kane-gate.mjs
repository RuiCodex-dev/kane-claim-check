#!/usr/bin/env node
// Claude Code Stop hook: the agent may not say "done" until Kane agrees.
//
// When the agent tries to stop, this gate runs, in order:
//   1. the unit tests (node --test);
//   2. Kane CLI replaying kane/*_test.md against the local UI (cached after the first run);
//   3. `claimcheck demo`: Claim Check run for real, Kane judging the local fixtures,
//      compared with fixtures/expected.json.
// Any failure is returned to the agent as {"decision":"block","reason":...}, with Kane's
// own words, so the agent's next turn starts from what Kane saw. After 3 failed attempts
// in a row the gate stops blocking and escalates to the human instead of looping.
// Nothing runs when the sources are unchanged since the last green gate.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATE = join(ROOT, '.claude', 'kane-gate-state.json');
const LOG = join(ROOT, 'recorded-runs', 'gate-log.ndjson');
const MAX_ATTEMPTS = 3;
const WATCH = ['src', 'ui', 'bin', 'fixtures', 'kane', 'test'];

function readStdin() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

function hashSources() {
  const h = createHash('sha256');
  const walk = (d) => {
    for (const f of readdirSync(d).sort()) {
      if (f.startsWith('output-')) continue; // Kane's replay cache, not a source
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else h.update(p.slice(ROOT.length)).update(readFileSync(p));
    }
  };
  for (const w of WATCH) if (existsSync(join(ROOT, w))) walk(join(ROOT, w));
  return h.digest('hex').slice(0, 16);
}

const loadState = () => { try { return JSON.parse(readFileSync(STATE, 'utf8')); } catch { return { attempts: 0 }; } };
const saveState = (s) => { mkdirSync(dirname(STATE), { recursive: true }); writeFileSync(STATE, JSON.stringify(s, null, 2)); };
const logEvent = (e) => {
  mkdirSync(dirname(LOG), { recursive: true });
  writeFileSync(LOG, `${JSON.stringify({ ts: new Date().toISOString(), ...e })}\n`, { flag: 'a' });
};
const tail = (s, n = 25) => String(s || '').split(/\r?\n/).filter(Boolean).slice(-n).join('\n');

function run(cmd, args, timeoutMs) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', timeout: timeoutMs, windowsHide: true, env: { ...process.env, NO_COLOR: '1' } });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), stdout: r.stdout || '' };
}

function kaneUiTests() {
  // The UI test needs the UI served on the port its test.md names.
  const files = existsSync(join(ROOT, 'kane')) ? readdirSync(join(ROOT, 'kane')).filter((f) => f.endsWith('_test.md')) : [];
  if (!files.length) return { ok: true, detail: 'no kane/*_test.md files' };
  const server = run(process.execPath, ['hooks/serve-for-gate.mjs', 'start'], 30000);
  if (server.code !== 0) return { ok: false, stage: 'serve UI', detail: tail(server.out) };
  try {
    for (const f of files) {
      const r = run(process.execPath, ['hooks/kane.mjs', 'testmd', 'run', join('kane', f), '--agent', '--headless'], 600000);
      const events = r.stdout.split(/\r?\n/).filter((l) => l.startsWith('{')).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const end = events.find((e) => e.type === 'run_end');
      logEvent({ gate: 'kane-ui', test: f, exit: r.code, status: end?.status, summary: end?.summary, credits: end?.credits_consumed });
      if (r.code !== 0 || !end || end.status !== 'passed') {
        const steps = events.filter((e) => e.step !== undefined && e.status !== 'done').map((e) => `step ${e.step} ${e.status}: ${e.remark || ''}`);
        return {
          ok: false,
          stage: `Kane UI test ${f}`,
          detail: [
            `kane-cli exit ${r.code}, status ${end?.status || 'no run_end'}`,
            end?.summary ? `Kane summary: ${end.summary}` : '',
            end?.final_state ? `Kane final state: ${JSON.stringify(end.final_state).slice(0, 600)}` : '',
            ...steps.slice(-6),
            end?.test_url ? `Kane run: ${end.test_url}` : '',
            `Kane wrote its step-by-step result to kane/output-${f.replace(/_test\.md$/, '')}/Result.md`,
          ].filter(Boolean).join('\n'),
        };
      }
    }
    return { ok: true };
  } finally {
    run(process.execPath, ['hooks/serve-for-gate.mjs', 'stop'], 15000);
  }
}

function main() {
  const input = readStdin();
  const state = loadState();
  const hash = hashSources();
  if (state.greenHash === hash) {
    process.stdout.write(JSON.stringify({ systemMessage: 'Kane gate: sources unchanged since the last green gate.' }));
    return;
  }
  const stages = [
    () => {
      const tests = readdirSync(join(ROOT, 'test')).filter((f) => f.endsWith('.test.mjs')).map((f) => join('test', f));
      const r = run(process.execPath, ['--test', ...tests], 120000);
      if (r.code === 0) return { ok: true };
      // Hand the agent only what failed: each "not ok" line with its error and expected/actual.
      const lines = r.out.split(/\r?\n/);
      const failed = [];
      lines.forEach((l, i) => {
        if (/^\s*not ok \d+/.test(l)) {
          const block = [l.trim()];
          for (let j = i + 1; j < Math.min(lines.length, i + 30) && !/^\s*(ok|not ok) \d+/.test(lines[j]); j++) {
            if (/error:|expected:|actual:|operator:|at .*test[\\/]/.test(lines[j])) block.push(lines[j].trim());
          }
          failed.push(block.join('\n  '));
        }
      });
      return { ok: false, stage: 'unit tests', detail: failed.length ? failed.join('\n') : tail(r.out, 40) };
    },
    kaneUiTests,
    () => {
      const r = run(process.execPath, ['bin/claimcheck.mjs', 'demo', '--out', 'runs'], 900000);
      logEvent({ gate: 'demo', exit: r.code, result: tail(r.out, 12) });
      return r.code === 0 ? { ok: true } : { ok: false, stage: 'claimcheck demo (Kane judging the fixtures)', detail: tail(r.out, 30) };
    },
  ];
  for (const stage of stages) {
    const res = stage();
    if (res.ok) continue;
    const attempts = (state.attempts || 0) + 1;
    logEvent({ gate: 'blocked', stage: res.stage, attempt: attempts, session: input.session_id });
    if (attempts >= MAX_ATTEMPTS) {
      saveState({ ...state, attempts: 0, lastFailure: res.stage });
      process.stdout.write(JSON.stringify({
        systemMessage: `Kane gate ESCALATION: "${res.stage}" still fails after ${MAX_ATTEMPTS} attempts. Stopping so a human can look.\n${res.detail}`,
      }));
      return;
    }
    saveState({ ...state, attempts, lastFailure: res.stage });
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: `Kane gate (attempt ${attempts} of ${MAX_ATTEMPTS}): "${res.stage}" failed. Do not claim the work is done. Read what failed (in Kane's own words where Kane ran), fix the cause in the code (not the test), and finish again.\n\n${res.detail}`,
    }));
    return;
  }
  saveState({ greenHash: hash, attempts: 0, greenAt: new Date().toISOString() });
  logEvent({ gate: 'green', hash });
  process.stdout.write(JSON.stringify({ systemMessage: 'Kane gate green: unit tests, Kane UI replay and the Kane-judged fixture demo all pass.' }));
}

main();
