-- Expand the reaction vocabulary without changing existing reactions or notifications.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['rail_likes','rail_room_likes','rail_table_likes','rail_comment_likes','rail_street_reactions'] LOOP
  EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',t,t||'_reaction_check');
  EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK(reaction IN (''heart'',''nice_hand'',''donkey'',''fish'',''shark'',''so_sick'',''all_in'',''muck_that'',''slow_roll'',''chip_shuffle'',''tank''))',t,t||'_reaction_check');
 END LOOP;
END $$;
