# Rail Social 2.5.2 — one entry screen per street

Status: implementation and local production build complete; production deployment pending.

## Changes

Hand review now has nine optional screens:

1. Tournament or Cash Game.
2. Event/game information.
3. Current situation, including one hero stack with Chips / Big blinds selection.
4. Preflop: your hand and position, opponent hands/positions/stacks, and preflop action together.
5. Flop: up to three flop cards and flop action.
6. Turn: the turn card and turn action, with the earlier board visible.
7. River: the river card and river action, with the earlier board visible.
8. Context, notes, question, images and hidden result.
9. Review the street frames and publish.

All details remain optional. Back preserves entries; sharing is available only on the final screen. Both private-rail posting/editing and calculator-to-review sharing use the same sequence. The full deck and existing ordered action controls remain.

Separate optional board metadata preserves a known turn/river even when an earlier street is skipped or cleared. Published frames show unknown slots in their proper places, and no later-street equity is invented without the required board. Legacy saved boards still load. Duplicate-card validation covers all streets and players. Changes clear stale equity snapshots.

The calculator uses a contiguous board; when importing an incomplete review it explains missing earlier cards and retains separate later cards on return unless the calculator board is changed. No database migration is required: the additive metadata uses existing hand JSON.

## Verification

- Focused tests: 44 passed, including save/edit against isolated PostgreSQL-compatible storage with photos, actions, stack units and hidden results.
- TypeScript and optimized Next.js production build passed.
- Static component render checks passed for all four combined street screens, the retained step-3 stack entry, optional navigation and final review/submit placement. These are not interactive browser checks.
- React review: controlled inputs, labelled card/action controls, keyed street editors, disabled fieldsets during submission, derived board state and shared final-step guards.
- Full automated suite: 94 passed, 0 failed. No sample posts were created in production. Deployment evidence will be recorded after promotion.
- Interactive browser verification remains unavailable: automatic approval review previously blocked local preview access. No new browser screenshots or physical-device verification are claimed.

## Deployment

Target: existing railsupport project, rage-factory1 team, https://railsupport.vercel.app.
Previous release: 2.5.1, code `678ca21`, deployment `dpl_2N19ff4UUB4E5sa6CiwyuWh3jEpL`.
