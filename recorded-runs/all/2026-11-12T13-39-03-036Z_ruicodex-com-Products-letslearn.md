# Claim Check: LetsLearn

- Page: https://ruicodex.com/Products/letslearn
- Checked: 2026-11-12T13:39:03.036Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 5 proved, 0 refuted, 0 inconclusive, 0 untrusted, 0 absent (exit 0)
- Kane credits used: 18.6

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| PROVED | Google Play | the store link opens the listing for "LetsLearn" ("LetsLearn") | claim true, negation false (after re-ask) Reading the app name from the store listing: value: 'LetsLearn' -> 'letslearn' after ['strip', 'lowercase']; equals 'letslearn' -> PASS |
| PROVED | Google Play | the app is free to download ("It is free to use with daily limits and ads; LetsLearn VIP removes them.") | claim true, negation false Checking whether the listing is free to install: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking whether the listing indicates in-app purchases: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("Contains ads") | claim true, negation false Checking whether the listing indicates ads: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Checking the PEGI content rating: value: 'true' -> 'true'; equals 'true' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/letslearn | TRUSTED | identity gate true and near-miss control false | 4.97 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.letslearn | TRUSTED | identity gate true and near-miss control false | 8.8 |
| Google Play (re-ask, visual) | https://play.google.com/store/apps/details?id=com.ruicodex.letslearn | TRUSTED | identity gate true and near-miss control false | 4.83 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads
- confirmed: the content rating is PEGI 3

## Fix tasks for your coding agent

None. Every claim was proved where its link leads.
