# Rail Social 2.9.0 — mobile layout and poker polish

Authorized October 14, 2026 at 12:53 AM EDT. Live and publicly verified October 14 at 1:38 AM EDT.

## Changes

- A single compact app header holds the logo, theme switch, notifications and profile. Members, Invite and Manage Rail share one row on phones. Tighter rail, composer and feed spacing brings content higher while retaining large action buttons.
- Update Stack and shared form inputs use explicit contrasting text/background colors, including Safari text fill and autofill. Dark values have 15.30:1 contrast; light values have 12.06:1. Placeholder contrast is 9.55:1 dark and 5.53:1 light.
- Hand entry, street actions, review tables, calculator and shared summaries use Villain for one opponent and numbered Villains for several. Stored player identifiers remain stable.
- All In, Muck That, Slow Roll, Chip Shuffling and Tank use custom poker SVG artwork. All five work on posts, comments and hand streets.
- The generated poker table, spectator rail, cheering crowd and stage lights form a fixed viewport background. The optimized WebP is 53,238 bytes; foreground surfaces preserve readability.

## Verification

- Production build and TypeScript checks passed.
- 138 tests passed, including new reaction authorization/persistence/replacement/removal, migration replay, accessible reaction picker interaction, and Villain renumbering.
- Isolated HTTP verification passed at 1:17 AM EDT: all five reactions on posts/comments/streets, removal, unauthorized and nonmember denial, invalid-value rejection, served stylesheet and image.
- New SVG artwork and the compressed background were visually inspected.
- Authenticated live browser inspection at 390px width subsequently passed: compact header, Members/Invite/Manage Rail on one row, light/dark appearance, populated dark Update Stack values, all five reaction picker entries, and Villain labels in existing hand tables/actions. Inspected existing records without saving edits or reactions. Localhost inspection had timed out; physical iPhone/Safari checks remain pending.
- React review: small pure SVG components, shared display labels, no new network waterfalls or dependencies, existing accessible button names/focus behavior preserved.

## Database and deployment

Target: Vercel `rage-factory1/railsupport`, project `prj_POLb696w4WfafDxAMwYMaoSEwE5x`, canonical URL https://railsupport.vercel.app.

The production build receives the one-time `RAILSOCIAL_RUN_POKER_REACTIONS_MIGRATION=true` flag and verified direct database hostname `ep-jolly-silence-b5j4rbqz.c-7.us-east-2.aws.neon.tech`. The migration expands five reaction check constraints inside a transaction without changing existing reaction records. The runner verifies the production environment, host and resulting constraints before committing. Ordinary builds skip migrations.

Neon branch rehearsal executed the current schema and migration twice in a 173-statement savepoint transaction. All five constraints expanded successfully; rolling back restored 19 posts, four memberships and the original test schema. Production baseline at about 1:06 AM EDT: seven posts, six memberships, four groups, one session, four post/comment reactions, two street reactions and seven game-history entries.

Photo information extraction remains a future idea and is outside this release.

## Published release evidence

- Code commit: `f24bdb7`, pushed to `codex/rail-social-v2.1`.
- Deployment: `dpl_319Uq1V4ZTEEm58AGVofjPkj4s8e`.
- Immutable URL: https://railsupport-fsd8g0zo4-rage-factory1.vercel.app.
- Staged verification passed at 1:35 AM EDT; public verification passed at 1:38 AM EDT. Both returned HTTP 200 for the exact deployment, all ten JavaScript bundles and five stylesheets, expected 401 responses from protected APIs, and 404 for an invalid invitation. Public background returned the expected WebP and exact byte count.
- Production migration verified all five expanded constraints; counts remained seven posts, six memberships, four groups, one session, four post/comment reactions, two street reactions and seven history entries.
- Initial deployment log inspection found no 5xx requests. Nine error-level entries contained the existing PostgreSQL client's future SSL-mode compatibility warning; no application exception appeared in those entries.
- Local evidence: `tmp/verified-2.9-staged.json`, `tmp/verified-2.9-live.json`, `tmp/release-2.9-http-result.json`, `tmp/compact-header-2.9.jpg`, `tmp/stack-fields-2.9.jpg`.

## Working preference

The user requested a build/deployment progress checklist and visible browser work for deployments on October 14, 2026 at 1:16 AM EDT. Keep timestamped communications and show completed, current and remaining deployment stages.
