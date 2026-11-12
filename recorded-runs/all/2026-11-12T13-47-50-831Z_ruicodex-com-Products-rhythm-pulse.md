# Claim Check: Rhythm Pulse

- Page: https://ruicodex.com/Products/rhythm-pulse
- Checked: 2026-11-12T13:47:50.831Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 5 proved, 0 refuted, 0 inconclusive, 0 untrusted, 0 absent (exit 0)
- Kane credits used: 13.06

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| PROVED | Google Play | the store link opens the listing for "Rhythm Pulse" ("Rhythm Pulse") | claim true, negation false Reading the app name from the store listing: value: 'Rhythm Pulse' -> 'rhythm pulse' after ['strip', 'lowercase']; equals 'rhythm pulse' -> PASS |
| PROVED | Google Play | the app is free to download ("It is free, with ads and optional in-app purchases.") | claim true, negation false Checking the app installation availability: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("It is free, with ads and optional in-app purchases.") | claim true, negation false Checking the in-app purchases indication: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("It is free, with ads and optional in-app purchases.") | claim true, negation false Checking the contains-ads indication: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Checking the PEGI 3 content rating: value: 'true' -> 'true'; equals 'true' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/rhythm-pulse | TRUSTED | identity gate true and near-miss control false | 5.29 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.rhythmpulse | TRUSTED | identity gate true and near-miss control false | 7.77 |

## Does the page really say it? (extractor vs Kane)

- confirmed: the app is free to download
- confirmed: the app offers in-app purchases
- confirmed: the app contains ads
- REFUTED: the app has no ads
- confirmed: the content rating is PEGI 3

## Notes

- Skipped "the app has no ads": Kane did not confirm the page states it (extractor and Kane disagree; check the extractor rule).

## Fix tasks for your coding agent

None. Every claim was proved where its link leads.
