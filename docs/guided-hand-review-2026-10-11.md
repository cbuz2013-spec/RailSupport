# Guided hand review — production release

Deployed and verified October 11, 2026 (America/New_York).

- Production: https://railsupport.vercel.app
- Source commit: `64d00f6b7ab2bf49d2ef63db2997586406026d20` on `codex/rail-social-v2.1`.
- Deployment: `dpl_8EcGcmF6jokB79E8q88EseqJP6TU`, https://railsupport-8tnf6h77h-rage-factory1.vercel.app.
- Clean committed-source export built on Vercel with production settings, then passed an HTTP check before promotion. Vercel reported READY and completed the build in 10 seconds.
- Rollback: `dpl_5ZLQdeaVaYxGDq92Yfo57ikro8LU`, source commit `60fb2f672acf86bc9087e480d8a9199bc06ee6c8`.

## Screen order

1. **Game type:** two prominent buttons for Tournament and Cash Game; choosing either advances to details. Skip remains available.
2. **Game details:** blinds, your stack and opponents' stacks. Tournament adds ante, tournament name, level and players remaining. Every field is optional.
3. **Cards and opponents:** full 52-card image selector, optional positions, board and up to four opponents. Unknown or partially known hands can be posted; duplicate cards cannot.
4. **Equity:** table view and player percentages after entering complete known hands. Incomplete hands can skip calculation. Card changes clear old results. Stacks/positions are labels; ranges and side pots are not calculated.
5. **Action and notes:** quick notes or separate action by street, optional pot and question. Switching styles retains both drafts; only the selected style is published.
6. **Review and share:** summary, optional context, up to three images with previews/removal, and optional hidden result. Photos stay attached when navigating Back/Continue and when saving/editing.

No individual field is required; completely empty posts remain blocked. The existing private-rail permissions and image pipeline are retained. Review data uses the existing hand JSON field, with no database migration. Legacy discussions still load, and calculator sharing retains guided-review details.

## Verification

- 34 targeted tests passed across hand-review validation, activity/database save/edit, equity calculation and sharing.
- Disposable local database browser checks: cash details, full deck, positions, known-hand equity, both action styles, image attach/save/reopen, image removal controls, tournament fields, four-opponent limit, and skipping all card/equity/action fields.
- Changing a card cleared saved equity in the browser. A 320-pixel card screen and 390-pixel review screen had no modal horizontal overflow. No browser console errors were observed.
- Final local and Vercel production builds passed, including TypeScript validation and page generation.
- After promotion, the live domain returned HTTP 200 with the exact new deployment ID. The signed-in production browser showed the six-screen wizard, all approved tournament fields, cash-specific details, 52 initial card choices, optional navigation through equity/action and the three-photo attachment field.
- No production test post was submitted. No browser console errors were observed. Runtime error-level logs contained PostgreSQL driver warnings about future SSL-mode semantics; no application exception was present in that scan. A separate 5xx request-log check found no failed server requests for this deployment.

Local preview captures: `tmp/browser/review-step-1.png` and `tmp/browser/review-attachments.png`. Live capture: `tmp/browser/guided-review-live-64d00f6.png`.
