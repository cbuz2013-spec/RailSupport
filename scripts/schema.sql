CREATE TABLE IF NOT EXISTS rail_groups (id text PRIMARY KEY,name text NOT NULL,description text NOT NULL DEFAULT '',kind text NOT NULL,owner text NOT NULL REFERENCES "user"(id),code text UNIQUE NOT NULL,created timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rail_members (group_id text REFERENCES rail_groups(id) ON DELETE CASCADE,user_id text REFERENCES "user"(id) ON DELETE CASCADE,PRIMARY KEY(group_id,user_id));
CREATE TABLE IF NOT EXISTS rail_posts (id text PRIMARY KEY,group_id text NOT NULL REFERENCES rail_groups(id) ON DELETE CASCADE,user_id text NOT NULL REFERENCES "user"(id),kind text NOT NULL CHECK(kind IN ('update','hand')),body text NOT NULL,hand jsonb,tournament jsonb,created timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rail_post_images (post_id text NOT NULL REFERENCES rail_posts(id) ON DELETE CASCADE,position smallint NOT NULL CHECK(position BETWEEN 0 AND 2),mime text NOT NULL CHECK(mime IN ('image/jpeg','image/png','image/webp')),data bytea NOT NULL,PRIMARY KEY(post_id,position));
CREATE INDEX IF NOT EXISTS rail_posts_group_created ON rail_posts(group_id,created DESC);
CREATE TABLE IF NOT EXISTS rail_comments (id text PRIMARY KEY,post_id text NOT NULL REFERENCES rail_posts(id) ON DELETE CASCADE,user_id text NOT NULL REFERENCES "user"(id),body text NOT NULL,created timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rail_likes (post_id text REFERENCES rail_posts(id) ON DELETE CASCADE,user_id text REFERENCES "user"(id),PRIMARY KEY(post_id,user_id));
CREATE TABLE IF NOT EXISTS rail_votes (post_id text REFERENCES rail_posts(id) ON DELETE CASCADE,user_id text REFERENCES "user"(id),choice text NOT NULL CHECK(choice IN ('Fold','Call','Raise')),PRIMARY KEY(post_id,user_id));
CREATE TABLE IF NOT EXISTS rail_profiles (user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,bio text NOT NULL DEFAULT '',photo text NOT NULL DEFAULT '',wsop text NOT NULL DEFAULT '',mspt text NOT NULL DEFAULT '',hendon text NOT NULL DEFAULT '',sharkscope text NOT NULL DEFAULT '',updated timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rail_follows (follower_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,followed_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,created timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(follower_id,followed_id),CHECK(follower_id<>followed_id));
CREATE INDEX IF NOT EXISTS rail_follows_followed ON rail_follows(followed_id);
CREATE TABLE IF NOT EXISTS rail_blocks (blocker_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,blocked_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,created timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(blocker_id,blocked_id),CHECK(blocker_id<>blocked_id));
CREATE INDEX IF NOT EXISTS rail_blocks_blocked ON rail_blocks(blocked_id);

-- Additive Table Talk schema. Independent from private rail posts.
CREATE TABLE IF NOT EXISTS rail_table_posts (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('status','location','news','topic')),
 audience text NOT NULL CHECK(audience IN ('public','friends')),
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 5000),
 location text NOT NULL DEFAULT '' CHECK(char_length(location)<=120),
 created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_table_posts_user_created ON rail_table_posts(user_id,created DESC,id DESC);
CREATE TABLE IF NOT EXISTS rail_table_likes (
 post_id text NOT NULL REFERENCES rail_table_posts(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 PRIMARY KEY(post_id,user_id)
);
CREATE TABLE IF NOT EXISTS rail_table_comments (
 id text PRIMARY KEY, post_id text NOT NULL REFERENCES rail_table_posts(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 2000),
 created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_table_comments_post_created ON rail_table_comments(post_id,created,id);

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
