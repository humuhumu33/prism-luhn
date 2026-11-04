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
recorded in [REPORT.md](REPORT.md) once the first `pages` run has built the holo.

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
