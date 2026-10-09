import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {RoomError,type RoomDatabase} from './rooms';

export const scopes=['rail','room','table','announcement'] as const;
export type PostScope=typeof scopes[number];
export type ActivityScope=PostScope|'session'|'profile'|'invitation';
const posts={rail:'rail_posts',room:'rail_room_posts',table:'rail_table_posts',announcement:'rail_room_announcements'};
const comments={rail:'rail_comments',room:'rail_room_comments',table:'rail_table_comments'};
const likes={rail:'rail_likes',room:'rail_room_likes',table:'rail_table_likes'};
const identifier=z.string().min(1).max(100);
type Content={scope:ActivityScope;id:string;user_id:string;group_id:string|null;room_id:string|null;session_id:string|null;body:string;audience:string|null;created:string};

export async function contentFor(database:RoomDatabase,viewer:string,scope:ActivityScope,target:string){
 const c=(await database.query<Content>('SELECT * FROM rail_activity_content WHERE scope=$1 AND id=$2 AND rail_visible_to(scope,id,$3)',[scope,target,viewer])).rows[0];
 if(!c)throw new RoomError('This post is unavailable or your access has changed.',404);
 return c;
}
export function activityHref(c:Content){
 if(c.scope==='invitation')return '/?view=people';
 if(c.scope==='profile')return '/?profile='+encodeURIComponent(c.id);
 if(c.scope==='session')return '/?group='+encodeURIComponent(c.group_id!)+'&session='+encodeURIComponent(c.id);
 if(c.scope==='rail')return '/?group='+encodeURIComponent(c.group_id!)+'&post='+encodeURIComponent(c.id);
 if(c.scope==='table')return '/?profile='+encodeURIComponent(c.user_id)+'&post='+encodeURIComponent(c.id);
 return '/?view=rooms&room='+encodeURIComponent(c.room_id!)+'&post='+encodeURIComponent(c.id);
}
export async function validMentions(database:RoomDatabase,actor:string,body:string,ids:unknown){
 const parsed=z.array(identifier).max(20).safeParse(ids||[]);if(!parsed.success)throw new RoomError('Choose up to 20 people to tag.');
 if(!parsed.data.length)return [];
 const rows=(await database.query<{id:string;name:string}>('SELECT id,name FROM "user" WHERE id=ANY($1::text[]) AND rail_unblocked(id,$2)',[[...new Set(parsed.data)],actor])).rows;
 return rows.filter(u=>body.includes('@'+u.name)).map(u=>u.id);
}
export async function activityStates(database:RoomDatabase,userId:string,targets:unknown){
 const parsed=z.array(z.object({scope:z.enum(scopes),id:identifier})).max(40).safeParse(targets);
 if(!parsed.success)throw new RoomError('Choose valid posts.');
 return (await database.query(`SELECT c.scope,c.id,(c.user_id=$1) AS "canEdit",
 (c.user_id=$1 OR EXISTS(SELECT 1 FROM rail_rooms r WHERE r.id=c.room_id AND (r.owner_id=$1 OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=$1 AND h.accepted)))) AS "canRemove",
 rail_can_comment(c.scope,c.id,$1) AS "canComment",
 EXISTS(SELECT 1 FROM rail_watches w WHERE w.user_id=$1 AND w.scope=CASE WHEN c.session_id IS NULL THEN c.scope ELSE 'session' END AND w.target_id=COALESCE(c.session_id,c.id)) AS watching,
 (c.session_id IS NOT NULL) AS "hasSession",
 (SELECT count(*)::int FROM rail_activity_likes l WHERE l.scope=c.scope AND l.target_id=c.id AND NOT l.is_comment AND rail_unblocked(l.user_id,$1)) AS likes,
 EXISTS(SELECT 1 FROM rail_activity_likes l WHERE l.scope=c.scope AND l.target_id=c.id AND NOT l.is_comment AND l.user_id=$1) AS liked,
 (SELECT count(*)::int FROM rail_activity_comments a WHERE a.scope=c.scope AND a.post_id=c.id AND rail_unblocked(a.user_id,$1)) AS comments
 FROM rail_activity_content c JOIN jsonb_to_recordset($2::jsonb) AS requested(scope text,id text) ON requested.scope=c.scope AND requested.id=c.id
 WHERE rail_visible_to(c.scope,c.id,$1)`,[userId,JSON.stringify(parsed.data)])).rows;
}
export async function activityComments(database:RoomDatabase,userId:string,scope:PostScope,postId:string,before?:string){
 await contentFor(database,userId,scope,postId);
 const rows=(await database.query(`SELECT a.id,a.user_id AS "userId",u.name,a.body,a.created,a.edited,a.mentions,(a.user_id=$1) AS "canEdit",
 (a.user_id=$1 OR EXISTS(SELECT 1 FROM rail_activity_content p JOIN rail_rooms r ON r.id=p.room_id WHERE p.scope=a.scope AND p.id=a.post_id AND (r.owner_id=$1 OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=$1 AND h.accepted)))) AS "canRemove",
 (SELECT count(*)::int FROM rail_comment_likes l WHERE l.scope=a.scope AND l.comment_id=a.id AND rail_unblocked(l.user_id,$1)) AS likes,
 EXISTS(SELECT 1 FROM rail_comment_likes l WHERE l.scope=a.scope AND l.comment_id=a.id AND l.user_id=$1) AS liked
 FROM rail_activity_comments a JOIN "user" u ON u.id=a.user_id WHERE a.scope=$2 AND a.post_id=$3 AND rail_unblocked(a.user_id,$1)
 AND ($4::text IS NULL OR (a.created,a.id)<(SELECT created,id FROM rail_activity_comments WHERE scope=$2 AND post_id=$3 AND id=$4))
 ORDER BY a.created DESC,a.id DESC LIMIT 31`,[userId,scope,postId,before||null])).rows;
 return {comments:rows.slice(0,30),nextBefore:rows.length>30?rows[29].id:null};
}
const mutation=z.object({action:z.enum(['watch','like','comment','editComment','deleteComment','likeComment','editPost','deletePost']),scope:z.enum(scopes),postId:identifier,commentId:identifier.optional(),body:z.string().trim().max(5000).optional(),enabled:z.boolean().optional(),mentions:z.array(identifier).max(20).default([])});
export async function mutateActivity(database:RoomDatabase,userId:string,input:unknown){
 const parsed=mutation.safeParse(input);if(!parsed.success)throw new RoomError(parsed.error.issues[0].message);
 const d=parsed.data,c=await contentFor(database,userId,d.scope,d.postId),values=[userId,d.scope,d.postId];
 const checked=(rows:unknown[])=>{if(!rows.length)throw new RoomError('This action is unavailable or your access has changed.',403)};
 if(d.action==='watch'){
  const scope=c.session_id?'session':d.scope,target=c.session_id||c.id;
  if(d.enabled)await database.query('INSERT INTO rail_watches(user_id,scope,target_id) SELECT $1,$2,$3 WHERE rail_visible_to($2,$3,$1) ON CONFLICT DO NOTHING',[userId,scope,target]);
  else await database.query('DELETE FROM rail_watches WHERE user_id=$1 AND scope=$2 AND target_id=$3',[userId,scope,target]);
  return {ok:true,watching:!!d.enabled};
 }
 if(d.action==='editPost'){
  if(c.user_id!==userId)throw new RoomError('Only the author can edit this post.',403);
  if(d.scope==='rail')throw new RoomError('Use the rail update editor.');
  if(!d.body||d.body.length>(d.scope==='announcement'?3000:5000))throw new RoomError('Add a message within the character limit.');
  const tagged=await validMentions(database,userId,d.body,d.mentions);
  checked((await database.query(`UPDATE ${posts[d.scope]} SET body=$4,mentions=$5::jsonb,edited=now() WHERE user_id=$1 AND id=$3 AND rail_visible_to($2,$3,$1) RETURNING id`,[...values,d.body,JSON.stringify(tagged)])).rows);
  return {ok:true};
 }
 if(d.action==='deletePost'){
  checked((await database.query(`DELETE FROM ${posts[d.scope]} p WHERE p.id=$3 AND rail_visible_to($2,$3,$1) AND (p.user_id=$1 OR EXISTS(SELECT 1 FROM rail_activity_content c JOIN rail_rooms r ON r.id=c.room_id WHERE c.scope=$2 AND c.id=$3 AND (r.owner_id=$1 OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=$1 AND h.accepted)))) RETURNING p.id`,values)).rows);
  return {ok:true};
 }
 if(d.scope==='announcement')throw new RoomError('Announcements support rail subscriptions and editing.');
 if(['like','comment','likeComment'].includes(d.action)&&!(await database.query('SELECT 1 WHERE rail_can_comment($2,$3,$1)',values)).rows.length)throw new RoomError('Join this room to take part in the conversation.',403);
 if(d.action==='like'){
  if(d.enabled)await database.query(`INSERT INTO ${likes[d.scope]}(post_id,user_id) SELECT $3,$1 WHERE rail_can_comment($2,$3,$1) ON CONFLICT DO NOTHING`,values);
  else await database.query(`DELETE FROM ${likes[d.scope]} WHERE user_id=$1 AND post_id=$3 AND $2::text IS NOT NULL`,values);
  return {ok:true};
 }
 if(d.action==='comment'){
  if(!d.body||d.body.length>2000)throw new RoomError('Comments must be 1–2,000 characters.');
  const tagged=await validMentions(database,userId,d.body,d.mentions),id=randomUUID();
  checked((await database.query(`INSERT INTO ${comments[d.scope]}(id,post_id,user_id,body,mentions) SELECT $4,$3,$1,$5,$6::jsonb WHERE rail_can_comment($2,$3,$1) RETURNING id`,[...values,id,d.body,JSON.stringify(tagged)])).rows);
  return {ok:true,id};
 }
 if(!d.commentId)throw new RoomError('Choose a comment.');
 const comment=(await database.query<{user_id:string}>('SELECT user_id FROM rail_activity_comments WHERE scope=$2 AND post_id=$3 AND id=$4 AND rail_unblocked(user_id,$1)',[...values,d.commentId])).rows[0];
 if(!comment)throw new RoomError('Comment unavailable.',404);
 if(d.action==='likeComment'){
  if(d.enabled)await database.query('INSERT INTO rail_comment_likes(scope,comment_id,user_id) SELECT $2,$4,$1 WHERE rail_can_comment($2,$3,$1) ON CONFLICT DO NOTHING',[...values,d.commentId]);
  else await database.query('DELETE FROM rail_comment_likes WHERE user_id=$1 AND scope=$2 AND comment_id=$4 AND $3::text IS NOT NULL',[...values,d.commentId]);
 }else if(d.action==='editComment'){
  if(comment.user_id!==userId)throw new RoomError('Only the author can edit this comment.',403);
  if(!d.body||d.body.length>2000)throw new RoomError('Comments must be 1–2,000 characters.');
  const tagged=await validMentions(database,userId,d.body,d.mentions);
  checked((await database.query(`UPDATE ${comments[d.scope]} SET body=$5,mentions=$6::jsonb,edited=now() WHERE id=$4 AND post_id=$3 AND user_id=$1 AND rail_visible_to($2,$3,$1) RETURNING id`,[...values,d.commentId,d.body,JSON.stringify(tagged)])).rows);
 }else{
  checked((await database.query(`DELETE FROM ${comments[d.scope]} a WHERE a.id=$4 AND a.post_id=$3 AND rail_visible_to($2,$3,$1) AND (a.user_id=$1 OR EXISTS(SELECT 1 FROM rail_activity_content c JOIN rail_rooms r ON r.id=c.room_id WHERE c.scope=$2 AND c.id=$3 AND (r.owner_id=$1 OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=$1 AND h.accepted)))) RETURNING a.id`,[...values,d.commentId])).rows);
  await database.query('DELETE FROM rail_comment_likes WHERE scope=$1 AND comment_id=$2',[d.scope,d.commentId]);
 }
 return {ok:true};
}

export async function mentionCandidates(database:RoomDatabase,userId:string,params:URLSearchParams){
 const group=params.get('groupId'),scope=params.get('scope'),post=params.get('postId'),q=(params.get('q')||'').slice(0,80);
 if(group&&!(await database.query('SELECT 1 FROM rail_members WHERE group_id=$1 AND user_id=$2',[group,userId])).rows.length)throw new RoomError('Rail unavailable.',404);
 if(scope&&post)await contentFor(database,userId,z.enum(scopes).parse(scope),post);
 return (await database.query(`SELECT u.id,u.name FROM "user" u WHERE u.id<>$1 AND rail_unblocked(u.id,$1) AND strpos(lower(u.name),lower($2))>0
 AND ($3::text IS NULL OR EXISTS(SELECT 1 FROM rail_members WHERE group_id=$3 AND user_id=u.id))
 AND ($4::text IS NULL OR rail_visible_to($4,$5,u.id)) ORDER BY lower(u.name),u.id LIMIT 12`,[userId,q,group,scope,post])).rows;
}
export async function userSessions(database:RoomDatabase,userId:string,groupId:string){
 return (await database.query('SELECT id,name,kind,active FROM rail_sessions WHERE user_id=$1 AND group_id=$2 AND active AND rail_visible_to(\'session\',id,$1) ORDER BY created DESC LIMIT 50',[userId,groupId])).rows;
}
