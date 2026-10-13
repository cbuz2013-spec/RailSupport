# Rail Social next build list

Requested October 13, 2026; consolidated for user review. **Implementation and live deployment authorized October 13, 2026 at 2:21 PM EDT.** Implemented for version 2.6; see release-2.6-tournament-rails.md for verification details and the visual-browser test limitation.

## Actions within a private rail

- [x] **New Post** opens a basic composer with only text and picture attachment options. Allow text, pictures or both; do not show tournament, chip-count, hand-review or game-setup fields in this flow.
- [x] Keep **Tournament Update** and **Discuss a Hand** as separate actions for their respective specialized options.
- [x] Keep the game-starting action. Rename the current **Cash Game Rail** entry to **New Game**. Its tournament flow uses **Start Tournament** to create the dedicated tournament rail described below, keeping the current private-rail context.

## Start Tournament and dedicated tournament rails

- [x] **Start Tournament** opens a simple setup form with **Event information**, **Buy-in**, **Starting stack**, **Location** and **Prize guarantee**. Every field is optional; the player can continue with all of them blank.
- [x] Completing or skipping the optional setup automatically creates a dedicated rail for that tournament and opens an invitation step asking **Who would you like to invite?**
- [x] Provide the agreed stack, current big blind, remaining/starting player counts, tournament-stage and active-status controls for the new tournament. Keep the event's starting stack distinct from the player's current chip count. Retain the three quick controls described below.
- [x] Make the creating player the owner of the tournament's update feed. Only that player can publish the normal updates and change their stack, player counts, tournament stage, playing status or winnings.
- [x] Followers of the tournament rail can read and comment on those updates. They cannot publish their own top-level updates into the player's tournament feed or change the player's tournament information.
- [x] Include a separate **real-time chat** within the tournament rail for followers and the player to discuss the tournament, socialize and talk trash. Messages should appear as they arrive without requiring a manual refresh.
- [x] Keep the player's update feed and follower chat visually distinct. Prefer a chat panel on the right on larger screens; use an easy-to-reach separate chat area or tab on phones. Preserve large, simple controls.
- [x] Keep chat and update/comment access within the tournament rail's membership and visibility rules.

The product goal is to keep followers engaged throughout the player's tournament and support future ad-placement opportunities. Record that goal for layout planning; ad integration or activation is not part of this release.

## Invite codes and new user signup

- [x] Let the inviting player share a tournament invite code with someone who does not yet have a Rail Social account.
- [x] Opening or entering the invite code prompts a new user to create an account through a simple form. Preserve the invitation through signup and sign-in so the user does not have to find or enter it again.
- [x] On successful signup and joining through the invitation, automatically add the user to the invited tournament rail, follow the tournament and follow its player. Open that tournament rail afterward.
- [x] When the invited person joins, automatically have the inviting player follow that person back. These follows happen when they join, not when the invitation is sent.
- [x] Briefly explain the automatic tournament/player follows and follow-back in the invitation/signup flow, keeping the process simple.
- [x] Existing users can sign in and join through the same code without creating another account. Retrying or reopening an accepted invitation must not create duplicate memberships or follows.

## Basic posting and simpler tournament updates

- [x] Arrange the tournament update screen in this order:
  1. **Update text** at the very top.
  2. **Attach image**, optional.
  3. **Chip count**, optional.
  4. **Current big blind**, optional.
  5. **Players left**, optional.
  6. **Players started**, optional.
  7. **Status**, retained.
- [x] Add players started to saved tournament updates and display remaining/starting counts together, for example **24 out of 73**. Do not require both values to submit an update.
- [x] Use the rail the member is already posting within. Remove the **Tournament or cash game rail (optional)** selector and **Start a new tournament rail or cash rail** controls from this update screen.
- [x] Remove the bottom **Event / game** and **Name (optional)** entry fields from this update screen. Existing rail/session details supply the context.
- [x] Simplify the screen with large, clearly labeled buttons, easy touch targets and a straightforward mobile layout. Optional details must not get in the way of a basic text post.

These removals apply to the tournament update form. Keep the separate **New Game** action and existing rails, sessions and saved details.

## Quick controls on tournament posts

Keep three large, adjacent controls on the post showing the player's stack and tournament counts:

- [x] **Update Stack** stays and opens only four fields: **Chips**, **Current big blind**, **Players left** and **Players started**. Show the remaining/starting counts together on the post, for example **24 out of 73**.
- [x] Next to Update Stack, add a **tournament-stage button** whose label shows the selected stage: **Registration**, **Reg Closed**, **In the Money** or **Final Table**. Let the posting player change the stage from this control.
- [x] Next to the stage button, add a **Status** control with **Still Playing** and **Busted** options. When Busted is selected, allow an optional winnings amount (how much the player made).
- [x] Keep stack/count changes, tournament stage and player status independently editable. Changing one must preserve the other values and the post's text and pictures.
- [x] Keep the three controls together and easy to tap on a phone, with readable labels and no cramped buttons.

## Release checks

- [x] A text-only post and a text-only tournament update can be submitted without chip/player fields or an image.
- [x] **New Post** shows only text and picture options. **Tournament Update** and **Discuss a Hand** still open their separate specialized flows.
- [x] The former **Cash Game Rail** entry reads **New Game**, remains available and starts a game inside the current private rail.
- [x] Text appears first, image attachment second, with the optional counts below and Status retained.
- [x] Entering 24 players left and 73 players started saves and displays **24 out of 73**, including after editing or reloading.
- [x] Posting within a rail keeps that destination without asking the member to select or create another rail.
- [x] Buttons and fields are easy to use on a phone; existing posts and rail/session information remain intact.
- [x] **Update Stack** exposes only the four count fields and preserves values after saving and reloading.
- [x] Each tournament-stage choice saves and appears as the stage button's label.
- [x] **Still Playing** and **Busted** save correctly; Busted supports an optional winnings amount. Updating stage/status preserves the stack, counts, text and pictures.
- [x] **Start Tournament** shows all five optional setup fields. Continuing with any or all fields blank creates the tournament rail and offers the invitation step; stack/blind/stage/status controls are available afterward.
- [x] In a tournament rail, only the creating player can publish top-level updates or change tournament information. Followers can comment and chat; enforce these permissions on the server as well as in the interface.
- [x] Chat messages arrive on an authorized stream without manual refresh and remain separate from the player’s update feed. Responsive desktop and phone layouts are implemented; authenticated visual-browser verification was unavailable.
- [x] A new user can use an invite code, complete the simple signup form and arrive in the correct tournament rail, following its player and tournament, with the inviting player following them back.
- [x] Existing-user invite acceptance and repeated attempts preserve the correct memberships and follows without duplicates; sending an unaccepted invite does not create follows.
