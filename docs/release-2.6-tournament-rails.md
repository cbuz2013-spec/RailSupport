# Rail Social 2.6 — simple posts and tournament rails

Deployed October 13, 2026 at 3:09 PM EDT to https://railsupport.vercel.app. Implementation and production deployment were explicitly authorized.

## Included

- New Post contains text and optional pictures. Tournament Update and Discuss a Hand remain separate.
- New Game offers Start Tournament and Start Cash Game. Tournament setup has optional event information, buy-in, starting stack, location and guarantee, plus optional current counts and playing status.
- Start Tournament creates a separate private tournament rail and session, then opens invitations. Invitees do not gain access to the originating private rail.
- Tournament updates put text first, photos second, four optional counts next, and status last. Players left/started display together. The old game/rail selectors and event-name fields are removed from this update form.
- Update Stack edits exactly four counts. Separate stage and status buttons preserve the other fields; Busted supports optional winnings. Counts can be cleared and zero is retained.
- Only the tournament player publishes feed updates. Members can comment and use a separate live chat. The server and database enforce player-only publishing; chat checks membership and blocks on every refresh.
- Desktop chat uses the right column. The mobile chat button opens a separate panel; hidden tabs and inactive responsive chat panels close their stream. Buttons have at least 48px targets.
- Invite links/codes survive signup and signin. Tournament joins create reciprocal player follows and a tournament watch atomically, without duplicate follows or memberships. In-app invitation acceptance also follows the accepted invitee from the inviting account.
- Existing full 52-card selection, duplicate-card exclusion, and equity sharing to private rails, followed rooms and Table Talk are retained.

## Verification

- Full regression suite: 109/109 passed, including the new database and React form tests.
- Final focused form run: 5/5 passed, including an additional regression for starting a cash game from a tournament rail (110 distinct tests in total).
- Local production build and TypeScript passed after the final application changes.
- Isolated local HTTP integration: signup, invite preview/join, mutual follows, tournament watch, private parent isolation, player-only posts, basic text post, live SSE chat delivery and unauthenticated rejection passed. All accounts and messages were disposable local test data.
- Additive migration executed twice on existing Neon migration-test branch `br-broad-hall-b58evunh`, within a transaction rolled back after validation. Existing post/member counts were unchanged. Branch capacity prevented creating another test branch; no branch was deleted or reset.
- Browser loaded the local signup screen, but the browser automation service timed out on input actions. React DOM interaction tests and HTTP/data/stream checks completed instead. No physical-phone or authenticated visual-browser test is claimed.

## Release controls

- Project: `rage-factory1/railsupport` / `prj_POLb696w4WfafDxAMwYMaoSEwE5x`.
- Production domain: https://railsupport.vercel.app.
- Production database: `green-wildflower-50878852`, branch `br-empty-star-b5bgyjru`.
- Expected direct endpoint: `ep-jolly-silence-b5j4rbqz.c-7.us-east-2.aws.neon.tech`.
- Migration adds tournament markers, the chat table, and membership/author triggers. It does not rewrite saved posts or memberships.
- One-off build flags enable migration only for the verified production URL and exact database endpoint. Normal builds do not migrate.
- A clean tracked-file export is staged with production environment variables, then promoted after READY. No local environment files, test fixtures, unrelated output or credentials are included.
- Prior production: `dpl_B3Fo3CnYL9fJbXyEe2SUgUoAPrdj`, version 2.5.7. The additive schema is compatible with that release if an application rollback becomes necessary.

## Published release

- Code commit: `5f886c5bb0d10ac58066ae559cc4342ba33d3221`.
- Deployment: `dpl_AYusdLG74KDSqbwj6smpMxHtKLbJ`, READY and promoted.
- Immutable URL: https://railsupport-e6y4704q2-rage-factory1.vercel.app.
- Cloud build completed successfully; the additive migration completed and verified against the expected production endpoint.
- Existing production counts remained 35 posts, 13 memberships and 6 groups after migration. Both tournament columns, both enforcement triggers and the chat table were present.
- Authenticated staged check and unauthenticated canonical-domain check passed: HTTP 200; exact deployment ID in HTML; all 10 linked JavaScript bundles retrieved; version 2.6, New Game, Start Tournament, player counts, stages and chat code present.
- Both rail and chat endpoints returned the expected 401 without an app session. A nonexistent invite returned 404, exercising the new invite-query schema.
- No production posts, chat messages, invitations, follows or accounts were created by verification.
- The immutable deployment remains protected by Vercel authentication. The canonical production domain is publicly reachable.


The immediate error-level log scan showed four PostgreSQL driver warnings about SSL-mode semantics in a future major version. The checked requests returned their expected 401/404 responses; no application exception appeared in that scan. Current dependencies retain certificate verification.
