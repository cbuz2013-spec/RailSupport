# Rail Social 2.7 — followed games and tournament alerts

Requested October 13, 2026. Implementation and publication are covered by the user's continuing build/deploy authorization. Publication evidence is recorded below after deployment.

## Included

- Following a player creates a notification when they start a tournament and when they mark it Busted or Finished. Alerts appear in the inbox and are queued for devices that have enabled push notifications.
- Each tournament generates at most one start and one finish notification per follower. Repeated saves and status corrections do not generate duplicate finish alerts. Unfollowing or blocking cancels queued delivery.
- The bottom menu includes Active Games while preserving My Rails, Rooms, People, Equity and Profile. Desktop navigation also includes Active Games.
- Active Games lists tournament and cash sessions from followed players and joined rails, plus games marked In Progress in followed rooms. All games, Players, Rooms and Rails filters, refresh, pagination, and periodic updates are included.
- Finished games leave the active list. A finish notification can still open the completed game's summary.
- Room hosts can Start game or Finish game from league schedules. Scheduled games do not appear active merely because their scheduled time has passed.
- Private game cards reveal only the player's identity, game type and active/finished status to followers. Event names, rail names, counts, private posts and chat remain membership-protected. Joining a parent rail does not grant access to a separate tournament rail.
- Status includes Finished with optional winnings, alongside Still Playing and Busted. Previous release features remain in place.

## Verification

- Complete regression suite: 120/120 passed, including lifecycle deduplication, push privacy, block/unfollow behavior, parent/child rail isolation, cash sessions, room host permissions, deterministic pagination and repeatable migrations.
- React DOM interaction verifies the actual six-button bottom navigation, opening Active Games, filtering rooms, and private-card redaction. TypeScript and the local production build passed.
- Isolated local HTTP integration passed: signing in two accounts, following, start/finish notifications, repeated finish, active/finished summaries, private rail rejection, unauthenticated rejection, and host-only room start/finish behavior. Verification accounts and records were local disposable data.
- Additive schema upgrade ran twice on existing Neon test branch `br-broad-hall-b58evunh` in a transaction rolled back afterward. Existing post/member counts were unchanged.
- Automated visual browser interaction was unavailable in the existing session. No physical-device push receipt or authenticated visual-browser check is claimed; push payload generation/delivery rules, React interaction, API and database behavior were verified separately.

## Release controls

- Project: `rage-factory1/railsupport`, ID `prj_POLb696w4WfafDxAMwYMaoSEwE5x`.
- Canonical domain: https://railsupport.vercel.app.
- Production database: `green-wildflower-50878852`, branch `br-empty-star-b5bgyjru`, direct endpoint `ep-jolly-silence-b5j4rbqz.c-7.us-east-2.aws.neon.tech`.
- Migration adds a completion timestamp and completion-event trigger, a restricted game-summary visibility function, and the room In Progress status. It does not update historical sessions, posts, memberships or replay prior events.
- The one-off production build requires the verified application URL and exact database endpoint. Ordinary builds do not migrate.
- Production baseline: 35 posts, 13 memberships, 6 groups, 3 sessions, 20 notifications. Verification does not create production accounts, posts or invitations.
- Prior production is 2.6, deployment `dpl_AYusdLG74KDSqbwj6smpMxHtKLbJ`. The schema preserves its existing features.
- Release is exported from committed tracked files, built with the existing production environment, checked on its immutable URL, and then promoted to the canonical domain.

## Publication

Pending cloud deployment and canonical-domain verification.
