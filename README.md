# Rail Social 2.2 — Buz Trio

Rail Social is the renamed RailSupport poker discussion app. Circle Pilot remains a separate project and is unchanged. Production origin stays `https://railsupport.vercel.app` so existing sessions and the Spot Solver receiver keep working.

## Version 2.2 — Community beta

Deployed October 7, 2026. Adds People search and connections, reliable rail/room invitation handoffs, in-app invitations, follower room posts/comments, and host-managed leagues with schedules, rosters, results and standings. See [Community 2.2 release notes](COMMUNITY-2.2.md) for capabilities, verification, and migration details. Password-reset email delivery remains pending domain and sender setup. Ads and monetization are planned, not activated.

## Version 2.1 — Room Pages

The Room Pages roadmap milestone is complete and deployed as version 2.1 on October 6, 2026. It adds a room directory, room profiles, room follows, host announcements, drafts, and co-host invitations. Creation is restricted to approved hosts. Published room pages are visible to signed-in members; private rails remain invite only.

See the [current roadmap](ROADMAP.md) and [Room Pages release notes](ROOM-PAGES-2.1.md) for status, roles, verification results, and the additive database migration. The production release is live at https://railsupport.vercel.app. League management is delivered in 2.2; tournament-specific live features remain future work.

## Existing version 2.0 features

- Private rails for friends, study partners, and backers; completed-hand discussions, updates, votes, comments, and result reveal.
- Shareable invite links. A recipient signs in or creates an account, then accepts the invite; a raw code also works. Invitations are bearer links—share privately.
- Player profiles with a photo, bio, and optional WSOP, MSPT, Hendon Mob, and Sharkscope links. Follow/unfollow and a Following filter within the current rail. Following never grants membership to a rail.
- Search the members of the current private rail by name, then open their profiles. Member search does not reveal people in other rails.
- Up to three photos per update or completed-hand discussion. The browser resizes each photo; original files are not uploaded. Images are served through an authenticated route that checks rail membership and blocks.
- Block/unblock hides the other player's posts, comments, and member listing in either direction and removes reciprocal follows. It does not delete either person's membership or past data.
- Hand-versus-hand Hold’em showdown odds preflop, flop, turn, and river using the hand-history card notation. Turn and river are exhaustive; preflop and flop are Monte Carlo estimates. This is a review tool, not live-hand assistance.
- Embedded Spot Solver V20.1 hand import remains separate from this odds calculator. The authorized origin is the existing production URL.

## Earlier 2.0 deployment reference

For 2.1, use the migration and review steps in [Room Pages release notes](ROOM-PAGES-2.1.md). The historical steps below are not authorization to deploy.

1. Run `npm ci`, then `npm run typecheck && npm run build` locally. No secrets belong in the repository.
2. Before publishing v2 code, apply the additive `scripts/v2-social.sql` migration to the existing Rail Social Neon database. It now includes `rail_post_images`; rerun it even if an earlier draft of the 2.0 social migration was already applied. The tables are also present in `scripts/schema.sql` for fresh installs.
3. Upload/push all app, lib, public, and scripts changes to the connected `cbuz2013-spec/RailSupport` GitHub repository; Vercel deploys the connected main branch to `railsupport.vercel.app`. Do not create a new Vercel project or change the URL merely to change the brand.
4. Leave the existing Vercel `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `RAILSUPPORT_READY` values intact. `BETTER_AUTH_URL` must remain the exact production origin.
5. Test with two real test accounts: invite recipient signup and join; follow/unfollow; block/unblock; profile photo and links; member search on desktop and phone; photos in posts and hand discussions; confirm a signed-out user and nonmember cannot load post images; calculator on every street; and Spot Solver import. Do not treat a local build alone as production acceptance.

## Boundaries

Accounts use Better Auth and PostgreSQL. Profile photos are resized client-side and stored as small data URLs in the profile table; post images are resized client-side and stored in PostgreSQL with a 300 KB limit each. This is for a limited pilot; switch to object storage before broader use. Email verification/recovery, invite rotation, membership removal, abuse-report queues, and production load testing are not included. Signed-in member discovery and host moderation of room conversations are available in 2.2. The private feed returns the newest 100 posts per rail. No real-money play or live-hand assistance.

The final-table silhouette and Rail Social logo were created with image generation.
