---
test: ../ledger_ui_test.md
status: passed
started: 2026-11-12T07:58:22.599Z
duration_s: 143
session_id: 071d0278-d8a9-4dcd-ac55-1f905b4751e0
---

# Claim Check renders a recorded ledger truthfully — Result

## The ledger opens ✓ passed (22.4s)
md5: 6bf82b8222814824ede815af62737cda
Verify the page heading reads "Claim Check" and a section titled "Ledger: Night Owl Notes" is visible.

## The broken promise is flagged ✓ passed (25.4s)
md5: 8617c872344f51685cc1f3104f4f7b1a
Verify the ledger table has a row for the claim "the app is free to download" whose verdict badge reads REFUTED.

## The honest claim is not flagged ✓ passed (21.9s)
md5: 21cb17cbb69da1ac086ae2671646ed02
Verify the ledger table has a row for the claim that the store link opens the listing for "Night Owl Notes", and its verdict badge reads PROVED.

## Every Kane run shows its control ✓ passed (28.1s)
md5: 11e8da7ff70becaeb99408c4dfae687b
Verify the "Trust gates" table lists at least one Kane run with the trust badge TRUSTED, and that run's known-false control column ends with "Kane: false".

## Previous checks link back ✓ passed (20.4s)
md5: d9895406a56bb10e02d307f7dd14b6e8
Verify the "Previous checks" list contains a link named "Night Owl Notes".
