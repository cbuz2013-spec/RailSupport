-- Additive 2.7 upgrade. Existing posts and historical notifications are preserved.
ALTER TABLE rail_sessions ADD COLUMN IF NOT EXISTS finished_at timestamptz;
CREATE INDEX IF NOT EXISTS rail_sessions_active ON rail_sessions(created DESC,id) WHERE active;
ALTER TABLE rail_league_events DROP CONSTRAINT IF EXISTS rail_league_events_status_check;
ALTER TABLE rail_league_events ADD CONSTRAINT rail_league_events_status_check CHECK(status IN ('scheduled','active','completed','cancelled'));

-- This reveals only a player's game existence/status. Private post access still
-- requires membership through the existing 'session' visibility check.
CREATE OR REPLACE FUNCTION rail_game_visible_to(game text,viewer text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM rail_sessions s JOIN rail_groups g ON g.id=s.group_id
 WHERE s.id=game AND rail_unblocked(viewer,s.user_id) AND rail_unblocked(viewer,g.owner)
 AND (s.user_id=viewer OR EXISTS(SELECT 1 FROM rail_follows f WHERE f.follower_id=viewer AND f.followed_id=s.user_id)
 OR EXISTS(SELECT 1 FROM rail_members m JOIN rail_groups parent ON parent.id=m.group_id WHERE m.user_id=viewer AND m.group_id IN (g.id,g.parent_group_id) AND rail_unblocked(viewer,parent.owner))));
$$;

CREATE OR REPLACE VIEW rail_activity_content AS
 SELECT 'rail'::text AS scope,id,user_id,group_id,NULL::text AS room_id,session_id,body,NULL::text AS audience,created FROM rail_posts
 UNION ALL SELECT 'room',id,user_id,NULL,room_id,NULL,body,NULL,created FROM rail_room_posts
 UNION ALL SELECT 'table',id,user_id,NULL,NULL,NULL,body,audience,created FROM rail_table_posts
 UNION ALL SELECT 'announcement',id,user_id,NULL,room_id,NULL,body,NULL,created FROM rail_room_announcements
 UNION ALL SELECT 'session',id,user_id,group_id,NULL,id,name,NULL,created FROM rail_sessions
 UNION ALL SELECT 'game',id,user_id,NULL,NULL,id,''::text,NULL,created FROM rail_sessions
 UNION ALL SELECT 'profile',id,id,NULL,NULL,NULL,name,NULL,NULL::timestamptz FROM "user"
 UNION ALL SELECT 'invitation',i.id,i.sender_id,i.group_id,i.room_id,NULL,COALESCE(g.name,r.name),NULL,i.created FROM rail_invitations i LEFT JOIN rail_groups g ON g.id=i.group_id LEFT JOIN rail_rooms r ON r.id=i.room_id;

CREATE OR REPLACE FUNCTION rail_visible_to(s text,t text,viewer text) RETURNS boolean LANGUAGE plpgsql STABLE AS $$
DECLARE c record; room_record record; is_host boolean;
BEGIN
 SELECT * INTO c FROM rail_activity_content WHERE scope=s AND id=t;
 IF NOT FOUND OR NOT rail_unblocked(viewer,c.user_id) THEN RETURN false; END IF;
 IF s='game' THEN RETURN rail_game_visible_to(t,viewer); END IF;
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

CREATE OR REPLACE FUNCTION rail_tournament_finished() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.active AND NOT NEW.active THEN
  NEW.finished_at:=now();
  IF NEW.kind='tournament' THEN
   INSERT INTO rail_activity_events(scope,target_id,actor_id,kind) VALUES('game',NEW.id,NEW.user_id,'tournament_finish');
  END IF;
 ELSIF NOT OLD.active AND NEW.active THEN NEW.finished_at:=NULL;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rail_tournament_finished ON rail_sessions;
CREATE TRIGGER rail_tournament_finished BEFORE UPDATE OF active ON rail_sessions FOR EACH ROW EXECUTE FUNCTION rail_tournament_finished();
