# Claim Check: RadioSEM

- Page: https://ruicodex.com/Products/radiosem
- Checked: 2026-11-12T13:58:17.022Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 7 proved, 0 refuted, 0 inconclusive, 0 untrusted, 0 absent (exit 0)
- Kane credits used: 17.18

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| PROVED | Google Play | the store link opens the listing for "RadioSEM" ("RadioSEM") | claim true, negation false Checking the store listing app name: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app is free to download ("It is free with ads, and an optional monthly Premium subscription removes them.") | claim true, negation false Checking the app installation availability: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking the in-app purchases disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("It is free with ads, and an optional monthly Premium subscription removes them.") | claim true, negation false Checking the ads disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | App Store | the store link opens the listing for "RadioSEM" ("RadioSEM") | claim true, negation false Checking the normalized app name on the store listing: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | App Store | the app is free to download ("It is free with ads, and an optional monthly Premium subscription removes them.") | claim true, negation false Checking the installation price in the listing summary: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | App Store | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking the listing for an in-app purchases indication: value: 'true' -> 'true'; equals 'true' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/radiosem | TRUSTED | identity gate true and near-miss control false | 2.57 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.radiosem | TRUSTED | identity gate true and near-miss control false | 7.06 |
| App Store | https://apps.apple.com/us/app/radiosem-global-fm-radio/id6806462026 | TRUSTED | identity gate true and near-miss control false | 7.55 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads

## Fix tasks for your coding agent

None. Every claim was proved where its link leads.
