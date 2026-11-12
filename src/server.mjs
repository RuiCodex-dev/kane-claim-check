// Local web UI and JSON API. Binds to 127.0.0.1 only.
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, dirname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkUrl } from './check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const LEDGER_DIRS = ['runs', 'recorded-runs'];

function sendFile(res, base, rel) {
  const full = normalize(join(base, rel));
  if (!full.startsWith(normalize(base) + sep) || !existsSync(full) || statSync(full).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('not found');
  }
  res.writeHead(200, { 'content-type': TYPES[extname(full)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(full));
}

function listRuns() {
  const out = [];
  for (const d of LEDGER_DIRS) {
    const dir = join(ROOT, d);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json') || f.startsWith('crawl_')) continue;
      try {
        const l = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        if (l.tool !== 'kane-claim-check') continue;
        out.push({ dir: d, file: f, url: l.url, productName: l.productName, checkedAt: l.checkedAt, summary: l.summary, exitCode: l.exitCode });
      } catch { /* not a ledger */ }
    }
  }
  // The same ledger can sit in runs/ and recorded-runs/; list it once, preferring the recorded copy.
  const seen = new Map();
  for (const r of out) {
    const k = `${r.url}|${r.checkedAt}`;
    if (!seen.has(k) || r.dir === 'recorded-runs') seen.set(k, r);
  }
  return [...seen.values()].sort((a, b) => String(b.checkedAt).localeCompare(String(a.checkedAt)));
}

export function startServer({ port = 4317, quiet = false } = {}) {
  const jobs = new Map();
  let busy = null;
  let nextJob = 0;

  const server = createServer(async (req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    try {
      if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) return sendFile(res, join(ROOT, 'ui'), 'index.html');
      if (req.method === 'GET' && u.pathname.startsWith('/ui/')) return sendFile(res, join(ROOT, 'ui'), u.pathname.slice(4));
      if (req.method === 'GET' && u.pathname.startsWith('/fixtures/')) {
        const rel = u.pathname.slice(10);
        return sendFile(res, join(ROOT, 'fixtures'), rel.endsWith('/') || !extname(rel) ? join(rel, 'index.html') : rel);
      }
      if (req.method === 'GET' && u.pathname === '/api/runs') {
        res.writeHead(200, { 'content-type': TYPES['.json'] });
        return res.end(JSON.stringify(listRuns()));
      }
      const m = u.pathname.match(/^\/api\/runs\/(runs|recorded-runs)\/([A-Za-z0-9._-]+\.json)$/);
      if (req.method === 'GET' && m) return sendFile(res, join(ROOT, m[1]), m[2]);
      if (req.method === 'POST' && u.pathname === '/api/check') {
        let body = '';
        for await (const chunk of req) body += chunk;
        let target;
        try { target = new URL(JSON.parse(body).url); } catch { target = null; }
        if (!target || !/^https?:$/.test(target.protocol)) {
          res.writeHead(400, { 'content-type': TYPES['.json'] });
          return res.end(JSON.stringify({ error: 'Give an http(s) URL.' }));
        }
        if (busy !== null) {
          res.writeHead(409, { 'content-type': TYPES['.json'] });
          return res.end(JSON.stringify({ error: 'A check is already running.', job: busy }));
        }
        const id = String(++nextJob);
        const job = { id, events: [], clients: new Set(), done: false };
        jobs.set(id, job);
        busy = id;
        const push = (e) => {
          job.events.push(e);
          for (const c of job.clients) c.write(`data: ${JSON.stringify(e)}\n\n`);
        };
        checkUrl(target.href, { onEvent: push, outDir: join(ROOT, 'runs') })
          .then((ledger) => push({ type: 'ledger', ledger }))
          .catch((e) => push({ type: 'error', message: e.message }))
          .finally(() => {
            job.done = true; busy = null;
            for (const c of job.clients) c.end();
          });
        res.writeHead(202, { 'content-type': TYPES['.json'] });
        return res.end(JSON.stringify({ job: id }));
      }
      const j = u.pathname.match(/^\/api\/jobs\/(\d+)\/events$/);
      if (req.method === 'GET' && j && jobs.has(j[1])) {
        const job = jobs.get(j[1]);
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        for (const e of job.events) res.write(`data: ${JSON.stringify(e)}\n\n`);
        if (job.done) return res.end();
        job.clients.add(res);
        req.on('close', () => job.clients.delete(res));
        return undefined;
      }
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found');
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      return res.end(e.message);
    }
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const actual = server.address().port;
      if (!quiet) console.log(`listening on 127.0.0.1:${actual}`);
      resolve({
        port: actual,
        close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }),
      });
    });
  });
}
