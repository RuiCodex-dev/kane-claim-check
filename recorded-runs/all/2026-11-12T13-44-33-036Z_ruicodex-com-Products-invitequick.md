# Claim Check: InviteQuick

- Page: https://ruicodex.com/Products/invitequick
- Checked: 2026-11-12T13:44:33.036Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 3 proved, 0 refuted, 2 inconclusive, 0 untrusted, 0 absent (exit 2)
- Kane credits used: 19.03

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| INCONCLUSIVE | Google Play | the store link opens the listing for "InviteQuick" ("InviteQuick") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation Diagnosis: Kane compiled the negation "The app name shown on this store listing is clearly a different app than "InviteQuick"" into a check that expects "false" and read "false", so it answered true to both the claim and its negation (an inverted question). |
| INCONCLUSIVE | Google Play | the app is free to download ("Free") | claim true, negation true (after re-ask) Kane answered true to the claim and true to its negation Diagnosis: Kane compiled the negation "This store listing shows a purchase price that must be paid before the app can be installed" into a check that expects "false" and read "false", so it answered true to both the claim and its negation (an inverted question). |
| PROVED | Google Play | the app offers in-app purchases ("The download is free, with ads, a free plan for one active event and paid plans as in-app purchases.") | claim true, negation false Checking the in-app purchases disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("The download is free, with ads, a free plan for one active event and paid plans as in-app purchases.") | claim true, negation false Checking the ads disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Reading the content rating from the store listing: value: 'PEGI 3' -> 'PEGI 3' after ['strip']; equals 'PEGI 3' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/invitequick | TRUSTED | identity gate true and near-miss control false | 5.17 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.invitequick | TRUSTED | identity gate true and near-miss control false | 7.95 |
| Google Play (re-ask, visual) | https://play.google.com/store/apps/details?id=com.ruicodex.invitequick | TRUSTED | identity gate true and near-miss control false | 5.91 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads
- confirmed: the content rating is PEGI 3

## Fix tasks for your coding agent

- [ ] Not established (INCONCLUSIVE): "the store link opens the listing for "InviteQuick"" on Google Play. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/invitequick` or check by hand.
- [ ] Not established (INCONCLUSIVE): "the app is free to download" on Google Play. Kane answered true to the claim and true to its negation. Do not treat this as a pass; re-run `claimcheck check https://ruicodex.com/Products/invitequick` or check by hand.
