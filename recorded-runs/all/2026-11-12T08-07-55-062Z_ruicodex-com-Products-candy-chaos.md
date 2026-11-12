# Claim Check: Candy Chaos

- Page: https://ruicodex.com/Products/candy-chaos
- Checked: 2026-11-12T08:07:55.062Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 4 proved, 0 refuted, 4 inconclusive, 0 untrusted, 0 absent (exit 2)
- Kane credits used: 29.48

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| INCONCLUSIVE | Google Play | the store link opens the listing for "Candy Chaos" ("Candy Chaos") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation Diagnosis: Kane compiled the negation "The app name shown on this store listing is clearly a different app than "Candy Chaos"" into a check that expects "false" and read "false", so it answered true to both the claim and its negation (an inverted question). |
| PROVED | Google Play | the app is free to download ("It is free to play, with ads suitable for children and optional purchases.") | claim true, negation false Reading the install action label: value: 'Install' -> 'Install' after ['strip']; equals 'Install' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking for the in-app purchases disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("It is free to play, with ads suitable for children and optional purchases.") | claim true, negation false Checking for the ads disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Reading the content rating: value: 'PEGI 3' -> 'PEGI 3' after ['strip']; equals 'PEGI 3' -> PASS |
| INCONCLUSIVE | App Store | the store link opens the listing for "Candy Chaos" ("Candy Chaos") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation Diagnosis: Kane compiled the negation "The app name shown on this store listing is clearly a different app than "Candy Chaos"" into a check that expects "false" and read "false", so it answered true to both the claim and its negation (an inverted question). |
| INCONCLUSIVE | App Store | the app is free to download ("It is free to play, with ads suitable for children and optional purchases.") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation Diagnosis: Kane compiled the negation "This store listing shows a purchase price that must be paid before the app can be installed" into a check that expects "false" and read "false", so it answered true to both the claim and its negation (an inverted question). |
| INCONCLUSIVE | App Store | the app offers in-app purchases ("In-app purchases") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation Diagnosis: Kane compiled the negation "This store listing gives no indication anywhere that the app offers in-app purchases" into a check that expects "false" and read "false", so it answered true to both the claim and its negation (an inverted question). |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/candy-chaos | TRUSTED | identity gate true and near-miss control false | 5.27 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.candychaos | TRUSTED | identity gate true and near-miss control false | 7.82 |
| Google Play (re-ask, visual) | https://play.google.com/store/apps/details?id=com.ruicodex.candychaos | TRUSTED | identity gate true and near-miss control false | 5.06 |
| App Store | https://apps.apple.com/us/app/candy-chaos-sweet-sort/id6779695174 | TRUSTED | identity gate true and near-miss control false | 5.04 |
| App Store (re-ask, visual) | https://apps.apple.com/us/app/candy-chaos-sweet-sort/id6779695174 | TRUSTED | identity gate true and near-miss control false | 6.29 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads
- confirmed: the content rating is PEGI 3

## Fix tasks for your coding agent

- [ ] Not established (INCONCLUSIVE): "the store link opens the listing for "Candy Chaos"" on Google Play. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/candy-chaos` or check by hand.
- [ ] Not established (INCONCLUSIVE): "the store link opens the listing for "Candy Chaos"" on App Store. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/candy-chaos` or check by hand.
- [ ] Not established (INCONCLUSIVE): "the app is free to download" on App Store. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/candy-chaos` or check by hand.
- [ ] Not established (INCONCLUSIVE): "the app offers in-app purchases" on App Store. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/candy-chaos` or check by hand.
