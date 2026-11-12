import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staleProfiles } from '../src/chrome.mjs';

test('only our own temp profiles older than the limit are swept', () => {
  const now = 10_000_000;
  const entries = [
    { name: 'claimcheck-chrome-old', mtimeMs: now - 2 * 3600_000 },
    { name: 'claimcheck-chrome-busy', mtimeMs: now - 60_000 }, // another run may be using it
    { name: 'some-other-tool-old', mtimeMs: now - 9 * 3600_000 },
  ];
  assert.deepEqual(staleProfiles(entries, now), ['claimcheck-chrome-old']);
  assert.deepEqual(staleProfiles([], now), []);
});
