# Claim Check

**Your app's website makes promises about its store listings. Claim Check proves each one where the link actually leads, in a real browser, with Kane CLI, and it refuses to show a green result unless Kane has first said no to a statement known to be false.**

Built for the Kane CLI Online Hackathon (12-19 November 2026) by Selman Altinay with Claude Code.

```
$ claimcheck check https://example.com/your-app
  product: Night Owl Notes
  claims found: the app is free to download; the app has no ads; the app has no in-app purchases; the content rating is PEGI 3
  store links: https://play.google.com/store/apps/details?id=...
  kane-cli judging 12 conditions on Google Play ...

  PROVED       Google Play  the store link opens the listing for "Night Owl Notes"
  REFUTED      Google Play  the app is free to download
  REFUTED      Google Play  the app has no ads
  ...
```

## Why

Landing pages drift from store listings. The page still says "free, no ads" after the listing added a price and an ad SDK; the App Store badge points at a different app; the age rating changed. Nobody re-reads the page, and a link checker only proves the link returns 200.

## How it works

1. **Claim Check opens the page itself** in a headless Chrome it owns (temporary profile, a random DevTools port) and reads the rendered DOM.
2. **Claims are extracted with plain rules, not a model**, so the list is reproducible: every store badge (Google Play, App Store, AppGallery), "free to download", "contains ads" / "no ads", "in-app purchases" / "no in-app purchases", and PEGI ratings, each with the sentence it came from. A sentence about a paid tier ("Pro adds ... no ads") is not read as a claim about the app as downloaded.
3. **Kane CLI confirms the page really says it.** One Kane run (`kane-cli run --analyzer-only --cdp-endpoint ...`) judges the source page: if Kane does not agree that the page makes a claim, the claim is skipped and reported as an extractor disagreement.
4. **Claim Check follows every store link** in the same browser, then asks Kane to judge each claim **on the store listing**, as a pair: the claim (P) and its negation (not-P). Only "P true, not-P false" is PROVED; "P false, not-P true" is REFUTED; anything else is INCONCLUSIVE.
5. **Every Kane run carries two gates whose answers are known in advance**: an identity gate (the tab title Claim Check just read: must be TRUE) and a near-miss control (the same title with one word swapped: must be FALSE). If either is wrong, the whole run is UNTRUSTED and none of its answers count.
6. **Inconclusive pairs go back to Kane once**, with Kane's own earlier reading quoted, so the second question is narrower than the first.
7. The result is a **ledger** (JSON + Markdown) and a local web UI. The Markdown ends with **fix tasks for a coding agent**: one line per refuted claim plus the command that re-verifies it.

Exit codes: `0` every claim proved, `1` something refuted, `2` something could not be established. A page with nothing to check exits `2`: silence is never reported as a pass.

### Why the gates exist (a real finding from day one)

The first probe of `kane-cli run --analyzer-only --url https://ruicodex.com/Products ...` printed `info: --analyzer-only ignores --url` on stderr and then judged **whatever page the browser had open**: the configured default, the KaneAI playground store. The claim "this page links to a Google Play listing" came back **PASS**. A control in the same run (a false price claim) correctly failed, so a control alone would not have caught it: the answer was confident, plausible and about the wrong page. That is why Claim Check owns navigation, hands Kane the browser over CDP, and asks every run an identity question it already knows the answer to.

### Why claims are asked twice (a real finding from the same day)

On the App Store listing of a live app ([recorded-runs/ruicodex-factory-legacy_2026-11-12_dom-reask.json](recorded-runs/ruicodex-factory-legacy_2026-11-12_dom-reask.json)), Kane answered **true** to "the app name shown on this store listing is 'Factory Legacy: Idle Empire'" and **also true** to "the app name shown on this store listing is clearly a different app than 'Factory Legacy: Idle Empire'". Its own sub-check shows why: it compiled the negation into "is the name different?", read `false`, and expected `false`. The same sentences on the Google Play listing were compiled correctly. Both trust gates passed in that run, so a control alone would have let a one-sided question through as PROVED. Claim Check reports the pair as INCONCLUSIVE, re-asks once (in the second check, in Kane's vision-only mode, which inverted the same question the same way), and records the diagnosis in the ledger instead of turning it green. Across the first two checks of that page (four Kane runs on the App Store listing, two in DOM mode and two in visual mode) the name claim was never proved there, while on Google Play it was proved both times.

The same day, on a second live page ([recorded-runs/ruicodex-candy-chaos_2026-11-12_inverted-and-rewritten.json](recorded-runs/ruicodex-candy-chaos_2026-11-12_inverted-and-rewritten.json)), Kane did it on Google Play too, and showed a second pattern: asked whether the listing's name is "Candy Chaos", it rewrote the expected value to what it read, `candy chaos - sweet sort`, and answered true. The page calls the app "Candy Chaos"; the Play listing is titled "Candy Chaos - Sweet Sort". Claim Check now reads Kane's own sub-check and downgrades a pass produced by a rewritten expectation to INCONCLUSIVE, naming the listing's real title in the ledger.

### Why the name claim allows a subtitle

On the live page [ruicodex.com/Products/koi-drift](https://ruicodex.com/Products/koi-drift) the name claim asked whether the Google Play listing name IS "Koi Drift". The listing is titled "Koi Drift: Zen Koi Puzzle", so Kane read `koidriftzenkoipuzzle`, compared it with `koidrift` and answered false, and Claim Check reported REFUTED ([recorded-runs/ruicodex-koi-drift_2026-11-12_strict-name-false-refuted.json](recorded-runs/ruicodex-koi-drift_2026-11-12_strict-name-false-refuted.json)). That was Claim Check asking the wrong question, not a broken link. The claim now asks whether the listing name BEGINS WITH the page's name, and a name refutation where Kane's own reading starts with the expected name is withheld as INCONCLUSIVE, never turned green.

The same false REFUTED had appeared on two more live pages the same morning, RadioSEM (Kane read the App Store title as `radiosemglobalfmradio`) and Star Harbor (Google Play, `starharborspacestation`). Re-checked after the fix, the name claim was PROVED on all three ([koi-drift](recorded-runs/ruicodex-koi-drift_2026-11-12_after-name-fix.json), [radiosem](recorded-runs/ruicodex-radiosem_2026-11-12_after-name-fix.json), [star-harbor](recorded-runs/ruicodex-star-harbor_2026-11-12_after-name-fix.json)).

### Why the page itself is checked first (Kane caught a bug in Claim Check)

On a live product page the extractor read "Pro ... adds HD export, batch mode and **no ads** or watermark" as the claim "the app has no ads". Kane's source-page run answered that the page does not state that, so Claim Check skipped the claim and printed *"extractor and Kane disagree; check the extractor rule"* instead of reporting a false REFUTED against the Google Play listing, which does say "Contains ads". The rule was then fixed (a sentence about a paid tier is not a claim about the app as downloaded) and a known-negative unit test was added for that exact sentence.

## Real runs so far

Every ledger from live pages is kept in [recorded-runs/all/](recorded-runs/all/) (JSON + Markdown). On 12 November: **15 checks of 10 live product pages, 46 Kane runs, none of which failed its identity gate or its known-false control; 78 claims proved, 12 withheld as INCONCLUSIVE, 3 refuted.** All three refutations were Claim Check's own strict name question (above), found because the ledger shows Kane's reading, fixed the same day, and re-checked as PROVED. Kane credits used on live pages: about 274.

## The closed loop with the coding agent

`.claude/settings.json` registers a Claude Code **Stop hook**, `hooks/kane-gate.mjs`. When the agent tries to finish, the gate runs:

1. the unit tests (`node --test`);
2. Kane CLI replaying `kane/*_test.md` against the local UI (recorded on first run, then replayed from cache);
3. `claimcheck demo`: the real tool, with Kane judging two local fixture pages whose answers are known (`fixtures/expected.json`).

A failure blocks the stop and hands the agent Kane's own words (`{"decision":"block","reason": ...}`): the failing step, Kane's summary and the path of Kane's `Result.md`. After three failed attempts in a row the gate escalates to the human instead of looping. It does nothing when the sources are unchanged since the last green gate, so it does not burn credits. Every gate decision is appended to `recorded-runs/gate-log.ndjson`.

### The gate inside a real Claude Code session (12 November)

The first time the hook ran inside a real headless Claude Code session (`claude -p`, asked to update this README), the agent edited, ran `npm test` and tried to finish; the hook then ran the unit tests, Kane's replay of the UI test and Kane judging the fixtures, all green, and only then did the session end ([recorded-runs/gate-log.ndjson](recorded-runs/gate-log.ndjson), 13:45-13:47 UTC).

### The gate's first real block (12 November, nothing staged)

The second gate run blocked the stop: on the honest fixture, whose answers are known, all five claims came back INCONCLUSIVE, and the hook handed this back as the reason:

```
Kane gate (attempt 1 of 3): "claimcheck demo (Kane judging the fixtures)" failed. ...
  FAIL /fixtures/honest/ listing-name: expected PROVED, got INCONCLUSIVE
  FAIL /fixtures/honest/ free: expected PROVED, got INCONCLUSIVE
  ...
```

Reading the ledger ([recorded-runs/demo-honest_2026-11-12_gate-blocked-inverted.json](recorded-runs/demo-honest_2026-11-12_gate-blocked-inverted.json)) showed Kane answering true to every claim **and** to every negation, on a page where two earlier runs had been clean, in both DOM and visual mode. Two fixes were tried, the first against the recorded Kane output and the second with new runs:

1. *Grade Kane's reading instead of its self-written expectation.* Re-judged against every recorded ledger, it fixed this page and broke others (on one listing Kane read `true` for "does the name differ?" and still reached the right answer), so it was **reverted**. Kane's extracted values do not reliably mean what its own descriptions say.
2. *Ask negations in a separate run.* Measured directly ([tools/batching-experiment.mjs](tools/batching-experiment.mjs), [recorded-runs/experiment-batching_2026-11-12.json](recorded-runs/experiment-batching_2026-11-12.json)): three runs of each design on the same page, 15 negations per design, all known false. Asked together with the claims, Kane wrongly answered true to **1 of 15**; asked alone, **0 of 15**. That leans one way and proves nothing at this size, so the extra run per store page was **not** added; the measurement stays open.

What did change: Claim Check was already right to abstain, but the demo demanded a decision on every claim, which made the gate flaky on a nondeterministic judge. The demo now fails on any **wrong** verdict (the opposite decision, an untrusted or absent run, a missing claim) and on a page where fewer than 60 % of the claims are decided correctly, and tolerates individual abstentions. The run that blocked would still block under the new rule (0 of 5 decided).

So Kane plays three roles: the **runtime** (it judges other people's claims), the **tester** (it checks Claim Check's own UI) and the **gate** (it decides when the agent is allowed to call the work done).

## Install and run

Requirements: Node 22+, Google Chrome, Kane CLI logged in (`npm install -g @testmuai/kane-cli`, then `kane-cli login`). No other dependencies.

```bash
git clone <this repo> && cd kane-claim-check
node bin/claimcheck.mjs doctor                        # check Node 22+, Chrome, Kane CLI login and credit balance (spends no credits)
node bin/claimcheck.mjs demo                          # self-test: Kane judges two local fixtures with known answers
node bin/claimcheck.mjs check https://your.site/app   # check a real page
node bin/claimcheck.mjs crawl https://your.site/apps --match /apps/ --limit 10
node bin/claimcheck.mjs serve                         # UI on http://127.0.0.1:4317
node bin/claimcheck.mjs report runs/<ledger>.json     # Markdown report with fix tasks
npm test                                              # unit tests, no network
```

`npm link` (or `npm install -g .`) installs the `claimcheck` command.

**No Kane credits?** `recorded-runs/` holds real ledgers from real runs; `node bin/claimcheck.mjs serve` and open `http://127.0.0.1:4317/?ledger=recorded-runs/<file>.json` to browse them, gates and Kane's reasons included.

Cost: one Kane analyzer run per page plus one per store link (two when a re-ask is needed); about 12 credits for a page with one store link and five claims.

## Limits, stated plainly

- The claim rules cover store-listing promises in English. Other claims on a page are ignored, not judged.
- Store listings vary by country and language; Claim Check runs Chrome with `--lang=en-US` from wherever you are, and a consent wall or redirect is reported as ABSENT rather than guessed past.
- The App Store shows no "contains ads" label and uses its own age ratings, so those claims are only checked on Google Play.
- Kane is a model-backed judge. The paired questions and the known-false control make its mistakes visible; they do not make it infallible. Its answers also vary between runs (the same App Store claims were inconclusive three times in one run and once in the next), so a ledger is a dated observation, not a permanent fact.
- An analyzer run takes 30-80 seconds, so a page with two store links takes about four minutes.

## Layout

```
bin/claimcheck.mjs    CLI
src/chrome.mjs        headless Chrome over the DevTools protocol (no dependencies)
src/extract.mjs       claim rules, store-link classification, gates
src/kane.mjs          kane-cli wrapper (agent-mode NDJSON)
src/judge.mjs         pure verdict logic (unit-tested)
src/check.mjs         orchestration and re-ask loop
src/report.mjs        Markdown report and agent fix tasks
src/server.mjs, ui/   local web UI
fixtures/             two fictional apps and their fixture store pages, with known answers
kane/*_test.md        Kane UI tests used by the gate (replayed from cache after the first run)
kane-live/            an end-to-end Kane test through the UI (slow, spends credits; not in the gate)
hooks/                the Claude Code Stop-hook gate
tools/                the batching experiment
recorded-runs/        real ledgers, the experiment result and the gate log
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
