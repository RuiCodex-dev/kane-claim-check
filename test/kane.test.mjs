import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNdjson } from '../src/kane.mjs';

test('NDJSON parsing keeps events and drops banners and partial lines', () => {
  const text = 'Running on: Desktop\n{"type":"stream_start"}\n{"step":1}\r\n{"type":"run_end","status":"passed","condition_results":[true,false]}\n{"type":"run_e';
  const ev = parseNdjson(text);
  assert.equal(ev.length, 3);
  assert.deepEqual(ev[2].condition_results, [true, false]);
});

test('the credit balance is read, and a logged-out Kane is named as such', async () => {
  const { parseBalance } = await import('../src/kane.mjs');
  assert.deepEqual(parseBalance('Skill update available\nAvailable credits: 10862.2827\n'), { ok: true, credits: 10862.2827 });
  assert.equal(parseBalance('Error: not authenticated, please log in', 1).ok, false);
  assert.match(parseBalance('Error: not authenticated, please log in', 1).why, /kane-cli login/);
  assert.match(parseBalance('', 3).why, /exit 3/);
});
