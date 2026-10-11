# Full card deck and equity sharing release

Deployed and verified October 11, 2026 (America/New_York).

- Production: https://railsupport.vercel.app
- Release commit: `60fb2f672acf86bc9087e480d8a9199bc06ee6c8` on `codex/rail-social-v2.1`.
- Deployment: `dpl_5ZLQdeaVaYxGDq92Yfo57ikro8LU`, https://railsupport-qo0prncia-rage-factory1.vercel.app.
- Clean tracked-source export built successfully on Vercel, including TypeScript and page generation, before promotion. The production URL returned HTTP 200 with this exact deployment ID after promotion.
- Rollback: `dpl_ffTLB8wYNY8FcJpiFjNRfCaa5p2w`, release commit `0579017735fe98203a2448f8ee2ee70cdd39f0b5`.

## Changes

- Shared card picker displays all 52 cards as SVG images grouped by suit. Selected cards disappear from the available deck across players and board; removing or replacing cards restores availability.
- Equity calculator opens a reviewable hand-history draft with current players, board, positions and equity. Destination choices include private rails, followed published rooms and Table Talk (friends or public).
- Drafts preserve optional context, action and questions after failed posting. Successful submission is locked against duplicates and navigates to the destination. Hidden results from source discussions are not copied.
- No database migration.

## Verification

- Existing 54 automated tests and three new equity-sharing tests passed; TypeScript and production builds passed.
- Disposable local database browser checks covered card removal/replacement, five-player selections, composer save/edit/reload, all sharing destinations, permissions, failed-post draft retention and retry. Posting was verified locally.
- Signed-in production browser check confirmed 52 initial card choices, 50 remaining after choosing two aces, unavailable aces for the opponent, successful 24,000-runout equity calculation, and populated share draft.
- Live share menu loaded all three private rails, the followed Poker Dealers Club room, and both Table Talk audiences. No browser console errors observed. No production test post was published.
- Vercel connector could not see the project. The installed Vercel CLI refreshed its existing authentication, verified the correct project/team, built the release and promoted it successfully.
