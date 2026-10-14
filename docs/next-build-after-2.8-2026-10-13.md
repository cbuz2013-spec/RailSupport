# Rail Social — next build after 2.8

Started October 13, 2026 at 7:44 PM EDT.

Last updated October 14, 2026 at 1:23 AM EDT.

Status: implementation and deployment of the complete list authorized October 14, 2026 at 12:53 AM EDT. Preparing version 2.9.0.

## 1. Make input values easy to read

- [x] Increase contrast between input text/numbers and field backgrounds. The Update Stack screenshot shows dark green numbers against dark green fields, making entered values difficult to see.
- [x] Fix all five Update Stack fields: Chips, Current big blind, Players left, Players started, and Players in the money (paid places).
- [x] Use clearly contrasting text and backgrounds consistently in other app input fields affected by the same styling. Keep labels, placeholder text, borders and focus indicators readable.
- [ ] Verify populated and empty fields on phones, including iPhone/Safari and applicable light/dark appearance, with readable values both before and during editing.

Reference: user-provided Update Stack screenshot, received October 13, 2026. Preserve the simple layout and large controls.

## 2. Use Villain labels in hand histories and reviews

Requested October 14, 2026 at 12:38 AM EDT.

- [x] Refer to a single opponent as **Villain** in hand histories and hand reviews.
- [x] When there is more than one opponent, use **Villain 1**, **Villain 2**, and so on.
- [x] Keep each villain's numbering consistent across hand entry, street actions, review summaries and displayed/shared hand histories so their cards and actions remain identifiable.

## 3. Add poker-themed emojis

Requested October 14, 2026 at 12:48 AM EDT.

- [x] **All In** — Poker chips being pushed into the pot.
- [x] **Muck That** — Face-down hole cards being tossed into the muck.
- [x] **Slow Roll** — A deliberately delayed hole-card reveal at the poker table.
- [x] **Chip Shuffling** — Two stacks of poker chips being shuffled together.
- [x] **Tank** — A player thinking over a poker decision, with cards/chips and a clock or thought cue.
- [x] Make the artwork clearly poker-related, distinct and readable at phone emoji size, with clear labels. Custom SVG artwork is implemented and visually inspected.

## 4. Fixed poker-stage background

Requested October 14, 2026 at 12:50 AM EDT. The user requested image creation; app integration is implemented for version 2.9.

- [x] Create a background image featuring a silhouetted poker table and spectator rail, overhead stage lights, and a cheering crowd. Use the app's dark green palette and subdued lighting to support readable foreground content.
- [x] Integrate the image as a background fixed to the viewport: it stays in place while app content scrolls.
- [ ] Preserve readable posts, numbers and input fields over the image. Test mobile/iPhone scrolling, desktop layout and responsive cropping so the table, rail and crowd remain recognizable.

Generated asset: [Poker-stage background v1](../output/imagegen/rail-social-fixed-background-v1.png). [Final prompt and generation record](../output/imagegen/rail-social-fixed-background-v1-prompt.txt). Created with the built-in image-generation tool; integrated as public/poker-stage-v29.webp; deployment pending.

## 5. Compact the top of the app and raise the feed

Requested October 14, 2026 at 12:53 AM EDT, with a phone screenshot showing the tall header and rail controls.

- [x] Place Members, Invite friends and Manage Rail side by side in one row on phones, with readable labels and easy tap targets.
- [x] Reduce height and excess spacing in the app header, rail selection and rail heading so posts start higher on the screen.
- [x] Keep theme switching, notifications, profile, rail selection, posting and chat accessible. Preserve readable content and responsive behavior on narrow screens.

Automatic information extraction from tournament-clock photos remains a separate future idea recorded in the roadmap.

Implementation, production build and 138 tests passed. Browser and physical iPhone checks have not completed; see [release record](release-2.9-mobile-polish.md).
