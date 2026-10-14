-- Additive game snapshots. Previously overwritten values cannot be recovered.
CREATE TABLE IF NOT EXISTS rail_game_updates (
 id bigserial PRIMARY KEY,
 session_id text NOT NULL REFERENCES rail_sessions(id) ON DELETE CASCADE,
 post_id text REFERENCES rail_posts(id) ON DELETE SET NULL,
 stats jsonb NOT NULL,
 created timestamptz NOT NULL DEFAULT clock_timestamp(),
 baseline boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS rail_game_updates_session ON rail_game_updates(session_id,id DESC);
CREATE TABLE IF NOT EXISTS rail_game_photos (
 session_id text PRIMARY KEY REFERENCES rail_sessions(id) ON DELETE CASCADE,
 mime text NOT NULL CHECK(mime IN ('image/jpeg','image/png','image/webp')),
 data bytea NOT NULL CHECK(octet_length(data)<=300000),
 revision text NOT NULL DEFAULT gen_random_uuid()::text,
 updated timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION rail_game_stats(t jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 SELECT COALESCE(jsonb_object_agg(key,value),'{}'::jsonb) FROM jsonb_each(COALESCE(t,'{}'::jsonb))
 WHERE key IN ('chips','bigBlind','remaining','started','paid','stage','status','winnings') AND value<>'null'::jsonb;
$$;

-- One truthful starting point from each game's latest saved update. No replayed events.
INSERT INTO rail_game_updates(session_id,post_id,stats,created,baseline)
 SELECT DISTINCT ON(p.session_id) p.session_id,p.id,rail_game_stats(p.tournament),COALESCE(p.edited,p.created),true
 FROM rail_posts p JOIN rail_sessions s ON s.id=p.session_id AND s.user_id=p.user_id
 WHERE p.tournament IS NOT NULL AND NOT EXISTS(SELECT 1 FROM rail_game_updates u WHERE u.session_id=p.session_id)
 ORDER BY p.session_id,COALESCE(p.edited,p.created) DESC,p.id DESC;

CREATE OR REPLACE FUNCTION rail_capture_game_update() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous jsonb; next_stats jsonb; old_stats jsonb; patch jsonb; field text;
BEGIN
 IF NEW.session_id IS NULL OR NEW.tournament IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.tournament IS NOT DISTINCT FROM OLD.tournament AND NEW.session_id IS NOT DISTINCT FROM OLD.session_id THEN RETURN NEW; END IF;
 -- Serialize snapshots from separate posts in the same game.
 PERFORM 1 FROM rail_sessions WHERE id=NEW.session_id AND user_id=NEW.user_id FOR UPDATE;
 IF NOT FOUND THEN RETURN NEW; END IF;
 SELECT stats INTO previous FROM rail_game_updates WHERE session_id=NEW.session_id ORDER BY id DESC LIMIT 1;
 next_stats:=COALESCE(previous,'{}'::jsonb);
 patch:=rail_game_stats(NEW.tournament);
 IF TG_OP='UPDATE' AND OLD.session_id=NEW.session_id THEN
  old_stats:=rail_game_stats(OLD.tournament);
  FOR field IN SELECT jsonb_object_keys(old_stats) LOOP
   IF NOT patch ? field THEN next_stats:=next_stats-field; END IF;
  END LOOP;
  SELECT COALESCE(jsonb_object_agg(key,value),'{}'::jsonb) INTO patch FROM jsonb_each(patch) WHERE old_stats->key IS DISTINCT FROM value;
 END IF;
 next_stats:=next_stats||patch;
 IF previous IS DISTINCT FROM next_stats THEN
  INSERT INTO rail_game_updates(session_id,post_id,stats) VALUES(NEW.session_id,NEW.id,next_stats);
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rail_game_update ON rail_posts;
CREATE TRIGGER rail_game_update AFTER INSERT OR UPDATE OF tournament,session_id ON rail_posts FOR EACH ROW EXECUTE FUNCTION rail_capture_game_update();
