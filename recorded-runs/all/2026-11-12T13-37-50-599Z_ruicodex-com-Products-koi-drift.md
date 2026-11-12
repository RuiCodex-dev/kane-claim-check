# Claim Check: Koi Drift

- Page: https://ruicodex.com/Products/koi-drift
- Checked: 2026-11-12T13:37:50.599Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 4 proved, 1 refuted, 0 inconclusive, 0 untrusted, 0 absent (exit 1)
- Kane credits used: 13.33

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| REFUTED | Google Play | the store link opens the listing for "Koi Drift" ("Koi Drift") | claim false, negation true Reading the normalized store listing app name: value: 'koidriftzenkoipuzzle' -> 'koidriftzenkoipuzzle'; equals 'koidrift' -> FAIL |
| PROVED | Google Play | the app is free to download ("There are no timers or lives, it plays offline, and it is free with optional purchases.") | claim true, negation false Checking the store listing installation action: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking the store listing for in-app purchases: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("Contains ads") | claim true, negation false Checking the store listing for ads information: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Checking the store listing content rating: value: 'true' -> 'true'; equals 'true' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/koi-drift | TRUSTED | identity gate true and near-miss control false | 5.27 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.koidrift | TRUSTED | identity gate true and near-miss control false | 8.06 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads
- confirmed: the content rating is PEGI 3

## Fix tasks for your coding agent

- [ ] The page https://ruicodex.com/Products/koi-drift says "Koi Drift" (the store link opens the listing for "Koi Drift"), but its Google Play link (https://play.google.com/store/apps/details?id=com.ruicodex.koidrift) does not support that. Kane: Reading the normalized store listing app name: value: 'koidriftzenkoipuzzle' -> 'koidriftzenkoipuzzle'; equals 'koidrift' -> FAIL. Change the page copy or the store listing so they agree, then re-run `claimcheck check https://ruicodex.com/Products/koi-drift`.
