# Claim Check: PixelCut Pro

- Page: https://ruicodex.com/Products/pixelcut-pro
- Checked: 2026-11-12T08:05:12.080Z with kane-claim-check 0.1.0, judged by Kane CLI (analyzer mode)
- Result: 8 proved, 0 refuted, 0 inconclusive, 0 untrusted, 0 absent (exit 0)
- Kane credits used: 21.87

## Claims, proved where the link leads

| Verdict | Store | Claim on the page | Kane said |
|---|---|---|---|
| PROVED | Google Play | the store link opens the listing for "PixelCut Pro" ("PixelCut Pro") | claim true, negation false Reading the app name from the store listing: value: 'pixelcutpro' -> 'pixelcutpro'; equals 'pixelcutpro' -> PASS |
| PROVED | Google Play | the app is free to download ("It is free to download with daily limits, ads and optional Pro, lifetime or per-photo purchases.") | claim true, negation false Checking whether the app is free to install: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking for an in-app purchases statement: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the app contains ads ("Contains ads") | claim true, negation false Checking for a contains ads statement: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | Google Play | the content rating is PEGI 3 ("Content rating: PEGI 3") | claim true, negation false Reading the store listing content rating: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | App Store | the store link opens the listing for "PixelCut Pro" ("PixelCut Pro") | claim true, negation false Reading the app name from the store listing: value: 'PixelCut Pro' -> 'pixelcut pro' after ['strip', 'lowercase']; equals 'PixelCut Pro' -> 'pixelcut pro' -> PASS |
| PROVED | App Store | the app is free to download ("It is free to download with daily limits, ads and optional Pro, lifetime or per-photo purchases.") | claim true, negation false Checking the store listing installation price: value: 'true' -> 'true'; equals 'true' -> PASS |
| PROVED | App Store | the app offers in-app purchases ("In-app purchases") | claim true, negation false Checking the store listing in-app purchase indication: value: 'true' -> 'true'; equals 'true' -> PASS |

## Trust gates per Kane run

Every run carries an identity gate (a statement known to be TRUE about the page Claim Check opened) and a near-miss control (a statement known to be FALSE). A run whose gate fails or whose control passes is UNTRUSTED and none of its answers count.

| Run | Page | Trust | Why | Credits |
|---|---|---|---|---|
| source page | https://ruicodex.com/Products/pixelcut-pro | TRUSTED | identity gate true and near-miss control false | 7.05 |
| Google Play | https://play.google.com/store/apps/details?id=com.ruicodex.pixelcut_pro | TRUSTED | identity gate true and near-miss control false | 7.64 |
| App Store | https://apps.apple.com/us/app/pixelcut-pro-ai-bg-remover/id6777847573 | TRUSTED | identity gate true and near-miss control false | 7.18 |

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
