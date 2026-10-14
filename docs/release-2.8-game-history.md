# Rail Social 2.8 — game graphic, chip history, clock photos and Delete Rail

Build and live deployment explicitly authorized October 13, 2026 at 4:25 PM EDT. Version 2.8.0 is live and verified as of October 13, 2026 at 4:56 PM EDT.

## Included

- Manage Rail is available in the main rail heading on phones and desktop. Only the current owner sees Delete Rail and can delete through the API. Confirmation names the rail, explains permanent removal for all members, and requires typing its name; Keep rail cancels.
- Deleting the selected rail removes its posts, photos, comments, sessions, chip histories, clock photos, memberships, chat, invitations, subscriptions and related notifications. Accounts and other rails remain. Separate tournament rails survive deletion of their parent rail. The app returns to My Rails.
- Each tournament or cash session has one current graphic in its latest visible statistics post: current stack, current big blind, players left, total players started, paid places, playing status, tournament stage, chip-history graph and optional photo. Older posts retain their historical numbers in a collapsible section.
- Update Stack includes paid places as an optional fifth count. Current controls remain near the top of the card. Selecting a historical graph point does not replace the latest summary values.
- The graph uses chips and time, supports tapping points and keyboard-accessible previous/next/slider controls, displays recorded update details, and loads earlier pages of history. It has empty and single-update states. Histories survive finishing a game.
- Database snapshots capture changes across posts in the same session, including status and player counts. Repeated identical saves do not add duplicate points; cleared values and zero remain distinct. Editing an older post preserves newer unrelated game values.
- Existing sessions start from their latest saved update, clearly labeled as the first recorded value. Overwritten prior values cannot be recovered. Legacy standalone posts without an identified game retain their saved statistics.
- The optional clock/game photo is inside the graphic. The player can take, choose, replace or remove it. Members can enlarge it. Images use the existing resizing/validation rules and permission-checked, uncached delivery; blocked/nonmembers cannot read them and other members cannot change them.
- Automatic information extraction from photos remains a future feature, as requested.

## Verification

- Production build and TypeScript checks passed. A Windows read-only flag on generated Next.js cache files initially blocked cleanup; clearing only the generated cache resolved it.

- Full regression suite: 135/135 passed, including 11 new database/history/deletion tests and 4 new React interaction tests.
- Final focused React run: 4/4 passed after placing update controls ahead of the graph and photo.
- Local HTTP flow passed with disposable accounts: tournament and cash histories, paid places, finished history, photo upload/read, block enforcement, denied member deletion, required confirmation, owner deletion, and preservation of other rails and a separate child tournament.
- An initial HTTP run encountered a temporary socket reset in the local PGlite server; the complete repeat passed after the concurrent regression suite finished. Production data was not used for these tests.
- Migration ran twice on the existing Neon test branch `br-broad-hall-b58evunh`, within a transaction rolled back after validation. Existing post and membership counts were unchanged.
- Browser automation could not attach to its webview, so authenticated visual/physical-phone verification is not claimed. React interaction, API and database checks passed. Camera hardware and photo readability should receive user testing.

## Release controls

- Project: `rage-factory1/railsupport`, ID `prj_POLb696w4WfafDxAMwYMaoSEwE5x`.
- Canonical URL: https://railsupport.vercel.app.
- Production database: `green-wildflower-50878852`, branch `br-empty-star-b5bgyjru`, direct endpoint `ep-jolly-silence-b5j4rbqz.c-7.us-east-2.aws.neon.tech`.
- Migration creates two additive tables, a statistics projection function and an update trigger, and seeds known values. It does not delete or rewrite existing posts, groups, memberships or sessions.
- A one-off build flag, verified application URL and exact database host are required to migrate. Ordinary builds do not migrate.
- Production baseline at 4:45 PM EDT: 36 posts, 14 memberships, 7 groups and 4 sessions. No real rail is deleted as part of release verification.
- Prior production: version 2.7, deployment `dpl_JFh1hotPtx8pQ9EYLfJ4J8ntxgKs`. The additive schema is compatible with it.
- A clean tracked-file export is staged with the existing production environment, verified, then promoted.

## Publication

- Release commit: `627305d`, pushed to `codex/rail-social-v2.1`.
- Exact deployment: `dpl_F6Fy9YUMSnNsdC8K9Qy38SjaJDQ2` (READY).
- Immutable URL: https://railsupport-39eotvlu9-rage-factory1.vercel.app.
- Staged using a clean tracked-file export, then promoted to https://railsupport.vercel.app on October 13, 2026 at 4:55 PM EDT. Canonical verification passed at 4:56 PM EDT.
- Staged and canonical checks confirmed the exact deployment, version, all 10 JavaScript bundles and the expected feature strings. History, photo, management, games, activity, rail and chat APIs returned 401 without sign-in; an invalid invitation returned 404.
- Production migration completed and verified. Read-only checks found 36 posts, 14 memberships, 7 groups and 4 sessions, unchanged from the pre-release baseline; 4 truthful baseline history snapshots and the capture trigger were created. No real rail or account was deleted.
- Post-publication Vercel log query returned no HTTP 5xx entries for the new deployment.
- Local temporary test-branch credentials were removed after verification. Unrelated marketing and roadmap files were left unchanged.

## User testing

Refresh the app and confirm version 2.8.0. In a tournament or cash game, use Update Stack to save two distinct chip counts and inspect the graph, current numbers and saved-point details. Add/replace/enlarge a clock or game photo. To remove an unwanted test rail you own, open Manage Rail, choose Delete Rail and confirm its exact name. Physical-phone camera and visual checks remain user testing; browser automation could not attach during this release.
