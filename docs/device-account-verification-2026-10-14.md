# Phone and account verification — October 14, 2026

Started 2:06 AM EDT against production version **2.9.1**, code `e4847d2`, deployment `dpl_9PeUA8mNvQbbBuepLWBWUctH2mRb`, at https://railsupport.vercel.app/. Missing physical push receipt led to a small diagnostic update, **2.9.2**, adding a test alert for the current device. [Release record](release-2.9.2-notification-test.md).

## Current checklist

- [x] **Focused automated checks:** 24/24 passed, zero failures or skipped tests. Includes reset expiry/single use, session revocation, provider failure handling, private photo persistence/permissions, and notification retry/deduplication/privacy.
- [x] **Real reset-email delivery:** the user approved one new request through the live form. Gmail confirmed the message from the production sender in the user's INBOX at **2:22:54 AM EDT** on October 14. A previous October 9 message was also found. Receipt is confirmed, rather than inferred from provider acceptance.
- [x] **Reset-link server and desktop-browser checks:** the newest email contains matching button and fallback links to the canonical HTTPS domain. The callback returns 302 to `/reset-password`, then HTTP 200. The live browser displays New password, Confirm new password and Save new password. The token is removed from the address bar. No password was entered or changed.
- [x] **Phone reset and sign-in:** at 2:56 AM EDT the user confirms they completed the password reset and successfully signed back in. They opened the form from Gmail by pressing and holding the link. The assistant did not enter or choose their password. Ordinary single-tap Gmail behavior remains a separate usability issue.
- [x] **Live draft-photo checks at 390 × 844:** JPEG with EXIF orientation 6, PNG and WebP all previewed. The rotated JPEG became upright 800 × 1200; a 2400 × 1600 PNG resized to 1600 × 1067; WebP converted to JPEG. All payloads stayed below the 400,000-character limit. A fourth photo, unreadable JPEG and file over 12 MB were rejected with useful errors. A valid selection succeeded after those errors. The draft was closed without publishing.
- [x] **User's iPhone Home Screen check:** the user confirms they launch from the Home Screen icon; uploaded photos stay upright and visible after reopening; Update Stack numbers are readable.
- [x] **Physical push receipt:** after reopening version 2.9.2, using Send test notification and locking the phone, the user confirms the test alert appeared at 2:56 AM EDT. This is physical-device receipt, separate from provider acceptance. They confirmed Home Screen push and iOS Allow Notifications/Lock Screen/Banners are enabled with Focus off. Earlier missing-alert reports were not reproduced by this fresh outside-app test; their cause is not claimed identified.
- [ ] **Separate follow-ups:** Gmail single-tap link behavior, actual verification/change-email completion, a broader Safari/accessibility audit, and HEIC/camera format coverage remain outside the checks confirmed here. The tested reset flow opened in Safari; Home Screen photo persistence/orientation/readability passed.

## Evidence and limits

Command:

```text
node --wasm-num-compilation-tasks=1 --liftoff-only --import tsx --test --test-concurrency=1 tests/password-recovery.test.ts tests/post-images.test.ts tests/activity.test.ts
```

Local test log: `tmp/device-account-checks-2026-10-14.log` (24 passed; 41.1 seconds). Browser screenshots: `tmp/photo-preview-check-2026-10-14.jpg`, `tmp/reset-request-confirmed-2026-10-14.jpg`, and `tmp/reset-form-open-2026-10-14.jpg`. Synthetic fixtures remain under `tmp/photo-check-fixtures/`. Temporary browser viewport override was reset.

The reset request initially required specific confirmation under automatic approval review. The user then explicitly approved sending the test to their account, and the request completed once. The user completed their own password change; the assistant entered no credentials. No production posts, photos or push settings were changed by the assistant. The browser's older session became invalid, consistent with reset-time session revocation. The expired test-form tab was closed.

Apple documents Home Screen web-app push and its integration with Focus: https://webkit.org/blog/13878/. iPhone notification presentation settings: https://support.apple.com/en-nz/108274. These are diagnostic possibilities, not a confirmed cause of the missing alerts.
