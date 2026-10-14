# Rail Social — next update list

Started October 13, 2026 at 4:13 PM EDT, following release 2.7.0.

Last updated October 13, 2026 at 4:56 PM EDT.

Status: delivered in version 2.8.0, live and verified October 13, 2026 at 4:56 PM EDT. Build and deployment explicitly authorized at 4:25 PM EDT. See [release record](release-2.8-game-history.md).

## 1. Delete rails you own

- [x] Add an owner-only **Delete Rail** button so players can remove old test rails and other rails they created.
- [x] Make the control easy to find and use on both phones and desktop.
- [x] Require a clear confirmation identifying the selected rail and explaining that deleting it permanently removes the rail and its contents for all members. Include a cancel option.
- [x] Enforce ownership on the server. Members who are not the owner retain **Leave group** rather than deletion rights.
- [x] After deletion, remove that rail from navigation and its games from Active Games, then return the user to My Rails. Preserve other rails and user accounts.

## 2. One game-summary graphic with chip history

Requested October 13, 2026 at 4:21 PM EDT, with the tournament post's Update Stack control as the reference.

Clarified at 4:22 PM EDT: keep the graph and all current game information together in **one graphic**.

- [x] Show **one combined graphic/card** for the tournament or cash game containing the chip-history graph, **current stack**, **current big blind**, **current players remaining**, **total players started**, **players in the money** (number of paid places), and **status**. Keep the existing tournament-stage and playing-status information clear within the same graphic.
- [x] Include an **optional photo area within the same graphic**, intended especially for a picture of the live tournament clock. Make taking or uploading a photo easy on a phone, allow replacing/removing it, and let viewers enlarge it to read the clock. Keep the photo within the rail's existing visibility rules.
- [x] Save a timestamped history whenever the player updates their stack, current big blind, player counts, paid places or status, instead of keeping only the latest values.
- [x] Within that graphic, show a simple line graph of **chip count over time** for the specific game. Use chips on the vertical axis and update times on the horizontal axis; the summary numbers always show the latest values.
- [x] Let the player or authorized rail member tap a point to see its date/time and the recorded stack, big blind, player counts, paid places and status. Tournament-only fields remain optional or are omitted for cash games.
- [x] Keep each game's history separate, including updates made through different posts belonging to the same game. Refresh the graph after a saved update and retain history after the game finishes.
- [x] Use large, readable controls on phones. Preserve the rail's existing access rules for the graph and history.
- [x] Start with available recorded values; do not invent historical points for values that were previously overwritten. Show a useful state when only one update exists.

## Future enhancement — import information from a tournament-clock photo

Recorded October 13, 2026 at 4:23 PM EDT for a later update.

- [ ] Explore reading visible tournament information from the attached clock photo, such as blinds, players remaining, total entries and paid places, to prefill an update.
- [ ] Present extracted values for the player to review and correct before saving. Leave unreadable or absent values for manual entry; a tournament-clock photo generally will not contain the player's personal stack.

Future requests for the next update should be appended above; later ideas remain in this future-enhancement section.
