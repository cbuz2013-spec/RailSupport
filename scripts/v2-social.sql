-- Rail Social 2.0 additive migration. Run after the existing v1 schema.
CREATE TABLE IF NOT EXISTS rail_profiles (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  photo text NOT NULL DEFAULT '',
  wsop text NOT NULL DEFAULT '',
  mspt text NOT NULL DEFAULT '',
  hendon text NOT NULL DEFAULT '',
  sharkscope text NOT NULL DEFAULT '',
  updated timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rail_follows (
  follower_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  followed_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(follower_id,followed_id),
  CHECK(follower_id<>followed_id)
);
CREATE INDEX IF NOT EXISTS rail_follows_followed ON rail_follows(followed_id);
CREATE TABLE IF NOT EXISTS rail_blocks (
  blocker_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  blocked_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(blocker_id,blocked_id),
  CHECK(blocker_id<>blocked_id)
);
CREATE INDEX IF NOT EXISTS rail_blocks_blocked ON rail_blocks(blocked_id);
CREATE TABLE IF NOT EXISTS rail_post_images (
  post_id text NOT NULL REFERENCES rail_posts(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK(position BETWEEN 0 AND 2),
  mime text NOT NULL CHECK(mime IN ('image/jpeg','image/png','image/webp')),
  data bytea NOT NULL,
  PRIMARY KEY(post_id,position)
);
