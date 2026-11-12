// Ledger -> Markdown. The "Fix tasks" section is written for a coding agent:
// each refuted claim becomes one concrete instruction plus the command that
// re-verifies it, so the agent can close the loop on its own.

const ICON = { PROVED: 'PROVED', REFUTED: 'REFUTED', INCONCLUSIVE: 'INCONCLUSIVE', UNTRUSTED: 'UNTRUSTED', ABSENT: 'ABSENT' };
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function toMarkdown(l) {
  const out = [];
  out.push(`# Claim Check: ${l.productName || l.url}`);
  out.push('');
  out.push(`- Page: ${l.url}${l.finalUrl && l.finalUrl !== l.url ? ` (landed on ${l.finalUrl})` : ''}`);
  out.push(`- Checked: ${l.checkedAt} with kane-claim-check ${l.version}, judged by Kane CLI (analyzer mode)`);
  const s = l.summary || {};
  out.push(`- Result: ${s.PROVED || 0} proved, ${s.REFUTED || 0} refuted, ${s.INCONCLUSIVE || 0} inconclusive, ${s.UNTRUSTED || 0} untrusted, ${s.ABSENT || 0} absent (exit ${l.exitCode})`);
  out.push(`- Kane credits used: ${l.credits}`);
  out.push('');
  out.push('## Claims, proved where the link leads');
  out.push('');
  out.push('| Verdict | Store | Claim on the page | Kane said |');
  out.push('|---|---|---|---|');
  for (const r of l.rows) {
    const k = r.kane ? `claim ${r.kane.p}, negation ${r.kane.notP}${r.reasked ? ' (after re-ask)' : ''}` : '';
    out.push(`| ${ICON[r.verdict]} | ${esc(r.store)} | ${esc(r.statement)} ("${esc(r.sourceQuote)}") | ${esc(k)} ${esc(r.why)}${r.diagnosis ? ` Diagnosis: ${esc(r.diagnosis)}` : ''} |`);
  }
  if (!l.rows.length) out.push('| - | - | nothing to check | - |');
  out.push('');
  out.push('## Trust gates per Kane run');
  out.push('');
  out.push('Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.');
  out.push('');
  out.push('| Run | Page | Trust | Why | Credits |');
  out.push('|---|---|---|---|---|');
  for (const b of l.batches) out.push(`| ${esc(b.label)} | ${esc(b.url)} | ${b.trust} | ${esc(b.why)} | ${b.credits ?? ''} |`);
  if (l.sourceRows?.length) {
    out.push('');
    out.push('## Does the page really say it? (extractor vs Kane)');
    out.push('');
    for (const r of l.sourceRows) out.push(`- ${r.verdict === 'PROVED' ? 'confirmed' : r.verdict}: ${r.statement}`);
  }
  if (l.notes?.length) {
    out.push('');
    out.push('## Notes');
    out.push('');
    for (const n of l.notes) out.push(`- ${n}`);
  }
  const refuted = l.rows.filter((r) => r.verdict === 'REFUTED');
  const open = l.rows.filter((r) => !['PROVED', 'REFUTED'].includes(r.verdict));
  out.push('');
  out.push('## Fix tasks for your coding agent');
  out.push('');
  if (!l.rows.length) out.push('- [ ] Nothing was checked, so nothing is proved. Check that the page has store links and claims the rules recognise.');
  else if (!refuted.length && !open.length) out.push('None. Every claim was proved where its link leads.');
  for (const r of refuted) {
    out.push(`- [ ] The page ${l.url} says "${r.sourceQuote}" (${r.statement}), but its ${r.store} link (${r.targetUrl}) does not support that. Kane: ${r.why}. Change the page copy or the store listing so they agree, then re-run \`claimcheck check ${l.url}\`.`);
  }
  for (const r of open) {
    out.push(`- [ ] Not established (${r.verdict}): "${r.statement}" on ${r.store}. ${r.why}. Do not treat this as a pass; re-run \`claimcheck check ${l.url}\` or check by hand.`);
  }
  out.push('');
  return out.join('\n');
}
