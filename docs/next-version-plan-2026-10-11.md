# Rail Social next version plan

Authorized and implemented October 11, 2026. Release 2.5 has passed 79 automated tests and a production build; production promotion is pending. Build on the existing 2.4 application, accounts, posts and groups.

**Implementation authorized:** The user asked to build and deploy, including roadmap stages 1–3. League scoring remains host-entered points with shared ranks. See the release record for verification and outstanding provider/device checks.

## Navigation and phone home-screen branding

- [ ] Replace the separate **My Rail** and **Groups** bottom-menu entries with one **My Rails** entry. Keep existing groups, memberships and game sessions accessible through the consolidated destination; this is a navigation change, not removal of group functionality.
- [ ] Use the **Rail Social logo** for the app icon saved to a phone's home screen instead of the single R. Cover the installed web app's manifest icons and the iPhone home-screen icon, with readable sizing and safe padding. Check both new installations and icon refresh behavior for existing installations.

## Reactions and wording

- [ ] Add a sixth reaction: a sick face with a speech bubble above it reading **So sick**. Retain Heart, Nice hand, Donkey, Fish and Shark.
- [ ] Change the post button label from **Follow rail** to **Follow this post**. Preserve existing subscriptions and the matching action-button design.
- [ ] Give each street's action section its own reaction picker and counts, separate from the overall post. This separation was explicitly confirmed. Members can add, change or remove their street reaction.
- [ ] Preserve content visibility, blocking and notification preferences for street reactions. Alerts should identify the street they refer to; changing a reaction must not send duplicate alerts.
- [ ] Let members open reaction counts or a reaction summary to see **who reacted and which reaction each person chose**. Apply consistently to overall posts, street actions and other existing reaction surfaces. Respect content access and blocking; changing or removing a reaction updates the visible list and counts.

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
| 3. Current situation | Tournament: blinds/ante, level, your current stack in BB, players remaining and total players who started. Cash: current stack in BB and any changed blinds/stakes; no tournament-only fields. |
| 4. Players | Your hole cards and position first, then each opponent's cards, position and stack. Add/remove opponents, up to four. Keep your current stack editable here without duplicating it as a separate value. |
| 5. Board | Separate Flop, Turn and River card slots on one screen. Each street may be left blank. |
| 6. Flop action | Optional action entry for the flop. |
| 7. Turn action | Optional action entry for the turn. |
| 8. River action | Optional action entry for the river. |
| 9. Context and notes | Free-text context, extra notes, question, optional images and hidden result. |
| 10. Review and publish | Preview the post's table frames, then publish. |

Keep the existing optional preflop action data. A dedicated skippable **Preflop action** screen before Flop action is recommended for the next discussion; the user has not yet confirmed that additional screen.

Equities remain available inside the street frames when enough cards are known, so a mandatory separate equity screen does not interrupt this sequence. Missing values stay unknown. Direct BB entry should avoid unnecessary chip-conversion fields; chip/currency conversion remains available with explicit compatible units and a valid big blind.

## Equity calculator to hand review

- [ ] Make **Share hand** at the bottom of the equity calculator open the hand-review flow directly, beginning with **Tournament or Cash Game**, then the relevant optional questions above.
- [ ] Import the calculator's existing player hands, positions and board into the hand-review draft, plus any other compatible details already entered. Preserve up to four opponents and keep imported fields editable; do not make the user select the same cards again.
- [ ] Preserve compatible equity results with their calculation context; edits must invalidate stale results. Each published street still uses only the board known at that street, rather than copying final-board equity into earlier streets.
- [ ] Keep the imported draft through forward/back navigation and optional skips. Finish through the hand-review preview and destination selection before publishing; opening Share hand must not publish a post automatically.

## Published hand review

- [ ] Replace each street's stacked player rows with a familiar oval poker-table layout, using Rail Social styling and the existing equity-table component as the starting point.
- [ ] Place each player around the table with their hole cards, stack, position and that street's equity. Keep seating in poker position order and the user's seat at the bottom; unknown positions remain unspecified.
- [ ] Put the tournament name, blinds/ante, level and players remaining/starting field in the middle of the table with the relevant community cards. Cash frames show cash-game stakes and omit tournament-only values.
- [ ] Retain horizontally scrollable **Preflop, Flop, Turn and River** frames with visible tabs, arrows, swipe guidance and a frame indicator. Each uses only the community cards known at that street.
- [ ] Place the street's action below its table, followed by its own reaction buttons. Keep the overall post reactions separate.
- [ ] Place general context and additional notes below the street sequence, with retained images and hidden-result behavior.
- [ ] Fit the five-player table and central information on mobile in both light and dark felt modes. Do not infer folds or changing stack sizes from free-text action.

## Implementation order and checks

This is the proposed order for when implementation is requested; all work below is currently on hold.

1. Consolidate bottom navigation into My Rails and update phone home-screen icons to the Rail Social logo.
2. Add So sick and the button wording; preserve existing reaction and follow records.
3. Extend session/event metadata and the Tournament/Cash Game setup flow.
4. Split the hand-review wizard into the agreed optional screens and carry session details forward.
5. Connect the calculator's Share hand action to that wizard with imported cards, positions, board and compatible details.
6. Extend the poker-table layout for published street frames.
7. Add per-street reaction storage, permissions, counts and notification handling, plus lists showing who reacted across reaction surfaces.
8. Verify consolidated navigation, phone icons, calculator import/back navigation, optional skips, existing saved hands/photos, BB units, all four street equities, four opponents, reaction identity/access/counts, mobile layouts and both themes. Build and deploy when requested.

Before implementation, review the current subscription behavior: following a session-linked post currently subscribes to that game session. The confirmed request changes the button wording; it does not yet explicitly change that notification scope. Do not silently drop existing session follows.

## Accounts, safety and complete community controls (stages 1–3)

Implemented for 2.5: verification/resend, secure email/password changes, session sign-out, atomic account deletion with ownership protection and anonymized league history; content/user/comment reports, moderator decisions and audit history, account restrictions, text screening, write limits, validated uploads, support/privacy/rules pages; group leave/removal/ownership transfer, invite withdrawal/resend/history, room ownership transfer and announcement pinning; league time zones, roster removal, archived seasons and correction history.

Verification: 79 automated tests pass; TypeScript and production build pass; isolated browser checks cover game setup, invitations and a ten-screen tournament review with mobile poker-table street equities. A Neon snapshot was restored to a separate branch and the additive migration preserved all original account/post/group counts.

Still unverified or external: actual inbox receipt, physical iOS/Android photo orientation and home-screen icon refresh, comprehensive assistive-technology audit, advanced image-content screening. Daily snapshot scheduling is unavailable on the current Neon project (provider returned not enabled); manual snapshot and tested restore are available. Do not mark these entire roadmap stages complete yet.
