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
