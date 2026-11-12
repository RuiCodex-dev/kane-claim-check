---
mode: testing
url: http://127.0.0.1:4317/
max_steps: 30
timeout: 900
tags: [live]
---

# Claim Check end to end, driven through its own UI

Not part of the Stop-hook gate (it starts a real Claim Check run, which itself calls Kane CLI,
so it takes several minutes and spends credits). Start the UI first: `node bin/claimcheck.mjs serve`.

## Start the demo check
Click the "try the demo fixture" button.

## Wait for the ledger
```yaml
timeout: 600
```
Wait until a section titled "Ledger: Night Owl Notes" appears. It can take several minutes.

## The broken promises are refuted
Verify the ledger table shows the claim "the app is free to download" with the verdict REFUTED and the claim "the app has no ads" with the verdict REFUTED.

## The controls held
Verify every row in the "Trust gates" table has the trust badge TRUSTED.
