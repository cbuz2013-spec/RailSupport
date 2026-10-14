# Rail Social next version plan

Authorized and implemented October 11, 2026. Release 2.5 has passed 79 automated tests and a production build; production promotion is complete. Build on the existing 2.4 application, accounts, posts and groups.

**Implementation authorized:** The user asked to build and deploy, including roadmap stages 1–3. League scoring remains host-entered points with shared ranks. See the release record for verification and outstanding provider/device checks.

## Navigation and phone home-screen branding

- [x] Replace the separate **My Rail** and **Groups** bottom-menu entries with one **My Rails** entry. Keep existing groups, memberships and game sessions accessible through the consolidated destination; this is a navigation change, not removal of group functionality.
- [x] Use the **Rail Social logo** for the app icon saved to a phone's home screen instead of the single R. Cover the installed web app's manifest icons and the iPhone home-screen icon, with readable sizing and safe padding. Manifest and asset references verified; physical-device installation and cached-icon refresh remain to verify.

## Reactions and wording

- [x] Add a sixth reaction: a sick face with a speech bubble above it reading **So sick**. Retain Heart, Nice hand, Donkey, Fish and Shark.
- [x] Change the post button label from **Follow rail** to **Follow this post**. Preserve existing subscriptions and the matching action-button design.
- [x] Give each street's action section its own reaction picker and counts, separate from the overall post. This separation was explicitly confirmed. Members can add, change or remove their street reaction.
- [x] Preserve content visibility, blocking and notification preferences for street reactions. Alerts should identify the street they refer to; changing a reaction must not send duplicate alerts.
- [x] Let members open reaction counts or a reaction summary to see **who reacted and which reaction each person chose**. Apply consistently to overall posts, street actions and other existing reaction surfaces. Respect content access and blocking; changing or removing a reaction updates the visible list and counts.

## Start a game rail inside a private group

The user confirmed that Tournament/Cash Game describes a game session inside an existing private group such as PhabFive. Creating a private group remains a separate action.

| Choice | Optional setup details |
| --- | --- |
| Tournament | Event name, location, buy-in, guarantee and starting stack |
| Cash Game | Location, stakes and buy-in |

Use a prominent **Start a rail** entry for this game-session flow. Keep the existing invitation and notification capabilities. A hand review linked to the session can reuse its event information without requiring the user to type it again; copied information remains editable. Starting stack and the player's current stack are separate values.

## Hand review screen order

All detail fields and screens are optional and skippable. Back retains entries. Keep up to four opponents, the full 52-card selector, image attachments, edit/delete controls and hidden results.

| Screen | Content |
| --- | --- |
| 1. Game type | What were you playing? Tournament or Cash Game. |
| 2. Event or game details | Tournament: name, location and starting stack. Cash: location, stakes and buy-in. Reuse linked session details where available. |
| 3. Current situation | Optional blinds/ante, level, remaining/total players where relevant; one hero stack with Chips / Big blinds selector. No duplicate hero-stack editor or conversion panel. |
| 4. Preflop | Your hole cards and position, opponent hands/positions/stacks (up to four), and preflop action on one screen. |
| 5. Flop | Up to three flop cards and flop action on one screen. |
| 6. Turn | Turn card and turn action, with the earlier board visible. |
| 7. River | River card and river action, with the earlier board visible. |
| 8. Context and notes | Free-text context, extra notes, question, optional images and hidden result. |
| 9. Review and publish | Preview the post's table frames, then publish. |

The user confirmed this combined street-entry order after release 2.5.1; it is deployed in 2.5.2. Existing Check/Bet/Call/Fold/Raise controls remain ordered by entered seats, with notes and sizes optional.

Equities remain inside the published street frames when enough cards are known. Missing values stay unknown. A skipped flop or turn never shifts a later card into an earlier slot; separate optional board metadata preserves those gaps. Legacy saved hands and calculator imports remain supported. See [2.5.2 release evidence](release-2.5.2-street-entry.md).

## Equity calculator to hand review

- [x] Make **Share hand** at the bottom of the equity calculator open the hand-review flow directly, beginning with **Tournament or Cash Game**, then the relevant optional questions above.
- [x] Import the calculator's existing player hands, positions and board into the hand-review draft, plus any other compatible details already entered. Preserve up to four opponents and keep imported fields editable; do not make the user select the same cards again.
- [x] Preserve compatible equity results with their calculation context; edits must invalidate stale results. Each published street still uses only the board known at that street, rather than copying final-board equity into earlier streets.
- [x] Keep the imported draft through forward/back navigation and optional skips. Finish through the hand-review preview and destination selection before publishing; opening Share hand must not publish a post automatically.

## Published hand review

- [x] Replace each street's stacked player rows with a familiar oval poker-table layout, using Rail Social styling and the existing equity-table component as the starting point.
- [x] Place each player around the table with their hole cards, stack, position and that street's equity. Keep seating in poker position order and the user's seat at the bottom; unknown positions remain unspecified.
- [x] Put the tournament name, blinds/ante, level and players remaining/starting field in the middle of the table with the relevant community cards. Cash frames show cash-game stakes and omit tournament-only values.
- [x] Retain horizontally scrollable **Preflop, Flop, Turn and River** frames with visible tabs, arrows, swipe guidance and a frame indicator. Each uses only the community cards known at that street.
- [x] Place the street's action below its table, followed by its own reaction buttons. Keep the overall post reactions separate.
- [x] Place general context and additional notes below the street sequence, with retained images and hidden-result behavior.
- [x] Support the five-player table and central information in both themes; a two-player 390-pixel review was browser-verified, while the full device/accessibility audit remains. Do not infer folds or changing stack sizes from free-text action.

## Implementation order and checks

Implemented in this order for release 2.5; remaining verification limits are recorded below.

1. Consolidate bottom navigation into My Rails and update phone home-screen icons to the Rail Social logo.
2. Add So sick and the button wording; preserve existing reaction and follow records.
3. Extend session/event metadata and the Tournament/Cash Game setup flow.
4. Split the hand-review wizard into the agreed optional screens and carry session details forward.
5. Connect the calculator's Share hand action to that wizard with imported cards, positions, board and compatible details.
6. Extend the poker-table layout for published street frames.
7. Add per-street reaction storage, permissions, counts and notification handling, plus lists showing who reacted across reaction surfaces.
8. Verify consolidated navigation, phone icons, calculator import/back navigation, optional skips, existing saved hands/photos, BB units, all four street equities, four opponents, reaction identity/access/counts, mobile layouts and both themes. Build and deploy when requested.

Retained subscription behavior: following a session-linked post currently subscribes to that game session. The confirmed request changes the button wording; it does not yet explicitly change that notification scope. Do not silently drop existing session follows.

## Accounts, safety and complete community controls (stages 1–3)

Implemented for 2.5: verification/resend, secure email/password changes, session sign-out, atomic account deletion with ownership protection and anonymized league history; content/user/comment reports, moderator decisions and audit history, account restrictions, text screening, write limits, validated uploads, support/privacy/rules pages; group leave/removal/ownership transfer, invite withdrawal/resend/history, room ownership transfer and announcement pinning; league time zones, roster removal, archived seasons and correction history.

Verification: 79 automated tests pass; TypeScript and production build pass; isolated browser checks cover game setup, invitations and a ten-screen tournament review with mobile poker-table street equities. A Neon snapshot restore finalized a replacement production branch. The original was retained and a comparison of all existing records found no content loss; see the release record for the branch IDs and exact comparison.

Still unverified or external: actual inbox receipt, physical iOS/Android photo orientation and home-screen icon refresh, comprehensive assistive-technology audit, advanced image-content screening. Daily snapshot scheduling is unavailable on the current Neon project (provider returned not enabled); manual snapshot and tested restore are available. Do not mark these entire roadmap stages complete yet.
