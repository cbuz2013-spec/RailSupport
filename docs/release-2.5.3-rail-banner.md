# Rail Social 2.5.3 — rail creation banner

Status: deployed to https://railsupport.vercel.app on October 11, 2026.

- Show the Start a rail banner only on My Rails and the selected rail feed, using the same view condition as the My Rails navigation item. It is removed from People, Rooms and Notifications.
- In Dark felt mode, use the existing dark surface, light heading, muted description and a deeper green button with a darker hover treatment. Light-mode appearance and mobile stacking remain unchanged.
- No data, API, permissions or schema changes.

Verification: TypeScript and local production build passed. A transient OneDrive lock on generated build output resolved on retry; no source or user files were removed. Computed text contrast: heading 11.28:1, description 7.16:1, button 6.29:1, hover 4.60:1. No new unit tests were added for this scoped presentational change. Interactive browser verification remains unavailable after the prior automatic approval rejection of local-preview access; no new screenshot or browser test is claimed.

Code: `ccb05daec23c699b441d4803fbc3720b6c749689`.
Target: existing railsupport project, rage-factory1 team, https://railsupport.vercel.app.
Previous production: 2.5.2 / `dpl_9C1uTSUGtdKstyx2j5dP7dyr6ts6`.

Deployment: `dpl_HdR9PJ9bZq3f4DHB8jKf67fmAzY1`.
Immutable URL: https://railsupport-ok8e6oxi2-rage-factory1.vercel.app.
Cloud production build passed (18 seconds). Staged and public homepages returned HTTP 200. Promotion succeeded and inspecting the canonical live domain resolved to this READY production deployment. Immediate error-log query returned no entries; ongoing monitoring/drains were not audited for this patch.
