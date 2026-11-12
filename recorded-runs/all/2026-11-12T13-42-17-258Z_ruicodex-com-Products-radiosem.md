# Claim Check: RadioSEM

- Page: https://ruicodex.com/Products/radiosem
- Checked: 2026-11-12T13:42:17.258Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 6 proved, 1 refuted, 0 inconclusive, 0 untrusted, 0 absent (exit 1)
- Kane credits used: 24.82

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| PROVED | Google Play | the store link opens the listing for "RadioSEM" ("RadioSEM") | claim true, negation false Reading the app name from the store listing: value: 'radiosem' -> 'radiosem' after ['lowercase']; equals 'RadioSEM' -> 'radiosem' -> PASS |
| PROVED | Google Play | the app is free to download ("It is free with ads, and an optional monthly Premium subscription removes them.") | claim true, negation false Checking the app installation action: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking for the in-app purchases disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("It is free with ads, and an optional monthly Premium subscription removes them.") | claim true, negation false Checking for the ads disclosure: value: 'true' -> 'true'; equals 'true' -> PASS |
| REFUTED | App Store | the store link opens the listing for "RadioSEM" ("RadioSEM") | claim false, negation true (after re-ask) Reading the normalized app name from the store listing: value: 'radiosemglobalfmradio' -> 'radiosemglobalfmradio'; equals 'radiosem' -> FAIL |
| PROVED | App Store | the app is free to download ("It is free with ads, and an optional monthly Premium subscription removes them.") | claim true, negation false Checking the listing installation price: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | App Store | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking the listing for in-app purchases: value: 'true' -> 'true'; equals 'true' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/radiosem | TRUSTED | identity gate true and near-miss control false | 4.95 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.radiosem | TRUSTED | identity gate true and near-miss control false | 6.83 |
| App Store | https://apps.apple.com/us/app/radiosem-global-fm-radio/id6806462026 | TRUSTED | identity gate true and near-miss control false | 6.51 |
| App Store (re-ask, visual) | https://apps.apple.com/us/app/radiosem-global-fm-radio/id6806462026 | TRUSTED | identity gate true and near-miss control false | 6.53 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads

## Fix tasks for your coding agent

- [ ] The page https://ruicodex.com/Products/radiosem says "RadioSEM" (the store link opens the listing for "RadioSEM"), but its App Store link (https://apps.apple.com/us/app/radiosem-global-fm-radio/id6806462026) does not support that. Kane: Reading the normalized app name from the store listing: value: 'radiosemglobalfmradio' -> 'radiosemglobalfmradio'; equals 'radiosem' -> FAIL. Change the page copy or the store listing so they agree, then re-run `claimcheck check https://ruicodex.com/Products/radiosem`.
