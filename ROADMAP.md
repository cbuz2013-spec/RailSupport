# Rail Social — current build roadmap

Updated **October 11, 2026**. **Current deployed release: 2.4, with poker reactions, separate Follow rail controls, uniform action buttons, BB-aware hand reviews, street equity frames and light/dark felt themes.** This is the build-only roadmap; marketing and participation goals remain separate.

The detailed [feature checklist](docs/rail-social-build-checklist-2026-10-08.md) and [task data](docs/rail-social-build-checklist-2026-10-08-data.json) are synchronized. They retain all **51 feature tasks and 6 external milestones**. Checked means delivered and verified within the stated scope. Partial work is listed explicitly instead of checking off an unfinished stage.

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
- [x] **Quick stack updates and photo placement** — Chips, current big blind and players left are first; photos follow, then other details.
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

## Next version under discussion — October 11

Planning only. The [next-version plan](docs/next-version-plan-2026-10-11.md) records the screen order and confirmed decisions; current production remains 2.4.

**Implementation and deployment are on hold while the user adds further requirements.**

- [ ] **My Rails navigation** — Replace My Rail and Groups in the bottom menu with one My Rails destination, preserving access to groups and game sessions.
- [ ] **Phone home-screen logo** — Use the Rail Social logo instead of the single R for installed web-app and iPhone home-screen icons.
- [ ] **So sick reaction** — Sick face with a speech bubble reading So sick; retain the existing poker reactions.
- [ ] **Follow this post wording** — Rename the post control and preserve existing subscriptions.
- [ ] **See who reacted** — Open reaction summaries to see people and their chosen reactions, respecting content access and blocking.
- [ ] **Game-session setup** — Tournament/Cash Game inside a private group, with the relevant optional event/location/buy-in/stack details. Private-group creation remains separate.
- [ ] **Skippable hand-review screens** — Separate event details, current situation, players, board, each street's action, and context/notes.
- [ ] **Calculator to hand review** — Share hand opens the hand-review wizard at Tournament/Cash Game and imports cards, positions, board and compatible details for optional completion before publishing.
- [ ] **Poker-table street frames** — Player cards, positions, stacks and equities around a table, with event information in the center and action below.
- [ ] **Street reactions** — Independent reactions and counts for each street's action section, separate from the overall post.

## Deployed, with verification or feature work remaining

- [ ] **Browser push:** opt-in, delivery queue, retries and expired-device cleanup are deployed. Verify receipt on physical phones; permission is required per device. Native app push is a later task.
- [ ] **Email delivery:** domain verification and provider test acceptance passed. Confirm a real user receives the reset message.
- [ ] **Photo management:** rail-post photos support compression and editing (up to three). Finish physical-device orientation, format and retry checks.
- [ ] **Preferences and reminders:** post/session watches and device push on/off exist. Per-room/category controls and schedule-aware reminders remain.
- [ ] **Rail/room/league management:** the foundation works; member removal/ownership transfer, invitation history/revocation, pinned announcements and league correction history remain.

## Next actions, in order

1. **By Oct 10:** verify real reset-email receipt and push receipt on physical phones; record the evidence.
2. **By Oct 11:** implement email ownership verification and safe resend/change-address handling.
3. **By Oct 12:** complete account/session settings and deletion; decide the native app approach and start publisher/provider setup.
4. **Oct 13–16:** add reporting/moderation/support controls and prove backup restoration.
5. Continue the remaining social/room controls, event tools, mobile apps and monetization in the sequence below.

## Build order and aggressive completion goals

All goals are end of day **America/New_York, 2026**. Dates are stretch targets retained from the October 8 plan; they are not automatic work schedules or delivery guarantees.

| Order | Stage | Current position | Complete-by goal |
| --- | --- | --- | --- |
| 1 | Accounts and recovery | Reset complete; delivery check, verification, settings and deletion remain | Oct 12 |
| 2 | Safety, permissions and support | Current permissions/blocking implemented; moderation, support and restore testing remain | Oct 16 |
| 3 | Social, room and league controls | Core community live; administration and device/accessibility finish remain | Oct 22 |
| 4 | Notifications and destination links | Inbox complete; web push deployed; phone verification, preferences and reminder work remain | Oct 28 |
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

- [Current detailed checklist](docs/rail-social-build-checklist-2026-10-08.md).
- [2.3 implementation and release evidence](docs/rail-social-2.3-validation.md): 48 automated tests, isolated API/browser checks, builds and live checks. The later timestamp update passed build/browser checks and exact-deployment verification in its release task.
- [Password-recovery evidence](PASSWORD-RECOVERY-2026-10-09.md).
- [Earlier 2.2 foundation](COMMUNITY-2.2.md).

The original [October 8 graphical plan](docs/rail-social-build-roadmap-2026-10-08.png) and [PDF](output/pdf/rail-social-build-checklist-2026-10-08.pdf) are historical and do not contain the latest checkoffs. Use this roadmap and the detailed checklist for current status.
