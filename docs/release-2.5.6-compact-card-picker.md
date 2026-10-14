# Rail Social 2.5.6 — compact card picker

Deployed October 11, 2026 to https://railsupport.vercel.app.

The shared card picker now has seven fixed columns: a full suit displays seven cards followed by six. This applies to hand reviews and the equity calculator in both themes. Flexible columns and zero minimum card width prevent the previous 44px minimum from forcing a third row or horizontal overflow; card controls retain at least 44px height and their aspect ratio. The deck caps at 484px on wider screens. Selected/unavailable-card behavior is unchanged.

Local and cloud production builds and TypeScript passed; Vercel reports a 20-second build. Staged and live homepages returned HTTP 200. The canonical live domain resolves to the exact READY deployment below, and its published CSS contains repeat(7,minmax(0,1fr)) with only a gap adjustment at the mobile breakpoint. No new unit tests were added for this CSS-only layout change. Interactive browser/device testing was not repeated after the prior automatic approval block; no new screenshot or visual browser test is claimed. No API, database or environment changes were required.

- Code: `8c7a00274010dff81c11753af7512b605709d823`.
- Branch: `codex/rail-social-v2.1`, repository `cbuz2013-spec/RailSupport`.
- Target: `rage-factory1/railsupport`, production.
- Deployment: `dpl_QPeZrZEhgZQ3nhtNaAe4KuionHya`.
- Immutable URL: https://railsupport-f54lcw9yu-rage-factory1.vercel.app.
- Previous production: 2.5.5 / `dpl_5vUAg6MZbNZVk2aJ9KZu9uZLw86V`.

Immediate error-log scan returned two instances of the existing PostgreSQL SSL-mode deprecation warning, with no application exception in the returned results. Drains and ongoing monitoring were not audited.
