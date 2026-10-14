-- Rail Social 2.1. Additive and safe to rerun; requires the existing account schema.
CREATE TABLE IF NOT EXISTS rail_rooms (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES "user"(id),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  address text NOT NULL DEFAULT '' CHECK (char_length(address) <= 240),
  website text NOT NULL DEFAULT '' CHECK (char_length(website) <= 400),
  published boolean NOT NULL DEFAULT false,
  created timestamptz NOT NULL DEFAULT now(),
  updated timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_rooms_directory ON rail_rooms (published, lower(name), id);
CREATE INDEX IF NOT EXISTS rail_rooms_owner ON rail_rooms (owner_id);
CREATE TABLE IF NOT EXISTS rail_room_hosts (
  room_id text NOT NULL REFERENCES rail_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accepted boolean NOT NULL DEFAULT false,
  created timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(room_id, user_id)
);
CREATE INDEX IF NOT EXISTS rail_room_hosts_user ON rail_room_hosts (user_id, accepted);
CREATE TABLE IF NOT EXISTS rail_room_follows (
  room_id text NOT NULL REFERENCES rail_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(room_id, user_id)
);
CREATE INDEX IF NOT EXISTS rail_room_follows_user ON rail_room_follows (user_id);
CREATE TABLE IF NOT EXISTS rail_room_announcements (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rail_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
  created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_room_announcements_room ON rail_room_announcements (room_id, created DESC, id DESC);
