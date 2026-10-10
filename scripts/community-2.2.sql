-- Additive Rail Social 2.2 community and league schema.
CREATE TABLE IF NOT EXISTS rail_invitations (
 id text PRIMARY KEY, sender_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 recipient_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 group_id text REFERENCES rail_groups(id) ON DELETE CASCADE,
 room_id text REFERENCES rail_rooms(id) ON DELETE CASCADE,
 created timestamptz NOT NULL DEFAULT now(),
 CHECK ((group_id IS NULL) <> (room_id IS NULL)), CHECK(sender_id<>recipient_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS rail_invitation_group ON rail_invitations(recipient_id,group_id) WHERE group_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS rail_invitation_room ON rail_invitations(recipient_id,room_id) WHERE room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS rail_invitation_recipient ON rail_invitations(recipient_id,created DESC);
CREATE TABLE IF NOT EXISTS rail_room_posts (
 id text PRIMARY KEY, room_id text NOT NULL REFERENCES rail_rooms(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id), body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 5000),
 created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_room_posts_feed ON rail_room_posts(room_id,created DESC,id DESC);
CREATE TABLE IF NOT EXISTS rail_room_comments (
 id text PRIMARY KEY, post_id text NOT NULL REFERENCES rail_room_posts(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id), body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 2000),
 created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_room_comments_feed ON rail_room_comments(post_id,created DESC,id DESC);
CREATE TABLE IF NOT EXISTS rail_leagues (
 id text PRIMARY KEY, room_id text NOT NULL REFERENCES rail_rooms(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(char_length(name) BETWEEN 2 AND 100),
 rules text NOT NULL DEFAULT '' CHECK(char_length(rules)<=5000),
 active boolean NOT NULL DEFAULT true, created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_leagues_room ON rail_leagues(room_id,created DESC);
CREATE TABLE IF NOT EXISTS rail_league_players (
 league_id text NOT NULL REFERENCES rail_leagues(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 PRIMARY KEY(league_id,user_id)
);
CREATE TABLE IF NOT EXISTS rail_league_events (
 id text PRIMARY KEY, league_id text NOT NULL REFERENCES rail_leagues(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(char_length(name) BETWEEN 2 AND 100), starts timestamptz NOT NULL,
 details text NOT NULL DEFAULT '' CHECK(char_length(details)<=2000),
 status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS rail_league_events_schedule ON rail_league_events(league_id,starts,id);
CREATE TABLE IF NOT EXISTS rail_league_results (
 event_id text NOT NULL REFERENCES rail_league_events(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id),
 place integer NOT NULL CHECK(place BETWEEN 1 AND 100000),
 points numeric(10,2) NOT NULL CHECK(points BETWEEN 0 AND 1000000),
 PRIMARY KEY(event_id,user_id)
);
