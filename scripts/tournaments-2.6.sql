-- Additive and rerunnable. Existing private groups and sessions keep their behavior.
ALTER TABLE rail_groups ADD COLUMN IF NOT EXISTS tournament boolean NOT NULL DEFAULT false;
ALTER TABLE rail_groups ADD COLUMN IF NOT EXISTS parent_group_id text REFERENCES rail_groups(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS rail_tournament_chat (
 id text PRIMARY KEY, group_id text NOT NULL REFERENCES rail_groups(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 1000),
 created timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS rail_tournament_chat_group ON rail_tournament_chat(group_id,created,id);

CREATE OR REPLACE FUNCTION rail_tournament_author() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM rail_groups WHERE id=NEW.group_id AND tournament AND owner<>NEW.user_id) THEN
  RAISE EXCEPTION 'Only the tournament player can publish updates.' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rail_tournament_author ON rail_posts;
CREATE TRIGGER rail_tournament_author BEFORE INSERT OR UPDATE ON rail_posts FOR EACH ROW EXECUTE FUNCTION rail_tournament_author();

-- Invitation acceptance and code-based joins both use rail_members. Keep the
-- membership, player follows and tournament watch in the same transaction.
CREATE OR REPLACE FUNCTION rail_tournament_join() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE player text; game text;
BEGIN
 SELECT owner INTO player FROM rail_groups WHERE id=NEW.group_id AND tournament;
 IF player IS NULL OR player=NEW.user_id THEN RETURN NEW; END IF;
 IF NOT rail_unblocked(player,NEW.user_id) THEN RAISE EXCEPTION 'Tournament unavailable.' USING ERRCODE='42501'; END IF;
 INSERT INTO rail_follows(follower_id,followed_id) VALUES(NEW.user_id,player),(player,NEW.user_id) ON CONFLICT DO NOTHING;
 SELECT id INTO game FROM rail_sessions WHERE group_id=NEW.group_id AND user_id=player ORDER BY created LIMIT 1;
 IF game IS NOT NULL THEN INSERT INTO rail_watches(user_id,scope,target_id) VALUES(NEW.user_id,'session',game) ON CONFLICT DO NOTHING; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rail_tournament_join ON rail_members;
CREATE TRIGGER rail_tournament_join AFTER INSERT ON rail_members FOR EACH ROW EXECUTE FUNCTION rail_tournament_join();
