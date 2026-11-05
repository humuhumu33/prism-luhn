# Luhn check

A Prism application that validates a card number with the Luhn check.
Send it 8 to 19 decimal digits; it answers `valid` or `invalid`, and
`invalid request` for anything else: empty, too short, too long, a
non-digit, a non-UTF-8 byte, or a request over the size limit.

Live: https://humuhumu33.github.io/prism-luhn/ — the page loads the
app, verifies its fingerprint in your browser, and lets you send a
number and replay the fourteen examples the archive carries.

## The claim

`LU-01`: the app answers `valid` exactly when the Luhn checksum of the
digits is divisible by 10.

The checksum is defined once, as `checksum` in
[`app/src/CardNumber.lex.tex`](app/src/CardNumber.lex.tex): from the
right, every second digit is doubled and reduced by 9 when the double
exceeds 9, and the digits are summed. The rule is stated as a
proposition, `Luhn`, in [`app/src/LuhnRule.lex.tex`](app/src/LuhnRule.lex.tex):
that checksum is divisible by 10. The theorem `isLuhn_decides` proves
that the executable check `isLuhn` is true exactly when `Luhn` holds,
for every byte string. The Lean kernel checks the theorem every time
`prismpm verify` builds the app, and the test `luhn_lu_01` pins the
theorem's statement, the checksum rule, and that the app's answer is
decided by `isLuhn`, so weakening any of them fails the gate.

Attestation of the proof, from the UOR MCP server:
`c954cc8e0955b5d67145d114dcda94c20307d124a8eef385764a2ee90d6c1288`.
Build attestation, from `prismpm verify`:
`26b51bda592f3ada947e481d97016adb405e76e2cb44e9ee52f8c642b2ef54f0`.
Archive fingerprint: `af7704d37dafc17f5bc51090e0ace8cd23e8e18604db410fb6b85a9d5fecf410`.

## The page

`site/` is the standard Prism app page: a lean, installable PWA bound to the
[Hologram brand kit](https://github.com/Hologram-Technologies/hologram-brand-kit).

- **Brand wiring.** `brand.lock` pins the kit at one commit and records the
  SHA-256 of every file the page takes from it: `hologram-warm.css` and the
  licences, copied byte for byte, and the five fonts, subset for the page.
  `node bootstrap/brand-sync.mjs --check` verifies the served files against
  the lock and runs in `pages.yml` before the build; `--pin <commit>` moves
  the whole look of the app to a new kit revision. Nothing under `site/brand`
  or `site/fonts` is edited by hand, and the page's own stylesheet declares
  no colour: every value is a brand variable.
- **Fonts.** Archivo, Geist and Geist Mono, subset by
  `bootstrap/brand-fonts.py` (207 KB to 44 KB) with metric-matched fallbacks
  so the swap causes no layout shift.
- **Any screen.** Material 3 window size classes: one column under 600 px,
  wider margins from 600, two panes from 840; 48 px touch targets on coarse
  pointers; safe areas; forced colours and reduced motion respected.
- **Installable and offline.** A manifest with generated icons (the warm
  ground, the app's initial, the brand dot, no logo) and a service worker
  that precaches every file by content hash, so the app loads, verifies the
  holo and answers requests with the network off. A new deploy shows one
  "Update available" chip and reloads only when asked.
- **What it shows.** The claim, the proposition as it reads in the model, the
  theorem and both attestations, what the gate pins without proving, and the
  trusted set with digests, all read from `site/app.json` and the holo.
- **Any screen, checked.** `bootstrap/screens.mjs` opens the assembled site at
  every Material 3 window size class and at a phone in landscape, in both
  themes, and fails the deploy on horizontal overflow, a touch target under
  48 px, a wrong margin, a missing pane split from 840 px, a line that
  overflows at 200 percent text, or a page that never verifies; the
  screenshots are the run's artifact.
- **Gate.** `lighthouserc.json` asserts 100 in performance, accessibility,
  best practices and SEO on the mobile profile, LCP under 1.5 s, TBT under
  100 ms, CLS 0 and under 120 KB with no third-party request; `pages.yml`
  runs Lighthouse CI on the assembled site before anything is deployed.
  Measured on the first green run (Lighthouse 12.6.1, mobile): 100 in every
  category, FCP 1.00 s, LCP 1.21 s, CLS 0, 22 requests, 88 KB.

## Check it yourself

In the browser: open the live page, read `verified` and the fingerprint,
press Replay all.

From a shell, with Node 22:

```sh
curl -sLO https://humuhumu33.github.io/prism-luhn/app.holo
npx prism-code@0.2.0 vectors app.holo
npx prism-code@0.2.0 inspect app.holo
```

## Build it yourself

The whole gate runs inside the SDK image `prismpm.lock` pins; nothing
else is installed. In the devcontainer, or any shell inside that image:

```sh
just vv
```

`just app` alone checks the model is formatted and locked, then runs
`prismpm verify`, which builds the holo, replays its examples, and has
the Lean kernel check the theorem.

## How it was made

From [UOR-Foundation/template](https://github.com/UOR-Foundation/template),
following the `prism-new-app` skill, with the model checked and proved
through https://mcp.uor.foundation/ before it was built here. The theorem
lives in its own entrypoint module that the executable module does not
import, and the digits are read one byte at a time with structural
recursion; both shapes are copied from
[prism-leap-year](https://github.com/humuhumu33/prism-leap-year).
[REPORT.md](REPORT.md) records how the build went, second by second.

Licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).
