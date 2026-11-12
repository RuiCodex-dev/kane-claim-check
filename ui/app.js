// Claim Check UI. Plain DOM, no build step.
const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
  }
  for (const k of kids) if (k) n.append(k);
  return n;
};
const badge = (v) => el('span', { class: 'badge', 'data-verdict': v, text: v });

function log(text) {
  $('#log').append(el('li', { text }));
  $('#log').scrollTop = $('#log').scrollHeight;
}

function renderLedger(l) {
  $('#ledger-card').hidden = false;
  $('#ledger-title').textContent = `Ledger: ${l.productName || l.url}`;
  $('#ledger-meta').textContent = `${l.url} | checked ${l.checkedAt} | ${(Math.round((l.credits || 0) * 100) / 100).toFixed(2)} Kane credits | exit ${l.exitCode}`;
  const s = l.summary || {};
  const chips = $('#summary');
  chips.replaceChildren();
  for (const v of ['PROVED', 'REFUTED', 'INCONCLUSIVE', 'UNTRUSTED', 'ABSENT']) {
    const c = el('span', { class: 'chip', 'data-count': v }, badge(v), ` ${s[v] || 0}`);
    chips.append(c);
  }
  const body = $('#ledger tbody');
  body.replaceChildren();
  if (!l.rows.length) body.append(el('tr', {}, el('td', { colspan: '4', text: 'Nothing to check on this page. That is not a pass.' })));
  // Kane's own sub-checks for a claim, from the last batch that asked about it.
  const claimIndex = (r) => (l.claims || []).findIndex((c) => c.statement === r.statement && c.type === r.claimType);
  const subChecks = (r) => {
    const i = claimIndex(r);
    const b = [...(l.batches || [])].reverse().find((bb) => bb.url === r.finalUrl && bb.conditions.some((c) => c.claim === i && c.role === 'p'));
    if (!b) return null;
    return ['p', 'notP'].map((role) => b.conditions.find((c) => c.claim === i && c.role === role)).filter(Boolean);
  };
  const pill = (label, v) => el('span', { class: 'pill', 'data-v': String(v), text: `${label}: ${v}` });
  for (const r of l.rows) {
    const said = el('td', { class: 'quote' });
    if (r.kane && 'notP' in r.kane) said.append(el('div', { class: 'pair' }, pill('claim', r.kane.p), pill('negation', r.kane.notP), r.reasked ? el('span', { class: 'pill', text: 're-asked' }) : null));
    said.append(el('div', { text: r.why || '' }));
    if (r.diagnosis) said.append(el('div', { class: 'diag', text: `Diagnosis: ${r.diagnosis}` }));
    const subs = subChecks(r);
    if (subs && subs.some((c) => c.kaneCheck)) {
      const d = el('details', { class: 'kanecheck' }, el('summary', { text: "Kane's own check" }));
      for (const c of subs) {
        const k = c.kaneCheck || {};
        d.append(el('code', { text: `${c.role === 'p' ? 'claim   ' : 'negation'}  read ${JSON.stringify(k.extracted)} ${k.operator || ''} expected ${JSON.stringify(k.expected)} -> ${c.answer}` }));
      }
      said.append(d);
    }
    body.append(el('tr', { 'data-claim': r.claimType, 'data-verdict': r.verdict },
      el('td', {}, badge(r.verdict)),
      el('td', { text: r.store }),
      el('td', {}, el('div', { text: r.statement }), el('div', { class: 'quote', text: `"${r.sourceQuote}"` })),
      said));
  }
  const gates = $('#gates tbody');
  gates.replaceChildren();
  for (const b of l.batches) {
    const id = b.conditions.find((c) => c.role === 'identity');
    const ct = b.conditions.find((c) => c.role === 'control');
    gates.append(el('tr', { 'data-run': b.label, 'data-trust': b.trust },
      el('td', { text: b.label }),
      el('td', {}, badge(b.trust)),
      el('td', { class: 'quote', text: id ? `${id.text} -> Kane: ${id.answer}` : '' }),
      el('td', { class: 'quote', text: ct ? `${ct.text} -> Kane: ${ct.answer}` : '' }),
      el('td', { text: b.credits == null ? '' : (Math.round(b.credits * 100) / 100).toFixed(2) })));
  }
  const notes = $('#notes');
  notes.replaceChildren();
  for (const n of l.notes || []) notes.append(el('p', { class: 'meta', text: `Note: ${n}` }));
}

async function loadRuns() {
  const runs = await (await fetch('/api/runs')).json();
  const ul = $('#runs');
  ul.replaceChildren();
  if (!runs.length) ul.append(el('li', { class: 'meta', text: 'No checks yet.' }));
  for (const r of runs) {
    const a = el('a', { href: `?ledger=${r.dir}/${r.file}`, text: r.productName || r.url });
    a.addEventListener('click', async (e) => { e.preventDefault(); history.replaceState(null, '', a.href); await openLedger(`${r.dir}/${r.file}`); });
    const s = r.summary || {};
    ul.append(el('li', {}, a, ` ${r.checkedAt} | ${s.PROVED || 0} proved, ${s.REFUTED || 0} refuted, ${(s.INCONCLUSIVE || 0) + (s.UNTRUSTED || 0) + (s.ABSENT || 0)} not established`));
  }
}

async function openLedger(path) {
  const res = await fetch(`/api/runs/${path}`);
  if (!res.ok) { log(`Could not load ${path}`); return; }
  renderLedger(await res.json());
}

function setStep(name) {
  const order = ['read', 'source', 'follow', 'judge', 'ledger'];
  const at = order.indexOf(name);
  document.querySelectorAll('.steps li').forEach((li) => {
    const i = order.indexOf(li.dataset.step);
    li.classList.toggle('done', i < at || (name === 'ledger' && i === at));
    li.classList.toggle('active', i === at && name !== 'ledger');
  });
}

async function runCheck(url) {
  $('#run').disabled = true;
  $('#log').replaceChildren();
  $('#progress').hidden = false;
  setStep('read');
  const t0 = Date.now();
  const tick = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    $('#elapsed').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 500);
  const finish = () => { clearInterval(tick); $('#run').disabled = false; };
  log(`Checking ${url}`);
  const res = await fetch('/api/check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
  const data = await res.json();
  if (!res.ok) { log(data.error || 'Check failed to start.'); finish(); return; }
  const es = new EventSource(`/api/jobs/${data.job}/events`);
  es.onmessage = (m) => {
    const e = JSON.parse(m.data);
    if (e.type === 'stage') { log(e.text); if (/^Following/.test(e.text)) setStep('follow'); }
    if (e.type === 'extracted') { log(`Found ${e.claims.length} claim(s) and ${e.targets.length} store link(s)`); setStep('source'); }
    if (e.type === 'kane_start') { log(`Kane CLI judging ${e.conditions.length} conditions on ${e.label}...`); if (e.label !== 'source page') setStep('judge'); }
    if (e.type === 'kane_end') log(`Kane CLI ${e.label}: ${e.trust}${e.why ? ` (${e.why})` : ''}`);
    if (e.type === 'error') log(`Error: ${e.message}`);
    if (e.type === 'ledger') { setStep('ledger'); renderLedger(e.ledger); loadRuns(); }
  };
  es.onerror = () => { es.close(); finish(); };
}

$('#form').addEventListener('submit', (e) => { e.preventDefault(); runCheck($('#url').value.trim()); });
$('#demo').addEventListener('click', () => {
  const url = `${location.origin}/fixtures/drift/`;
  $('#url').value = url;
  runCheck(url);
});

const pre = new URLSearchParams(location.search).get('ledger');
if (pre) openLedger(pre);
loadRuns();
