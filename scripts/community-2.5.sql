-- Additive 2.5 migration. Existing posts, reactions, watches and results are preserved.
ALTER TABLE rail_sessions ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}';
ALTER TABLE rail_room_posts ADD COLUMN IF NOT EXISTS hand jsonb;
ALTER TABLE rail_table_posts ADD COLUMN IF NOT EXISTS hand jsonb;
ALTER TABLE rail_room_announcements ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE rail_leagues ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/New_York';
ALTER TABLE rail_leagues ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE rail_league_players ADD COLUMN IF NOT EXISTS removed boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS rail_street_reactions (
 scope text NOT NULL CHECK(scope IN ('rail','room','table')),post_id text NOT NULL,
 street text NOT NULL CHECK(street IN ('preflop','flop','turn','river')),
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 reaction text NOT NULL CHECK(reaction IN ('heart','nice_hand','donkey','fish','shark','so_sick','all_in','muck_that','slow_roll','chip_shuffle','tank')),
 created timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(scope,post_id,street,user_id)
);
CREATE TABLE IF NOT EXISTS rail_admins (user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE);
-- Bootstrap only the previously authorized room-owner account; no client-side admin grant.
INSERT INTO rail_admins SELECT id FROM "user" WHERE lower(email)='cbuz2013@gmail.com' ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS rail_restrictions (user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,reason text NOT NULL,created timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rail_reports (
 id text PRIMARY KEY,reporter_id text REFERENCES "user"(id) ON DELETE SET NULL,
 scope text NOT NULL,target_id text NOT NULL,reason text NOT NULL,details text NOT NULL DEFAULT '',
 snapshot jsonb NOT NULL DEFAULT '{}',status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','dismissed')),
 resolution text NOT NULL DEFAULT '',created timestamptz NOT NULL DEFAULT now(),updated timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_reports_queue ON rail_reports(status,created DESC);
CREATE TABLE IF NOT EXISTS rail_audit (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,actor_id text,kind text NOT NULL,
 room_id text,group_id text,league_id text,target_id text,details jsonb NOT NULL DEFAULT '{}',created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_audit_league ON rail_audit(league_id,created DESC);
CREATE TABLE IF NOT EXISTS rail_invitation_history (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,invitation_id text NOT NULL,sender_id text,recipient_id text,
 group_id text,room_id text,status text NOT NULL,created timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rail_request_limits (user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,bucket bigint NOT NULL,count integer NOT NULL DEFAULT 1,PRIMARY KEY(user_id,bucket));

CREATE OR REPLACE FUNCTION rail_capture_invitation_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO rail_invitation_history(invitation_id,sender_id,recipient_id,group_id,room_id,status)
 VALUES(NEW.id,NEW.sender_id,NEW.recipient_id,NEW.group_id,NEW.room_id,CASE WHEN TG_OP='INSERT' THEN 'sent' ELSE 'resent' END);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rail_invitation_history_insert ON rail_invitations;
CREATE TRIGGER rail_invitation_history_insert AFTER INSERT OR UPDATE ON rail_invitations FOR EACH ROW EXECUTE FUNCTION rail_capture_invitation_history();

CREATE OR REPLACE FUNCTION rail_capture_league_correction() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d jsonb; league text; room text;
BEGIN
 d:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 IF TG_TABLE_NAME='rail_league_results' THEN SELECT league_id INTO league FROM rail_league_events WHERE id=d->>'event_id';
 ELSE league:=d->>'league_id'; END IF;
 SELECT room_id INTO room FROM rail_leagues WHERE id=league;
 INSERT INTO rail_audit(actor_id,kind,room_id,league_id,target_id,details) VALUES(nullif(current_setting('rail.actor',true),''),'league.'||lower(TG_OP),room,league,COALESCE(d->>'event_id',d->>'id'),jsonb_build_object('table',TG_TABLE_NAME,'before',CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,'after',CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END));
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS rail_league_result_audit ON rail_league_results;
CREATE TRIGGER rail_league_result_audit AFTER INSERT OR UPDATE OR DELETE ON rail_league_results FOR EACH ROW EXECUTE FUNCTION rail_capture_league_correction();
DROP TRIGGER IF EXISTS rail_league_event_audit ON rail_league_events;
CREATE TRIGGER rail_league_event_audit AFTER INSERT OR UPDATE OR DELETE ON rail_league_events FOR EACH ROW EXECUTE FUNCTION rail_capture_league_correction();

CREATE OR REPLACE FUNCTION rail_capture_street_reaction() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO rail_activity_events(scope,target_id,actor_id,kind,detail) VALUES(NEW.scope,NEW.post_id,NEW.user_id,'like',jsonb_build_object('street',NEW.street));
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rail_street_reaction_event ON rail_street_reactions;
CREATE TRIGGER rail_street_reaction_event AFTER INSERT ON rail_street_reactions FOR EACH ROW EXECUTE FUNCTION rail_capture_street_reaction();

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['rail_likes','rail_room_likes','rail_table_likes','rail_comment_likes'] LOOP
 EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',t,t||'_reaction_check');
 EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK(reaction IN (''heart'',''nice_hand'',''donkey'',''fish'',''shark'',''so_sick'',''all_in'',''muck_that'',''slow_roll'',''chip_shuffle'',''tank''))',t,t||'_reaction_check');
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION rail_delete_account_data() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE anonymous text;
BEGIN
 IF EXISTS(SELECT 1 FROM rail_groups WHERE owner=OLD.id) OR EXISTS(SELECT 1 FROM rail_rooms WHERE owner_id=OLD.id) THEN
  RAISE EXCEPTION 'Transfer group and room ownership before deleting your account';
 END IF;
 IF EXISTS(SELECT 1 FROM rail_league_results WHERE user_id=OLD.id) THEN
  anonymous:=gen_random_uuid()::text;
  INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES(anonymous,'Deleted player',anonymous||'@deleted.invalid',false,now(),now());
  INSERT INTO rail_league_players(league_id,user_id,removed) SELECT DISTINCT e.league_id,anonymous,true FROM rail_league_results r JOIN rail_league_events e ON e.id=r.event_id WHERE r.user_id=OLD.id ON CONFLICT DO NOTHING;
  UPDATE rail_league_results SET user_id=anonymous WHERE user_id=OLD.id;
 END IF;
 DELETE FROM rail_comments WHERE user_id=OLD.id;
 DELETE FROM rail_room_comments WHERE user_id=OLD.id;
 DELETE FROM rail_table_comments WHERE user_id=OLD.id;
 DELETE FROM rail_posts WHERE user_id=OLD.id;
 DELETE FROM rail_room_posts WHERE user_id=OLD.id;
 DELETE FROM rail_room_announcements WHERE user_id=OLD.id;
 DELETE FROM rail_table_posts WHERE user_id=OLD.id;
 DELETE FROM rail_likes WHERE user_id=OLD.id;
 DELETE FROM rail_votes WHERE user_id=OLD.id;
 UPDATE rail_reports SET reporter_id=NULL,details='',snapshot='{}'::jsonb WHERE reporter_id=OLD.id OR snapshot->>'user_id'=OLD.id;
 UPDATE rail_audit SET actor_id=NULL,details='{}'::jsonb WHERE actor_id=OLD.id OR details::text LIKE '%'||OLD.id||'%';
 DELETE FROM rail_invitation_history WHERE sender_id=OLD.id OR recipient_id=OLD.id;
 RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS rail_delete_account ON "user";
CREATE TRIGGER rail_delete_account BEFORE DELETE ON "user" FOR EACH ROW EXECUTE FUNCTION rail_delete_account_data();

CREATE TABLE IF NOT EXISTS rail_content_rules (phrase text PRIMARY KEY CHECK(char_length(phrase) BETWEEN 4 AND 100));
INSERT INTO rail_content_rules VALUES('kill yourself'),('i will kill you') ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION rail_filter_content() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE value text;
BEGIN
 value:=lower(coalesce(to_jsonb(NEW)->>'body','')||' '||coalesce(to_jsonb(NEW)->>'hand','')||' '||coalesce(to_jsonb(NEW)->>'bio',''));
 IF EXISTS(SELECT 1 FROM rail_content_rules WHERE strpos(value,phrase)>0) THEN
  RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Community safety filter: please remove harmful language. Contact support if this was a mistake.';
 END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['rail_posts','rail_comments','rail_room_posts','rail_room_comments','rail_table_posts','rail_table_comments','rail_room_announcements','rail_profiles'] LOOP
 EXECUTE format('DROP TRIGGER IF EXISTS rail_text_filter ON %I',t);
 EXECUTE format('CREATE TRIGGER rail_text_filter BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION rail_filter_content()',t);
 END LOOP;
END $$;
