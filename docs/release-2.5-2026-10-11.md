# Rail Social 2.5 — release and verification

Status: built and tested; awaiting staged deployment and production promotion.

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

Production data was never used for browser test posts. A restored Neon branch retained 5 accounts, 31 posts and 5 groups after the additive migration. Snapshot: snap-curly-brook-b5ce6m7h; restored branch: br-empty-star-b5bgyjru. Production remains on the existing branch br-empty-fire-b58tq1en.

## Remaining checks and limits

- Provider rejected daily snapshot scheduling as not enabled for this project. Manual recovery snapshot is available until October 18; six-hour point-in-time history remains configured.
- Real inbox receipt, physical phone photo handling/icon refresh and a comprehensive accessibility audit remain unverified. Existing phone shortcuts may retain their old cached icon until re-added.
- Text screening is conservative phrase matching, supplemented by reports and moderator review; uploaded image contents are not automatically classified.
- Photos remain limited to three per private-rail post. Calculator imports can attach photos when sharing to a private rail.
- No store submission, paid ads, billing or real-money poker was added.

## Deployment

Pending. Previous live rollback candidate: dpl_881P5zF511gtiFrUh3n9iJPza6Xj (2.4).
