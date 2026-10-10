# Rail Social password recovery — October 9, 2026

Deployed and promoted to https://railsupport.vercel.app/forgot-password.

- Existing project: `railsupport`, Rage Factory (`prj_POLb696w4WfafDxAMwYMaoSEwE5x`).
- Production deployment: `dpl_2FjYDWcdYaBQbqAvKDpxrpBHa5MA`, READY and promoted.
- Build URL: https://railsupport-9z63kiihr-rage-factory1.vercel.app.
- This is an account-recovery update to the 2.2 community release. No database migration, branch merge or account password changes were performed in production.

## Delivered

- Forgot password link on the account screen and dedicated request/reset pages.
- Resend sender: **Rail Social <noreply@phabfive.com>**. `RESEND_API_KEY` is a Vercel Production Secret; `RAILSOCIAL_EMAIL_FROM` is production configuration. No credential is stored in tracked files.
- Single-use links expire after 30 minutes. Passwords must be 8–128 characters; completing a reset invalidates previous sessions.
- Known and unknown email addresses receive the same response. Reset requests are limited to 3 per minute per client IP and reset submissions to 5 per minute.
- Sending runs in a Next.js `after` background task so the function stays alive without exposing account existence through email-provider timing. Transient provider failures retry once with a stable hashed idempotency key. Logs omit addresses, keys, tokens and provider response bodies.
- Reset pages suppress referrers and indexing. Tokens are removed from the address bar after the form initializes, and are not persisted in browser storage. Reloading that page requires reopening the email link.
- Safe local navigation preserves rail and room invitations through recovery and back to sign-in.

## Verification

- 35/35 automated tests pass, including existing community/room/league checks and the new password recovery tests.
- TypeScript, local Next production build and Vercel production build pass.
- Disposable PGlite/PostgreSQL preview verified the actual Next route, captured email, callback, new-password submission, one-time token consumption, rejection of the old password, acceptance of the new password and revocation of a previously valid session.
- Browser verified request confirmation, callback opening, token removal, retained invitation, accessible labels and the reset layout at a 390px phone width without horizontal overflow.
- Staged production pages returned HTTP 200 with sender configured. A reset request for a nonexistent synthetic address returned the uniform success response without emailing a person. Anonymous sessions remained null.
- Resend accepted a test email from the production sender to its official `delivered@resend.dev` test mailbox. Its sending credential did not permit querying delivery status (HTTP 401), so acceptance is not represented as confirmed inbox delivery.
- After promotion, the canonical domain was inspected and resolved to the new deployment; the live forgot-password form was verified in the browser.

## Remaining account milestones

Confirm a real user's inbox receives the reset message by requesting one through the live form. The user chooses their own password. Email ownership verification, account/session settings and account deletion remain separate planned tasks.

The original October 8 graphical/PDF roadmap files are historical planning artifacts. The Markdown roadmap/checklist now records task 1.2 complete and keeps task 1.1 open pending inbox confirmation.

## Rollback

If required, promote previous production deployment `dpl_9dH2CpmMNHVzU3NeiqrgSZZ5fNXb`. Keep existing user data and verification/session tables intact. A rollback hides the recovery feature but does not undo passwords users may already have reset.
