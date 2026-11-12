# Claim Check: EveryTranslate

- Page: https://ruicodex.com/Products/everytranslate
- Checked: 2026-11-12T13:40:37.229Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 3 proved, 0 refuted, 1 inconclusive, 0 untrusted, 0 absent (exit 2)
- Kane credits used: 16.8

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| INCONCLUSIVE | Google Play | the store link opens the listing for "EveryTranslate" ("EveryTranslate") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation |
| PROVED | Google Play | the app is free to download ("It is free to download, with premium plans for higher limits.") | claim true, negation false Checking whether the listing shows a free install action: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking whether the listing states in-app purchases are offered: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Reading the listing content rating: value: 'PEGI 3' -> 'PEGI 3' after ['strip']; equals 'PEGI 3' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/everytranslate | TRUSTED | identity gate true and near-miss control false | 4.34 |
| Google Play | https://play.google.com/store/apps/details?id=com.everytranslate.app | TRUSTED | identity gate true and near-miss control false | 7.59 |
| Google Play (re-ask, visual) | https://play.google.com/store/apps/details?id=com.everytranslate.app | TRUSTED | identity gate true and near-miss control false | 4.87 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the content rating is PEGI 3

## Fix tasks for your coding agent

- [ ] Not established (INCONCLUSIVE): "the store link opens the listing for "EveryTranslate"" on Google Play. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/everytranslate` or check by hand.
