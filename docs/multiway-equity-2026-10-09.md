# Multi-opponent equity calculator — October 9, 2026

Status: deployed and verified on October 9, 2026 at https://railsupport.vercel.app.

## Production release

- Release commit: `0579017735fe98203a2448f8ee2ee70cdd39f0b5` on `codex/rail-social-v2.1`.
- Deployment: `dpl_ffTLB8wYNY8FcJpiFjNRfCaa5p2w` — https://railsupport-69r1tjuid-rage-factory1.vercel.app.
- Clean tracked-source release built successfully on Vercel, including full TypeScript and page generation. Build output completed in 10 seconds; deployment reached READY before promotion.
- Promoted the tested production build. Vercel confirmed the main `railsupport.vercel.app` alias resolves to this deployment and exact commit.
- Signed-in live browser verification: added four opponents; selected cards and positions; confirmed the requested dropdown order, duplicate-card prevention and disabled fifth-opponent action; completed a five-player, 24,000-runout estimate; verified every hand/equity row and clockwise table placement. No browser console errors observed.
- Runtime log scan returned six dependency warnings (Postgres SSL-mode compatibility and Node `url.parse` deprecation), not calculator exceptions. Keep these as maintenance follow-ups; do not describe the runtime scan as warning-free.
- Rollback reference: previous live deployment `dpl_3xsWsvU1GRztYFL59mgqURPFYd5r`, commit `bb35edc4f247cb486da15e16c1eccebc36c116af`.

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
- The initial implementation passed the full production build and TypeScript checks. Following the clockwise-position correction, the final clean Vercel release build passed full TypeScript, compilation and page generation. This resolves the earlier interrupted full-project check in the OneDrive working folder. Temporary preview files are excluded from project type checking.
- Disposable local browser preview: add four opponents, choose cards/positions, leave a position blank, calculate all five equities and show all five result rows.
- Shared-card prevention, stale-result clearing, remove/re-add behavior and the four-opponent limit verified through the UI.
- Five-player flop example reports exactly 741 runouts. Preflop reports 24,000 sampled runouts.
- Five-seat layout inspected at 390 and 320 pixels. No seat overlaps or horizontal modal overflow at 320 pixels. No browser console errors observed during the calculation flow.

No production data or database schema is changed by this feature. The calculation runs locally in the browser.
