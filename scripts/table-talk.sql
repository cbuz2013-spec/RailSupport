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
