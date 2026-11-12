# Claim Check: Factory Legacy: Idle Empire

- Page: https://ruicodex.com/Products/factory-legacy
- Checked: 2026-11-12T07:48:55.117Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 5 proved, 0 refuted, 3 inconclusive, 0 untrusted, 0 absent (exit 2)
- Kane credits used: 25.57

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| PROVED | Google Play | the store link opens the listing for "Factory Legacy: Idle Empire" ("Factory Legacy: Idle Empire") | claim true, negation false Reading the app name from the store listing: value: 'Factory Legacy: Idle Empire' -> 'Factory Legacy: Idle Empire' after ['strip']; equals 'Factory Legacy: Idle Empire' -> PASS |
| PROVED | Google Play | the app is free to download ("It is free to download, with ads and optional in-app purchases.") | claim true, negation false Checking the installation availability shown on the listing: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("It is free to download, with ads and optional in-app purchases.") | claim true, negation false Checking the in-app purchases disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("It is free to download, with ads and optional in-app purchases.") | claim true, negation false Checking the ads disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Checking the content rating on the store listing: value: 'true' -> 'true'; equals 'true' -> PASS |
| INCONCLUSIVE | App Store | the store link opens the listing for "Factory Legacy: Idle Empire" ("Factory Legacy: Idle Empire") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation |
| INCONCLUSIVE | App Store | the app is free to download ("It is free to download, with ads and optional in-app purchases.") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation |
| INCONCLUSIVE | App Store | the app offers in-app purchases ("It is free to download, with ads and optional in-app purchases.") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/factory-legacy | TRUSTED | identity gate true and near-miss control false | 4.942470000000001 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.IdleFactoryTycoon | TRUSTED | identity gate true and near-miss control false | 9.18416 |
| App Store | https://apps.apple.com/us/app/factory-legacy-idle-empire/id6777828643 | TRUSTED | identity gate true and near-miss control false | 5.423069999999999 |
| App Store (re-ask) | https://apps.apple.com/us/app/factory-legacy-idle-empire/id6777828643 | TRUSTED | identity gate true and near-miss control false | 6.01819 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads
- confirmed: the content rating is PEGI 3

## Fix tasks for your coding agent

- [ ] Not established (INCONCLUSIVE): "the store link opens the listing for "Factory Legacy: Idle Empire"" on App Store. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/factory-legacy` or check by hand.
- [ ] Not established (INCONCLUSIVE): "the app is free to download" on App Store. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/factory-legacy` or check by hand.
- [ ] Not established (INCONCLUSIVE): "the app offers in-app purchases" on App Store. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/factory-legacy` or check by hand.
