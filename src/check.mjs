// Orchestration: open the page, extract its claims, follow each store link,
// and have Kane judge every claim against the place the link actually leads.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Browser } from './chrome.mjs';
import { PAGE_SCRIPT, compileClaims, gatesFor } from './extract.mjs';
import { analyze } from './kane.mjs';
import { VERDICT, judgeBatch, exitCodeFor, summarise, diagnose } from './judge.mjs';
import { toMarkdown } from './report.mjs';

export const VERSION = '0.1.0';

const EXPECTED_HOST = {
  play: (h) => h === 'play.google.com',
  appstore: (h) => h === 'apps.apple.com',
  appgallery: (h) => h === 'appgallery.huawei.com',
  fixture: (h, src) => h === src,
};

function slugOf(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

async function runBatch(browser, conditions, emit, label, { assertionMode = 'dom' } = {}) {
  emit({ type: 'kane_start', label, conditions: conditions.map((c) => c.text), assertionMode });
  const result = await analyze(browser.endpoint, conditions.map((c) => c.text), { extraArgs: ['--assertion-mode', assertionMode] });
  const judged = judgeBatch(conditions, result);
  emit({ type: 'kane_end', label, trust: judged.trust, why: judged.why, credits: judged.credits, ms: result.durationMs });
  const sub = result.runEnd?.condition_sub_checks || [];
  return {
    label,
    assertionMode,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    trust: judged.trust,
    why: judged.why,
    credits: Math.round((judged.credits || 0) * 100) / 100,
    conditions: conditions.map((c, i) => ({
      role: c.role, claim: c.claim, text: c.text,
      answer: judged.answers[i] ?? null, reason: judged.reasons[i] ?? null,
      kaneCheck: sub[i] ? { extracted: sub[i].extracted_value, operator: sub[i].operator, expected: sub[i].expected_value } : null,
    })),
    stderrTail: result.stderrTail,
    judged,
  };
}

export async function checkUrl(url, { onEvent = () => {}, outDir = 'runs', maxTargets = 4, headless = true, reask = true } = {}) {
  const emit = (e) => onEvent({ ts: new Date().toISOString(), ...e });
  const ledger = {
    tool: 'kane-claim-check', version: VERSION, checkedAt: new Date().toISOString(), url,
    batches: [], rows: [], sourceRows: [], notes: [],
  };
  const browser = await Browser.launch({ headless });
  try {
    emit({ type: 'stage', text: `Opening ${url}` });
    await browser.goto(url);
    const page = await browser.evaluate(PAGE_SCRIPT);
    const { productName, claims, targets } = compileClaims(page);
    Object.assign(ledger, { finalUrl: page.url, title: page.title, productName, claims, targets });
    emit({ type: 'extracted', productName, claims: claims.map((c) => c.statement), targets: targets.map((t) => t.url) });
    if (!targets.length) ledger.notes.push('No store links found on the page: nothing to prove, and that is not a pass.');
    if (!claims.length) ledger.notes.push('No checkable claims found on the page: nothing to prove, and that is not a pass.');

    // 1. Source batch: does the page really make each claim the extractor found?
    const disputed = new Set();
    const g0 = gatesFor(page.title);
    const srcConds = [
      { role: 'identity', text: g0.identity.condition },
      { role: 'control', text: g0.control.condition },
      ...claims.map((c, i) => ({ role: 'source', claim: i, text: `This page states that ${c.statement}` }))
        .filter((c) => claims[c.claim].type !== 'listing-name'),
    ];
    if (srcConds.length > 2) {
      const b = await runBatch(browser, srcConds, emit, 'source page');
      b.url = page.url; b.title = page.title;
      ledger.batches.push(b);
      for (const [id, v] of Object.entries(b.judged.claims)) {
        const c = claims[id];
        ledger.sourceRows.push({ claimType: c.type, statement: c.statement, sourceQuote: c.sourceQuote, verdict: v.verdict, why: v.why });
        if (v.verdict === VERDICT.REFUTED) disputed.add(Number(id));
      }
    }

    // 2. One batch per store target, asked from the target page itself.
    for (const t of targets.slice(0, maxTargets)) {
      const applicable = claims
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) => c.appliesTo.includes(t.kind) && !disputed.has(i));
      emit({ type: 'stage', text: `Following ${t.label} link ${t.url}` });
      let tpage;
      try {
        await browser.goto(t.url);
        tpage = await browser.evaluate(PAGE_SCRIPT);
      } catch (e) {
        tpage = null;
        ledger.notes.push(`${t.label}: could not open ${t.url}: ${e.message}`);
      }
      const srcHost = new URL(page.url).host;
      const host = tpage ? new URL(tpage.url).host : '';
      const baseRow = (c) => ({ store: t.label, targetUrl: t.url, finalUrl: tpage?.url || null, claimType: c.type, statement: c.statement, sourceQuote: c.sourceQuote });
      if (!tpage || !EXPECTED_HOST[t.kind](host, srcHost)) {
        const why = tpage
          ? `the link landed on ${host}, not on the ${t.label} (redirect or consent wall), so no claim could be judged there`
          : 'the link could not be opened';
        for (const { c } of applicable) ledger.rows.push({ ...baseRow(c), verdict: VERDICT.ABSENT, why });
        emit({ type: 'kane_end', label: t.label, trust: VERDICT.ABSENT, why });
        continue;
      }
      const g = gatesFor(tpage.title);
      const conds = [
        { role: 'identity', text: g.identity.condition },
        { role: 'control', text: g.control.condition },
      ];
      for (const { c, i } of applicable) {
        conds.push({ role: 'p', claim: i, text: c.p });
        conds.push({ role: 'notP', claim: i, text: c.notP });
      }
      const b = await runBatch(browser, conds, emit, t.label);
      b.url = tpage.url; b.title = tpage.title;
      ledger.batches.push(b);
      const verdicts = { ...b.judged.claims };

      // 3. Re-ask: an inconclusive pair goes back to Kane once, with Kane's own
      //    earlier reading quoted, so the second question is narrower than the first,
      //    and judged by a second instrument: Kane's vision-only assertion mode
      //    instead of DOM extraction. Both answers are kept in the ledger.
      const unsure = Object.entries(verdicts).filter(([, v]) => v.verdict === VERDICT.INCONCLUSIVE);
      if (reask && unsure.length) {
        const g2 = gatesFor(tpage.title);
        const conds2 = [
          { role: 'identity', text: g2.identity.condition },
          { role: 'control', text: g2.control.condition },
        ];
        for (const [id, v] of unsure) {
          const c = claims[id];
          const hint = 'Read the whole listing, including the details and information sections further down the page.';
          conds2.push({ role: 'p', claim: Number(id), text: `${c.p}. ${hint} Your earlier reading was: "${(v.reasons?.p || '').slice(0, 160).replace(/"/g, "'")}"` });
          conds2.push({ role: 'notP', claim: Number(id), text: `${c.notP}. ${hint} Your earlier reading was: "${(v.reasons?.notP || '').slice(0, 160).replace(/"/g, "'")}"` });
        }
        emit({ type: 'stage', text: `Re-asking Kane about ${unsure.length} inconclusive claim(s) on ${t.label}` });
        const b2 = await runBatch(browser, conds2, emit, `${t.label} (re-ask, visual)`, { assertionMode: 'visual' });
        b2.url = tpage.url; b2.title = tpage.title;
        ledger.batches.push(b2);
        for (const [id] of unsure) {
          const second = b2.judged.claims[id];
          if (second) verdicts[id] = { ...second, reasked: true, first: verdicts[id] };
        }
      }
      // Diagnosis for an inconclusive pair: Kane's own sub-check shows whether it
      // compiled the negation into a question that expects "false" (an inverted
      // question), which makes "true" its answer to both the claim and its negation.
      const lastBatchFor = (id) => [...ledger.batches].reverse().find((bb) => bb.url === tpage.url && bb.conditions.some((x) => x.claim === id));
      for (const { c, i } of applicable) {
        const v = verdicts[i];
        const conds = lastBatchFor(i)?.conditions || [];
        const { verdict, diagnosis } = diagnose({
          claim: c, productName, verdict: v.verdict,
          pos: conds.find((x) => x.claim === i && x.role === 'p'),
          neg: conds.find((x) => x.claim === i && x.role === 'notP'),
        });
        ledger.rows.push({ ...baseRow(c), verdict, why: v.why, kane: v.kane || null, reasked: !!v.reasked, diagnosis });
      }
    }
    for (const i of disputed) {
      const c = claims[i];
      ledger.notes.push(`Skipped "${c.statement}": Kane did not confirm the page states it (extractor and Kane disagree; check the extractor rule).`);
    }
  } finally {
    await browser.close();
  }
  ledger.credits = Math.round(ledger.batches.reduce((s, b) => s + (b.credits || 0), 0) * 100) / 100;
  ledger.summary = summarise(ledger.rows);
  ledger.exitCode = exitCodeFor(ledger.rows);
  for (const b of ledger.batches) delete b.judged;

  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    const stem = `${ledger.checkedAt.replace(/[:.]/g, '-')}_${slugOf(url)}`;
    ledger.files = { json: join(outDir, `${stem}.json`), md: join(outDir, `${stem}.md`) };
    writeFileSync(ledger.files.json, JSON.stringify(ledger, null, 2));
    writeFileSync(ledger.files.md, toMarkdown(ledger));
  }
  emit({ type: 'done', summary: ledger.summary, exitCode: ledger.exitCode, credits: ledger.credits, files: ledger.files });
  return ledger;
}
