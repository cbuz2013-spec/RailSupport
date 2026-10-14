# Rail Social 2.4 - production release

Deployed and verified October 11, 2026, at approximately 7:09 AM America/New_York.

- Live site: https://railsupport.vercel.app
- Repository: cbuz2013-spec/RailSupport, branch `codex/rail-social-v2.1`.
- Deployed source: `d63baab9b4d5a28e3edf38e479fa515ba78d9e21`.
- Vercel project: `railsupport`, team `rage-factory1`.
- Deployment: `dpl_881P5zF511gtiFrUh3n9iJPza6Xj`.
- Deployment URL: https://railsupport-hvz2jt75h-rage-factory1.vercel.app

## Delivered

- Heart, custom hooded Nice hand player, donkey, fish and shark reactions. Add, change or remove one reaction per member; counts and accessible labels are included. Existing likes became hearts. Reactions do not subscribe to a rail or grant membership.
- Separate Follow rail control preserves existing watches and notification behavior. Reaction, Follow, Comments and Reply use the same button design across rail, room and Table Talk posts; comment reactions and replies use that design too.
- Existing six-screen hand review now includes optional total players, numeric big blind and explicit stack/blind units. BB conversions require compatible units and a valid positive big blind. All individual fields remain optional.
- Event/cash information stays above four horizontally scrollable street frames. Each shows the known board, hands, positions, stacks, action and equity. Tabs, arrows, keyboard navigation, scroll snapping and a numbered swipe hint expose navigation.
- Each street calculates with only its own 0/3/4/5 board cards. Preflop uses 24,000 estimated samples; complete flop/turn/river boards use exact enumeration. Tied pots are shared correctly, with up to four opponents.
- Green-and-white light mode and dark green felt mode are available at the top of all pages, including authentication and recovery. The preference persists through navigation and reloads; the initial theme is set before painting.
- Retained full 52-card selector, image fields and existing photos, author edit/delete permissions, saved posts, hidden results, accounts and memberships. New calculator shares retain structured opponent details for street displays.

## Validation

- Full automated suite: **70 tests passed**. Coverage includes reaction migration/reruns, permissions and blocking, comment reactions, notification deduplication, preserved watches, optional and legacy hands, BB conversion, street board isolation, stale results, multiway equity and tied pots.
- After final adjustments, 13 hand-review/sharing/street tests passed; the four street tests passed again after tightening ambiguous-number validation.
- Final local production build passed compilation, TypeScript and page generation. Vercel independently built the committed revision successfully.
- Disposable PGlite browser environment: changed and removed a reaction, reloaded its saved state, verified Follow remained unchanged, edited an existing hand through all six screens, saved per-street snapshots and total players, and confirmed both after reload.
- Browser calculations showed AA versus KK at approximately 83% preflop, 91.2% on the flop, 13.6% on the turn and 0% on the river for the seeded board. Earlier frames did not use later community cards.
- Tested desktop, 390px and 320px layouts. Fixed dark action-button contrast and narrow-screen composer overflow; 320px page width and scroll width both measured 305px excluding the scrollbar. The four main action buttons all measured 46px high.
- Verified theme persistence, keyboard street arrows, rooms/People navigation, recovery-page styling, the full deck and optional fields. No browser console errors were observed.
- Protected deployment returned HTTP 200 and the exact deployment ID before promotion. After promotion, the public domain returned HTTP 200 with the same ID.
- Signed-in production showed V2.4, the new reaction picker, preserved historical hearts, street frames, unknown values for incomplete legacy hands, new optional fields and 52 available cards in a new draft. Existing photo loading was verified. No sample posts or reactions were submitted to production rails.
- Runtime error-level output contained the existing PostgreSQL SSL-mode deprecation warning, not an application exception. A separate 5xx request-log check found no failed server requests during verification.

## Migration and rollback

`scripts/reactions-2.4.sql` adds a default-heart reaction column to four existing like tables and creates a new reaction view. Existing like rows and watches are retained; notification triggers are not replayed. The migration is additive and rerunnable, with the same SQL included for fresh database setup.

The guarded migration runner executed inside this project's production Vercel build with `RAILSOCIAL_RUN_REACTION_MIGRATION=true`. It used the existing private database configuration, a transaction, timeouts and schema checks, and reported completion. Ordinary builds leave the migration disabled. Production credentials were not embedded in source or logged.

Rollback target: `dpl_8EcGcmF6jokB79E8q88EseqJP6TU`, https://railsupport-8tnf6h77h-rage-factory1.vercel.app, source `64d00f6b7ab2bf49d2ef63db2997586406026d20`. The prior application remains compatible with the additive schema; rolling back does not require dropping data.

## Limits and follow-up

- Unknown hands cannot yield equity. Old records without explicit stack units keep their original stack and show BB unknown; no guessed conversions. Legacy calculator summaries stored only in body text are retained there rather than inferred into opponent records.
- Equity compares known hands at showdown; ranges, side pots and inferred folds or stack changes are not modeled. Preflop estimates can vary slightly when recalculated.
- The browser file chooser stalled during a new attachment test in this run. It is not recorded as a passing upload test. Existing production images loaded, and optional-image/save validation passed; the unchanged photo pipeline had been browser-tested in the previous release. Physical-device photo/orientation/retry checks remain on the broader roadmap.
- Automatic approval review rejected a local test using simulated production flags. That test was abandoned; the guard stayed intact and the migration was verified in the authorized Vercel production build instead.

## Local screenshots

- `tmp/browser/rail-social-24-live-reactions.png`: verified production reactions and dark felt.
- `tmp/browser/rail-social-24-mobile-dark.png`: disposable test hand on mobile, river frame.
- `tmp/browser/rail-social-24-reactions-light.png`: disposable test rail, uniform light-mode actions.

The screenshots are local verification artifacts, not production sample content.
