//! The `luhn` suite: one test per scenario in `features/suites/luhn.feature`.
//!
//! The proof is checked by the Lean kernel when `just vv` runs
//! `prismpm verify` on `app/`. What this test holds fixed is the claim the
//! proof is about: the theorem's exact statement, the Luhn rule in the
//! checksum the proposition is stated over, and that the answer the
//! application returns is decided by the function it proves. A weakened
//! rule, a dropped condition or an answer decided some other way would still
//! verify, and would no longer be the claim `LU-01` makes.

use std::path::PathBuf;

fn root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(2)
        .expect("crates/conformance is two below the root")
        .to_path_buf()
}

/// The body of the top-level declaration named `name`, up to its closing brace.
fn declaration<'a>(model: &'a str, name: &str) -> &'a str {
    let start = model
        .find(&format!("\n  name: {name},\n"))
        .unwrap_or_else(|| panic!("{name} is not declared"));
    let end = model[start..]
        .find("\n}\n")
        .unwrap_or_else(|| panic!("{name} is not closed"));
    &model[start..start + end]
}

/// `LU-01`: The app answers valid exactly when the Luhn checksum of the digits is divisible by 10
#[test]
fn luhn_lu_01() {
    // The theorem lives in its own module, which the executable app does not
    // import: its proof needs `LexLeanRuntime.Laws`, and only the app's import
    // closure is compiled into the guest.
    let model = std::fs::read_to_string(root().join("app/src/CardNumber.lex.tex"))
        .expect("the card-number model");
    let rule =
        std::fs::read_to_string(root().join("app/src/LuhnRule.lex.tex")).expect("the Luhn rule");
    let lexlean =
        std::fs::read_to_string(root().join("app/lexlean.toml")).expect("the LexLean project");
    assert!(
        lexlean.contains("\"src/LuhnRule.lex.tex\""),
        "the rule module must be an entrypoint, or its theorem is never checked"
    );
    assert!(
        !model.contains("\\importmodule{LuhnRule}"),
        "the executable module must not import the proof module"
    );

    let decides = declaration(&rule, "isLuhn_decides");
    assert!(
        decides.contains("statement: (((CardNumber::isLuhn value) = true) <-> (Luhn value)),"),
        "LU-01's statement changed: isLuhn must be true exactly when Luhn holds:\n{decides}"
    );
    assert!(
        decides.contains("parameters: [value : Bytes],"),
        "LU-01 quantifies over every byte string:\n{decides}"
    );

    // The proposition: the checksum of the whole request, taken from the
    // right with the rightmost digit unweighted, is divisible by 10.
    let luhn = declaration(&rule, "Luhn");
    assert!(
        luhn.contains(
            "body: ((prim remainder (CardNumber::checksum value (Foundation.Bytes::byteLength value) 0 0) 10 0 : Nat) = 0)"
        ),
        "Luhn must state that the checksum from the right is divisible by 10:\n{luhn}"
    );

    // The checksum walks the digits from the right (index `rest` of a
    // `Nat.succ rest` counter), flips the parity at every digit, and adds
    // each digit weighted by its parity.
    let checksum = declaration(&model, "checksum");
    assert!(
        checksum.contains("(match (Foundation.Bytes::byteAt value rest)"),
        "checksum must walk the digits from the right:\n{checksum}"
    );
    assert!(
        checksum.contains(
            "(checksum value rest (prim subtract 1 parity : Nat) (accumulated + (weighted (digitOf byte) parity)))"
        ),
        "checksum must flip the parity each step and add each digit weighted:\n{checksum}"
    );
    assert!(
        checksum.contains("| Nat.zero => accumulated"),
        "checksum must end with the accumulated sum:\n{checksum}"
    );

    // Every second digit is doubled, and a double above 9 is reduced by 9.
    let weighted = declaration(&model, "weighted");
    assert!(
        weighted.contains(
            "body: (if (parity =? 1) then (if (9 <? (prim multiply digit 2 : Nat)) then (prim subtract (prim multiply digit 2 : Nat) 9 : Nat) else (prim multiply digit 2 : Nat)) else digit)"
        ),
        "weighted must double every second digit and subtract 9 above 9:\n{weighted}"
    );
    let digit_of = declaration(&model, "digitOf");
    assert!(
        digit_of.contains("body: (prim subtract (prim to_nat byte : Nat) 48 : Nat)"),
        "digitOf must read the decimal value of an ASCII digit:\n{digit_of}"
    );

    let answer = declaration(&model, "answer");
    assert!(
        answer.contains(
            "(if (isLuhn value) then (prim utf8_encode \"valid\" : Bytes) else (prim utf8_encode \"invalid\" : Bytes))"
        ),
        "the answer must be decided by isLuhn, the function LU-01 proves:\n{answer}"
    );
    // Every request that is 8 to 19 decimal digits is answered by `answer`;
    // everything else is an invalid request.
    let card = declaration(&model, "isCardNumber");
    assert!(
        card.contains(
            "((7 <? (Foundation.Bytes::byteLength value)) && (((Foundation.Bytes::byteLength value) <? 20) && (isDigits value 0 (Foundation.Bytes::byteLength value))))"
        ),
        "a card number is 8 to 19 decimal digits:\n{card}"
    );
    let dispatch = declaration(&model, "dispatch");
    assert!(
        dispatch.contains(
            "(if (isCardNumber value) then (answer value) else (prim utf8_encode \"invalid request\" : Bytes))"
        ),
        "every card number must be answered by answer, and nothing else:\n{dispatch}"
    );
}
