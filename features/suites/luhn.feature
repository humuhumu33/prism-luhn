Feature: luhn

  The Prism application in app/: given a card number as 8 to 19 decimal
  digits, it answers "valid" or "invalid" by the Luhn check, and
  "invalid request" for anything that is not a card number.

  @LU-01 @build
  Scenario: The app answers valid exactly when the Luhn checksum of the digits is divisible by 10
    Given the card-number model in app/src/CardNumber.lex.tex and its rule in app/src/LuhnRule.lex.tex
    When the Lean kernel checks isLuhn_decides during prismpm verify
    Then isLuhn is true exactly when the checksum, taken from the right with every second digit doubled and reduced by 9 above 9, is divisible by 10
    And the answer the application returns is decided by that same isLuhn
