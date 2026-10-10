# Multi-opponent equity calculator — October 9, 2026

Status: implemented and verified locally; awaiting deployment. The live site still has the previously released two-player calculator.

## Behavior

- Compare your hand with one to four opponents, for up to five players total.
- Tap a seat on the poker table to select its two cards with the existing suit-first picker and optionally select its position. Positions label the hand; they do not change card equity.
- Seats run clockwise in position order: small blind, big blind, UTG, MP, low jack, high jack, cutoff, button. Your seat stays at the bottom; all player identities, cards and results move together. The position menu uses the same order. Unspecified seats retain a stable order; older UTG+1 hand discussions remain supported between UTG and MP.
- Tap the center to choose the shared board. Leave it empty preflop, or select three, four or five cards.
- Cards already used by another player or the board cannot be selected again. Removed players release their cards. Any change clears the previous results.
- Results appear on the seats and in a hands/positions/equities table. Equity includes the correct fraction of every split pot, including ties among only some players.
- Flop, turn and river results enumerate all possible remaining boards. Preflop uses 24,000 sampled runouts with progress and cancellation. Displayed percentages are rounded.
- All active hands need two cards to calculate known-hand equity. Positions remain optional. Ranges and side pots are outside this change.

## Validation

- Eleven automated odds tests pass. They cover exact counts, two- through five-way split pots, sole/partial winners, duplicate and incomplete hands, player limits and cancellation.
- The direct seven-card evaluator agrees with the existing five-card enumeration evaluator on eight targeted edge cases and 320 seeded deals spanning two to five players.
- Clockwise seating verified for 784 position/hero arrangements spanning two to five players. Rendering checks confirm that repositioned seats retain their original hand/equity association and the position menu follows SB, BB, UTG, MP, LJ, HJ, CO, BTN. The corrected five-player table was visually checked in the local component preview.
- The initial multi-opponent implementation passed the full production build and TypeScript checks. After the clockwise-position correction, production compilation and a focused TypeScript check of the changed calculator components passed. The full-project type check was stopped after an extended run without a result; complete a clean release build before deployment. Temporary preview files are now excluded from project type checking.
- Disposable local browser preview: add four opponents, choose cards/positions, leave a position blank, calculate all five equities and show all five result rows.
- Shared-card prevention, stale-result clearing, remove/re-add behavior and the four-opponent limit verified through the UI.
- Five-player flop example reports exactly 741 runouts. Preflop reports 24,000 sampled runouts.
- Five-seat layout inspected at 390 and 320 pixels. No seat overlaps or horizontal modal overflow at 320 pixels. No browser console errors observed during the calculation flow.

No production data or database schema is changed by this feature. The calculation runs locally in the browser.
