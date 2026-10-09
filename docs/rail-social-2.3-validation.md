# Rail Social 2.3 release verification

Date: 2026-10-09

## Features

- Prominent Create a rail action. Creation opens the member invitation picker automatically; current members and pending invitations are identified. Invitations appear in the recipient's Notifications and People inbox, with web push when enabled.
- Rail Social logo Join rail control subscribes to a tournament/cash session or a standalone conversation. It does not grant private group membership.
- In-app notifications and web push for watched activity, stack updates, tags, likes, comments, followers, followed players starting sessions, and rail/room invitations. Private access and blocking are checked before delivery.
- Optional hand/update fields, with chips, current big blind and players left first, then photos and other details. At least one piece of content is required to avoid blank posts.
- Author editing/deletion of posts and comments, removable reply tags, and host deletion moderation. Hosts cannot rewrite another author's content.
- Built-in equity calculator replaces the Spot Solver entry. Ties contribute half their probability to two-player equity.

## Verification completed before deployment

- All 48 automated tests passed, including recipient consent, private access, author permissions, idempotent activity, invitation alerts to nonmembers, blocked/revoked recipients, push endpoint validation, dead subscription removal, transient retries, and notification cancellation after leaving a rail.
- TypeScript check and Next.js 16.3.8 production build passed.
- Dependency audit reported zero vulnerabilities after compatible updates.
- Authenticated local API checks passed across synthetic accounts: partial posts, stack edits, session watches, likes/tags, room and Table Talk comments, author-only edits, deep links, and private API authentication.
- Browser verification passed: create rail -> automatic people picker -> invitation confirmation. A separate synthetic recipient's API confirmed the corresponding notification and pending invitation.
- Browser verification covered optional update forms, reply tags, notification links, and 50/50 equity for a tied river.
- Additive SQL migration ran successfully on Neon test branch `br-broad-hall-b58evunh` before production application. The migration creates no historical activity notifications.

## Operational notes

- A member must enable push on each device. On iPhone/iPad, use a supported version and add Rail Social to the Home Screen first.
- Production VAPID and cron credentials are configured in Vercel; secrets are excluded from source control.
- Delivery starts after app writes, retries on subsequent activity, and has a daily cron fallback within the current hosting plan.
- Provider delivery behavior is covered by tests with a stubbed sender. Receipt on a physical phone has not yet been verified.
- Local test accounts and test content exist only in the isolated preview database.
