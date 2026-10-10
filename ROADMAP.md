# Rail Social product roadmap

Updated October 7, 2026. **Current release: Rail Social 2.2, deployed to production.** Room Pages now include community conversations and league management. Milestone numbers below follow the original September 25 roadmap; they are not software version numbers.

Live site: https://railsupport.vercel.app

[Historical October 6 roadmap visual](docs/rail-social-roadmap-2026-10-06.png). The table below reflects the current release.

| Milestone | Scope | Status |
| --- | --- | --- |
| 1. Vision | Private poker community for players and backers | Complete |
| 2. Player platform | Accounts, feed, hand-review foundation; expanded in 2.0 with private rails, profiles, follows, photos, blocks, and odds | Complete and deployed |
| 3. Spot Solver integration | Embedded Spot Solver and hand import | Complete and deployed |
| **4. Room Pages** | **Room profiles and hosts; expanded with follower posts/comments, invitations, and leagues** | **Complete in 2.1; community expansion deployed in 2.2 — October 7, 2026** |
| **5. Tournaments** | **QR join, live stacks, hands, and event chat** | **League schedules, rosters, results and standings delivered in 2.2; tournament-specific live features remain planned** |
| 6. Monetization | Advertising, sponsors, and Free, Standard, and Premium room plans | Planned; no ads or payments activated |
| 7. Growth tools | Push notifications, live video, and analytics | Planned |
| 8. Pilot rooms | Three to five rooms; measure adoption | Planned |
| 9. Room apps | White-label branded apps and managed service | Planned |

## Room Pages completed in 2.1

- Searchable directory and room profiles with shareable links.
- Draft and published pages, room follows, and host announcements.
- Approved room creators, owner controls, and co-host invitations with acceptance.
- Access checks that preserve private-rail separation and draft privacy.
- Production database migration and initial room-creator approval.

## Community beta completed in 2.2

- People directory with display-name search, follows, followers and mutual friends.
- Rail invitation links preserved through account creation/sign-in, opening the accepted rail.
- In-app rail and room invitations with recipient acceptance and a pending-invitation indicator.
- Room followers can invite others, post, and comment. Authors remove their own content; hosts moderate.
- Room league seasons, scoring rules, self-enrollment, game scheduling, editable results and standings.
- Production migration, recovery branch, automated tests, signed-in local HTTP checks, and desktop/mobile browser verification.

Password recovery remains pending domain and email-sender setup. Published Room Pages require sign-in. Room follows do not yet send notifications. Paid plans, live tournament tools, growth tools, broader pilot rollout, and branded apps remain future work.

The 2.2 production build and signed-out checks passed. The social/room/league permission flows passed local HTTP acceptance tests, and headless Edge verified the invitation handoffs and key member/host screens with synthetic local accounts. Real-member production flows were not impersonated. See [Community 2.2 release notes](COMMUNITY-2.2.md).

## Business direction

Players use Rail Social free. The planned room business includes subscriptions, paid push campaigns, promoted events and sponsors, and managed branded room apps. These are future offerings, not services activated by the 2.1 release.

Source: the September 25, 2026 planning email, “RailSupport — Funding Visual, Roadmap & Room Tier Pricing,” and the verified October 6 production release. See [Room Pages release notes](ROOM-PAGES-2.1.md).
