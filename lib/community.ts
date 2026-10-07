import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {type RoomDatabase, RoomError} from './rooms';

const id=z.string().min(1).max(100);
const text=(max:number)=>z.string().trim().min(1).max(max);
const leagueFields={name:z.string().trim().min(2).max(100),rules:z.string().trim().max(5000)};
const eventFields={name:z.string().trim().min(2).max(100),starts:z.iso.datetime({offset:true}),details:z.string().trim().max(2000),status:z.enum(['scheduled','completed','cancelled'])};
const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('invite'),recipientId:id,groupId:id.optional(),roomId:id.optional()}).refine(d=>!!d.groupId!==!!d.roomId,'Choose one invitation destination.'),
 z.object({action:z.literal('accept'),invitationId:id}),z.object({action:z.literal('decline'),invitationId:id}),
 z.object({action:z.literal('post'),roomId:id,body:text(5000)}),
 z.object({action:z.literal('comment'),roomId:id,postId:id,body:text(2000)}),
 z.object({action:z.literal('removePost'),roomId:id,postId:id}),
 z.object({action:z.literal('removeComment'),roomId:id,commentId:id}),
 z.object({action:z.literal('createLeague'),roomId:id,...leagueFields}),
 z.object({action:z.literal('editLeague'),roomId:id,leagueId:id,...leagueFields,active:z.boolean()}),
 z.object({action:z.literal('joinLeague'),roomId:id,leagueId:id}),
 z.object({action:z.literal('saveEvent'),roomId:id,leagueId:id,eventId:id.optional(),...eventFields}),
 z.object({action:z.literal('result'),roomId:id,leagueId:id,eventId:id,userId:id,place:z.number().int().min(1).max(100000),points:z.number().min(0).max(1000000).multipleOf(.01)}),
 z.object({action:z.literal('removeResult'),roomId:id,leagueId:id,eventId:id,userId:id}),
]);
const host=`(r.owner_id=$1 OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=$1 AND h.accepted))`;
const unblocked=(other:string)=>`NOT EXISTS(SELECT 1 FROM rail_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=${other}) OR (b.blocker_id=${other} AND b.blocked_id=$1))`;
const visible=`(${host} OR (r.published AND ${unblocked('r.owner_id')}))`;
const participant=`(${host} OR (r.published AND ${unblocked('r.owner_id')} AND EXISTS(SELECT 1 FROM rail_room_follows f WHERE f.room_id=r.id AND f.user_id=$1)))`;
function checked<T>(rows:T[]){if(!rows.length)throw new RoomError('This item is unavailable or you no longer have access.',404);return rows[0];}
function offset(params:URLSearchParams){const n=Number(params.get('offset')||0);if(!Number.isSafeInteger(n)||n<0||n>10000)throw new RoomError('Invalid page.');return n;}

export async function people(database:RoomDatabase,userId:string,params:URLSearchParams){
 const q=(params.get('q')||'').trim().slice(0,100),scope=params.get('scope')||'all',start=offset(params);
 if(!['all','following','followers','friends'].includes(scope))throw new RoomError('Invalid people filter.');
 const following=`EXISTS(SELECT 1 FROM rail_follows f WHERE f.follower_id=$1 AND f.followed_id=u.id)`;
 const followsYou=`EXISTS(SELECT 1 FROM rail_follows f WHERE f.follower_id=u.id AND f.followed_id=$1)`;
 const result=await database.query(`SELECT u.id,u.name,COALESCE(p.bio,'') AS bio,${following} AS following,${followsYou} AS "followsYou"
 FROM "user" u LEFT JOIN rail_profiles p ON p.user_id=u.id WHERE u.id<>$1 AND ${unblocked('u.id')}
 AND ($2='' OR strpos(lower(u.name),lower($2))>0)
 AND ($3='all' OR ($3='following' AND ${following}) OR ($3='followers' AND ${followsYou}) OR ($3='friends' AND ${following} AND ${followsYou}))
 ORDER BY lower(u.name),u.id LIMIT 25 OFFSET $4`,[userId,q,scope,start]);
 const invitations=await database.query(`SELECT i.id,u.name AS sender,COALESCE(g.name,r.name) AS name,CASE WHEN i.group_id IS NULL THEN 'room' ELSE 'rail' END AS kind
 FROM rail_invitations i JOIN "user" u ON u.id=i.sender_id LEFT JOIN rail_groups g ON g.id=i.group_id LEFT JOIN rail_rooms r ON r.id=i.room_id
 WHERE i.recipient_id=$1 AND ${unblocked('i.sender_id')} AND i.created>now()-interval '30 days'
 AND ((g.id IS NOT NULL AND ${unblocked('g.owner')} AND EXISTS(SELECT 1 FROM rail_members m WHERE m.group_id=g.id AND m.user_id=i.sender_id))
 OR (r.published AND ${unblocked('r.owner_id')} AND (r.owner_id=i.sender_id OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=i.sender_id AND h.accepted) OR EXISTS(SELECT 1 FROM rail_room_follows f WHERE f.room_id=r.id AND f.user_id=i.sender_id))))
 ORDER BY i.created DESC LIMIT 100`,[userId]);
 return {people:result.rows.slice(0,24),nextOffset:result.rows.length>24?start+24:null,invitations:invitations.rows};
}

export async function community(database:RoomDatabase,userId:string,params:URLSearchParams){
 const roomId=params.get('roomId');if(!roomId||roomId.length>100)throw new RoomError('Choose a room.');
 checked((await database.query(`SELECT r.id FROM rail_rooms r WHERE r.id=$2 AND ${visible}`,[userId,roomId])).rows);
 const postId=params.get('postId'),before=params.get('before');
 if((before?.length||0)>100||(postId?.length||0)>100)throw new RoomError('Invalid page.');
 if(postId){
  checked((await database.query(`SELECT p.id FROM rail_room_posts p WHERE p.id=$2 AND p.room_id=$3 AND ${unblocked('p.user_id')}`,[userId,postId,roomId])).rows);
  const rows=(await database.query(`SELECT c.id,c.user_id AS "userId",u.name,c.body,c.created,(c.user_id=$1 OR ${host}) AS "canRemove" FROM rail_room_comments c JOIN rail_room_posts p ON p.id=c.post_id JOIN rail_rooms r ON r.id=p.room_id JOIN "user" u ON u.id=c.user_id WHERE c.post_id=$3 AND r.id=$2 AND ${visible} AND ${unblocked('c.user_id')}
   AND ($4::text IS NULL OR (c.created,c.id)<(SELECT created,id FROM rail_room_comments WHERE id=$4 AND post_id=$3)) ORDER BY c.created DESC,c.id DESC LIMIT 31`,[userId,roomId,postId,before])).rows;
  return {comments:rows.slice(0,30),nextBefore:rows.length>30?rows[29].id:null};
 }
 const rows=(await database.query(`SELECT p.id,p.user_id AS "userId",u.name,p.body,p.created,(p.user_id=$1 OR ${host}) AS "canRemove",
 (SELECT count(*)::int FROM rail_room_comments c WHERE c.post_id=p.id AND ${unblocked('c.user_id')}) AS comments
 FROM rail_room_posts p JOIN rail_rooms r ON r.id=p.room_id JOIN "user" u ON u.id=p.user_id WHERE r.id=$2 AND ${visible} AND ${unblocked('p.user_id')}
 AND ($3::text IS NULL OR (p.created,p.id)<(SELECT created,id FROM rail_room_posts WHERE id=$3 AND room_id=$2)) ORDER BY p.created DESC,p.id DESC LIMIT 21`,[userId,roomId,before])).rows;
 return {posts:rows.slice(0,20),nextBefore:rows.length>20?rows[19].id:null};
}

export async function leagues(database:RoomDatabase,userId:string,params:URLSearchParams){
 const roomId=params.get('roomId');if(!roomId||roomId.length>100)throw new RoomError('Choose a room.');
 checked((await database.query(`SELECT r.id FROM rail_rooms r WHERE r.id=$2 AND ${visible}`,[userId,roomId])).rows);
 const seasons=(await database.query(`SELECT l.*,EXISTS(SELECT 1 FROM rail_league_players p WHERE p.league_id=l.id AND p.user_id=$1) AS joined FROM rail_leagues l WHERE room_id=$2 ORDER BY created DESC LIMIT 50`,[userId,roomId])).rows;
 const leagueId=params.get('leagueId')||seasons[0]?.id;
 if(!leagueId)return {leagues:seasons,events:[],standings:[],results:[],leagueId:null};
 checked((await database.query('SELECT id FROM rail_leagues WHERE id=$1 AND room_id=$2',[leagueId,roomId])).rows);
 const events=(await database.query('SELECT * FROM rail_league_events WHERE league_id=$1 ORDER BY starts,id',[leagueId])).rows;
 const standings=(await database.query(`SELECT u.id,u.name,COALESCE(sum(v.points) FILTER(WHERE e.status='completed'),0)::float AS points,
 count(v.event_id) FILTER(WHERE e.status='completed')::int AS played FROM rail_league_players p JOIN "user" u ON u.id=p.user_id
 LEFT JOIN rail_league_results v ON v.user_id=p.user_id AND v.event_id IN(SELECT id FROM rail_league_events WHERE league_id=$2)
 LEFT JOIN rail_league_events e ON e.id=v.event_id WHERE p.league_id=$2 AND ${unblocked('u.id')} GROUP BY u.id,u.name ORDER BY points DESC,lower(u.name),u.id`,[userId,leagueId])).rows;
 const results=(await database.query(`SELECT v.event_id AS "eventId",v.user_id AS "userId",v.place,v.points::float,u.name FROM rail_league_results v JOIN rail_league_events e ON e.id=v.event_id JOIN "user" u ON u.id=v.user_id WHERE e.league_id=$2 AND ${unblocked('v.user_id')} ORDER BY e.starts,v.place,u.name`,[userId,leagueId])).rows;
 return {leagues:seasons,leagueId,events,standings,results};
}

export async function mutateCommunity(database:RoomDatabase,userId:string,raw:unknown){
 const parsed=actionSchema.safeParse(raw);if(!parsed.success)throw new RoomError(parsed.error.issues[0].message);
 const d=parsed.data;
 if(d.action==='decline'){checked((await database.query('DELETE FROM rail_invitations WHERE id=$2 AND recipient_id=$1 RETURNING id',[userId,d.invitationId])).rows);return {ok:true};}
 if(d.action==='invite'){
  const target=d.groupId?'group':'room';
  const authority=d.groupId?`EXISTS(SELECT 1 FROM rail_groups g JOIN rail_members m ON m.group_id=g.id WHERE g.id=$3 AND m.user_id=$1 AND ${unblocked('g.owner')})`:`EXISTS(SELECT 1 FROM rail_rooms r WHERE r.id=$3 AND r.published AND ${participant})`;
  const already=d.groupId?'rail_members WHERE group_id=$3':'rail_room_follows WHERE room_id=$3';
  const result=await database.query(`INSERT INTO rail_invitations(id,sender_id,recipient_id,${target}_id)
   SELECT $4,$1,u.id,$3 FROM "user" u WHERE u.id=$2 AND u.id<>$1 AND ${unblocked('u.id')} AND ${authority}
   AND NOT EXISTS(SELECT 1 FROM ${already} AND user_id=u.id)
   AND (SELECT count(*) FROM rail_invitations WHERE sender_id=$1 AND created>now()-interval '1 day')<50
   ON CONFLICT(recipient_id,${target}_id) WHERE ${target}_id IS NOT NULL DO UPDATE SET sender_id=EXCLUDED.sender_id,created=now() WHERE rail_invitations.created<now()-interval '1 day' OR rail_invitations.sender_id=$1 RETURNING id`,[userId,d.recipientId,d.groupId||d.roomId,randomUUID()]);
  if(!result.rows.length)throw new RoomError('Cannot send this invitation. They may already belong, have an invite, or your access has changed.');return {ok:true};
 }
 if(d.action==='accept'){
  const result=await database.query(`WITH accepted AS (DELETE FROM rail_invitations i WHERE i.id=$2 AND i.recipient_id=$1 AND i.created>now()-interval '30 days' AND ${unblocked('i.sender_id')}
   AND ((i.group_id IS NOT NULL AND EXISTS(SELECT 1 FROM rail_groups g JOIN rail_members m ON m.group_id=g.id WHERE g.id=i.group_id AND m.user_id=i.sender_id AND ${unblocked('g.owner')}))
   OR (i.room_id IS NOT NULL AND EXISTS(SELECT 1 FROM rail_rooms r WHERE r.id=i.room_id AND r.published AND ${unblocked('r.owner_id')} AND (r.owner_id=i.sender_id OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=i.sender_id AND h.accepted) OR EXISTS(SELECT 1 FROM rail_room_follows f WHERE f.room_id=r.id AND f.user_id=i.sender_id))))) RETURNING group_id,room_id),
   joined AS (INSERT INTO rail_members(group_id,user_id) SELECT group_id,$1 FROM accepted WHERE group_id IS NOT NULL ON CONFLICT DO NOTHING),
   followed AS (INSERT INTO rail_room_follows(room_id,user_id) SELECT room_id,$1 FROM accepted WHERE room_id IS NOT NULL ON CONFLICT DO NOTHING)
   SELECT group_id AS "groupId",room_id AS "roomId" FROM accepted`,[userId,d.invitationId]);
  return checked(result.rows);
 }
 const values=[userId,d.roomId];let result:{rows:Record<string,unknown>[]};
 switch(d.action){
  case 'post':result=await database.query(`INSERT INTO rail_room_posts(id,room_id,user_id,body) SELECT $3,r.id,$1,$4 FROM rail_rooms r WHERE r.id=$2 AND ${participant} RETURNING id`,[...values,randomUUID(),d.body]);break;
  case 'comment':result=await database.query(`INSERT INTO rail_room_comments(id,post_id,user_id,body) SELECT $4,p.id,$1,$5 FROM rail_room_posts p JOIN rail_rooms r ON r.id=p.room_id WHERE r.id=$2 AND p.id=$3 AND ${participant} AND ${unblocked('p.user_id')} RETURNING id`,[...values,d.postId,randomUUID(),d.body]);break;
  case 'removePost':result=await database.query(`DELETE FROM rail_room_posts p USING rail_rooms r WHERE p.id=$3 AND p.room_id=r.id AND r.id=$2 AND ${visible} AND (p.user_id=$1 OR ${host}) RETURNING p.id`,[...values,d.postId]);break;
  case 'removeComment':result=await database.query(`DELETE FROM rail_room_comments c USING rail_room_posts p,rail_rooms r WHERE c.id=$3 AND c.post_id=p.id AND p.room_id=r.id AND r.id=$2 AND ${visible} AND (c.user_id=$1 OR ${host}) RETURNING c.id`,[...values,d.commentId]);break;
  case 'createLeague':result=await database.query(`INSERT INTO rail_leagues(id,room_id,name,rules) SELECT $3,r.id,$4,$5 FROM rail_rooms r WHERE r.id=$2 AND ${host} AND (SELECT count(*) FROM rail_leagues WHERE room_id=$2)<50 RETURNING id`,[...values,randomUUID(),d.name,d.rules]);break;
  case 'editLeague':result=await database.query(`UPDATE rail_leagues l SET name=$4,rules=$5,active=$6 FROM rail_rooms r WHERE l.id=$3 AND l.room_id=r.id AND r.id=$2 AND ${host} RETURNING l.id`,[...values,d.leagueId,d.name,d.rules,d.active]);break;
  case 'joinLeague':result=await database.query(`INSERT INTO rail_league_players(league_id,user_id) SELECT l.id,$1 FROM rail_leagues l JOIN rail_rooms r ON r.id=l.room_id WHERE r.id=$2 AND l.id=$3 AND l.active AND ${participant} ON CONFLICT DO NOTHING RETURNING league_id`,[...values,d.leagueId]);break;
  case 'saveEvent':{
   if(d.eventId)result=await database.query(`UPDATE rail_league_events e SET name=$5,starts=$6,details=$7,status=$8 FROM rail_leagues l,rail_rooms r WHERE e.id=$4 AND e.league_id=l.id AND l.id=$3 AND l.room_id=r.id AND r.id=$2 AND ${host} RETURNING e.id`,[...values,d.leagueId,d.eventId,d.name,d.starts,d.details,d.status]);
   else result=await database.query(`INSERT INTO rail_league_events(id,league_id,name,starts,details,status) SELECT $4,l.id,$5,$6,$7,$8 FROM rail_leagues l JOIN rail_rooms r ON r.id=l.room_id WHERE l.id=$3 AND r.id=$2 AND l.active AND ${host} AND (SELECT count(*) FROM rail_league_events WHERE league_id=$3)<200 RETURNING id`,[...values,d.leagueId,randomUUID(),d.name,d.starts,d.details,d.status]);break;
  }
  case 'result':result=await database.query(`INSERT INTO rail_league_results(event_id,user_id,place,points) SELECT e.id,p.user_id,$6,$7 FROM rail_league_events e JOIN rail_leagues l ON l.id=e.league_id JOIN rail_rooms r ON r.id=l.room_id JOIN rail_league_players p ON p.league_id=l.id AND p.user_id=$5 WHERE r.id=$2 AND l.id=$3 AND e.id=$4 AND e.status<>'cancelled' AND ${host} ON CONFLICT(event_id,user_id) DO UPDATE SET place=EXCLUDED.place,points=EXCLUDED.points RETURNING event_id`,[...values,d.leagueId,d.eventId,d.userId,d.place,d.points]);break;
  case 'removeResult':result=await database.query(`DELETE FROM rail_league_results v USING rail_league_events e,rail_leagues l,rail_rooms r WHERE v.event_id=e.id AND e.league_id=l.id AND l.room_id=r.id AND r.id=$2 AND l.id=$3 AND e.id=$4 AND v.user_id=$5 AND ${host} RETURNING v.event_id`,[...values,d.leagueId,d.eventId,d.userId]);break;
 }
 checked(result.rows);return {ok:true};
}
