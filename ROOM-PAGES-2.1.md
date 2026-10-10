# Rail Social 2.1 — Room Pages

## Roadmap milestone

The September 25 RailSupport product roadmap puts **official poker-room pages and hosts** after the Spot Solver integration. Version 2.1 implements that room-network foundation in the existing RailSupport application.

**Complete and deployed on October 6, 2026.** Version 2.1 is live at https://railsupport.vercel.app. The production database migration and room-creator configuration are complete. See [the updated roadmap](ROADMAP.md).

Included:
- A searchable room directory with All rooms, Following, and My host desk filters.
- Room profiles with name, city/region, description, street address, website, host roster, and shareable links.
- Draft and published pages. Published pages are visible to signed-in members; drafts are visible only to the owner and accepted co-hosts.
- Room follows, kept separate from player follows and private-rail membership.
- Host announcements, with pagination and the existing bidirectional block policy.
- Owner-managed co-host invitations. Invitees must already have an account and accept inside Rooms; no email is sent.
- Server-side authorization for every read and write, including stale sessions after host removal.

The next roadmap milestone is **Tournaments**: QR join, live stacks, hands, and event chat. Room subscriptions, paid push campaigns, analytics, live video, and branded room apps remain later milestones. Existing private rails, profiles, Table Talk, odds, and the Spot Solver bridge are retained.

## Roles

| Action | Member | Accepted co-host | Owner |
| --- | --- | --- | --- |
| View published rooms and follow | Yes | Yes | Yes |
| View this room's draft | No | Yes | Yes |
| Edit details / manage announcements | No | Yes | Yes |
| Publish / unpublish | No | No | Yes |
| Invite / remove co-hosts | No | No | Yes |

Creating rooms requires the account ID to appear in the server-only, comma-separated `RAILSOCIAL_ROOM_CREATOR_IDS` setting. Empty means nobody can create rooms. This is the default for the approved-host pilot; approving an account is an operator decision, not a self-service verification claim. Removing creation approval prevents new rooms but does not silently revoke an existing room's ownership.

Room sharing requires sign-in. Follows do not send notifications in this release. Unpublishing preserves the room's follows and announcements so the owner can republish it later.

## Local review without cloud credentials

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run preview:rooms
```

The optional preview creates an in-memory PostgreSQL database at **127.0.0.1:5439** and starts the app at **http://127.0.0.1:3100/?view=rooms**. It overrides database/auth settings for its child process and does not connect to an existing database. All room names and accounts in this preview are fictional. State is discarded when the preview stops.

Local accounts: `preview-owner@example.test`, `preview-member@example.test`, `preview-cohost@example.test`. The local-only password for each is `LocalRoomPreview123!`. The owner is approved to create rooms. This preview script must never run in a hosted environment. It refuses to run on Vercel.

Tests use PostgreSQL via PGlite with serialized execution and limited WASM compilation threads to accommodate Windows. PGlite and its socket server are development dependencies only.

With the disposable preview running, `node --import tsx scripts/rooms-http-smoke.ts` checks the real HTTP routes and Better Auth sessions using those synthetic accounts.

## Verification on October 6, 2026

- 22 automated tests passed: existing odds and image validation plus Room Pages database/permission coverage.
- TypeScript checking and the production build passed.
- HTTP acceptance checks passed: sign-in, unauthenticated denial, origin protection, malformed/oversized requests, draft privacy, host consent, publishing, following, revocation, and private-rail isolation.
- Browser visual and responsive checks remain pending. The in-app browser repeatedly timed out attaching to the local preview. No screenshot or browser interaction result is claimed.
- No production data or credentials were used for testing. Existing Spot Solver integration was preserved, but its live trusted-origin flow was not rerun in this localhost preview.

## Production release completed October 6, 2026

The user authorized deployment. The additive Room Pages migration was tested on an isolated Neon branch and then applied to production after a recovery branch was created. The existing account for `cbuz2013@gmail.com` was approved to create rooms.

The final production deployment is `dpl_4E3XLh36iD6n5YjUxpfjWmNfmmH2`, built from commit `088d3b35292a61b96454463ed82b2ed8e8a85ddc` on `codex/rail-social-v2.1`. Vercel confirms it is ready and promoted to the existing production domain. The draft PR has not been merged into `main`.

Production checks confirmed the homepage and all eight homepage JavaScript assets returned 200, version 2.1 was present, the requested ChatGPT reference was removed, signed-out Rooms and Rails requests returned 401, and session lookup returned 200. Signed-in production room creation and browser visual checks remain manual follow-up checks; local HTTP acceptance covered the full room permission flows.

## Reference checklist for future releases

1. Review the branch and authorize deployment separately. The review branch `codex/rail-social-v2.1` is explicitly disabled in `vercel.json`, matching the [Vercel branch deployment configuration](https://vercel.com/docs/project-configuration/git-configuration).
2. On an approved database target, back up first and apply `scripts/room-pages.sql`. It is additive and rerunnable. New installations can run `npm run db:setup`, whose full schema includes Room Pages. Do not run setup or this migration against production without approval.
3. Set approved account IDs in `RAILSOCIAL_ROOM_CREATOR_IDS` on the intended environment. Leave it empty until room ownership has been approved. The existing auth secret, database URL, site URL, and `RAILSUPPORT_READY` behavior do not change.
4. Verify owner creation, draft visibility, publication, following, invitations/acceptance/removal, and announcements with distinct accounts on the intended test environment.
5. Recheck existing private rails, Table Talk, and the Spot Solver bridge at the trusted Rail Social origin before any production promotion. This release does not change the solver URL or its message origins.

The October 6 deployment included the approved production migration and environment configuration. Rolling the app back to 2.0 can leave the additive Room Pages tables in place.
