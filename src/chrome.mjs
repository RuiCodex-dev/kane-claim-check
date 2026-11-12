// A minimal headless Chrome over the DevTools protocol, with no dependencies.
// Claim Check owns navigation (so it always knows which page Kane is judging)
// and hands Kane the same browser through --cdp-endpoint.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ports other local tools commonly hold; never use them.
const RESERVED_PORTS = new Set([9222, 9229, 9333]);
const PROFILE_PREFIX = 'claimcheck-chrome-';
const STALE_AFTER_MS = 60 * 60 * 1000;

// Every Chrome this process started, so Ctrl+C or a crash never leaves one running.
const OPEN = new Set();
let signalsHooked = false;
function hookSignals() {
  if (signalsHooked) return;
  signalsHooked = true;
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, async () => {
      process.stderr.write(`\nclaimcheck: ${sig}, closing ${OPEN.size} browser(s)...\n`);
      await closeAll();
      process.exit(130);
    });
  }
  process.once('exit', () => { for (const b of OPEN) { try { b.proc?.kill(); } catch { /* gone */ } } });
}

export async function closeAll() {
  await Promise.all([...OPEN].map((b) => b.close().catch(() => {})));
}

// Pure: which temporary profiles left by an earlier, killed run may be removed.
// entries: [{ name, mtimeMs }]. Only our own prefix, and only when older than maxAgeMs,
// so a profile another claimcheck process is using right now is never touched.
export function staleProfiles(entries, now = Date.now(), maxAgeMs = STALE_AFTER_MS) {
  return entries.filter((e) => e.name.startsWith(PROFILE_PREFIX) && now - e.mtimeMs > maxAgeMs).map((e) => e.name);
}

function sweepStaleProfiles() {
  try {
    const dir = tmpdir();
    const entries = readdirSync(dir).filter((n) => n.startsWith(PROFILE_PREFIX)).map((name) => {
      try { return { name, mtimeMs: statSync(join(dir, name)).mtimeMs }; } catch { return null; }
    }).filter(Boolean);
    for (const name of staleProfiles(entries)) {
      try { rmSync(join(dir, name), { recursive: true, force: true }); } catch { /* still locked: next run */ }
    }
  } catch { /* temp dir unreadable: nothing to sweep */ }
}

export function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA || ''}/Google/Chrome/Application/chrome.exe`,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const hit = candidates.find((p) => p && existsSync(p));
  if (!hit) throw new Error('Chrome not found. Set CHROME_PATH to your Chrome or Chromium binary.');
  return hit;
}

function pickPort() {
  for (;;) {
    const p = 9400 + Math.floor(Math.random() * 500);
    if (!RESERVED_PORTS.has(p)) return p;
  }
}

class Session {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Set();
  }
  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = () => reject(new Error(`CDP connection failed: ${this.wsUrl}`));
    });
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners) fn(msg);
      }
    };
    return this;
  }
  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  waitFor(method, timeoutMs) {
    return new Promise((resolve) => {
      const t = setTimeout(() => { this.listeners.delete(fn); resolve(null); }, timeoutMs);
      const fn = (msg) => {
        if (msg.method === method) { clearTimeout(t); this.listeners.delete(fn); resolve(msg.params); }
      };
      this.listeners.add(fn);
    });
  }
  close() { try { this.ws.close(); } catch { /* already closed */ } }
}

export class Browser {
  static async launch({ headless = true, lang = 'en-US' } = {}) {
    hookSignals();
    sweepStaleProfiles();
    const b = new Browser();
    b.port = pickPort();
    b.dir = mkdtempSync(join(tmpdir(), PROFILE_PREFIX));
    const args = [
      `--remote-debugging-port=${b.port}`,
      `--user-data-dir=${b.dir}`,
      '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      `--lang=${lang}`, '--window-size=1366,900', 'about:blank',
    ];
    if (headless) args.unshift('--headless=new');
    b.proc = spawn(findChrome(), args, { stdio: 'ignore' });
    b.exited = new Promise((r) => b.proc.on('exit', r));
    b.proc.on('error', () => {});
    OPEN.add(b);
    for (let i = 0; i < 75; i++) {
      try {
        b.version = await (await fetch(`${b.endpoint}/json/version`)).json();
        break;
      } catch { await sleep(200); }
    }
    if (!b.version) { await b.close(); throw new Error('Chrome did not open its DevTools port in 15 s.'); }
    const targets = await (await fetch(`${b.endpoint}/json/list`)).json();
    let page = targets.find((t) => t.type === 'page');
    if (!page) page = await (await fetch(`${b.endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
    b.page = await new Session(page.webSocketDebuggerUrl).open();
    await b.page.send('Page.enable');
    await b.page.send('Runtime.enable');
    return b;
  }

  get endpoint() { return `http://127.0.0.1:${this.port}`; }

  async goto(url, { settleMs = 2500, timeoutMs = 30000 } = {}) {
    const loaded = this.page.waitFor('Page.loadEventFired', timeoutMs);
    const nav = await this.page.send('Page.navigate', { url });
    if (nav.errorText) throw new Error(`Navigation to ${url} failed: ${nav.errorText}`);
    await loaded;
    await sleep(settleMs); // let client-rendered pages finish (store listings are JS-heavy)
    return this.evaluate('location.href');
  }

  async evaluate(expression) {
    const r = await this.page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`Page script failed: ${r.exceptionDetails.text}`);
    return r.result.value;
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    OPEN.delete(this);
    try { this.page?.close(); } catch { /* ignore */ }
    if (this.version?.webSocketDebuggerUrl) {
      try {
        const s = await new Session(this.version.webSocketDebuggerUrl).open();
        s.send('Browser.close').catch(() => {});
        await Promise.race([this.exited, sleep(5000)]);
        s.close();
      } catch { /* fall through to kill */ }
    }
    if (this.proc && this.proc.exitCode === null) {
      this.proc.kill();
      await Promise.race([this.exited, sleep(3000)]);
    }
    // Chrome's child processes can hold profile files for a few seconds after the
    // browser exits (Windows especially). Retry for ~10 s; whatever is still locked
    // is swept by the next run once it is an hour old.
    for (let i = 0; i < 20; i++) {
      try { rmSync(this.dir, { recursive: true, force: true }); if (!existsSync(this.dir)) break; } catch { /* locked */ }
      await sleep(500);
    }
  }
}
