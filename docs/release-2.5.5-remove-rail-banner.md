# Rail Social 2.5.5 — remove the rail-creation banner

Deployed October 11, 2026 to https://railsupport.vercel.app.

Removed the large Bring your people together / Start a rail banner from all views and removed its unused light/dark CSS. The existing New rail button remains inside the My Rails page header only, with its existing behavior. This supersedes the banner placement and color treatment in 2.5.3. No API, schema or saved-data changes.

Validation: local production build, TypeScript and cloud production build passed (Vercel reports 20 seconds). Staged and public homepages returned HTTP 200. The canonical live domain resolves to the exact READY deployment below. Published application scripts contain V2.5.5 and New rail, with no create-rail-banner or Bring your people together markup. Source review confirms New rail remains in the groups/My Rails view branch. No new tests were added for this narrow markup/CSS removal. Interactive browser verification was not repeated after the earlier automatic approval block; no new browser or device test is claimed.

Immediate error-log scan returned two instances of the existing PostgreSQL SSL-mode deprecation warning, with no application exception in the returned results. Drains and ongoing monitoring were not audited.

- Code: `e05691da3de3340a0fdd810f45d3a464f0ce36e6`.
- Branch: `codex/rail-social-v2.1`, repository `cbuz2013-spec/RailSupport`.
- Target: `rage-factory1/railsupport`, production.
- Deployment: `dpl_5vUAg6MZbNZVk2aJ9KZu9uZLw86V`.
- Immutable URL: https://railsupport-5tsnyygsa-rage-factory1.vercel.app.
- Previous production: 2.5.4 / `dpl_Bi1gUQBTLeGZhrKp4FX4BK4SDFcU`.
