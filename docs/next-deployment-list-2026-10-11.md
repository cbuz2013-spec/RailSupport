# Rail Social — next deployment list

Implemented and deployed October 11, 2026 as Rail Social **2.4**, on the existing app. Production commit: `d63baab9b4d5a28e3edf38e479fa515ba78d9e21`. [Release and verification record](rail-social-2.4-release-2026-10-11.md).

## 1. Poker reactions

- [x] Replace the requested Join rail reaction area with a heart that opens optional poker reactions.
- [x] Include a custom hooded poker player saying **Nice hand**, a **donkey**, a **fish** and a **shark**, plus the heart.
- [x] Give each reaction a readable label, selected state and count. Allow a member to change or remove their reaction. Support touch and keyboard use without relying on hover.
- [x] Keep reaction alerts compatible with notification preferences and existing privacy/blocking rules.
- [x] Replace Join rail visually with the heart/reaction control and retain a separate **Follow rail** control for notification subscriptions. This mapping was confirmed by the user. Reactions must not silently change rail membership or notification subscriptions; preserve existing follows.
- [x] Make **Reaction, Follow, Comments and Reply** uniform buttons wherever these actions appear: matching height, shape, icon size, label typography, padding and spacing, in that order. Use consistent selected, hover, focus and disabled states in both themes. Keep counts aligned without changing button height, and maintain comfortable touch targets on mobile.

## 2. Hand-review display and street frames

Display the hand in this order:

1. **Event / game header:** tournament name and blinds/ante, or Cash Game and stakes.
2. **Game situation:** your stack in big blinds; players left / total players; tournament level. Show the relevant fields for the chosen game type.
3. **Your hand:** hole-card images, position, equity and stack in BB.
4. **Opponents:** each player's hole-card images, position, equity and stack in BB; retain support for up to four opponents.

- [x] Add an optional **total players** field alongside players remaining.
- [x] Support explicit stack units and a numeric big blind so stacks can display accurately in BB. Accept stacks already entered in BB. Do not guess a conversion from missing, zero or ambiguous blinds; preserve the original value and leave the BB amount unspecified.
- [x] Give **Preflop, Flop, Turn and River** separate horizontally scrollable frames.
- [x] Each frame shows its board, player details, available equities and that street's action/notes.
- [x] Calculate equity independently using only the board known on that street: 0, 3, 4 or 5 cards. Later board cards must not influence earlier-street calculations. Label estimated versus exact results and account for ties.
- [x] Show unknown hands or missing streets clearly without inventing cards, equities or changing stacks based on free-text notes. All form fields remain optional.
- [x] Make navigation obvious: visible street tabs, previous/next arrows, **Swipe to view streets**, and a **1 of 4**-style indicator. Support touch swiping and keyboard navigation.
- [x] Keep event information visible while moving between street frames, and retain image attachments, editing/deletion and existing hidden-result behavior.

## 3. Light and dark felt themes

- [x] Put a clearly labeled light/dark toggle at the top of every page, including account and sign-in/recovery pages.
- [x] Retain the green-and-white light theme.
- [x] Make dark mode use deep green **poker felt** with a subtle texture and readable contrasting text/cards/controls.
- [x] Remember the chosen theme across page changes and reloads. Avoid a flash of the wrong theme on load.
- [x] Apply the theme consistently to posts, street frames, forms, dialogs, notifications, rooms, leagues, people and the equity calculator.

## Implementation and release order

1. Implement reaction storage, permissions and artwork/UI, with the confirmed separate Follow rail notification control.
2. Extend optional hand metadata for total players and stack units; preserve compatibility with existing posts.
3. Build per-street equity snapshots and the ordered player display, then the swipeable frames.
4. Add the global theme preference and light/dark felt styling.
5. Verify optional/legacy hands, missing boards/blinds, multiway ties, photo retention, reaction changes/removal, subscriptions, theme persistence and mobile/keyboard accessibility. Build, deploy and verify the exact production release when requested.

Completed October 11, 2026. Existing broader roadmap goals remain separate. Physical-device photo and push checks remain tracked in ROADMAP.md.
