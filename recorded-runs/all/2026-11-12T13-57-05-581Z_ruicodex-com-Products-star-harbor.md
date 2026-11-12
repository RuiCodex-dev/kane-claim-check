# Claim Check: Star Harbor

- Page: https://ruicodex.com/Products/star-harbor
- Checked: 2026-11-12T13:57:05.581Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 5 proved, 0 refuted, 0 inconclusive, 0 untrusted, 0 absent (exit 0)
- Kane credits used: 11.28

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| PROVED | Google Play | the store link opens the listing for "Star Harbor" ("Star Harbor") | claim true, negation false Checking the normalized store listing app name: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app is free to download ("It is free to download, with ads and optional purchases and no subscriptions.") | claim true, negation false Checking the installation action shown on the listing: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking the in-app purchases information badge: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("It is free to download, with ads and optional purchases and no subscriptions.") | claim true, negation false Checking the contains ads information badge: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Checking the displayed content rating: value: 'true' -> 'true'; equals 'true' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/star-harbor | TRUSTED | identity gate true and near-miss control false | 1.94 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.starharbor | TRUSTED | identity gate true and near-miss control false | 9.34 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads
- confirmed: the content rating is PEGI 3

## Fix tasks for your coding agent

None. Every claim was proved where its link leads.
