import {z} from 'zod';
import {RoomError,type RoomDatabase} from './rooms';
import type {Tournament} from './types';

export type GameFilter='all'|'players'|'rooms'|'rails';
export type ActiveGame={id:string;source:'player'|'room';kind:'tournament'|'cash'|'room';name:string;playerId:string|null;playerName:string|null;groupId:string|null;railName:string|null;roomId:string|null;roomName:string|null;leagueId:string|null;active:boolean;created:string;finishedAt:string|null;private:boolean;followingPlayer:boolean;followingRail:boolean;followingRoom:boolean;tournament:Tournament|null;href:string};
export type ActiveGamesData={games:ActiveGame[];selected:ActiveGame|null;nextOffset:number|null};

export async function activeGames(database:RoomDatabase,userId:string,input:unknown):Promise<ActiveGamesData>{
 const parsed=z.object({filter:z.enum(['all','players','rooms','rails']).default('all'),offset:z.coerce.number().int().min(0).max(10000).default(0),game:z.string().max(100).default('')}).safeParse(input);
 if(!parsed.success)throw new RoomError('Choose a valid game filter.');
 const {filter,offset,game}=parsed.data;
 // Redact in SQL, before private fields reach the response or application logs.
 const rows=(await database.query<Omit<ActiveGame,'href'>>(`WITH games AS (
 SELECT s.id,'player'::text AS source,s.kind,
 CASE WHEN rail_visible_to('session',s.id,$1) THEN s.name ELSE '' END AS name,
 s.user_id AS "playerId",u.name AS "playerName",
 CASE WHEN rail_visible_to('session',s.id,$1) THEN g.id END AS "groupId",
 CASE WHEN rail_visible_to('session',s.id,$1) THEN g.name END AS "railName",
 NULL::text AS "roomId",NULL::text AS "roomName",NULL::text AS "leagueId",s.active,s.created,s.finished_at AS "finishedAt",
 NOT rail_visible_to('session',s.id,$1) AS private,
 EXISTS(SELECT 1 FROM rail_follows WHERE follower_id=$1 AND followed_id=s.user_id) AS "followingPlayer",
 EXISTS(SELECT 1 FROM rail_members m JOIN rail_groups parent ON parent.id=m.group_id WHERE m.user_id=$1 AND m.group_id IN(g.id,g.parent_group_id) AND rail_unblocked($1,parent.owner)) AS "followingRail",
 false AS "followingRoom",
 CASE WHEN rail_visible_to('session',s.id,$1) THEN (SELECT p.tournament FROM rail_posts p WHERE p.session_id=s.id AND p.tournament IS NOT NULL ORDER BY COALESCE(p.edited,p.created) DESC,p.id DESC LIMIT 1) END AS tournament
 FROM rail_sessions s JOIN rail_groups g ON g.id=s.group_id JOIN "user" u ON u.id=s.user_id
 WHERE (s.active OR s.id=$2) AND rail_game_visible_to(s.id,$1)
 UNION ALL
 SELECT e.id,'room','room',e.name,NULL,NULL,NULL,NULL,r.id,r.name,l.id,e.status='active',e.starts,NULL,false,false,false,true,NULL::jsonb
 FROM rail_league_events e JOIN rail_leagues l ON l.id=e.league_id JOIN rail_rooms r ON r.id=l.room_id
 JOIN rail_room_follows f ON f.room_id=r.id AND f.user_id=$1
 WHERE (e.status='active' OR e.id=$2) AND r.published AND NOT l.archived AND rail_unblocked($1,r.owner_id)
 ) SELECT * FROM games WHERE id=$2 OR $3='all' OR ($3='players' AND "followingPlayer") OR ($3='rooms' AND "followingRoom") OR ($3='rails' AND "followingRail")
 ORDER BY (id=$2) DESC,created DESC,id DESC LIMIT 51 OFFSET $4`,[userId,game,filter,offset])).rows;
 const page=rows.slice(0,50).map(g=>({...g,href:g.source==='room'?'/?view=rooms&room='+encodeURIComponent(g.roomId!)+'&league='+encodeURIComponent(g.leagueId!)+'&game='+encodeURIComponent(g.id):g.private?'/?profile='+encodeURIComponent(g.playerId!):'/?group='+encodeURIComponent(g.groupId!)+'&session='+encodeURIComponent(g.id)}));
 return {games:page.filter(g=>g.active),selected:page.find(g=>g.id===game)||null,nextOffset:rows.length>50?offset+50:null};
}
