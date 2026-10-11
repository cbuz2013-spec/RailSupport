# Rail Social 2.5.1 — stack units and ordered actions

Status: implemented and tested; production deployment pending.

## Changes

- Step 3 has one optional current-stack entry and a Chips / Big blinds selector. It preserves the numeric value when units change. Existing saved unknown/cash units remain explicit until changed.
- Remove the extra hero-stack editor from step 4 and the step-3 conversion panel. Opponent stack fields remain in step 4.
- Published stacks show the selected units. Existing valid chip-to-BB metadata can still show an additional BB equivalent; no missing amount is guessed.
- Preflop and flop/turn/river action sections have Check, Bet, Call, Fold and Raise controls, optional bet/raise-to size, all-in marking, a next-player indicator and Undo.
- Preflop order: UTG, UTG+1 (legacy), MP, LJ, HJ, CO, BTN, SB, BB. Postflop starts SB, then BB and the remaining positions. Missing seats are omitted; unknown/duplicate positions retain the notes option.
- A separate optional Heads-up table checkbox applies the two-handed button/SB-first preflop and BB-first postflop order. Two entered hands alone do not imply a heads-up table.
- Raises reopen action in order; explicit folds/all-ins carry forward. Free-text notes do not imply a fold. Later positional edits are flagged before adding further guided actions.
- All details remain optional; existing notes, photos, saved hands and opponent stacks are retained. Action records use the existing hand JSON, with no database migration.

## Validation

- 88 automated tests passed, including isolated PostgreSQL-compatible save/edit with photos, stack units and action records, turn order, raises, calls, folded players, all-ins, heads-up, Undo, optional fields, permissions and existing equity behavior.
- TypeScript and optimized Next.js production build passed. The final guard for changed earlier-street positions is covered by a targeted rerun and the cloud production build.
- React review: semantic labelled controls, explicit button types, fieldset disabled state, derived turn state and no new network requests in the action editor.
- Browser verification was blocked by browser security/automatic approval review. No new interactive screenshot or physical-device validation is claimed.

This is a hand-history recorder, not a complete poker betting/rules engine: it does not adjudicate minimum/full-raise reopening rights, side pots or infer stack changes. Unknown action sizes can remain blank.

## Deployment

Pending. Previous application release: `141d949` / `dpl_AoGreewpE5W8u3S9SVEHRrEz1y7z`.
