// Deterministic claim extraction. No model is involved here: what a page
// promises is read from its rendered DOM with plain rules, so the list of
// claims is reproducible and reviewable. Kane is used afterwards, to judge.

// Evaluated inside the page. Returns plain data only.
export const PAGE_SCRIPT = `(() => {
  const root = document.querySelector('main') || document.body;
  const h1 = document.querySelector('h1');
  return {
    url: location.href,
    title: document.title || '',
    h1: h1 ? h1.innerText.trim().split('\\n')[0] : '',
    lang: document.documentElement.lang || '',
    text: (root.innerText || '').slice(0, 60000),
    links: [...document.querySelectorAll('a[href]')].map(a => ({
      href: a.href,
      text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 160),
    })),
  };
})()`;

const STORE_LABEL = {
  play: 'Google Play',
  appstore: 'App Store',
  appgallery: 'Huawei AppGallery',
  fixture: 'fixture store',
};

export function classifyStoreLink(href, pageUrl) {
  let u;
  try { u = new URL(href); } catch { return null; }
  const host = u.hostname.toLowerCase();
  if (host === 'play.google.com' && u.pathname.startsWith('/store/apps/details') && u.searchParams.get('id')) {
    return { kind: 'play', key: `play:${u.searchParams.get('id')}` };
  }
  if (host === 'apps.apple.com') {
    const m = u.pathname.match(/\/id(\d+)/);
    if (m) return { kind: 'appstore', key: `appstore:${m[1]}` };
  }
  if (host === 'appgallery.huawei.com') {
    const m = u.pathname.match(/\/app\/([A-Za-z0-9]+)/) || u.hash.match(/\/app\/([A-Za-z0-9]+)/);
    if (m) return { kind: 'appgallery', key: `appgallery:${m[1]}` };
  }
  // Local demo fixtures: only on the same origin as the page under check.
  try {
    const page = new URL(pageUrl);
    if (u.origin === page.origin && u.pathname.startsWith('/fixtures/store/')) {
      return { kind: 'fixture', key: `fixture:${u.pathname}` };
    }
  } catch { /* no page url */ }
  return null;
}

function sentences(text) {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

// A sentence about a paid tier is not a claim about the free app.
const PAID_TIER = /\b(pro|premium|vip|plus|subscription|subscribe|upgrade|remove ads|removes ads|unlock)\b/i;

// Each rule: the claim a page makes, where it can be proved, and the paired
// questions Kane is asked on the target. Asking P and not-P separately is the
// point: a judge that agrees with both is not a judge.
const RULES = [
  {
    type: 'free',
    match: (s) => /\b(free to (download|install|play|use)|(it|the app|the game) is free\b|free download)/i.test(s) || /^free$/i.test(s),
    statement: () => 'the app is free to download',
    appliesTo: ['play', 'appstore', 'appgallery', 'fixture'],
    p: () => 'This store listing shows that the app is free to install',
    notP: () => 'This store listing shows a purchase price that must be paid before the app can be installed',
  },
  {
    type: 'in-app-purchases',
    match: (s) => /\bin-app purchases?\b/i.test(s) && !/\bno in-app purchases?\b/i.test(s),
    statement: () => 'the app offers in-app purchases',
    appliesTo: ['play', 'appstore', 'appgallery', 'fixture'],
    p: () => 'This store listing states that the app offers in-app purchases',
    notP: () => 'This store listing gives no indication anywhere that the app offers in-app purchases',
  },
  {
    type: 'no-in-app-purchases',
    match: (s) => /\bno in-app purchases?\b/i.test(s) && !PAID_TIER.test(s),
    statement: () => 'the app has no in-app purchases',
    appliesTo: ['play', 'appstore', 'appgallery', 'fixture'],
    p: () => 'This store listing gives no indication anywhere that the app offers in-app purchases',
    notP: () => 'This store listing states that the app offers in-app purchases',
  },
  {
    type: 'contains-ads',
    match: (s) => /\b(with|shows|contains|includes|has) ads\b/i.test(s) && !/\b(no|without) ads\b/i.test(s),
    statement: () => 'the app contains ads',
    appliesTo: ['play', 'fixture'], // the App Store has no "Contains ads" label
    p: () => 'This store listing states that the app contains ads',
    notP: () => 'This store listing gives no indication anywhere that the app contains ads',
  },
  {
    type: 'no-ads',
    // "Pro adds ... no ads" describes a paid tier, not the app as downloaded.
    match: (s) => /\b(no ads|ad-free|without ads)\b/i.test(s) && !PAID_TIER.test(s),
    statement: () => 'the app has no ads',
    appliesTo: ['play', 'fixture'],
    p: () => 'This store listing gives no indication anywhere that the app contains ads',
    notP: () => 'This store listing states that the app contains ads',
  },
  {
    type: 'content-rating',
    match: (s) => /\bPEGI\s?(3|7|12|16|18)\b/.test(s),
    statement: (s) => `the content rating is PEGI ${s.match(/\bPEGI\s?(3|7|12|16|18)\b/)[1]}`,
    appliesTo: ['play', 'fixture'], // the App Store uses its own age ratings
    p: (s) => `This store listing shows the content rating PEGI ${s.match(/\bPEGI\s?(3|7|12|16|18)\b/)[1]}`,
    notP: (s) => `This store listing shows a content rating that is not PEGI ${s.match(/\bPEGI\s?(3|7|12|16|18)\b/)[1]}`,
  },
];

const clean = (s) => s.replace(/"/g, "'").replace(/\s+/g, ' ').trim();

// page: the PAGE_SCRIPT result. Returns { productName, claims, targets }.
export function compileClaims(page) {
  const productName = clean(page.h1 || page.title.split('|')[0] || '');
  const targets = [];
  const seen = new Set();
  for (const link of page.links) {
    const c = classifyStoreLink(link.href, page.url);
    if (!c || seen.has(c.key)) continue;
    seen.add(c.key);
    targets.push({ kind: c.kind, label: STORE_LABEL[c.kind], key: c.key, url: link.href, linkText: clean(link.text) });
  }

  const claims = [];
  const sents = sentences(page.text || '');
  for (const rule of RULES) {
    const hit = sents.find((s) => rule.match(s));
    if (!hit) continue;
    // Prefer a full sentence as the quote when the first hit is a bare chip ("Free").
    const quote = hit.length < 12 ? (sents.find((s) => s.length >= 12 && rule.match(s)) || hit) : hit;
    claims.push({
      type: rule.type,
      statement: rule.statement(quote),
      sourceQuote: clean(quote).slice(0, 300),
      appliesTo: rule.appliesTo,
      p: rule.p(quote),
      notP: rule.notP(quote),
    });
  }
  // The link itself is a claim: "this badge leads to this product".
  if (productName) {
    claims.unshift({
      type: 'listing-name',
      statement: `the store link opens the listing for "${productName}"`,
      sourceQuote: productName,
      appliesTo: ['play', 'appstore', 'appgallery', 'fixture'],
      // Store titles often carry a subtitle after the name ("Koi Drift: Zen Koi Puzzle"),
      // so the claim is that the listing's name BEGINS with the page's name. Asking for
      // equality produced a false REFUTED on a live page on 12 November.
      p: `The app name shown on this store listing begins with "${productName}" (ignoring letter case and punctuation; a subtitle after it is allowed)`,
      notP: `The app name shown on this store listing is clearly a different app than "${productName}"`,
    });
  }
  return { productName, claims, targets };
}

const DECOYS = ['Velvet', 'Glacier', 'Orchid', 'Harbor', 'Quantum', 'Saffron', 'Tundra'];

// Identity gate + known-negative control for one batch, both about the tab
// title Claim Check itself read through CDP a moment earlier, so their truth
// is known in advance. The control is a near miss: one word swapped.
export function gatesFor(title) {
  const t = clean(title || '');
  const words = t.split(' ').filter(Boolean);
  const fragment = clean(words.slice(0, 6).join(' ')).slice(0, 60) || t;
  const lower = t.toLowerCase();
  const decoy = DECOYS.find((d) => !lower.includes(d.toLowerCase())) || 'Zzyzx';
  const fw = fragment.split(' ');
  let idx = -1;
  fw.forEach((w, i) => { if (/[A-Za-z]{3,}/.test(w) && (idx < 0 || w.length > fw[idx].length)) idx = i; });
  let nearMiss;
  if (idx >= 0 && fw.length > 1) { fw[idx] = decoy; nearMiss = fw.join(' '); } else nearMiss = `${fragment} ${decoy}`;
  if (lower.includes(nearMiss.toLowerCase())) nearMiss = `${fragment} ${decoy} ${decoy}`;
  return {
    identity: { fragment, condition: `The browser tab title contains the text "${fragment}"` },
    control: { nearMiss, condition: `The browser tab title contains the text "${nearMiss}"` },
  };
}
