// Pure verdict logic. No I/O, so every rule here is unit-tested.
//
// A batch is one Kane analyzer run. Each batch carries:
//   identity - a statement Claim Check KNOWS is true (read from the DOM a moment earlier)
//   control  - a near-miss statement Claim Check KNOWS is false
// and, per claim, a pair of questions: P and not-P.
//
// Kane's answers count only if the batch is trusted: identity true AND control false.
// A claim is PROVED only when Kane says P is true AND not-P is false.

export const VERDICT = {
  PROVED: 'PROVED',
  REFUTED: 'REFUTED',
  INCONCLUSIVE: 'INCONCLUSIVE', // Kane agreed (or disagreed) with both P and not-P
  UNTRUSTED: 'UNTRUSTED', // the batch failed its identity gate or its control
  ABSENT: 'ABSENT', // Kane produced no usable answer (error, timeout, malformed)
};

export function readAnswers(result, n) {
  const re = result && result.runEnd;
  if (!re) {
    const hint = result?.stderrTail?.length ? `: ${result.stderrTail[result.stderrTail.length - 1].slice(0, 200)}` : '';
    const timeout = result?.timedOut ? ', timed out' : '';
    return { ok: false, why: `Kane returned no run_end (exit ${result ? result.exitCode : 'none'}${timeout})${hint}` };
  }
  const r = re.condition_results;
  if (!Array.isArray(r) || r.length !== n) {
    return { ok: false, why: `Kane answered ${Array.isArray(r) ? r.length : 0} of ${n} conditions` };
  }
  if (!r.every((x) => typeof x === 'boolean')) return { ok: false, why: 'Kane returned a non-boolean answer' };
  return { ok: true, answers: r, reasons: re.condition_reasons || [], credits: re.credits_consumed || 0 };
}

// conditions: [{ role: 'identity'|'control'|'p'|'notP'|'source', claim?: number, text }]
export function judgeBatch(conditions, result) {
  const read = readAnswers(result, conditions.length);
  const out = { trust: null, why: '', credits: 0, answers: [], reasons: [], claims: {} };
  const claimIds = [...new Set(conditions.filter((c) => c.claim !== undefined).map((c) => c.claim))];
  if (!read.ok) {
    out.trust = VERDICT.ABSENT;
    out.why = read.why;
    for (const id of claimIds) out.claims[id] = { verdict: VERDICT.ABSENT, why: read.why };
    return out;
  }
  out.answers = read.answers;
  out.reasons = read.reasons;
  out.credits = read.credits;
  const ans = (role, claim) => {
    const i = conditions.findIndex((c) => c.role === role && (claim === undefined || c.claim === claim));
    return i < 0 ? undefined : { value: read.answers[i], reason: read.reasons[i] || '' };
  };
  const identity = ans('identity');
  const control = ans('control');
  const problems = [];
  if (!identity) problems.push('batch has no identity gate');
  else if (identity.value !== true) problems.push(`identity gate failed: Kane did not see the page Claim Check opened (${identity.reason})`);
  if (!control) problems.push('batch has no known-negative control');
  else if (control.value !== false) problems.push(`control failed: Kane agreed with a statement known to be false (${control.reason})`);
  if (problems.length) {
    out.trust = VERDICT.UNTRUSTED;
    out.why = problems.join('; ');
    for (const id of claimIds) out.claims[id] = { verdict: VERDICT.UNTRUSTED, why: out.why };
    return out;
  }
  out.trust = 'TRUSTED';
  out.why = 'identity gate true and near-miss control false';
  for (const id of claimIds) {
    const src = ans('source', id);
    if (src) {
      out.claims[id] = {
        verdict: src.value ? VERDICT.PROVED : VERDICT.REFUTED,
        kane: { p: src.value },
        why: src.reason,
      };
      continue;
    }
    const p = ans('p', id);
    const np = ans('notP', id);
    let verdict;
    if (p.value === true && np.value === false) verdict = VERDICT.PROVED;
    else if (p.value === false && np.value === true) verdict = VERDICT.REFUTED;
    else verdict = VERDICT.INCONCLUSIVE;
    out.claims[id] = {
      verdict,
      kane: { p: p.value, notP: np.value },
      why: verdict === VERDICT.INCONCLUSIVE
        ? `Kane answered ${p.value} to the claim and ${np.value} to its negation`
        : p.reason,
      reasons: { p: p.reason, notP: np.reason },
    };
  }
  return out;
}

// Exit code for a whole ledger: 0 every check proved, 1 something refuted,
// 2 something could not be established (never reported as a pass).
export function exitCodeFor(rows) {
  if (!rows.length) return 2;
  if (rows.some((r) => r.verdict === VERDICT.REFUTED)) return 1;
  if (rows.some((r) => r.verdict !== VERDICT.PROVED)) return 2;
  return 0;
}

export function summarise(rows) {
  const s = { total: rows.length };
  for (const v of Object.values(VERDICT)) s[v] = rows.filter((r) => r.verdict === v).length;
  return s;
}

// Read Kane's own sub-checks for one claim and explain a verdict that must not
// be trusted, downgrading a PROVED that Kane produced by rewriting the expected
// value. pos / neg: the claim's P and not-P conditions as stored in a batch
// ({ answer, kaneCheck: { extracted, operator, expected } }).
export function diagnose({ claim, productName, verdict, pos, neg }) {
  const norm = (x) => String(x ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const exp = pos?.kaneCheck?.expected;
  // A boolean expectation ("is the name X? true") is a different, legitimate compilation.
  const isBool = /^(true|false)$/i.test(String(exp ?? '').trim());
  // A refutation that contradicts Kane's own reading: the title it read begins with
  // the page's name (a store subtitle follows), so "a different app" is not shown.
  // Never turned green by this reading, only withheld.
  const readTitle = pos?.kaneCheck?.extracted;
  if (claim.type === 'listing-name' && verdict === VERDICT.REFUTED && readTitle && !isBool
    && norm(productName) && norm(readTitle).startsWith(norm(productName))) {
    return {
      verdict: VERDICT.INCONCLUSIVE,
      diagnosis: `Kane refuted the name, but the listing title it read, "${readTitle}", begins with "${productName}" (a store subtitle follows), so the refutation contradicts Kane's own reading. Not counted either way.`,
    };
  }
  if (claim.type === 'listing-name' && pos?.kaneCheck && !isBool && norm(exp) !== norm(productName)) {
    return {
      verdict: verdict === VERDICT.PROVED ? VERDICT.INCONCLUSIVE : verdict,
      diagnosis: `Kane rewrote the expected name "${productName}" as "${pos.kaneCheck.expected}" (what it read), so its "true" does not confirm the claim. The listing is titled "${pos.kaneCheck.extracted}".`,
    };
  }
  if (verdict === VERDICT.INCONCLUSIVE && neg?.kaneCheck && String(neg.kaneCheck.expected).toLowerCase() === 'false' && neg.answer === true) {
    return {
      verdict,
      diagnosis: `Kane compiled the negation "${claim.notP}" into a check that expects "${neg.kaneCheck.expected}" and read "${neg.kaneCheck.extracted}", so it answered true to both the claim and its negation (an inverted question).`,
    };
  }
  return { verdict, diagnosis: null };
}
