// Experiment (12 Nov 2026): does asking not-P in the same Kane run as P make Kane answer
// true to negations it should reject? Three trials of each design on the honest fixture
// store page, where every not-P is known to be FALSE. Run: node tools/batching-experiment.mjs
const R = new URL('../src/', import.meta.url).href;
const { Browser } = await import(R + 'chrome.mjs');
const { startServer } = await import(R + 'server.mjs');
const { PAGE_SCRIPT, compileClaims, gatesFor } = await import(R + 'extract.mjs');
const { analyze } = await import(R + 'kane.mjs');
const { writeFileSync } = await import('node:fs');
const srv = await startServer({ port: 0, quiet: true });
const b = await Browser.launch();
const out = [];
try {
  await b.goto(`http://127.0.0.1:${srv.port}/fixtures/honest/`);
  const { claims } = compileClaims(await b.evaluate(PAGE_SCRIPT));
  await b.goto(`http://127.0.0.1:${srv.port}/fixtures/store/tally-tiles/`);
  const t = await b.evaluate(PAGE_SCRIPT);
  const g = gatesFor(t.title);
  const gates = [g.identity.condition, g.control.condition];
  const designs = {
    mixed: [...gates, ...claims.flatMap((c) => [c.p, c.notP])],
    notPonly: [...gates, ...claims.map((c) => c.notP)],
  };
  for (let trial = 1; trial <= 3; trial++) {
    for (const [name, conds] of Object.entries(designs)) {
      const r = await analyze(b.endpoint, conds);
      const re = r.runEnd || {};
      const sub = re.condition_sub_checks || [];
      const res = re.condition_results || [];
      // not-P indexes: every not-P is known FALSE on this honest page.
      const notIdx = conds.map((c, i) => (claims.some((x) => x.notP === c) ? i : -1)).filter((i) => i >= 0);
      const wrong = notIdx.filter((i) => res[i] === true).length;
      const row = { trial, design: name, notP: notIdx.length, notPAnsweredTrue: wrong, gates: [res[0], res[1]], expectations: notIdx.map((i) => sub[i]?.expected_value), credits: re.credits_consumed, ms: r.durationMs };
      out.push(row);
      console.log(JSON.stringify(row));
    }
  }
} finally {
  await b.close();
  await srv.close();
}
writeFileSync(new URL('../recorded-runs/experiment-batching_2026-11-12.json', import.meta.url), JSON.stringify(out, null, 2));
