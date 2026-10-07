# Rail Social 2.2 — community beta

Deployed October 7, 2026 to https://railsupport.vercel.app.

Application commit: `5184d4d3c977f56a89bb48fdebb5063c3d359d70`.
Vercel deployment: `dpl_9dH2CpmMNHVzU3NeiqrgSZZ5fNXb` — READY / PROMOTED.
Canonical domain mapping was verified directly against this deployment.

## Included

- People directory: display-name search, profile links, following, followers, mutual friends, and pending invitation count.
- Private rail invitations survive account creation/sign-in and open the rail after explicit acceptance. Invite codes accept upper- or lowercase hex.
- Member-to-member rail and room invitations in People. Acceptance joins the rail or follows the published room; it never grants host access.
- Room invitation links keep their destination through sign-in and present a Join room confirmation.
- Room followers and hosts can post and comment. Authors remove their own content; hosts moderate the room. Private rails remain separate.
- Room leagues: host-managed seasons and rules, follower self-enrollment, game schedules, status changes, host-entered results and corrections, and points standings.
- Completed games count toward standings. Scheduled/cancelled games do not. Equal points share a rank. Points are entered by hosts according to their published rules.

## Limits and next steps

- Password-reset email delivery remains pending domain selection/registration, sender verification, and email integration. This release does not enable password reset or claim emails are being sent.
- Ads, sponsors, subscriptions, paid campaigns, push notifications, and marketing-plan changes are not activated.
- Leagues organize schedules and results; there is no poker game engine, wagering, payout processing, or GG account integration.
- Room pages remain visible to signed-in members. Room conversations are not private rails. Following does not send email or push notifications.
- In-app invitations expire after 30 days; the recipient explicitly accepts. Existing membership, blocking, removed senders, unpublished rooms, and expired invitations are checked on the server.

## Verification

- 31 automated tests pass, including member-search privacy, blocks, invite authorization and recipient consent, room posts/comments, moderation, pagination, and league results.
- TypeScript checking covers the application and automated tests.
- Local HTTP acceptance tests pass using synthetic accounts and an isolated database: authentication, origin validation, body limits, rail/room invites, follows, posting, comments, leagues, standings, and existing room host controls.
- Headless Edge checks passed for new-account rail invitation handoff, existing-account room invitation handoff, mobile room posting/comments, member search/following, and host league/game creation. Screenshots were captured locally; no browser runtime exceptions occurred.
- Additive migration successfully applied twice to a Neon test branch, then once to production. The existing two accounts, two rails, five rail posts, and one room were preserved. A separate production recovery branch was created before release.
- Vercel production compilation and TypeScript passed. The canonical homepage and eight JavaScript assets returned 200; the bundle includes version 2.2 and People. Signed-out community, league, room and rail APIs returned 401, and the session endpoint returned null. No real member account was impersonated for verification.

## Database rollout

Apply `scripts/community-2.2.sql` to the intended database. It creates seven new tables and seven indexes without modifying existing user, rail, post, or room rows. The full setup schema includes this migration for new installations.

Production rollback can promote the previous application deployment while leaving additive tables intact. Do not delete community data during rollback.

Recovery branch: `br-old-bird-b5zdyqrs` (no compute). Migration-check branch: `br-green-smoke-b5ru8ec9`. Previous production deployment: `dpl_4E3XLh36iD6n5YjUxpfjWmNfmmH2`. The Git branch remains unmerged.
