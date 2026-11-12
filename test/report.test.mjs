import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toMarkdown } from '../src/report.mjs';

const ledger = JSON.parse(readFileSync(new URL('../recorded-runs/demo-drift.json', import.meta.url), 'utf8'));

test('every refuted claim becomes exactly one fix task for the agent, with the re-check command', () => {
  const md = toMarkdown(ledger);
  const tasks = md.split('\n').filter((l) => l.startsWith('- [ ] The page'));
  assert.equal(tasks.length, ledger.rows.filter((r) => r.verdict === 'REFUTED').length);
  assert.ok(tasks.every((t) => t.includes('claimcheck check')));
});

test('an empty ledger says there was nothing to check instead of reporting success', () => {
  const md = toMarkdown({ ...ledger, rows: [], summary: { total: 0 }, exitCode: 2 });
  assert.match(md, /nothing to check/);
  assert.doesNotMatch(md, /Every claim was proved/);
});
