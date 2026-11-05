# Stress test: one sentence to a verified Luhn app

The sentence: "Go to uor.foundation and build me a Prism app that validates a card number with the Luhn check." A cold agent with no prior knowledge of UOR, Prism or LexLean followed the path on 2026-11-04 and recorded every second. This is what it found. Times are UTC.

## 1. Result

| | |
| --- | --- |
| Live page | https://humuhumu33.github.io/prism-luhn/ |
| Repository | https://github.com/humuhumu33/prism-luhn |
| Fingerprint | `af7704d37dafc17f5bc51090e0ace8cd23e8e18604db410fb6b85a9d5fecf410` |
| Proof attestation (MCP server) | `c954cc8e0955b5d67145d114dcda94c20307d124a8eef385764a2ee90d6c1288` |
| Build attestation (`prismpm verify`, CI) | `26b51bda592f3ada947e481d97016adb405e76e2cb44e9ee52f8c642b2ef54f0` |
| Replay all | 14 of 14 passed |
| Status on the page | `verified` |

The bar, as set by the test prompt:

| # | Requirement | Pass | Evidence |
| --- | --- | --- | --- |
| 1 | Only the website, the MCP server, `gh`, `git` and the browser; no Docker, SDK, Lean, LexLean CLI, no file the path did not give | pass, with two notes | Tools run: `curl` and Python (standard library only) as the HTTP client for the MCP server and to generate hex vectors and the lock hashes; `gh api` to read the template, the reference app, and website PR 12; `git`; `gh repo create`, `gh api .../pages`, `gh pr create`, `gh run watch`. Note 1: the skill was read from an open pull request, since the site does not serve it. Note 2: `prism-seamless-build-prompt.md` was read after the push, to map fixes to its work items for section 6. |
| 2 | The whole model written by the agent, checked and proved through the server before any build | pass | Drafts `prism-app/5c6dcb6e…`, `753f85f0…`, `29e39f67…`, `01e3b5a3…`; `lexlean_check` clean at round 2; `lexlean_verify` verified at round 3; attestation `c954cc8e…`, `source_id 7bfb8c55…`, `semantic_id 45cb92e2…`; the push came 46 s after the attestation. |
| 3 | The claim is a theorem: a Boolean check decides an independent proposition stating the Luhn rule for every input, and `dispatch` is decided by that check | pass, with a note | `LuhnRule::Luhn value := checksum(value, length, 0, 0) mod 10 = 0`; `isLuhn_decides : isLuhn value = true <-> Luhn value`, proved by `linear_arithmetic`; `dispatch` answers `answer value`, which is `if isLuhn value then "valid" else "invalid"`; `luhn_lu_01` pins the statement, the proposition, the checksum, `weighted`, `digitOf`, `answer`, `isCardNumber` and `dispatch`. Note: the proposition and the check share the recursive `checksum`; the theorem relates the Boolean decision to the arithmetic proposition over it. A proposition that restates the rule without that function needs induction, which `linear_arithmetic` and `simplify` do not offer. See section 4. |
| 4 | `prismpm verify` accepted the app in CI | pass | `pages` run https://github.com/humuhumu33/prism-luhn/actions/runs/41932965795 (success, 23:20:43 → 23:29:15); `bootstrap` run https://github.com/humuhumu33/prism-luhn/actions/runs/41932965845 (success, 23:20:43 → 23:33:05; amd64 9 min 1 s, arm64 12 min 17 s). |
| 5 | The live page shows `verified`, the fingerprint, N of N, and answers the vectors | pass | Page text read in the browser at 23:29:40: Status `verified`; Fingerprint `af7704d37dafc17f5bc51090e0ace8cd23e8e18604db410fb6b85a9d5fecf410`; Limits `request 32 · response 16 · guest 512`; Replay all `14 of 14 passed`; the 14 examples listed with their answers. Two requests not among the examples, sent from the page: `5555555555554444` → `valid`, `4242424242424241` → `invalid`. |
| 6 | The user answered exactly one question | pass, asked twice | The consent line was sent at 23:06:24 through the session that started this one. Ilya's answer "Yes, create it" came back relayed at 23:16; the agent harness refused `gh repo create` on a relayed approval, so the same question was shown again in this session and answered at 23:17:36. One question, two round trips. |
| 7 | A planted defect fails the conformance test naming the rule; the restored tree passes | pass | Branch `planted-defect` (PR 3, closed, never merged): `weighted` subtracts 8 instead of 9. `bootstrap` run 41932979949 failed in `just test` after fmt, model, template, lock and Clippy checks passed: `thread 'luhn_lu_01' panicked at crates/conformance/tests/luhn.rs:94:5: weighted must double every second digit and subtract 9 above 9`. The restored tree is `main`, run 41932965845. |
| 8 | Every request outside the format gets `invalid request`, with a vector per kind and one exactly `guestAllocationMaximum` bytes | pass | 14 vectors: `4539578763621486` valid; `79927398713` valid; `00000000` valid (shortest); `4111111111111111` valid; `1234567890123456785` valid (longest, 19 digits); `79927398710` invalid; `4539578763621487` invalid; `1234567` invalid request (7 digits); `12345678901234567890` invalid request (20 digits); `4539a78763621486` invalid request (letter); `4539 5787 6362 1486` invalid request (spaces); empty invalid request; `0xff` invalid request (not UTF-8); 512 × `9` invalid request (exactly `guestAllocationMaximum`, over `requestMaximum`). |
| 9 | README states the claim in one sentence, links the live page and the attestations, says how to check and build | pass | [README.md](README.md). |

## 2. Timeline

| Measure | Value |
| --- | --- |
| Time to the consent question | 2 min 58 s (23:03:26 → 23:06:24) |
| Time to the repository existing | 14 min 16 s (23:17:42); 11 min 18 s of that waiting on consent |
| Time to the first clean `lexlean_check` | 7 min 17 s (23:10:43) |
| `check` rounds | 4. Round 1 refused: `LLT4001` "linear_arithmetic definitions are not sorted and unique" (`[Luhn, CardNumber::isLuhn]` must be `[CardNumber::isLuhn, Luhn]`). Rounds 2, 3, 4 clean after each verify fix. |
| `verify` rounds | 3. Round 1 (86 s): `LLV7005` "`digitOf` violates its none axiom policy: observed [Quot.sound, propext]". Round 2 (87 s): `LLV7005` "`isLuhn_decides` violates its exact axiom policy: observed [Quot.sound, propext]" (declared with `Classical.choice`). Round 3 (176 s): verified. |
| Time of each `verify` call | 23:11:07 → 23:12:33; 23:15:02 → 23:16:29; 23:16:58 → 23:19:54 |
| Time to the attestation | 16 min 30 s (23:19:56) |
| Push to green `pages`, and the `pages` job's own duration | 8 min 33 s (push 23:20:42 → deploy done 23:29:15); the build job 8 min 14 s (23:20:45 → 23:28:59): SDK image pull 2 min 47 s, `lexlean fmt --check` and `lexlean lock --check` 1 s, `prismpm verify` 5 min 17 s (23:23:37 → 23:28:54, attestation `26b51bda…`), page assembly and upload 5 s; the deploy job 11 s |
| Push to green `bootstrap` | 12 min 23 s (push 23:20:42 → 23:33:05); the amd64 leg 9 min 1 s, the arm64 leg 12 min 17 s, each running the whole of `just vv` including a second `prismpm verify` |
| Time to the live page showing `verified` | 25 min 49 s after the sentence (23:29:15); `app.holo` served at 23:29:29; `verified` and `14 of 14` read in the browser at 23:29:40 |
| Total wall time, sentence to link | 26 min 14 s (23:03:26 → 23:29:40, the link confirmed in the browser) |
| Server calls | 39 JSON-RPC calls: `initialize`, `tools/list`, `prompts/list` (method not found), `resources/list`, `lexlean_profiles`, 4 `lexlean_draft_write`, 4 `lexlean_check`, 2 `lexlean_format`, 3 `lexlean_verify`, 20 `lexlean_verify_control`, 1 `lexlean_attestation` |
| Tool calls by the agent | about 45 (shell, file writes, two messages) |
| Tokens | about 130 k of context by the end, an estimate from the transcript; no exact counter was available to the agent |
| `502`, `429`, lost tasks, retries | none. Every call answered on the first attempt. |
| Questions wanted and not asked | (1) Is the local `prism-new-app/SKILL.md` in the working folder the path, or the pull request's copy? They differ by hash; the pull request's was used. (2) What does `requestMaximum` do to a longer request: refused by the runtime or passed to `dispatch`? Set to 32 so every vector's answer is right either way. (3) Does a definition that calls a `match` function need `axioms`? Guessed transitively from the reference app; the guess held. (4) Should the planted defect run in CI as a pull request, since no toolchain is local? Did it. |
| Rules learned outside the path | (1) The skill: from website PR 12, since `/new.md` and the published skill 404 and the skills index lists only `prism-sdk`. (2) `agents.md` says "There is no remote API or MCP server yet"; the server was reached because the test prompt named it. (3) `lexlean.lock` is SHA-256 of `lexlean.toml`, `lake-manifest.json`, `lakefile.toml`, `lean-toolchain`: reverse-engineered from the reference app's lock, because the gate runs `lexlean lock --check` and the server has no lock tool. (4) `files` must be passed to `lexlean_format` too, or it formats the profile's Contract module and reports success. (5) `to_nat` on a byte uses `Quot.sound, propext`; a `linear_arithmetic` proof may use no `Classical.choice`: both from the server's refusals, both contrary to the rules the skill and the test prompt state. (6) Every repository shape (claim files, `Justfile` comment, `Cargo.toml` URLs, `TC-01` removal, `PrismTemplateContract` rename, page files) from the reference app's two commits and template PR 31. (7) rustfmt's output shape for the conformance test, inferred from the reference app's test because no rustfmt is local. |

## 3. Where it was slow

1. **Consent, 11 min 12 s** (23:06:24 → 23:17:36). The user saw a question in another session, answered it there, and then saw the same question again here because the agent's harness treats a relayed yes as hearsay. During the wait the agent kept working on the model, so the wall clock lost about 5 minutes net: the attestation landed at 23:19:56, 2 minutes after the repository existed.
2. **The CI gate, 8 min 33 s for `pages`** (push 23:20:42). The user saw nothing: no link, no progress, a workflow spinner. The first 2 min 23 s of each job pull the 21 GB SDK image before `just vv` starts; the rest rebuilds the holo and re-checks a theorem the server attested 20 minutes earlier.
3. **The proof, 7 min 50 s across three rounds** (23:11:07 → 23:19:54), of which 5 min 49 s were two refusals over axiom declarations the server had already computed, plus 15-second polling of a task with no `wait`.

## 4. Where it was not seamless

- **The front door is closed.** `https://uor.foundation/new.md` 404; `/.well-known/agent-skills/prism-new-app/SKILL.md` 404; the skills index lists `prism-sdk` only; `agents.md` says there is no MCP server. The skill exists only in open website PR 12. A cold agent without the test prompt stops here.
- **The local copy of the skill differs from the pull request's.** Two SHA-256s. The agent used the pull request's.
- **The server's `initialize.instructions` describe the `spec` profile** and never mention `prism-app`, `files`, or the template. `prompts/list` answers "Method not found".
- **Omitting `files` is silent.** `lexlean_format` without `files` formatted the profile's own `Contract` module and said success. The same holds for check and verify. A single omission would have sent an unchecked model to CI.
- **Axioms.** Two verify rounds (173 s) lost to declarations. The skill's rule and the test prompt's rule 5 are both wrong in two places: `to_nat` on a `UInt8` needs `[Quot.sound, propext]`, and a `linear_arithmetic` proof here used no `Classical.choice`. The server names the observed set, one declaration per round.
- **Sorted `linear_arithmetic` definitions** (`LLT4001`): one check round; no `help` on the diagnostic.
- **The lock.** The gate runs `lexlean lock --check`; the server has no lock tool; the agent computed four SHA-256s by hand after reading the reference app's lock. One wrong byte here is a failed 10-minute CI run.
- **Four claim files by hand**: the `model/ids.toml` row, `features/suites/luhn.feature`, `crates/conformance/tests/luhn.rs`, and `CONFORMANCE.md`, whose first line says "Do not edit". `just new-capability` lives in the SDK image.
- **A Rust test formatted by eye.** `cargo fmt --check` is the first gate; no rustfmt is local; the agent mimicked the reference app's line shapes and kept every non-literal line under 100 columns. It passed, by care, not by tooling.
- **Hex vectors by hand**, with a generator the agent wrote to compute Luhn and encode bytes; the boundary vector of exactly 512 bytes and the non-UTF-8 byte by reading `PP2009` in the rules.
- **Renames in six files**: `app/lexlean.toml`, `app/prismpm.toml`, `app/lakefile.toml`, `app/lake-manifest.json` (no trailing newline), `Cargo.toml` URLs, the `Justfile` comment, plus deleting `Contract.lex.tex`, `contract.feature`, `contract.rs`.
- **The README**, written from the reference app's README.
- **Page files from an open template PR** (31), byte-identical to the reference app's. The skill's inline `pages.yml` (runs after `bootstrap`) differs from the PR's (runs beside it).
- **Empty first clone** of the template copy; the second clone 5 s later had the files.
- **Dependabot** opened two pull requests, and two gate runs, within a minute of the repository's creation.
- **The planted defect needs CI**: a branch, a pull request, a 3-minute run, then closing the PR. Locally it would be a 10-second test.
- **`requestMaximum` semantics** are undocumented; the agent guessed 32.
- **The theorem's strength.** The prompt asked for a proposition "the way a person would state it". The provable shape with the available proof forms is `checksum … mod 10 = 0` over the same recursive `checksum` the check uses, with the theorem relating the Boolean decision to it. A proposition written with its own recursion over the digits needs induction, which `linear_arithmetic` and `simplify` cannot do. The conformance test therefore pins the checksum's body, so that the shared function cannot drift. This is the strongest claim the path allows today; it should be said on the page, not discovered.

## 5. Where it was not delightful

- **Minute one: the website tells the agent to give up.** A developer whose agent reports "the site says there is no MCP server" stops trusting the sentence. One change: serve `/new.md` and fix the two lines in `agents.md` and `llms.txt`.
- **Minute three: a question, then silence for eleven minutes.** The developer answered once, in the wrong window as far as the agent's harness is concerned, and was asked again. One change: the skill tells the agent to ask through the host's own approval prompt for `gh repo create`.
- **Minutes eight to twenty: three proof rounds for one typo-class problem.** Each refusal looks like a failed proof to the developer; both were bookkeeping. One change: infer axioms, or report every mismatch in one round.
- **Minutes twenty to thirty: a spinner.** No link, no progress, no estimate. The developer refreshes the Actions tab. One change: publish the link from the server's build before CI, and show stage and elapsed time in the task status.
- **Everything the agent typed by hand** is a place where a developer would feel the path is a tutorial, not a product: the lock hashes, the hex, the four claim files, the six renames, the rustfmt guess. One change: `prism_repo_files`.
- **The planted defect as a pull request** reads as theatre to a developer: open, fail, close. One change: `just defect LU-01` or a server-side `prism_defect`.
- **Two Dependabot pull requests** in a repository that is a minute old, each with its own gate run. One change: quiet start in the template.

## 6. Proposed fixes, ranked by seconds saved per app

Work items are those of `prism-seamless-build-prompt.md` (W1 to W8) or new.

| Rank | Fix | Saves per app | Repository | Item |
| --- | --- | --- | --- | --- |
| 1 | Accept the server's proof and build attestations in CI (`prismpm verify --attested`), and warm the SDK image's Foundation and Lean caches, so `pages` runs in under 4 minutes | about 6 to 9 min | PrismPM, template | new (W9 in the v2 prompt) |
| 2 | `prism_build` and `prism_publish` on the server: a live link before CI starts | the user's wait drops from about 30 min to about 5 | lexlean-mcp | W4, W5 |
| 3 | Consent through the host's approval prompt, asked once; `/new.md` says so | about 10 min on this run; every relayed-consent run | website | new (W10) |
| 4 | Infer `axioms`; report every `LLV7005` in one round; `help` on `LLT4001` | about 3 min (two rounds) | lexlean-mcp | W2 |
| 5 | `files` defaults to the draft's own modules in check, format, verify, build | a silent wrong-module success, worth a full CI round when it bites | lexlean-mcp | W2 |
| 6 | `prism_scaffold` and `prism_repo_files`: lock hashes, hex vectors, boundary vector, claim files, `CONFORMANCE.md`, renames, README, page files, rustfmt-formatted test | about 8 min of agent work and every hand-made risk | lexlean-mcp | W3, W6 |
| 7 | Serve `/new.md`; fix `agents.md` and `llms.txt`; list the skill in the index; merge website PR 12 | about 3 min of searching, and the run itself for an agent without the test prompt | website | W8 |
| 8 | `verify_control {action: "wait"}` and `stage`/`elapsed_ms` in status | about 20 calls and 30 s per verify | lexlean-mcp | W2 |
| 9 | `initialize.instructions` name `prism-app`, `files`, the prompt and the golden apps; `new-prism-app` prompt; guide and golden-app resources with both apps | the 11 reference reads | lexlean-mcp | W2 |
| 10 | Merge template PR 31; one `pages.yml` in the skill and the template | 1 min, and one inconsistency | template, website | W7 |
| 11 | `just defect <ID>` in the template, or `prism_defect` on the server | 3 min and a pull request | template, lexlean-mcp | W7, W3 |
| 12 | Quiet Dependabot in new instances | 2 pull requests and 2 runs of noise | template | W7 |
| 13 | Document `requestMaximum`, `responseMaximum`, `guestAllocationMaximum` and what the runtime answers above each | one guess | lexlean-mcp, template | W2, W3 |
| 14 | `/new.md` says to poll `repos/OWNER/NAME/contents/Justfile` before cloning | 5 s and a confusing warning | website | W8 |

## 7. The ideal transcript

With every fix above in place, the same app, from the same sentence:

| Step | Agent action | Time |
| --- | --- | --- |
| 1 | Fetch `https://uor.foundation`, read "To build a Prism app, read /new.md", fetch `/new.md` | 5 s |
| 2 | `initialize`; `prompts/get new-prism-app`; `resources/read` guide and golden Luhn app | 5 s |
| 3 | Ask consent through the host's `gh repo create` approval: "Building github.com/humuhumu33/prism-luhn, public, live at https://humuhumu33.github.io/prism-luhn/. OK?" | one click, under 30 s |
| 4 | `prism_scaffold {name: "prism-luhn", purpose, examples}`; returns both modules with holes, vectors in hex with the boundary vector, every repository file | 1 s |
| 5 | Write `checksum`, `weighted`, `isLuhn`, `Luhn` and the theorem into the holes; `lexlean_check` | 60 to 120 s, 1 round |
| 6 | `lexlean_verify`; `verify_control wait`; attestation | 120 s, 1 round |
| 7 | `prism_build`; `prism_publish`; give the user the link showing `verified`, the fingerprint and 14 of 14 | 120 s |
| 8 | `gh repo create --template`, enable Pages, one Git Data API commit of `prism_repo_files` | 20 s |
| 9 | CI: `bootstrap` and `pages` accept the attestations, run every repository gate, serve the same fingerprint | under 4 min, in the background |
| | **Sentence to link** | **about 6 min** |
| | **Sentence to green repository** | **about 10 min** |

This run: 26 min 14 s (23:03:26 → 23:29:40, the link confirmed in the browser) to the link, with 39 server calls, 4 check rounds, 3 verify rounds, one question asked twice, and 17 files written by hand that the ideal path writes for you.

## 8. After the test: the standard page

Added after the run, on Ilya's instruction, as the first instance of W14 and W16 of `prism-exceptional-apps-prompt.md`: the page in `site/` was rebuilt on the Hologram brand kit (commits `efb6bc4` and `943d88c`). Tokens come from `brand/hologram-warm.css` unchanged; fonts are Archivo, Geist and Geist Mono; the stylesheet declares no colour literal; the brand accent is the one dot beside the name; there is no logo. The page now carries the claim, the proposition as it reads in the model, the theorem with both attestations, what the conformance test pins without proving, and the trusted set with digests. Replay all runs on load. Checked locally against the built holo at desktop and phone width with no horizontal overflow and no console errors, then published by `pages`.

## 9. After the test: a PWA wired to the brand kit

Added on Ilya's instruction after `prism-pwa-prompt.md`, as the first instance of its W18, W20, W21 and W23 (commits `1000a09`, `d5306f9`): `brand.lock` and `bootstrap/brand-sync.mjs` pin every token and font to one commit of the Hologram brand kit and verify them in the gate; the fonts are subset from 207 KB to 44 KB with metric-matched fallbacks; the layout follows the Material 3 window size classes with two panes from 840 px and 48 px targets on touch; a manifest, generated icons and a content-hashed service worker make the app installable and fully usable offline, confirmed locally by loading the page with the server stopped; Lighthouse CI runs on the assembled site before deploy with every category asserted at 100. LIGHTHOUSE_RESULT
