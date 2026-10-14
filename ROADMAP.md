# Rail Social — current build roadmap

Updated **October 14, 2026**. **Current deployed release: 2.9.2 — adds a delayed notification test for the current device, with delivery results. Retains compact mobile header, readable inputs, Villain labels, five poker reactions and a fixed poker-stage background; game history/photos, owner-only Delete Rail, tournament notifications, Active Games, dedicated tournament rails, live chat, simple posts, invitations, card selection and equity sharing.** This is the build-only roadmap; marketing and participation goals remain separate.

The detailed [feature checklist](docs/rail-social-build-checklist-2026-10-08.md) and [task data](docs/rail-social-build-checklist-2026-10-08-data.json) are synchronized. They retain all **51 feature tasks and 6 external milestones**. Checked means delivered and verified within the stated scope. Partial work is listed explicitly instead of checking off an unfinished stage.

## Completed October 14 — raised background

Version 2.9.1 raises the poker scene into the visible gap near the top. Published and verified at 1:51 AM EDT. [Release record](docs/release-2.9.1-background.md).

## October 14 — phone/account checks and notification test

Version 2.9.2 is live at 2:52 AM EDT. Notifications includes **Send test notification**, delayed 10 seconds so the user can leave the app. It targets only their current registered device and reports provider results. Twenty-seven tests and local/cloud production builds passed. [Release record](docs/release-2.9.2-notification-test.md).

The user confirmed upright, persistent photos and readable numbers on their iPhone. A new reset email reached the real inbox; its form opened from Gmail using press-and-hold, and the user completed reset/sign-in. At 2:56 AM EDT, they confirmed the delayed test alert appeared on the locked iPhone. Single-tap Gmail behavior remains a usability follow-up. [Verification checklist](docs/device-account-verification-2026-10-14.md).

## Completed October 14 — mobile layout and poker polish

Started October 13, 2026 at 7:44 PM EDT. [Next-build list](docs/next-build-after-2.8-2026-10-13.md). Build and deployment authorized October 14, 2026 at 12:53 AM EDT.

- [x] **Readable input fields** — Increase contrast so entered numbers are easy to see, starting with all five Update Stack fields and other inputs using the same styling. Verified at phone width in the live browser; physical iPhone/Safari checks remain pending.
- [x] **Villain labels in hand histories/reviews** — Use Villain for one opponent, or Villain 1, Villain 2, etc. for multiple opponents, with consistent numbering throughout the hand. Added October 14, 2026 at 12:38 AM EDT.
- [x] **Poker-themed emojis** — Add All In, Muck That, Slow Roll, Chip Shuffling and Tank, with recognizable poker imagery and clear labels at phone sizes. Added October 14, 2026 at 12:48 AM EDT.
- [x] **Fixed poker-stage background** — Use the generated silhouette of a poker table, spectator rail, cheering crowd and stage lights as a stationary background while app content scrolls. Image created October 14, 2026 at 12:50 AM EDT; fixed background integration is live. See the next-build list for the asset and prompt.
- [x] **Compact mobile header** — Put Members, Invite friends and Manage Rail in one row and reduce the space above the feed while preserving readable controls and navigation.

Version 2.9.0 is live and verified at 1:38 AM EDT, with 138 passing tests. [Release record](docs/release-2.9-mobile-polish.md).

## Completed October 13 — game history, photos and rail deletion

Version 2.8.0 is live and verified October 13, 2026 at 4:56 PM EDT, with 135 passing tests. [Requirements](docs/next-update-list-2026-10-13.md) · [Release record](docs/release-2.8-game-history.md).

- [x] **Delete rails you own** — Add an owner-only Delete Rail button with a clear confirmation before permanently removing the selected rail and its contents. Make it easy to access on mobile and desktop.
- [x] **One game-summary graphic** — Combine the chip-history graph, current stack, current big blind, players remaining, total players, paid places (players in the money), status, and an optional photo area in one graphic for each tournament or cash game. Support photos of the live tournament clock. Save timestamped updates, allow tapping a point for details, and preserve history after the game finishes.

**Future idea:** Read visible tournament information from a clock photo to prefill an update, with player review and corrections before saving. Recorded for a later update.

## Completed October 13 — active games and tournament notifications

- [x] **Followed-player tournament alerts** — Notify followers at tournament start and finish, with in-app alerts and push for opted-in devices. Repeated status saves do not duplicate alerts; blocks, unfollows and private-rail permissions are enforced.
- [x] **Active Games navigation** — Add a bottom menu entry and a screen listing active tournament/cash games from followed players, followed rooms and joined rails. Include Players, Rooms and Rails filters; finished games leave the list.
- [x] **Room game status and tournament finish** — Hosts can start/finish room league games. Players can choose Finished or Busted to end a tournament, with optional winnings.

Version 2.7 is live as of 3:38 PM EDT. Verification and publication: [release record](docs/release-2.7-active-games.md).

## Completed October 13 — tournament rails and simple posting

**Version 2.6 is live.** Release evidence: [deployment record](docs/release-2.6-tournament-rails.md). Full requirements: [next build list](docs/next-build-list-2026-10-13.md).

- [x] **Separate posting actions** — Within a private rail, **New Post** offers only text and pictures. Keep **Tournament Update** and **Discuss a Hand** as separate specialized flows. Retain the game-starting action and rename **Cash Game Rail** to **New Game**, for starting a game within the current private rail.
- [x] **Simpler tournament updates** — Put the written update first, optional image attachment second, then optional chips, current big blind, players left and players started; display counts such as **24 out of 73**. Keep Status. Use the current rail and remove rail-selection/new-rail controls and the bottom event/game/name fields from this update form; keep the separate **New Game** action. Use large, clearly labeled buttons and an easy mobile layout.

- [x] **Quick tournament-post controls** — Keep **Update Stack** limited to chips, current big blind, players left and players started. Add an adjacent stage button showing **Registration**, **Reg Closed**, **In the Money** or **Final Table**, then a **Status** control for **Still Playing** or **Busted**, with optional winnings when busted. Use large, easy-to-tap controls and display remaining/starting players as **24 out of 73**.

- [x] **Start Tournament and live follower chat** — **Start Tournament** offers optional event information, buy-in, starting stack, location and prize guarantee, then automatically creates a dedicated tournament rail and asks whom to invite. Include the stack/blind/stage/status controls. Only the creating player publishes updates and changes tournament information; followers can comment. Add a separate real-time chat, preferably on the right on desktop with an accessible phone layout, for discussion and banter. Support ongoing engagement and future ad-placement opportunities.
- [x] **Invite-code signup and automatic follows** — A tournament invite code brings new users through a simple signup form, automatically joins them to the tournament rail and follows its player and tournament. When they join, the inviting player automatically follows them back. Preserve the invitation through signup/sign-in and support existing users without duplicate accounts, memberships or follows.

## Completed foundation

- [x] Accounts, profiles and private rails.
- [x] Member search, following and mutual friends.
- [x] Private rail and room invitations, recipient consent and sign-in handoffs.
- [x] Posts, photos, comments and blocking.
- [x] Room pages, host controls and follower conversations.
- [x] League seasons, schedules, manual results and standings.
- [x] Forgot-password/reset flow using the verified phabfive.com sender.
- [x] Server-side owner/host/member permissions and private-rail isolation for the current web product.

## Completed October 9 enhancements

- [x] **Green and white interface** — Updated green/white layout is deployed.
- [x] **Easy rail creation and member suggestions** — Create a rail is prominent and opens the searchable invitation list immediately.
- [x] **Invitation notifications** — Invitations appear in Notifications and People before the recipient joins; opted-in devices are queued for push.
- [x] **Join rail subscriptions** — Logo buttons follow a post or tournament/cash session without granting private-group access.
- [x] **Activity notification inbox** — Stack changes, tags, replies, likes, follows and followed-player sessions create permission-checked alerts.
- [x] **Post and comment editing/deletion** — Authors can edit/delete; room hosts may remove content but cannot rewrite another author.
- [x] **Automatic reply tags** — Replies insert a removable @tag; removing the tag suppresses the mention notification.
- [x] **Optional hand-review and update fields** — No individual field is required. Twenty-seven isolated saves verified one-item submissions. Completely empty posts remain blocked.
- [x] **Quick stack updates and photo placement** — Superseded by the October 13 text-first update form and separate four-count stack control.
- [x] **Built-in equity calculator** — The equity calculator replaces the Spot Solver entry; tied hands contribute correctly to equity.
- [x] **Post and comment timestamps** — All five post/comment surfaces show date, year, local time and time zone; edits retain the original posting time.
- [x] **Card selection** — The original suit-first picker was replaced October 11 by the full 52-card image deck in hand reviews and the equity calculator.

## Completed October 11 — card deck and hand-history sharing

- [x] **Full 52-card image selector** — Cards are grouped by suit; cards already used by another player or the board are unavailable.
- [x] **Share calculator hands** — Review the players, positions, board, equity and optional notes, then share to a private rail, followed room or Table Talk.
- [x] **Deployment verified** — Release `60fb2f6` is live; [release and verification record](docs/full-deck-and-equity-sharing-2026-10-11.md).

## Completed October 11 — guided hand reviews

- [x] **Game choice and details** — Tournament or cash game, with the relevant optional blinds, stacks and tournament fields.
- [x] **Cards and opponents** — Full deck, positions and up to four opponents; unknown cards can remain blank.
- [x] **Equity after cards** — Calculate completed known hands or skip; card edits clear old results.
- [x] **Action entry** — Quick notes or separate preflop/flop/turn/river action; both drafts survive switching styles.
- [x] **Review and photos** — Optional context, question, hidden result and up to three attached images with previews/removal.
- [x] **Local verification** — Automated save/edit and validation tests, browser flows and small-screen checks completed. [Implementation record](docs/guided-hand-review-2026-10-11.md).
- [x] **Deploy and verify live** — Release `64d00f6` is live; the exact deployment ID, both game types, full deck, optional screens and image attachment field were verified on production.

## Completed October 9 — multi-opponent equity calculator

Requested, implemented and **deployed October 9**. The live domain was verified against release commit `0579017` after the clean production build passed.

- [x] **You plus 1–4 opponents** — Add or remove seats; each active player has two known hole cards.
- [x] **Optional position for every player** — Small blind, big blind, UTG, MP, low jack, high jack, cutoff or button, with an unspecified option. Seats follow that clockwise order while your seat stays at the bottom.
- [x] **Mobile poker-table view** — Tap a seat to edit; show its cards, position and equity around a green felt table with the shared board in the center.
- [x] **Hands and equities table** — List every player's position, hand and percentage below the calculator.
- [x] **Multiway calculation and split pots** — Divide ties among the actual winners. Enumerate every flop/turn/river runout; label preflop simulations as estimates.
- [x] **Validation and responsive checks** — Block duplicate cards, clear stale results after edits, cap opponents at four and support cancellation. Browser checks cover 320- and 390-pixel layouts.
- [x] **Deploy and verify the live update** — Production READY and promoted; five-player calculations, clockwise seating and hand/equity associations verified on the live site.

Implementation and validation details: [multi-opponent calculator](docs/multiway-equity-2026-10-09.md).

## Completed release 2.4 — October 11

Deployed and verified October 11. [Release record](docs/rail-social-2.4-release-2026-10-11.md) and [completed deployment checklist](docs/next-deployment-list-2026-10-11.md).

- [x] **Poker reactions** — Heart plus a hooded player saying Nice hand, donkey, fish and shark. Replace the Join rail control with reactions and retain a separate Follow rail control for notifications, as confirmed.
- [x] **Uniform action buttons** — Reaction, Follow, Comments and Reply use matching dimensions, shapes, icons, typography and spacing across light/dark themes and mobile layouts.
- [x] **Hand-review presentation** — Event/cash stakes first, stacks in BB, remaining/total players and level, followed by your hand and each opponent's cards, position and equity.
- [x] **Street frames** — Swipe left/right through preflop, flop, turn and river, each with its own equities and obvious tabs/arrows/swipe guidance.
- [x] **Light/dark toggle** — Top of every page; green-and-white light mode and a readable dark green poker-felt theme, with the selection remembered.

## Completed release 2.5.7 — October 11

- [x] **Repair street entry** — Give the card picker and action editor distinct identities on each street, preventing duplicated/stale controls when cards or actions change. Flop remains capped at three cards; turn and river each use one.
- [x] **Interaction and persistence checks** — 49 tests passed, including three new React DOM tests that failed before the fix, repeated raises/calls/Undo, board editing/navigation, and isolated database save/edit with photos. Local/cloud builds and live script checks passed. [Release evidence](docs/release-2.5.7-hand-entry-repair.md).

## Completed release 2.5.6 — October 11

- [x] **Compact card picker** — Each full suit has seven cards on the first row and six on the second, in hand reviews and the equity calculator. Cards fit the available width; selected/unavailable cards retain their existing behavior.
- [x] **Deploy and verify** — Local/cloud builds and TypeScript passed; the READY live deployment serves the seven-column stylesheet. [Release evidence](docs/release-2.5.6-compact-card-picker.md).

## Completed release 2.5.5 — October 11

- [x] **Remove the large creation banner** — Removed from every view, including its unused light/dark styling. The existing New rail button stays in the My Rails page header only.
- [x] **Build and deploy** — Local/cloud production builds and TypeScript passed. Canonical live deployment is READY; public scripts show 2.5.5 and New rail without the banner. [Release evidence](docs/release-2.5.5-remove-rail-banner.md).

## Completed release 2.5.4 — October 11

- [x] **Saved-hand feed crash** — Empty community-card slots now render placeholders safely. Four of seven saved PhabFive hands reproduced the crash before the fix; all seven render successfully afterward. No saved posts or photos were changed.
- [x] **Regression tests and deployment** — 20 focused tests and local/cloud production builds passed. Code `7748083` is live; the canonical domain resolves to the READY deployment and returns HTTP 200. Phone/browser interaction still needs a retest. [Release evidence](docs/release-2.5.4-saved-hand-crash.md).

## Completed release 2.5.3 — October 11

- [x] **Rail creation banner** — Visible only on My Rails and its rail feeds. Dark felt uses a dark green panel/button and readable light text; the light theme is retained.
- [x] **Build and release** — TypeScript, local/cloud production builds and contrast checks passed. Code `ccb05da` is live; interactive browser verification remains unavailable. [Release evidence](docs/release-2.5.3-rail-banner.md).

## Completed release 2.5.2 — October 11

- [x] **One entry screen per street** — Preflop hands and action together, followed by flop cards/action, turn card/action and river card/action. The full optional flow now has nine screens.
- [x] **Optional board gaps** — Skipping or clearing an earlier street preserves later cards in their correct slots. No missing cards or later-street equities are invented.
- [x] **Saved hands and sharing** — Retain step-3 hero stack units, step-4 opponent stacks, photos, hidden results, action controls and calculator imports. Existing hands load without migration.
- [x] **Test and release** — 94 automated tests, static component render checks and local/cloud production builds passed. Code `3dc5ad8` is live; browser interaction remains unverified because automatic approval review blocked the local preview. [Release evidence](docs/release-2.5.2-street-entry.md).

## Completed release 2.5.1 — October 11

- [x] **One hero-stack entry** in step 3 with Chips / Big blinds selection; no duplicate in step 4 or conversion panel. Opponent stacks remain in step 4.
- [x] **Ordered action controls** — Check, Bet, Call, Fold and Raise with optional sizing, all-in marking and Undo. UTG-first preflop and SB-first postflop among entered seats; explicit heads-up option for two-handed order.
- [x] **Saved-hand compatibility** — Preserve existing notes, photos and player details; store optional structured actions in existing hand JSON without a migration.
- [x] **Test and release** — 88 automated tests and local/cloud production builds passed; deployed code `678ca21`. Browser verification was blocked; it is not claimed complete. [Release evidence](docs/release-2.5.1-hand-actions.md).

## Completed release 2.5 — October 11

Built on the existing app and deployed as commit `141d949`. [Release and verification record](docs/release-2.5-2026-10-11.md); [feature specification](docs/next-version-plan-2026-10-11.md). 79 automated tests, TypeScript and local/cloud production builds passed.

- [x] **My Rails** navigation and Rail Social logo assets for home-screen installation.
- [x] **So sick**, **Follow this post**, reaction identity lists and separate street reactions.
- [x] **Tournament/Cash Game setup** inside existing private groups, with optional details and invitation handoff.
- [x] **Ten optional hand-review screens** and calculator-to-review import with editable cards/positions/board.
- [x] **Poker-table street frames** showing hands, positions, stacks, event information and street-specific equities, with action below.
- [x] **Account controls** for verification/resend, email/password changes, sessions and protected deletion; real inbox completion still needs confirmation.
- [x] **Safety and support** reports, moderation/actions, restrictions, basic text screening, request limits and help/privacy pages.
- [x] **Community management** group transfer/removal/leave, invitation withdrawal/resend/history, room transfer/pinning and league time zones/archive/correction history.
- [x] **League rules preserved** — host-entered points and shared ranks.

These checkoffs describe delivered feature scope. Entire stages 1–3 remain partially open for the provider, physical-device and accessibility checks below.

## Deployed, with verification or feature work remaining

- [x] **Browser push on the tested iPhone:** October 14 at 2:56 AM EDT, the user confirmed the delayed test alert appeared outside the app after locking the phone. Other platforms and native app push remain separate checks.
- [x] **Reset-email delivery:** a fresh approved live request reached the real Gmail inbox October 14 at 2:22:54 AM EDT. Provider failure handling also passed. Verification/change-email completion remains separate.
- [x] **Phone password reset/sign-in:** the user confirmed both completed successfully after opening the email link with press-and-hold. Desktop/server checks also pass.
- [ ] **Gmail link usability:** ordinary taps did nothing in Gmail on iPhone; press-and-hold opens the valid link in Safari. Investigate the single-tap behavior separately.
- [ ] **Photo management:** live JPEG/PNG/WebP preview, EXIF rotation, resizing, three-photo limit and retry checks passed. The user confirms upright photos persist after reopening the iPhone Home Screen app and Update Stack numbers are readable. HEIC/camera and separate Safari coverage remain.
- [ ] **Preferences and reminders:** post/session watches and device push on/off exist. Per-room/category controls and schedule-aware reminders remain.
- [ ] **Safety and operations:** advanced image screening and broader abuse/accessibility review remain. Manual snapshot recovery was exercised; automated daily snapshots are not enabled by the provider. See the release record for the finalized restore and data comparison.

## Next actions, in order

1. **Core phone/account checks completed October 14:** real reset-email delivery, reset/sign-in, outside-app iPhone push, and Home Screen photo persistence/orientation/readability passed. Follow-ups remain for Gmail single-tap behavior, verification/change-email settings, and broader Safari/HEIC/accessibility coverage. [Current evidence](docs/device-account-verification-2026-10-14.md).
2. **By Oct 12:** decide the native app approach and start publisher/provider setup.
3. **By Oct 16:** enable an available automatic-backup option, document a strictly isolated restore procedure, and complete the broader abuse review.
4. **By Oct 22:** finish physical-phone photo/icon behavior and the cross-product keyboard/accessibility audit.
5. Continue notifications/preferences/reminders, event tools, mobile apps and monetization in the sequence below.

## Build order and aggressive completion goals

All goals are end of day **America/New_York, 2026**. Dates are stretch targets retained from the October 8 plan; they are not automatic work schedules or delivery guarantees.

| Order | Stage | Current position | Complete-by goal |
| --- | --- | --- | --- |
| 1 | Accounts and recovery | Reset delivery and phone sign-in verified; verification/change-email and remaining sensitive settings need checks | Oct 12 |
| 2 | Safety, permissions and support | Reports/moderation/support live; automatic backups and broader abuse review remain | Oct 16 |
| 3 | Social, room and league controls | Administration deployed; physical-device and accessibility checks remain | Oct 22 |
| 4 | Notifications and destination links | Inbox and tested iPhone push verified; other devices, preferences and reminders remain | Oct 28 |
| 5 | Live tournament tools | Player sessions and stack updates live; event lifecycle, QR join, board, clock and scoring integration remain | Nov 5 |
| 6 | iPhone and Android apps | Native app implementation and signed physical-device builds remain | Nov 13 |
| 7 | Ads and paid room plans | Ad integration, consent, entitlements, billing and sponsor controls remain | Nov 20 |
| 8 | Store-ready release and operations | Final cross-product QA, monitoring, rollback exercise and submission packages remain | Nov 25 |
| 9 | Advanced room product | Live video/replays, analytics, branding and branded-app builds remain | Dec 18 |

Start the mobile/billing feasibility check and provider access now; other stages still have prerequisites even where selected features were delivered early. Continue permission and regression checks with each feature.

## External publication goals

- [ ] **Nov 27:** satisfy required store testing/access and submit eligible iOS/Android packages.
- [ ] **Dec 4:** initial public app releases, subject to store review.
- [ ] **Dec 7:** approved live ad activation.
- [ ] **Dec 23:** full-feature mobile update, subject to review.

Apple/Google publisher setup, testing eligibility and ad/video/billing-provider access are not verified complete. There are no live native store apps or ads recorded in this roadmap. Browser installation/push does not complete the native app milestone.

## Scope and evidence

The finished-product scope remains accounts/recovery, rails, social connections, rooms, leagues, notifications, live tournament tools, native apps, ads/paid plans, video, analytics and branding. Real-money game hosting, deposits, payouts and GG game-engine integration are outside this build. Individual branded listings require their own eligible approval.

- [2.5 release evidence](docs/release-2.5-2026-10-11.md).
- [Current detailed checklist](docs/rail-social-build-checklist-2026-10-08.md).
- [2.3 implementation and release evidence](docs/rail-social-2.3-validation.md): 48 automated tests, isolated API/browser checks, builds and live checks. The later timestamp update passed build/browser checks and exact-deployment verification in its release task.
- [Password-recovery evidence](PASSWORD-RECOVERY-2026-10-09.md).
- [Earlier 2.2 foundation](COMMUNITY-2.2.md).

The original [October 8 graphical plan](docs/rail-social-build-roadmap-2026-10-08.png) and [PDF](output/pdf/rail-social-build-checklist-2026-10-08.pdf) are historical and do not contain the latest checkoffs. Use this roadmap and the detailed checklist for current status.
