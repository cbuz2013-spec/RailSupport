# Rail Social 2.5.4 — saved-hand feed crash

Status: deployed to https://railsupport.vercel.app on October 11, 2026.

## Cause and fix

The phone recording showed PhabFive loading briefly before the page failed. The 2.5.2 street display introduced empty strings for unknown board slots. EquityCards guarded the card value but called toUpperCase on its missing first character, causing a TypeError during rendering. The shared card renderer now also guards that character and renders the existing unknown-card placeholder.

The error reproduced for four of seven actual saved PhabFive hands before the fix. All seven pass the same static React rendering check afterward. Production data was read only for diagnosis; no posts, photos, permissions or schema were changed. The temporary local hand-data fixture was removed after verification.

## Verification

- Two new component regression tests failed before the fix and pass afterward: all street/partial-board combinations, and later cards retaining their slots when earlier cards are skipped or cleared.
- All 20 focused tests passed across equity-cards, hand-board, hand-streets, hand-review and equity-share.
- All seven saved hands passed schema validation and static HandReviewSummary rendering, including all four street tables.
- Local production build and TypeScript passed. Vercel production build passed; reported build duration 15 seconds.
- Staged homepage and canonical public homepage returned HTTP 200 with Rail Social branding. Promotion succeeded; inspecting the canonical live URL resolved to this exact READY production deployment.
- Immediate error-level log scan returned one existing PostgreSQL SSL-mode deprecation warning on /api/rail, with no application exception in the returned results. Monitoring and drains were not audited for this patch.
- Interactive browser verification remains unavailable: automatic approval review rejected access to the local preview under browser security restrictions. No browser screenshot, device test or authenticated live-feed interaction is claimed. The user's phone retest remains outstanding.

## Deployment

- Code: `774808378bd914115a4ce889f2d78f53073e3e30`.
- Branch: `codex/rail-social-v2.1` in `cbuz2013-spec/RailSupport`.
- Target: existing `railsupport` project, `rage-factory1` team, production.
- Deployment: `dpl_Bi1gUQBTLeGZhrKp4FX4BK4SDFcU`.
- Immutable URL: https://railsupport-r7a2i7cl0-rage-factory1.vercel.app.
- Live URL: https://railsupport.vercel.app.
- Previous production: 2.5.3 / `dpl_HdR9PJ9bZq3f4DHB8jKf67fmAzY1`.

This patch preserves the My Rails-only creation banner and dark felt styling from 2.5.3 and the street-by-street entry from 2.5.2. No new migration or environment configuration was required.
