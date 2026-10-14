# Rail Social 2.9.2 — device notification test

The user reports that push notifications only appear inside Rail Social, despite enabling push in the Home Screen app and enabling iOS banners/lock-screen alerts with Focus off. Existing provider acceptance cannot establish whether the phone displayed an alert.

Notifications now includes **Send test notification**. It uses only the current device's saved subscription, waits 10 seconds so the user can leave the app or lock the phone, and records whether the provider accepted the test, rejected an expired subscription, failed, or the device was disconnected. The page displays the latest test result without equating acceptance with physical receipt.

The existing authenticated, origin-checked activity route handles the test. Server-side ownership checks prevent sending to another account's device. A deterministic audit ID allows only one request per account per minute, including simultaneous requests. Delivery checks device ownership again after the delay. The test uses a generic message and stores no subscription endpoints, keys, private post text or provider response bodies in its audit entry. No schema migration is required.

## Validation

- 27 focused tests passed: notification isolation/ownership, concurrent test limiting, account switching before delivery, expired/transient provider outcomes, and existing notification/photo/password recovery regressions.
- TypeScript passed.
- React review: no new effects/subscriptions, existing refresh lifecycle reused, controls have visible names and busy/disabled states, results use `role="status"`, and secrets remain server-only.
- Local production build passed after clearing read-only flags on generated build-cache entries and running with the Windows filesystem access required for Next.js build junctions.
- Code commit: `d8b6da4`, pushed to `codex/rail-social-v2.1`.
- Clean release source: `git archive` of that exact commit; no local credentials or unrelated untracked files included.
- Target verified in both working directories: `rage-factory1/railsupport`, project `prj_POLb696w4WfafDxAMwYMaoSEwE5x`.
- Vercel cloud build passed (about 17 seconds); authenticated staged page returned HTTP 200 with the exact deployment ID.
- Promoted to production and verified October 14, 2026 at 2:52 AM EDT. The canonical domain returns HTTP 200 with the correct deployment ID and all ten JavaScript bundles; bundles include the test control and 2.9.2 version. Anonymous activity access returns HTTP 401.
- Browser reload reached the sign-in screen because its previous session was no longer valid. The user subsequently confirmed they completed their own password reset and successfully signed in again.
- The production audit records provider acceptance for the user's test created at **2:55:23 AM EDT**. At **2:56 AM EDT**, the user confirmed the alert appeared on their locked iPhone after using the deployed control. This verifies the new button, authenticated API request, delayed delivery, service-worker notification and physical presentation together. The assistant's desktop browser did not regain a signed-in session.

## Deployment result

- URL: https://railsupport.vercel.app/
- Target/status: production / READY.
- Commit: `d8b6da4`.
- Framework: Next.js 16.3.8.
- Deployment: `dpl_sq7iVgym42AksmHnWwaHtMkLNPBK`.
- Immutable URL: https://railsupport-ge9i29xs4-rage-factory1.vercel.app.
- Cloud build duration: 16.9 seconds.
- Runtime check: no 5xx entries found in the first post-release scan. The error-level scan returned five existing PostgreSQL SSL-compatibility warnings, without an application exception. This is a limited initial window, not continuous monitoring.
- External log drains: not inspected; no monitoring configuration changed.
- Rollback target if a release regression is confirmed: prior production `dpl_9PeUA8mNvQbbBuepLWBWUctH2mRb`.

Phone test: fully close and reopen the Home Screen app, sign in if needed, open Notifications, choose **Send test notification**, and lock the phone. Delivery is scheduled after 10 seconds. Read the latest test result after reopening. Provider acceptance and actual lock-screen receipt are separate observations.

Local evidence: `tmp/notification-test-checks-2.9.2.log`, `tmp/typecheck-2.9.2.log`, `tmp/build-2.9.2.log`, `tmp/verified-2.9.2-live.json`. Earlier phone/email evidence is in [the verification record](device-account-verification-2026-10-14.md).
