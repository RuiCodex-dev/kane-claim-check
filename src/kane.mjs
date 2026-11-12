// Thin wrapper around `kane-cli`: spawn it in agent mode, parse its NDJSON.
import { spawn } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';

// Resolve kane-cli without a shell, so condition text is never re-split by
// cmd.exe quoting. On Windows npm installs a .cmd shim; the real entry point
// is the package's bin script, which we run with this same Node.
export function findKane() {
  if (process.env.KANE_CLI_JS && existsSync(process.env.KANE_CLI_JS)) {
    return { cmd: process.execPath, pre: [process.env.KANE_CLI_JS] };
  }
  for (const dir of (process.env.PATH || '').split(delimiter)) {
    if (!dir) continue;
    const js = join(dir, 'node_modules', '@testmuai', 'kane-cli', 'bin', 'kane-cli.cjs');
    if (existsSync(js)) return { cmd: process.execPath, pre: [js] };
    const bin = join(dir, 'kane-cli');
    if (process.platform !== 'win32' && existsSync(bin)) {
      const real = realpathSync(bin);
      return real.endsWith('.cjs') || real.endsWith('.js')
        ? { cmd: process.execPath, pre: [real] }
        : { cmd: bin, pre: [] };
    }
  }
  throw new Error('kane-cli not found. Install it with: npm install -g @testmuai/kane-cli');
}

export function parseNdjson(text) {
  const events = [];
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim();
    if (!s.startsWith('{')) continue;
    try { events.push(JSON.parse(s)); } catch { /* partial line */ }
  }
  return events;
}

export function runKane(args, { timeoutSec = 240, cwd } = {}) {
  const { cmd, pre } = findKane();
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(cmd, [...pre, ...args], { cwd, windowsHide: true, env: { ...process.env, NO_COLOR: '1' } });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutSec * 1000);
    child.on('error', (e) => { err += `\n${e.message}`; });
    child.on('close', (code) => {
      clearTimeout(timer);
      const events = parseNdjson(out);
      resolve({
        exitCode: code,
        timedOut,
        events,
        runEnd: events.find((e) => e.type === 'run_end') || null,
        stdoutText: out.slice(-4000),
        stderrTail: err.split(/\r?\n/).filter(Boolean).slice(-5),
        durationMs: Date.now() - started,
      });
    });
  });
}

// Ask Kane to judge conditions against whatever page the CDP browser shows.
export function analyze(cdpEndpoint, conditions, { extraArgs = [], ...opts } = {}) {
  const args = ['run', '--agent', '--analyzer-only', '--cdp-endpoint', cdpEndpoint, ...extraArgs];
  for (const c of conditions) args.push('--condition', c);
  return runKane(args, opts);
}

// Is Kane installed and logged in? Used by `claimcheck doctor`. Spends no credits.
export async function kaneStatus() {
  try { findKane(); } catch (e) { return { ok: false, why: e.message }; }
  const r = await runKane(['balance'], { timeoutSec: 60 });
  return parseBalance(`${r.stdoutText}\n${r.stderrTail.join('\n')}`, r.exitCode);
}

// Pure, so it is unit-tested: read `kane-cli balance` output.
export function parseBalance(text, exitCode = 0) {
  const m = String(text).match(/Available credits:\s*([0-9.]+)/i);
  if (m) return { ok: true, credits: Number(m[1]) };
  if (/log ?in|unauthori[sz]ed|not authenticated|401/i.test(text)) return { ok: false, why: 'Kane CLI is not logged in. Run: kane-cli login' };
  return { ok: false, why: `could not read the credit balance (kane-cli exit ${exitCode})` };
}
