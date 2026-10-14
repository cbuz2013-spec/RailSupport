# Rail Social 2.9.1 — raised background

Requested October 14, 2026 after the 2.9 release: raise the background artwork into the visible gap at the top of the page.

The image layer is raised by 44% of viewport height on phones and 20% on larger screens. The overlay remains over the complete viewport, the background stays fixed while scrolling, and the surrounding theme color fills the lower area. Both traditional viewport units and stable large-viewport units are provided for browser compatibility.

This release changes styling and the displayed patch version only. No database migration or gameplay changes are included. Validation: production build plus inspection of the served stylesheet and live browser. Deployment evidence will be added after publication.
