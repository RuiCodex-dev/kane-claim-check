#!/usr/bin/env node
// Start or stop a detached Claim Check UI on the fixed gate port (the port the
// Kane UI tests name), recording its PID so the gate always stops what it started.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4399;
const PIDFILE = join(ROOT, '.claude', 'gate-server.pid');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function up() {
  try { return (await fetch(`http://127.0.0.1:${PORT}/api/runs`)).ok; } catch { return false; }
}

if (process.argv[2] === 'start') {
  if (await up()) { console.log('already serving'); process.exit(0); }
  const child = spawn(process.execPath, ['bin/claimcheck.mjs', 'serve', '--port', String(PORT)], { cwd: ROOT, detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  writeFileSync(PIDFILE, String(child.pid));
  for (let i = 0; i < 50; i++) { if (await up()) { console.log(`serving on ${PORT}, pid ${child.pid}`); process.exit(0); } await sleep(200); }
  console.error('UI did not come up');
  process.exit(1);
} else if (process.argv[2] === 'stop') {
  if (existsSync(PIDFILE)) {
    const pid = Number(readFileSync(PIDFILE, 'utf8'));
    try { process.kill(pid); } catch { /* already gone */ }
    rmSync(PIDFILE, { force: true });
  }
  process.exit(0);
}
