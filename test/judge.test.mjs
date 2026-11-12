import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeBatch, exitCodeFor, VERDICT } from '../src/judge.mjs';

const conds = [
  { role: 'identity', text: 'id' },
  { role: 'control', text: 'ctl' },
  { role: 'p', claim: 0, text: 'free' },
  { role: 'notP', claim: 0, text: 'not free' },
  { role: 'p', claim: 1, text: 'ads' },
  { role: 'notP', claim: 1, text: 'no ads' },
];
const res = (answers) => ({ exitCode: 0, runEnd: { type: 'run_end', condition_results: answers, condition_reasons: answers.map(String), credits_consumed: 3 } });

test('trusted batch: P true + not-P false is PROVED, the reverse is REFUTED', () => {
  const j = judgeBatch(conds, res([true, false, true, false, false, true]));
  assert.equal(j.trust, 'TRUSTED');
  assert.equal(j.claims[0].verdict, VERDICT.PROVED);
  assert.equal(j.claims[1].verdict, VERDICT.REFUTED);
});

test('Kane agreeing with a claim AND its negation is INCONCLUSIVE, never PROVED', () => {
  const j = judgeBatch(conds, res([true, false, true, true, false, false]));
  assert.equal(j.claims[0].verdict, VERDICT.INCONCLUSIVE);
  assert.equal(j.claims[1].verdict, VERDICT.INCONCLUSIVE);
});

test('a control that passes makes the whole batch UNTRUSTED, even if every claim looks proved', () => {
  const j = judgeBatch(conds, res([true, true, true, false, true, false]));
  assert.equal(j.trust, VERDICT.UNTRUSTED);
  assert.equal(j.claims[0].verdict, VERDICT.UNTRUSTED);
  assert.match(j.why, /control failed/);
});

test('an identity gate that fails (Kane judged some other page) makes the batch UNTRUSTED', () => {
  const j = judgeBatch(conds, res([false, false, true, false, true, false]));
  assert.equal(j.trust, VERDICT.UNTRUSTED);
  assert.match(j.why, /identity gate failed/);
});

test('missing run_end, wrong answer count or non-boolean answers are ABSENT, not a pass', () => {
  assert.equal(judgeBatch(conds, { exitCode: 2, runEnd: null }).trust, VERDICT.ABSENT);
  assert.equal(judgeBatch(conds, res([true, false])).trust, VERDICT.ABSENT);
  assert.equal(judgeBatch(conds, res([true, false, 'yes', false, true, false])).trust, VERDICT.ABSENT);
});

test('a batch without a control is never trusted', () => {
  const noCtl = conds.filter((c) => c.role !== 'control');
  const j = judgeBatch(noCtl, res([true, true, false, true, false]));
  assert.equal(j.trust, VERDICT.UNTRUSTED);
});

test('exit codes: nothing checked is not a pass', () => {
  assert.equal(exitCodeFor([]), 2);
  assert.equal(exitCodeFor([{ verdict: 'PROVED' }]), 0);
  assert.equal(exitCodeFor([{ verdict: 'PROVED' }, { verdict: 'INCONCLUSIVE' }]), 2);
  assert.equal(exitCodeFor([{ verdict: 'ABSENT' }, { verdict: 'REFUTED' }]), 1);
});

import { diagnose } from '../src/judge.mjs';

// Sub-check values as Kane returned them on 2026-11-12 (recorded-runs/ruicodex-candy-chaos_*).
const nameClaim = { type: 'listing-name', notP: 'The app name shown on this store listing is clearly a different app than "Candy Chaos"' };

test('a PROVED that Kane produced by rewriting the expected name is downgraded and explained', () => {
  const d = diagnose({
    claim: nameClaim, productName: 'Candy Chaos', verdict: VERDICT.PROVED,
    pos: { answer: true, kaneCheck: { extracted: 'Candy Chaos - Sweet Sort', operator: 'equals', expected: 'candy chaos - sweet sort' } },
    neg: { answer: false, kaneCheck: { extracted: 'false', operator: 'equals', expected: 'true' } },
  });
  assert.equal(d.verdict, VERDICT.INCONCLUSIVE);
  assert.match(d.diagnosis, /titled "Candy Chaos - Sweet Sort"/);
});

test('an expected value that only differs in case and punctuation is not a rewrite', () => {
  const d = diagnose({
    claim: nameClaim, productName: 'Factory Legacy: Idle Empire', verdict: VERDICT.PROVED,
    pos: { answer: true, kaneCheck: { extracted: 'Factory Legacy: Idle Empire', operator: 'equals', expected: 'factory legacy idle empire' } },
    neg: { answer: false, kaneCheck: { extracted: 'false', operator: 'equals', expected: 'true' } },
  });
  assert.equal(d.verdict, VERDICT.PROVED);
  assert.equal(d.diagnosis, null);
});

test('an inverted negation is named as such', () => {
  const d = diagnose({
    claim: { type: 'free', notP: 'This store listing shows a purchase price' }, productName: 'X', verdict: VERDICT.INCONCLUSIVE,
    pos: { answer: true, kaneCheck: { extracted: 'true', operator: 'equals', expected: 'true' } },
    neg: { answer: true, kaneCheck: { extracted: 'false', operator: 'equals', expected: 'false' } },
  });
  assert.match(d.diagnosis, /inverted question/);
});

test('a boolean expectation for the name is not mistaken for a rewrite', () => {
  const d = diagnose({
    claim: nameClaim, productName: 'Candy Chaos', verdict: VERDICT.PROVED,
    pos: { answer: true, kaneCheck: { extracted: 'true', operator: 'equals', expected: 'true' } },
    neg: { answer: false, kaneCheck: { extracted: 'false', operator: 'equals', expected: 'true' } },
  });
  assert.equal(d.verdict, VERDICT.PROVED);
  assert.equal(d.diagnosis, null);
});

test('a Kane run with no result says why, with its last stderr line and a timeout', async () => {
  const { readAnswers } = await import('../src/judge.mjs');
  const r = readAnswers({ exitCode: null, timedOut: true, runEnd: null, stderrTail: ['info: something', 'Error: browser closed'] }, 3);
  assert.equal(r.ok, false);
  assert.match(r.why, /timed out/);
  assert.match(r.why, /browser closed/);
});

// Sub-check values as Kane returned them on 2026-11-12 (recorded-runs/ruicodex-koi-drift_*).
test('a name refutation that contradicts Kane\'s own reading (a store subtitle) is withheld, never turned green', () => {
  const claim = { type: 'listing-name', notP: 'The app name shown on this store listing is clearly a different app than "Koi Drift"' };
  const d = diagnose({
    claim, productName: 'Koi Drift', verdict: VERDICT.REFUTED,
    pos: { answer: false, kaneCheck: { extracted: 'koidriftzenkoipuzzle', operator: 'equals', expected: 'koidrift' } },
    neg: { answer: true, kaneCheck: { extracted: 'true', operator: 'equals', expected: 'true' } },
  });
  assert.equal(d.verdict, VERDICT.INCONCLUSIVE);
  assert.match(d.diagnosis, /begins with "Koi Drift"/);
  // A genuinely different app stays refuted.
  const other = diagnose({
    claim, productName: 'Koi Drift', verdict: VERDICT.REFUTED,
    pos: { answer: false, kaneCheck: { extracted: 'Pond Puzzle Deluxe', operator: 'equals', expected: 'koi drift' } },
    neg: { answer: true, kaneCheck: { extracted: 'true', operator: 'equals', expected: 'true' } },
  });
  assert.equal(other.verdict, VERDICT.REFUTED);
});
