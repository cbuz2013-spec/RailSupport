# Rail Social 2.5 — release and verification

Status: deployed October 11, 2026. Production: https://railsupport.vercel.app. Code commit: `141d949d3f8f07401f7be18c0da496276787bb44`.

## Included

- My Rails bottom navigation and Rail Social logo manifest/iPhone icons.
- So sick reaction, reaction attribution lists, Follow this post wording and independent street reactions.
- Tournament/cash game sessions inside existing groups, with optional relevant setup details and invitation handoff.
- Ten optional review screens, calculator-to-review import, up to four opponents, full card deck and poker-table street frames. Per-street equity uses only known cards, including tied pots.
- Email verification/resend, email/password settings, session management, protected account deletion with anonymous league results.
- Reports for posts/comments/profiles, moderation desk and action history, account restrictions, conservative text screening, write limits, upload validation, support/privacy/rules.
- Group transfer/removal/leave, invitation resend/withdraw/history, room transfer and pinned announcements.
- League-specific time zones, roster removal, season archive and schedule/result correction history; host-entered points and shared ranks.

## Evidence

79/79 automated tests passed. TypeScript passed. Next.js 16.3.8 production build passed. Isolated browser sign-in, group creation, member invite, tournament rail setup, ten-screen review, card selection and 390-pixel street frames passed. Example AA vs KK showed estimated preflop equity and exact flop equity using only flop cards.

No browser test posts were published to production. Snapshot `snap-curly-brook-b5ce6m7h` retained 5 accounts, 31 posts and 5 groups. The restore operation unexpectedly finalized the new branch as production, moving the existing endpoint: production is now `br-empty-star-b5bgyjru`; original data remains on `br-empty-fire-b58tq1en`. Before promotion, a read-only comparison of all 41 pre-existing tables/views using all original columns found 40 identical; the remaining table had identical push subscriptions with one newer device-refresh timestamp. No existing content/account differences were found. The additive migration was verified on the active production branch (street reactions, administrator and content rules present). Keep both recovery branches; do not treat a default finalized restore as an isolated rehearsal in future.

## Remaining checks and limits

- Provider rejected daily snapshot scheduling as not enabled for this project. Manual recovery snapshot is available until October 18; six-hour point-in-time history remains configured.
- Real inbox receipt, physical phone photo handling/icon refresh and a comprehensive accessibility audit remain unverified. Existing phone shortcuts may retain their old cached icon until re-added.
- Text screening is conservative phrase matching, supplemented by reports and moderator review; uploaded image contents are not automatically classified.
- Photos remain limited to three per private-rail post. Calculator imports can attach photos when sharing to a private rail.
- No store submission, paid ads, billing or real-money poker was added.

## Deployment

Deployment `dpl_AoGreewpE5W8u3S9SVEHRrEz1y7z` is Ready and promoted. Immutable URL: https://railsupport-68tmn65kp-rage-factory1.vercel.app. Canonical-domain inspection resolves to this deployment. Vercel cloud build and production migration passed. Protected-deployment checks returned the new logo manifest, help page, an anonymous auth-session response and the expected 401 for the management API. Previous application rollback candidate: `dpl_881P5zF511gtiFrUh3n9iJPza6Xj` (2.4); its schema remains compatible.

Final browser refresh was blocked to protect possible unsaved state in the user tab; opening a separate verification tab timed out. Final production verification therefore uses deployment metadata and HTTP checks, with interactive coverage recorded from the isolated local run.
