# Green and white theme QA — October 9, 2026

final result: passed

## Scope and source

The user selected option 1, Ivory Clubhouse: green actions, white cards, warm ivory background, and gold brand details. This is a palette update to the existing functional application, not a replacement of its navigation or room features.

Source visual truth: `output/design/rail-social-colors-1-ivory.png` (853 × 1844 pixels). The reference was displayed at 390 × 844 CSS pixels beside the working app. The real app was rendered in a 390 × 844 outer iframe (388 × 842 content area), at 1× browser density. The browser viewport override did not apply to the background tab, so a temporary same-origin local review page provided the responsive viewport; it was removed before deployment.

Desktop verification used the existing 1280 × 720 viewport. Full-page captures include scrolling content. All local accounts, posts, rails, and rooms were synthetic in a disposable database.

## Evidence and comparison

- Combined source/implementation comparison: `output/design/green-white-comparison.png` (1265 × 959 pixels). Both sides are visible together, with normalized display width.
- Desktop private feed: `output/design/green-white-feed-desktop.png`.
- Phone People screen after the fix: `output/design/green-white-people-mobile.png`.
- Phone password recovery: `output/design/green-white-recovery-mobile.png`.
- Phone focused dialog and form controls: `output/design/green-white-dialog-mobile.png`.

The combined full-view comparison confirmed the palette, header, action states, and navigation treatment. Focused checks of the form and dialog screenshots confirmed label contrast, borders, primary buttons, and the visible keyboard focus ring. The source is a simplified color study; the implementation intentionally retains the existing room heading, emblem, invite-link and member-invite buttons, league section, and six navigation destinations. It does not introduce the mockup's unimplemented room Like control or sample follower count.

## Findings and iteration history

1. The first comparison found no palette or image fidelity blocker. Phone People testing revealed a P2 issue: the existing generic mobile page-title rule hid the text-only Refresh button. Added `.community-page .page-title .outline` with a readable 12px label and padding.
2. Recaptured the same People route at the same responsive size. `green-white-people-mobile.png` now shows Refresh clearly. Search returned Alex M.; content width and scroll width were both 388px, without horizontal overflow. No actionable P0/P1/P2 finding remains.

## Required fidelity surfaces

- **Fonts/typography:** Retained DM Sans for body/UI and Barlow Condensed for display headings. Dark forest foregrounds, readable secondary text, larger phone post text, labels and metadata. Existing hierarchy is retained; the color study's simplified heading structure is an intentional scope difference.
- **Spacing/layout rhythm:** Existing responsive layout preserved. White cards have subtle borders and shadows, with ivory surrounding space. Room hero now uses the open ivory treatment. Phone forms and dialogs fit the available width, with visible navigation and focus controls.
- **Colors/tokens:** Ivory `#f6f3eb`, white `#ffffff`, forest text `#1c332b`, green actions `#226448`, muted text `#596760`, gold details `#86621f`. Green action contrast against white is approximately 7:1. Error states keep distinct red semantics. Browser color scheme and theme color are light.
- **Image quality/assets:** A transparent light-background version of the existing Rail Social logo was generated from the original, retaining the people/rail/spade mark and lettering. Gold Rail and forest Social remain visible on white; the original logo is preserved. Existing user imagery is unaffected. Embedded external Spot Solver keeps its own theme.
- **Copy/content:** Application copy, permissions, data and workflows retained. Only synthetic local content was used for verification. No invented production metrics or demo accounts were added.

## Functional verification

- Production Next.js build passed, including TypeScript and page generation.
- Full automated suite: 35 passed, 0 failed.
- Local browser: signed in, opened Fab Five, navigated room directory and Traveling Dealers, published a synthetic room post successfully, searched People, opened the odds dialog, and viewed password recovery.
- Browser error log: no console errors recorded during the final review.
- React review: no hooks, fetching, state or permission changes; image dimensions/alt text retained, theme viewport typed with Next.js Viewport, and semantic buttons/forms remain intact.
- The final CSS-only Refresh-label fix is included in the remote production build before release.

## Implementation checklist

- [x] Replace dark surfaces and pale text with shared light semantic tokens.
- [x] Apply palette to private rails, rooms, People, leagues, forms and dialogs.
- [x] Add the matching light-background logo to navigation and authentication.
- [x] Verify desktop, phone, focus and selected states.
- [x] Resolve the mobile Refresh-label finding.
- [x] Build and run the existing regression suite.

Residual limits: the external Study Tools application has its own theme; this release does not redesign it. Mobile verification covers responsive browser rendering, not a physical-device installation.
