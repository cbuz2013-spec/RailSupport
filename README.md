# RailSupport V1 — Buz Trio

Separate from Circle Pilot. Original Circle source and deployment have not been changed.

## V1

- Responsive private rails for friends/family, study groups, and backers.
- Text updates and tournament snapshots (event, chips, big blind, players remaining, status).
- Completed NL Hold’em hand posts, cards, action, question, fold/call/raise votes, and author-controlled result reveal.
- Comments, reactions, group creation/joining, author-only post deletion.
- Generated final-table rail silhouette background in `public/final-table-rail.png`.
- Independent email/password account integration using Better Auth and PostgreSQL. No ChatGPT dependency.

## Current deployment state

The completed V1 has not been published. Vercel rejected production deployment because the connected account lacks deployment permission for the project. A Vercel owner must provide an authorized project/account before publishing. Local production build and TypeScript checks pass; browser and database end-to-end checks remain pending.

**Interactive preview, not yet a connected multiuser pilot.** No database credentials were available for a separate RailSupport database. `RAILSUPPORT_READY` is false by default. The UI uses fictional sample activity and explicitly labels it. Preview actions exist in React memory only, reset on reload, and are never shared. Preview does not collect passwords. No real private data is bundled in this repository.

## Run

`npm ci`, then `npm run dev`. Production check: `npm run typecheck && npm run build`.

## Activate shared testing

1. Create a dedicated Neon/PostgreSQL database for RailSupport. Do not reuse DealerFlow tables or credentials.
2. Configure `DATABASE_URL`, a random `BETTER_AUTH_SECRET` (at least 32 bytes), and `BETTER_AUTH_URL` equal to the exact deployed HTTPS origin in Vercel environment settings. Never place secrets in client code or source archives.
3. With the same environment configured locally, run `npm run db:setup` once. It applies Better Auth migrations and the bounded application schema.
4. Verify sign-up, sign-in, private-group separation, invitation joins, result hiding, and delete authorization with two disposable test accounts on an isolated test database.
5. Set `RAILSUPPORT_READY=true` and redeploy once checks pass.

Authentication uses secure cookies in production and database-backed authentication rate limiting. Application requests validate a server-side session and rail membership. Writes validate request origin. Hidden hand results are stripped from server responses to nonauthors until revealed. Group invite codes are high-entropy bearer invitations; share only with intended members.

## Limitations / follow-up

- Email verification and self-service password reset are not yet configured; connect an email service before expanding beyond a trusted pilot.
- Membership removal and invite rotation, uploads, push notifications, pagination beyond the latest 100 posts, and moderation/reporting are not included in V1.
- Add application write throttling and operational monitoring before public signup.
- Spot Solver tools, advertising, paid memberships, and payments are explicitly planned, not active.
- No live-hand advice, real-money games, or staking transactions.
- Domain `railsupportpoker.com` was not purchased or connected.

## Artwork

Created using built-in image generation. Prompt: cinematic wide silhouette of spectators on the rail at a poker final table, seen from behind, seated players beyond, charcoal haze and muted antique-gold overhead lighting, dark negative space above, realistic proportions, no identifiable faces, text, logos, watermarks, or UI. Source asset is retained in the project.
