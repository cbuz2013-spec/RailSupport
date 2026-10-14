# Rail Social 2.9.1 — raised background

Requested October 14, 2026 after the 2.9 release: raise the background artwork into the visible gap at the top of the page.

The image layer is raised by 44% of viewport height on phones and 20% on larger screens. The overlay remains over the complete viewport, the background stays fixed while scrolling, and the surrounding theme color fills the lower area. Both traditional viewport units and stable large-viewport units are provided for browser compatibility.

This release changes styling and the displayed patch version only. No database migration or gameplay changes are included.

Published October 14, 2026 at 1:51 AM EDT. Production build and TypeScript passed. The public URL returned the exact new deployment and all five stylesheets, including the new 20lvh/44lvh image offsets. Live browser inspection at 390px confirmed the cheering crowd and rail now occupy the gap above the composer, in both themes. The original light theme and browser viewport were restored after inspection.

- Code commit: `e4847d2`.
- Deployment: `dpl_9PeUA8mNvQbbBuepLWBWUctH2mRb`.
- Live: https://railsupport.vercel.app.
- Immutable: https://railsupport-18p0k3l3m-rage-factory1.vercel.app.
- Evidence: `tmp/verified-2.9.1-live.json`, `tmp/raised-background-2.9.1.jpg`.
