# Rail Social 2.5.7 — hand-review entry repair

Deployed October 11, 2026 to https://railsupport.vercel.app.

## Root cause and repair

The street-entry CardPicker and HandActionEditor siblings both used the street name as their React key. On updates, React warned about duplicate keys and left duplicated card pickers in the DOM. This reproduced the reported multiplying flop fields: interaction tests found two, five and six picker instances where only one should exist. Stale duplicated controls could update an older hand draft.

Each component now has a distinct key per street: board-cards-[street] and board-actions-[street]. This preserves each control's identity during card/action changes and remounts it correctly when moving between streets. The existing three-card flop and single-card turn/river limits remain in place. Betting-order rules did not need a rewrite; second/third turns after raises and re-raises are verified through the real editor event handlers.

## Validation

Three new React DOM + JSDOM interaction tests failed on the previous code and pass with the fix:

1. Pick, replace and remove flop cards; prevent a fourth flop card; retain exactly one picker/editor; enter one turn and one river; navigate back/forth repeatedly; preserve board cards and pass save validation.
2. Postflop check, bet 4 BB, raise to 12 BB, re-raise to 30 BB, call; verify the correct returning actor, Undo/call again, and retain all five actions while entering flop cards afterward.
3. Preflop raise to 3 BB, re-raise to 10 BB, re-raise to 25 BB and call; advance to flop and return without mixing cards or street histories.

All 49 selected tests passed: 18 card/board/action/component tests, plus 31 existing persistence, sharing, hand-review and equity tests. Database integration tests use isolated PGlite data, including photo retention and saved action/board histories. Test-only jsdom dependencies were added; no new browser or production runtime dependency is imported into the app.

Local production build and TypeScript passed. Cloud production build passed (Vercel reports 26 seconds). Staged and canonical public homepages returned HTTP 200. Live inspection resolves to the exact READY deployment below; published JavaScript contains V2.5.7 and both distinct component-key prefixes. The immediate error-level log scan returned no entries; drains and ongoing monitoring were not audited.

The component tests execute events and React reconciliation in an in-memory DOM. They are not a real browser layout test, phone test or authenticated live posting session. The prior browser-preview automatic approval block was not bypassed; no new screenshot or physical-device completion is claimed.

## Deployment

- Code: `7cf5dfae6859d3ec89e35872ee9c5b5e441154d4`.
- Branch: `codex/rail-social-v2.1`, repository `cbuz2013-spec/RailSupport`.
- Target: `rage-factory1/railsupport`, production.
- Deployment: `dpl_B3Fo3CnYL9fJbXyEe2SUgUoAPrdj`.
- Immutable URL: https://railsupport-jxw2tctkg-rage-factory1.vercel.app.
- Previous production: 2.5.6 / `dpl_QPeZrZEhgZQ3nhtNaAe4KuionHya`.

No database migration, saved-post change or environment change. The seven-plus-six suit layout and prior feed-crash repair are retained.
