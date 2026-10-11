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

-- Rail Social 2.3. Additive, rerunnable; no historical notifications are replayed.
CREATE TABLE IF NOT EXISTS rail_sessions (
 id text PRIMARY KEY, group_id text NOT NULL REFERENCES rail_groups(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('tournament','cash')), name text NOT NULL DEFAULT '',
 active boolean NOT NULL DEFAULT true, created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_sessions_owner ON rail_sessions(user_id,group_id,created DESC);
ALTER TABLE rail_posts ADD COLUMN IF NOT EXISTS session_id text REFERENCES rail_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS rail_posts_session ON rail_posts(session_id,created DESC);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['rail_posts','rail_comments','rail_table_posts','rail_table_comments','rail_room_posts','rail_room_comments','rail_room_announcements'] LOOP
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS edited timestamptz',t);
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS mentions jsonb NOT NULL DEFAULT ''[]''::jsonb',t);
 END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS rail_watches (
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 scope text NOT NULL CHECK(scope IN ('rail','room','table','announcement','session')),
 target_id text NOT NULL, created timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,scope,target_id)
);
CREATE INDEX IF NOT EXISTS rail_watches_target ON rail_watches(scope,target_id);
CREATE TABLE IF NOT EXISTS rail_room_likes (
 post_id text NOT NULL REFERENCES rail_room_posts(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, PRIMARY KEY(post_id,user_id)
);
CREATE TABLE IF NOT EXISTS rail_comment_likes (
 scope text NOT NULL CHECK(scope IN ('rail','room','table')), comment_id text NOT NULL,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, PRIMARY KEY(scope,comment_id,user_id)
);

-- The transaction that saves an action also saves its event. Failed delivery never loses a post.
CREATE TABLE IF NOT EXISTS rail_activity_events (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text, scope text NOT NULL,target_id text NOT NULL,
 actor_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,kind text NOT NULL,detail jsonb NOT NULL DEFAULT '{}',
 created timestamptz NOT NULL DEFAULT now(), processed timestamptz, lease_until timestamptz, attempts int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS rail_events_pending ON rail_activity_events(created) WHERE processed IS NULL;
CREATE TABLE IF NOT EXISTS rail_notifications (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text, recipient_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 actor_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, event_id text NOT NULL REFERENCES rail_activity_events(id) ON DELETE CASCADE,
 scope text NOT NULL,target_id text NOT NULL,kind text NOT NULL,href text NOT NULL,
 dedupe_key text NOT NULL UNIQUE, created timestamptz NOT NULL DEFAULT now(),read_at timestamptz
);
CREATE INDEX IF NOT EXISTS rail_notifications_inbox ON rail_notifications(recipient_id,created DESC);
CREATE TABLE IF NOT EXISTS rail_push_devices (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 endpoint text NOT NULL UNIQUE,p256dh text NOT NULL,auth text NOT NULL,updated timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rail_push_devices_user ON rail_push_devices(user_id);
CREATE TABLE IF NOT EXISTS rail_push_outbox (
 notification_id text NOT NULL REFERENCES rail_notifications(id) ON DELETE CASCADE,
 device_id text NOT NULL REFERENCES rail_push_devices(id) ON DELETE CASCADE,
 attempts int NOT NULL DEFAULT 0,available_at timestamptz NOT NULL DEFAULT now(),lease_until timestamptz,
 sent_at timestamptz, last_error text, PRIMARY KEY(notification_id,device_id)
);
CREATE INDEX IF NOT EXISTS rail_push_pending ON rail_push_outbox(available_at) WHERE sent_at IS NULL;

CREATE OR REPLACE VIEW rail_activity_content AS
 SELECT 'rail'::text AS scope,id,user_id,group_id,NULL::text AS room_id,session_id,body,NULL::text AS audience,created FROM rail_posts
 UNION ALL SELECT 'room',id,user_id,NULL,room_id,NULL,body,NULL,created FROM rail_room_posts
 UNION ALL SELECT 'table',id,user_id,NULL,NULL,NULL,body,audience,created FROM rail_table_posts
 UNION ALL SELECT 'announcement',id,user_id,NULL,room_id,NULL,body,NULL,created FROM rail_room_announcements
 UNION ALL SELECT 'session',id,user_id,group_id,NULL,id,name,NULL,created FROM rail_sessions
 UNION ALL SELECT 'profile',id,id,NULL,NULL,NULL,name,NULL,NULL::timestamptz FROM "user"
 UNION ALL SELECT 'invitation',i.id,i.sender_id,i.group_id,i.room_id,NULL,COALESCE(g.name,r.name),NULL,i.created FROM rail_invitations i LEFT JOIN rail_groups g ON g.id=i.group_id LEFT JOIN rail_rooms r ON r.id=i.room_id;
CREATE OR REPLACE VIEW rail_activity_comments AS
 SELECT 'rail'::text AS scope,id,post_id,user_id,body,created,edited,mentions FROM rail_comments
 UNION ALL SELECT 'room',id,post_id,user_id,body,created,edited,mentions FROM rail_room_comments
 UNION ALL SELECT 'table',id,post_id,user_id,body,created,edited,mentions FROM rail_table_comments;
CREATE OR REPLACE VIEW rail_activity_likes AS
 SELECT 'rail'::text AS scope,post_id AS target_id,user_id,false AS is_comment FROM rail_likes
 UNION ALL SELECT 'room',post_id,user_id,false FROM rail_room_likes
 UNION ALL SELECT 'table',post_id,user_id,false FROM rail_table_likes
 UNION ALL SELECT scope,comment_id,user_id,true FROM rail_comment_likes;

CREATE OR REPLACE FUNCTION rail_unblocked(a text,b text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT NOT EXISTS(SELECT 1 FROM rail_blocks WHERE (blocker_id=a AND blocked_id=b) OR (blocker_id=b AND blocked_id=a))
$$;
CREATE OR REPLACE FUNCTION rail_visible_to(s text,t text,viewer text) RETURNS boolean LANGUAGE plpgsql STABLE AS $$
DECLARE c record; room_record record; is_host boolean;
BEGIN
 SELECT * INTO c FROM rail_activity_content WHERE scope=s AND id=t;
 IF NOT FOUND OR NOT rail_unblocked(viewer,c.user_id) THEN RETURN false; END IF;
 IF s='profile' THEN RETURN true; END IF;
 IF s='invitation' THEN
  RETURN EXISTS(SELECT 1 FROM rail_invitations i LEFT JOIN rail_groups g ON g.id=i.group_id LEFT JOIN rail_rooms r ON r.id=i.room_id
   WHERE i.id=t AND viewer IN (i.sender_id,i.recipient_id) AND i.created>now()-interval '30 days' AND rail_unblocked(i.sender_id,i.recipient_id)
   AND ((g.id IS NOT NULL AND rail_unblocked(i.recipient_id,g.owner) AND rail_unblocked(i.sender_id,g.owner) AND EXISTS(SELECT 1 FROM rail_members WHERE group_id=g.id AND user_id=i.sender_id))
   OR (r.published AND rail_unblocked(i.recipient_id,r.owner_id) AND rail_unblocked(i.sender_id,r.owner_id) AND (r.owner_id=i.sender_id OR EXISTS(SELECT 1 FROM rail_room_hosts WHERE room_id=r.id AND user_id=i.sender_id AND accepted) OR EXISTS(SELECT 1 FROM rail_room_follows WHERE room_id=r.id AND user_id=i.sender_id)))));
 END IF;
 IF s IN ('rail','session') THEN
  RETURN EXISTS(SELECT 1 FROM rail_members m JOIN rail_groups g ON g.id=m.group_id WHERE m.group_id=c.group_id AND m.user_id=viewer AND rail_unblocked(viewer,g.owner));
 ELSIF s='table' THEN
  RETURN c.user_id=viewer OR c.audience='public' OR (EXISTS(SELECT 1 FROM rail_follows WHERE follower_id=viewer AND followed_id=c.user_id) AND EXISTS(SELECT 1 FROM rail_follows WHERE follower_id=c.user_id AND followed_id=viewer));
 ELSE
  SELECT * INTO room_record FROM rail_rooms WHERE id=c.room_id;
  is_host:=room_record.owner_id=viewer OR EXISTS(SELECT 1 FROM rail_room_hosts WHERE room_id=room_record.id AND user_id=viewer AND accepted);
  RETURN is_host OR (room_record.published AND rail_unblocked(viewer,room_record.owner_id));
 END IF;
END $$;
CREATE OR REPLACE FUNCTION rail_can_comment(s text,t text,viewer text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT rail_visible_to(s,t,viewer) AND (s IN ('rail','table') OR (s='room' AND EXISTS(
  SELECT 1 FROM rail_activity_content c JOIN rail_rooms r ON r.id=c.room_id WHERE c.scope=s AND c.id=t AND
  (r.owner_id=viewer OR EXISTS(SELECT 1 FROM rail_room_hosts WHERE room_id=r.id AND user_id=viewer AND accepted) OR EXISTS(SELECT 1 FROM rail_room_follows WHERE room_id=r.id AND user_id=viewer)))))
$$;

CREATE OR REPLACE FUNCTION rail_capture_activity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d jsonb; previous jsonb; scope_name text; event_kind text; target text; actor text; detail jsonb;
BEGIN
 d:=to_jsonb(NEW); previous:=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
 scope_name:=TG_ARGV[0]; event_kind:=TG_ARGV[1]; actor:=d->>TG_ARGV[2]; target:=d->>TG_ARGV[3];
 IF scope_name='comment' THEN scope_name:=d->>'scope'; END IF;
 detail:=jsonb_build_object('id',d->>'id','comment',TG_ARGV[1]='comment','mentions',COALESCE(d->'mentions','[]'::jsonb),'previousMentions',COALESCE(previous->'mentions','[]'::jsonb));
 IF TG_OP='UPDATE' THEN
  IF scope_name='rail' AND event_kind='post' AND
    ROW(d->'tournament'->'chips',d->'tournament'->'bigBlind',d->'tournament'->'remaining') IS DISTINCT FROM
    ROW(previous->'tournament'->'chips',previous->'tournament'->'bigBlind',previous->'tournament'->'remaining') THEN event_kind:='stack';
  ELSIF (COALESCE(d->'mentions','[]'::jsonb)-ARRAY(SELECT jsonb_array_elements_text(COALESCE(previous->'mentions','[]'::jsonb)))) <> '[]'::jsonb THEN event_kind:='mention';
  ELSE RETURN NEW; END IF;
 END IF;
 INSERT INTO rail_activity_events(scope,target_id,actor_id,kind,detail) VALUES(scope_name,target,actor,event_kind,detail);
 RETURN NEW;
END $$;

-- Post edits emit only new mentions or changed stack metrics; ordinary copy edits do not spam followers.
DROP TRIGGER IF EXISTS rail_activity ON rail_posts;
CREATE TRIGGER rail_activity AFTER INSERT OR UPDATE ON rail_posts FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('rail','post','user_id','id');
DROP TRIGGER IF EXISTS rail_activity ON rail_room_posts;
CREATE TRIGGER rail_activity AFTER INSERT OR UPDATE ON rail_room_posts FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('room','post','user_id','id');
DROP TRIGGER IF EXISTS rail_activity ON rail_table_posts;
CREATE TRIGGER rail_activity AFTER INSERT OR UPDATE ON rail_table_posts FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('table','post','user_id','id');
DROP TRIGGER IF EXISTS rail_activity ON rail_room_announcements;
CREATE TRIGGER rail_activity AFTER INSERT OR UPDATE ON rail_room_announcements FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('announcement','post','user_id','id');
DROP TRIGGER IF EXISTS rail_activity ON rail_comments;
CREATE TRIGGER rail_activity AFTER INSERT OR UPDATE ON rail_comments FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('rail','comment','user_id','post_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_room_comments;
CREATE TRIGGER rail_activity AFTER INSERT OR UPDATE ON rail_room_comments FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('room','comment','user_id','post_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_table_comments;
CREATE TRIGGER rail_activity AFTER INSERT OR UPDATE ON rail_table_comments FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('table','comment','user_id','post_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_likes;
CREATE TRIGGER rail_activity AFTER INSERT ON rail_likes FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('rail','like','user_id','post_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_room_likes;
CREATE TRIGGER rail_activity AFTER INSERT ON rail_room_likes FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('room','like','user_id','post_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_table_likes;
CREATE TRIGGER rail_activity AFTER INSERT ON rail_table_likes FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('table','like','user_id','post_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_comment_likes;
CREATE TRIGGER rail_activity AFTER INSERT ON rail_comment_likes FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('comment','comment_like','user_id','comment_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_follows;
CREATE TRIGGER rail_activity AFTER INSERT ON rail_follows FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('profile','follow','follower_id','followed_id');
DROP TRIGGER IF EXISTS rail_activity ON rail_sessions;
CREATE TRIGGER rail_activity AFTER INSERT ON rail_sessions FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('session','session','user_id','id');
DROP TRIGGER IF EXISTS rail_activity ON rail_invitations;
CREATE TRIGGER rail_activity AFTER INSERT ON rail_invitations FOR EACH ROW EXECUTE FUNCTION rail_capture_activity('invitation','invitation','sender_id','id');

-- Additive and rerunnable. Existing likes become hearts without replaying notifications.
ALTER TABLE rail_likes ADD COLUMN IF NOT EXISTS reaction text NOT NULL DEFAULT 'heart' CHECK(reaction IN ('heart','nice_hand','donkey','fish','shark'));
ALTER TABLE rail_room_likes ADD COLUMN IF NOT EXISTS reaction text NOT NULL DEFAULT 'heart' CHECK(reaction IN ('heart','nice_hand','donkey','fish','shark'));
ALTER TABLE rail_table_likes ADD COLUMN IF NOT EXISTS reaction text NOT NULL DEFAULT 'heart' CHECK(reaction IN ('heart','nice_hand','donkey','fish','shark'));
ALTER TABLE rail_comment_likes ADD COLUMN IF NOT EXISTS reaction text NOT NULL DEFAULT 'heart' CHECK(reaction IN ('heart','nice_hand','donkey','fish','shark'));
CREATE OR REPLACE VIEW rail_activity_reactions AS
 SELECT 'rail'::text AS scope,post_id AS target_id,user_id,false AS is_comment,reaction FROM rail_likes
 UNION ALL SELECT 'room',post_id,user_id,false,reaction FROM rail_room_likes
 UNION ALL SELECT 'table',post_id,user_id,false,reaction FROM rail_table_likes
 UNION ALL SELECT scope,comment_id,user_id,true,reaction FROM rail_comment_likes;

-- Rail Social 2.5
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
 reaction text NOT NULL CHECK(reaction IN ('heart','nice_hand','donkey','fish','shark','so_sick')),
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
 EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK(reaction IN (''heart'',''nice_hand'',''donkey'',''fish'',''shark'',''so_sick''))',t,t||'_reaction_check');
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
