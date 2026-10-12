# Rail Social - build checklist and completion goals

**Issued October 8; status updated October 11, 2026. Current release: 2.5.6. All goals are end of day, America/New_York, in 2026.**

This is the build-only plan: features, dependencies, implementation order and completion goals. It excludes acquisition, recruitment, ambassadors, influencers, marketing budgets and participation targets. Ads, paid plans and sponsor-slot controls are included only as product features to build.

**Aggressive goals:** store-ready build **November 25**; initial public apps **December 4** (external approval goal); full feature build **December 18**; full-feature public update **December 23** (external approval goal).

These are stretch goals assuming focused development, a scope freeze and timely provider/account access. They are not delivery guarantees, a staffing estimate, or work already scheduled. If a prerequisite slips, update its dependent dates rather than marking unfinished work complete. Stage numbers are implementation order, not software version numbers.

## Definition of the finished product

A reliable Rail Social service with accounts/recovery, private rails, people connections, room conversations, leagues, live event tools, notifications, iOS/Android apps, ads and paid room plans, plus the original roadmap's live video, room analytics and branded-app capability. Actual approval of each public app is external. This scope does not include operating real-money poker, taking deposits/payouts or a GG game-engine integration.

## Version 1 - graphical roadmap

[Original October 8 graphical plan — historical, without current checkoffs](rail-social-build-roadmap-2026-10-08.png). The current roadmap is [ROADMAP.md](../ROADMAP.md); this checklist is the detailed status source.

## Version 2 - feature checklist

[Original October 8 printable/fillable PDF — historical, without current checkoffs](../output/pdf/rail-social-build-checklist-2026-10-08.pdf).

Check an item only after it is implemented and its behavior is verified. Unchecked items with progress notes are partially delivered or awaiting verification. Browser push remains unchecked until physical-device receipt is tested. The October 8 artwork/PDF are historical; this checklist and its task data carry current status. Dates are retained stretch goals, not scheduled work or guarantees.

### Existing foundation - complete as of October 7

- [x] **Accounts, profiles and private rails** - delivered foundation in the verified 2.2 release; preserve and regression-test it.
- [x] **People search, following and mutual friends** - delivered foundation in the verified 2.2 release; preserve and regression-test it.
- [x] **Rail/room invitation handoffs and in-app invite count** - delivered foundation in the verified 2.2 release; preserve and regression-test it.
- [x] **Posts, photos, comments and blocking** - delivered foundation in the verified 2.2 release; preserve and regression-test it.
- [x] **Hand review and equity calculator** - delivered foundation; the 2.3 release replaces the Spot Solver entry with the built-in equity calculator.
- [x] **Room profiles, host controls and follower conversations** - delivered foundation in the verified 2.2 release; preserve and regression-test it.
- [x] **League seasons, schedules, manual results and standings** - delivered foundation in the verified 2.2 release; preserve and regression-test it.
- [x] **Manual tournament-update posts** - delivered foundation in the verified 2.2 release; preserve and regression-test it.

### Completed in the October 9 updates

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

Browser push infrastructure is deployed but **real-phone receipt is not yet verified**. Rail/room/league setup and sign-in forms still retain necessary required fields; the all-optional confirmation applies to hand reviews and updates.

Evidence: [2.3 release checks](rail-social-2.3-validation.md), implementation commits `2752d1d` and `89f19f2`. No real inbox delivery or native-app/store approval is inferred from code completion.

### Release 2.5 — October 11

My Rails, So sick and independent street reactions, reaction attribution, game-session setup, the ten-screen review and calculator import, poker-table frames, and expanded account/safety/community tools are deployed. 79 tests and local/cloud production builds passed. [Release evidence and limitations](release-2.5-2026-10-11.md). Stages 1–3 remain partial where checks below are still open.

### Release 2.5.1 — stack entry and action buttons

Delivered: one Chips/BB hero-stack entry in step 3, opponent stacks retained in step 4, guided street actions with optional sizing, turn order, explicit heads-up, all-in flags and Undo. 88 tests and local/cloud builds passed; browser verification was blocked. [Release evidence](release-2.5.1-hand-actions.md).

### Release 2.5.4 — saved-hand loading repair

Fixed the feed crash caused by empty board-card slots introduced with street-by-street entry. Twenty focused tests, all seven saved PhabFive hand component renders, and local/cloud production builds passed. The live domain is verified against the promoted deployment; interactive phone/browser retesting remains outstanding. [Release evidence](release-2.5.4-saved-hand-crash.md).

### Release 2.5.5 — remove the creation banner

Removed the large rail-creation banner from every page. The existing New rail button remains only in the My Rails header. Local/cloud builds, TypeScript and live deployment/script checks passed. [Release evidence](release-2.5.5-remove-rail-banner.md).

### Release 2.5.6 — compact card picker

Each full suit now uses a seven-card row followed by a six-card row across hand review and the equity calculator. Local/cloud builds, TypeScript and live CSS checks passed. [Release evidence](release-2.5.6-compact-card-picker.md).

### Implementation sequence

| Order | Stage | Complete-by goal |
| --- | --- | --- |
| 1 | Accounts and recovery | Oct 12, 2026 |
| 2 | Safety, permissions and support | Oct 16, 2026 |
| 3 | Complete social, room and league controls | Oct 22, 2026 |
| 4 | Notifications and destination links | Oct 28, 2026 |
| 5 | Live tournament tools | Nov 5, 2026 |
| 6 | iPhone and Android apps | Nov 13, 2026 |
| 7 | Ads and paid room plans | Nov 20, 2026 |
| 8 | Store-ready release and operations | Nov 25, 2026 |
| 9 | Complete the advanced room product | Dec 18, 2026 |

**Start the mobile/billing feasibility check (6.1) and provider setup (E1) immediately**, even though their implementation stages appear later. Security checks and automated tests accompany every feature. Required platform testing runs as soon as usable phone builds exist; it is a release dependency, not a recruitment workstream in this document.

## 1. Accounts and recovery - complete by Oct 12

**When:** Start here. Verified domain/sender and account access are prerequisites.

- [ ] **1.1 Verified email delivery - Oct 9.** Connect a verified sender so account messages reach the correct address; confirm delivery and failure handling. **Status Oct 9:** Sender domain phabfive.com is verified and Resend is connected. Provider test acceptance and failure handling passed; receipt in a real user inbox still needs confirmation.
- [x] **1.2 Forgot password - Oct 10. Completed Oct 9.** Send a single-use reset link and preserve invitations through recovery. **Status Oct 9:** Completed Oct 9: deployed single-use, 30-minute reset links, session revocation and invitation-preserving recovery; local end-to-end and production route checks passed.
- [ ] **1.3 Email verification - Oct 11.** Confirm email ownership and provide resend/change-address handling without stranding existing accounts. **Status Oct 11:** Verification and resend are deployed, with confirmation-based email changes and session revocation. Signup email behavior passed automated checks; actual inbox completion remains unverified.
- [ ] **1.4 Account and session settings - Oct 12.** Allow secure email/password changes and sign-out of other sessions after sensitive account changes. **Status Oct 11:** Email/password settings, session list/revocation and sign-out with push detachment are deployed. Sensitive email/password changes still need a real-account end-to-end confirmation.
- [x] **1.5 Account deletion - Oct 12.** Add in-app and public web deletion requests with clear handling of posts, files and league history. **Status Oct 11:** In-app password-confirmed deletion and public deletion instructions deployed. Atomic cleanup, ownership protection and anonymized league history passed isolated database tests.

**Done when:** Reset, sign-in, settings and deletion flows pass end-to-end checks.

## 2. Safety, permissions and support - complete by Oct 16

**When:** After 1. Apply these controls to every later feature.

- [x] **2.1 Report content and users - Oct 13.** Add report actions that save the reason and relevant content for moderator review. **Status Oct 11:** Post, comment and profile reports save reasons and snapshots with access checks. Isolated reporting and comment-removal tests passed.
- [x] **2.2 Moderation console - Oct 14.** Let authorized moderators review reports, remove content and restrict abusive accounts with an action log. **Status Oct 11:** Moderator report queue, resolve/dismiss/remove, restrictions/restore and action history deployed. Unauthorized and authorized API cases passed.
- [x] **2.3 Role and privacy enforcement - Oct 15.** Check owner, host and member rights on the server; keep private rails separate from rooms. **Status Oct 9:** Completed for the current web product Oct 9: owner/host/member rights, private-rail isolation, author-only editing, blocking and invitation consent are enforced and tested. Extend these checks as new features are added.
- [ ] **2.4 Abuse and upload protection - Oct 15.** Filter objectionable content, limit abusive requests and reject unsupported or oversized uploads. **Status Oct 11:** Conservative text rules, per-user write/report limits and format/size validation deployed and tested. Automated image-content screening and broader abuse audit remain.
- [x] **2.5 Help, privacy and community rules - Oct 16.** Publish working support, privacy, deletion and community-standard screens, including required safety contacts. **Status Oct 11:** Public help, privacy, deletion and community rules plus authenticated support/appeals deployed; help route verified on staged production.
- [ ] **2.6 Backup and recovery baseline - Oct 16.** Automate database protection and prove a test restore before later schema changes. **Status Oct 11:** Manual snapshot and recovery comparison completed; the restore finalized a replacement production branch. Original data retained; all existing content matched. Daily snapshot scheduling was rejected as unavailable; establish automation and a strictly isolated rehearsal procedure.

**Done when:** Unauthorized actions are denied; reports can be resolved and a backup restored.

## 3. Complete social, room and league controls - complete by Oct 22

**When:** After 1-2. Extend the live 2.2 foundation; do not rebuild it.

- [x] **3.1 Rail membership controls - Oct 17.** Add missing leave/remove-member, invite-revoke and owner-transfer controls with confirmation. **Status Oct 11:** Leave/remove-member, ownership transfer and invitation withdrawal deployed. Transfer/removal permissions and revoked watches/invites passed regression tests.
- [x] **3.2 Invitation management - Oct 18.** Show pending, accepted, declined and expired invites; let senders withdraw or resend eligible invitations. **Status Oct 11:** Pending invitation management, resend/withdraw and history deployed and tested. History records subsequent transitions; historical deleted invitations cannot be reconstructed.
- [ ] **3.3 Room administration - Oct 19.** Complete host removal, room access controls and pinned announcements while preserving owner permissions. **Status Oct 11:** Room transfer, accepted-host checks and pinned announcements implemented alongside existing owner/host permissions. Full new room-administration browser walkthrough remains to verify.
- [ ] **3.4 Post and photo management - Oct 20.** Finish supported edit/delete flows, image orientation/compression and useful upload retry messages. **Status Oct 11:** Post/photo edits and deletion retained; orientation-aware compression and unsupported-format retry guidance deployed. Physical-device orientation/format and retry checks remain; maximum three photos per private-rail post.
- [x] **3.5 League administration finish - Oct 21.** Add missing time-zone handling, roster removal, season archive and correction history around existing schedules/results. **Status Oct 11:** League time zones with DST validation, soft roster removal, archived seasons and correction history deployed and tested. Host-entered points and shared ranks retained.
- [ ] **3.6 Mobile web and accessibility finish - Oct 22.** Fix keyboard, focus, empty/loading/error states and small-screen layouts across existing social and solver flows. **Status Oct 11:** My Rails navigation, optional nine-screen review with cards/action together per street (2.5.2), table frames and accessible reaction controls deployed. Current static render checks passed; the earlier 2.5 flow passed a 390-pixel check, but interactive 2.5.2 verification is blocked and the comprehensive keyboard/screen-reader/device audit remains.

**Done when:** Members and hosts can manage their own content, invitations and rooms correctly.

## 4. Notifications and destination links - complete by Oct 28

**When:** After 3. Reuse the event service in the native apps.

- [x] **4.1 Notification inbox - Oct 23.** Store invitation, reply and game-update alerts with unread counts and read-state controls. **Status Oct 9:** Completed Oct 9: stored invitation, watched-post/stack, reply/tag, like, follow and followed-session alerts, unread counts and mark-read controls are deployed and tested.
- [ ] **4.2 Reliable delivery service - Oct 24.** Queue alerts, retry temporary failures and prevent duplicate sends or stale reminders. **Status Oct 9:** Durable event/outbox queues, duplicate prevention, access rechecks and retries are implemented and tested with a stubbed push sender. Immediate delivery runs after writes, with activity-driven retries and a daily fallback. Physical-device delivery and future scheduled-reminder handling remain to verify.
- [ ] **4.3 Browser push - Oct 26.** Register supported browsers for opt-in push and handle permission denial and expired subscriptions. **Status Oct 9:** Browser opt-in, service worker, production push credentials, permission handling and expired-device cleanup are deployed. This stays unchecked until receipt is verified on physical phones.
- [ ] **4.4 Notification preferences and reminders - Oct 27.** Offer per-room/category mute controls and game reminders that update when schedules change. **Status Oct 9:** Join/leave a post or session watch and device-wide push on/off are delivered. Per-room/category mute preferences and schedule-aware reminders remain.
- [ ] **4.5 Secure deep-link routing - Oct 28.** Preserve rail, room and event destinations through sign-in; validate membership before opening content. **Status Oct 9:** Rail/room invitation handoffs, post/session links and membership checks exist. Complete the signed-out destination audit and routing for future event/native screens.

**Done when:** An allowed alert is delivered once and opens the correct destination; muted alerts stay off.

## 5. Live tournament tools - complete by Nov 5

**When:** After 3-4. Extend the existing manual tournament-update posts.

- [ ] **5.1 Event setup and lifecycle - Oct 29.** Create room-linked tournaments with schedule, blind structure and draft/live/finished states. **Status Oct 9:** Player-created tournament/cash-game sessions are delivered. Organizer-managed room events, blind structures and the full draft/live/finished lifecycle remain.
- [ ] **5.2 QR and link join - Oct 30.** Generate event join codes; a scan opens the correct event and applies its membership rules.
- [ ] **5.3 Live stack and status board - Nov 2.** Show timestamped chip-count/status updates and reconnect cleanly; clearly identify self-reported data. **Status Oct 9:** Timestamped chip/big-blind/players-left updates and watch notifications are delivered. A consolidated live board, reconnect behavior and self-reported labels remain.
- [ ] **5.4 Blind clock and event updates - Nov 3.** Synchronize levels, breaks and organizer corrections from the server so devices stay consistent.
- [ ] **5.5 Event chat and completed-hand posts - Nov 4.** Keep moderated discussion inside the event; only completed hands enter review/solver workflows. **Status Oct 9:** Private-rail comments and optional completed-hand reviews exist. Dedicated moderated event discussion remains.
- [ ] **5.6 Results and league connection - Nov 5.** Finalize event results, record corrections and update linked league standings without duplicate scoring.

**Done when:** A test event runs from setup through results without leaking private data or giving live solver advice.

## 6. iPhone and Android apps - complete by Nov 13

**When:** Feasibility check starts Oct 9; implement after stable APIs in 3-5.

- [ ] **6.1 Mobile architecture decision - Oct 12.** Prove authentication, native push, deep links and ad SDK compatibility before choosing the shared-client approach.
- [ ] **6.2 App shells and secure sessions - Nov 6.** Build native navigation and secure sign-in/session storage around the existing Rail Social backend.
- [ ] **6.3 Camera, photos and native sharing - Nov 9.** Connect phone media selection and share sheets with permissions, progress and recovery from cancelled actions.
- [ ] **6.4 Native push and app links - Nov 10.** Deliver iOS/Android alerts and open the right screen from a cold start or expired session.
- [ ] **6.5 Offline and error recovery - Nov 12.** Show connection state, preserve safe drafts and prevent duplicate writes after reconnecting.
- [ ] **6.6 Signed device-test builds - Nov 13.** Configure app IDs, certificates and builds; verify accessibility, crashes and core flows on both platforms.

**Done when:** Signed iOS/Android builds install and complete core flows on physical phones.

## 7. Ads and paid room plans - complete by Nov 20

**When:** After 6; billing/SDK feasibility should be checked during the Oct 12 spike.

- [ ] **7.1 In-app ad placements - Nov 14.** Integrate test ad units into selected browsing screens while keeping account and private-rail tasks clear.
- [ ] **7.2 Consent and ad controls - Nov 16.** Add required consent/tracking choices, frequency limits, app-ads.txt and a remote switch to turn ads off.
- [ ] **7.3 Free, Standard and Premium rights - Nov 17.** Define plan limits and enforce the correct room capabilities on the server; final prices remain configurable.
- [ ] **7.4 Store billing and purchase validation - Nov 18.** Implement applicable platform purchase flows and server-side receipt validation before granting paid access.
- [ ] **7.5 Renewal, restore and cancellation - Nov 19.** Keep entitlements correct after renewals, refunds, cancellations and restored purchases.
- [ ] **7.6 Labeled sponsor placement controls - Nov 20.** Let authorized admins configure clearly labeled in-product sponsor slots with dates and an off switch.

**Done when:** Test ads and sandbox purchases work; rights and privacy choices remain correct across devices.

## 8. Store-ready release and operations - complete by Nov 25

**When:** After 1-7. Publisher verification and required platform testing run in parallel.

- [ ] **8.1 Regression and permission audit - Nov 21.** Exercise accounts, rails, rooms, events, media, notifications and purchases with authorized test accounts. **Status Oct 9:** The 2.3 web release passed 48 automated tests, local API/browser checks and builds; the timestamp update also passed build/browser checks. Final cross-product acceptance remains after native apps, events and purchases exist.
- [ ] **8.2 Performance and accessibility audit - Nov 23.** Fix launch-blocking slow paths, crash cases, screen-reader issues and poor-connection behavior.
- [ ] **8.3 Production monitoring and rollback - Nov 24.** Connect error/delivery alerts, usage limits and a proven restore/rollback procedure. **Status Oct 9:** Staged production builds, promotion and live checks are in use. Operational alerts, usage limits and a proven restore/rollback exercise remain.
- [ ] **8.4 Store submission packages - Nov 25.** Prepare signed binaries, accurate privacy/Data Safety answers, age ratings, screenshots and reviewer access.
- [ ] **8.5 Release-candidate sign-off - Nov 25.** Record test evidence and zero unresolved critical defects; keep live ads off until required approval.

**Done when:** A releasable build and complete submission package are ready; approval remains external.

## 9. Complete the advanced room product - complete by Dec 18

**When:** After 8. Extend stable core apps; reuse permissions, plans and release checks.

- [ ] **9.1 Room live video - Dec 4.** Add host-controlled room broadcasts with access checks, mute/end controls and viewer permissions.
- [ ] **9.2 Video replay and retention - Dec 7.** Provide permissioned replay where enabled, with storage limits, removal and recording controls.
- [ ] **9.3 Room and service analytics - Dec 9.** Give hosts scoped room usage summaries and admins operational health, without exposing private content.
- [ ] **9.4 Room branding and configuration - Dec 11.** Store per-room logos, colors and enabled features while keeping room data and permissions isolated.
- [ ] **9.5 Branded app build pipeline - Dec 16.** Generate room-specific mobile packages from shared code; each public listing still needs its own eligible review.
- [ ] **9.6 Full-product acceptance and update - Dec 18.** Re-test all stages together, document limitations and package the complete feature set for deployment/submission.

**Done when:** All planned features pass; the advanced update is packaged for release, with no critical open defects.

## External dependencies and publication goals

These targets do not claim control over provider verification, platform testing eligibility, app review or AdMob review. The internal build milestone remains distinct from public availability.

- [ ] **E1 Provider and publisher access - Oct 9 (External setup target).** Start domain/sender, Apple/Google, billing, ad and video-provider setup. Approval delays may move dependent dates. **Status Oct 9:** Email domain/sender setup is complete. Apple/Google publisher, billing, ad and video-provider setup has not been verified.
- [ ] **E2 Required store testing/access - Nov 27 (External eligibility target).** Complete platform-required testing and production-access checks before submission; no recruitment plan is included.
- [ ] **E3 Submit initial apps - Nov 27 (Submission target).** Submit both eligible store packages once publisher and testing requirements have cleared.
- [ ] **E4 Public store release - Dec 4 (External approval goal).** Publish approved iOS and Android builds; actual timing depends on Apple and Google review.
- [ ] **E5 Live ad activation - Dec 7 (External approval goal).** Link published apps, pass required AdMob readiness checks and verify controlled live ad serving.
- [ ] **E6 Publish the full-feature update - Dec 23 (External approval goal).** Deploy the accepted full build and publish approved mobile updates; branded room listings remain individually reviewed.

## Finish criteria and evidence

Every feature checkbox needs implementation and verification evidence. Complete accounts, authorization, photo/media handling, notification routing, event results, purchases, consent, video access and room isolation tests. Keep no known unresolved critical security, privacy, data-loss or core-flow defects. Store listings must match the actual app, and live ads must remain disabled until required approval. Tests and provider setup belong in the build; audience-size or recruitment goals do not.

The nine-stage scope preserves the original roadmap's later video/analytics/branded-room ambitions rather than calling the first mobile submission the whole finished product. Branded packages must satisfy applicable store rules; generating a package does not guarantee a separate listing will be accepted.

## References

- [Current 2.3 release evidence](rail-social-2.3-validation.md).
- [Earlier 2.2 foundation evidence](../COMMUNITY-2.2.md).
- [Retained technical store-launch requirements](rail-social-store-launch-roadmap-2026-10-07.md).
- [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/): user content, account deletion, app functionality and purchase requirements.
- [Google production-testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en): eligibility can delay submission/public release; account type matters.
- [AdMob app readiness](https://support.google.com/admob/answer/10564477?hl=en): publication and ad readiness are separate approvals.

Provider policies must be checked again at implementation and submission. Dates are project goals set on October 8, not published review promises. The detailed task data is the source for the printable/fillable PDF. Artwork uses the built-in image-generation tool; [generation prompt](rail-social-build-roadmap-2026-10-08-prompt.txt).
