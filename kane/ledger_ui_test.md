---
mode: testing
url: http://127.0.0.1:4399/?ledger=recorded-runs/demo-drift.json
headless: true
max_steps: 20
tags: [ui, gate]
---

# Claim Check renders a recorded ledger truthfully

## The ledger opens
Verify the page heading reads "Claim Check" and a section titled "Ledger: Night Owl Notes" is visible.

## The broken promise is flagged
Verify the ledger table has a row for the claim "the app is free to download" whose verdict badge reads REFUTED.

## The honest claim is not flagged
Verify the ledger table has a row for the claim that the store link opens the listing for "Night Owl Notes", and its verdict badge reads PROVED.

## Every Kane run shows its control
Verify the "Trust gates" table lists at least one Kane run with the trust badge TRUSTED, and that run's known-false control column ends with "Kane: false".

## Previous checks link back
Verify the "Previous checks" list contains a link named "Night Owl Notes".
