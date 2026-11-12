import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileClaims, classifyStoreLink, gatesFor } from '../src/extract.mjs';

const page = {
  url: 'https://example.com/apps/factory',
  title: 'Factory Legacy: Idle Empire | Example',
  h1: 'Factory Legacy: Idle Empire',
  text: 'Android\niOS\nFree\nIt is free to download, with ads and optional in-app purchases.\nContent rating: PEGI 3',
  links: [
    { href: 'https://play.google.com/store/apps/details?id=com.example.factory', text: 'Get it on Google Play' },
    { href: 'https://play.google.com/store/apps/details?id=com.example.factory&hl=en', text: 'Google Play' },
    { href: 'https://apps.apple.com/us/app/factory/id123456789', text: 'Download on the App Store' },
    { href: 'https://example.com/privacy', text: 'Privacy' },
  ],
};

test('store links are classified and de-duplicated by app id', () => {
  const { targets } = compileClaims(page);
  assert.deepEqual(targets.map((t) => t.key), ['play:com.example.factory', 'appstore:123456789']);
});

test('claims are extracted with a full-sentence quote, not the bare chip', () => {
  const { claims } = compileClaims(page);
  const types = claims.map((c) => c.type);
  assert.deepEqual(types, ['listing-name', 'free', 'in-app-purchases', 'contains-ads', 'content-rating']);
  assert.match(claims.find((c) => c.type === 'free').sourceQuote, /free to download/);
  assert.equal(claims.find((c) => c.type === 'content-rating').statement, 'the content rating is PEGI 3');
});

test('a "no ads" page yields the no-ads claim and not the contains-ads claim', () => {
  const { claims } = compileClaims({ ...page, text: 'It is free to download. No ads, no in-app purchases.' });
  const types = claims.map((c) => c.type);
  assert.ok(types.includes('no-ads'));
  assert.ok(types.includes('no-in-app-purchases'));
  assert.ok(!types.includes('contains-ads'));
  assert.ok(!types.includes('in-app-purchases'));
});

test('known negatives: words that only look like claims are not claims', () => {
  const { claims } = compileClaims({ ...page, h1: '', title: '', text: 'Sugar-free recipes. Read our ads policy. Feel free to contact us.' });
  assert.deepEqual(claims.map((c) => c.type), []);
});

test('fixture store links count only on the same origin', () => {
  assert.equal(classifyStoreLink('http://127.0.0.1:4317/fixtures/store/x/', 'http://127.0.0.1:4317/fixtures/drift/').kind, 'fixture');
  assert.equal(classifyStoreLink('http://evil.test/fixtures/store/x/', 'http://127.0.0.1:4317/fixtures/drift/'), null);
});

test('gates: the identity fragment is in the title and the near-miss control is not', () => {
  for (const title of ['Factory Legacy: Idle Empire - Apps on Google Play', 'Tally Tiles', 'X', '']) {
    const g = gatesFor(title);
    assert.ok(title.includes(g.identity.fragment), `identity for "${title}"`);
    assert.ok(!title.toLowerCase().includes(g.control.nearMiss.toLowerCase()), `control for "${title}"`);
  }
});

test('known negative: "Pro adds ... no ads" is about the paid tier, not a no-ads claim', () => {
  const text = 'It is free to download with daily limits, ads and optional Pro purchases.\nContains ads\nPro, available monthly or yearly, adds HD export, batch mode and no ads or watermark.';
  const types = compileClaims({ ...page, text }).claims.map((c) => c.type);
  assert.ok(types.includes('contains-ads'));
  assert.ok(!types.includes('no-ads'));
});
