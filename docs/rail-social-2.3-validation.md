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

## Production release

- Implementation commit: `2752d1d`, pushed to `codex/rail-social-v2.1` without merging.
- Production migration applied successfully to `br-empty-fire-b58tq1en`. Initial event, notification and device counts were zero; all 14 capture triggers were present.
- Vercel deployment: `dpl_HPyUp6EeGc1Fu5chn5YbvK9tEmxS`, built successfully and promoted on 2026-10-09.
- Live site: <https://railsupport.vercel.app>. Deployment inspection confirmed this exact release serves the live URL.
- Staged and live HTTP checks passed: app, password recovery, standalone manifest, push worker and icon; activity and retry endpoints rejected unauthenticated access. The live push worker has cache control preventing stale copies.

## Card-picker update — October 9, 2026

- Implementation commit: `bb35edc4f247cb486da15e16c1eccebc36c116af`, pushed to `codex/rail-social-v2.1` without merging.
- Shared suit-first picker in hand reviews and the equity calculator: four suit icons, thirteen values, visible selected cards, replacement/removal/clear controls, and duplicate prevention across the hand and board. Hand-review cards remain optional.
- Local production build and all five existing equity tests passed. Browser checks verified all 52 choices, keyboard selection, duplicate prevention, calculation-result invalidation, 320px/390px layouts, save/readback/reload, editing, discussion-to-calculator prefill, and submissions without cards. Test posts used the isolated local database only.
- Production build succeeded from a clean archive of the implementation commit. Staged checks confirmed the exact commit and card-picker CSS before promotion.
- Vercel deployment: `dpl_3xsWsvU1GRztYFL59mgqURPFYd5r`, URL <https://railsupport-1dugdog3w-rage-factory1.vercel.app>.
- Promoted successfully; deployment inspection confirmed <https://railsupport.vercel.app> serves this exact READY production deployment and commit.
- Live signed-in browser checks confirmed the calculator renders all thirteen heart values, selects cards, and disables duplicates in the other hand. No browser errors were captured; no error-level runtime logs were returned for the deployment in the initial ten-minute query window. No production posts were created or edited during verification.
- No database migration or environment-variable change was needed.
