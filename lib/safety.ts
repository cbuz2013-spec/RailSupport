import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {RoomError,type RoomDatabase} from './rooms';
import {contentFor,scopes} from './activity';
export async function guardMember(db:RoomDatabase,uid:string,write=false){
 if((await db.query('SELECT 1 FROM rail_restrictions WHERE user_id=$1',[uid])).rows.length)throw new RoomError('This account is restricted. Open Help to request a review.',403);
 if(write){const bucket=Math.floor(Date.now()/60000);const row=(await db.query<{count:number}>('INSERT INTO rail_request_limits(user_id,bucket) VALUES($1,$2) ON CONFLICT(user_id,bucket) DO UPDATE SET count=rail_request_limits.count+1 RETURNING count',[uid,bucket])).rows[0];if(row.count>80)throw new RoomError('Too many requests. Please wait a minute and try again.',429);await db.query('DELETE FROM rail_request_limits WHERE user_id=$1 AND bucket<$2',[uid,bucket-2]);}
}
export async function requireModerator(db:RoomDatabase,uid:string){if(!(await db.query('SELECT 1 FROM rail_admins WHERE user_id=$1',[uid])).rows.length)throw new RoomError('Moderator access required.',403);}
export async function reportContent(db:RoomDatabase,uid:string,raw:unknown){
 const d=z.object({scope:z.enum([...scopes,'profile','support']),targetId:z.string().min(1).max(100),reason:z.enum(['harassment','spam','unsafe content','privacy','support','other']),commentId:z.string().min(1).max(100).optional(),details:z.string().trim().max(3000).default('')}).parse(raw);
 let snapshot:Record<string,unknown>=d.scope==='support'?{}:await contentFor(db,uid,d.scope,d.targetId);
 if(d.commentId){const c=(await db.query('SELECT * FROM rail_activity_comments WHERE scope=$1 AND post_id=$2 AND id=$3 AND rail_unblocked(user_id,$4)',[d.scope,d.targetId,d.commentId,uid])).rows[0];if(!c)throw new RoomError('Comment unavailable.',404);snapshot={...c,comment_id:d.commentId};}
 const reportTarget=d.commentId||d.targetId;
 if((await db.query("SELECT 1 FROM rail_reports WHERE reporter_id=$1 AND scope=$2 AND target_id=$3 AND status='open'",[uid,d.scope,reportTarget])).rows.length)throw new RoomError('Your report is already open. Support will review it.');
 if((await db.query("SELECT count(*)::int AS n FROM rail_reports WHERE reporter_id=$1 AND created>now()-interval '1 day'",[uid])).rows[0].n as number>=20)throw new RoomError('Daily report limit reached.');
 const id=randomUUID();await db.query('INSERT INTO rail_reports(id,reporter_id,scope,target_id,reason,details,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)',[id,uid,d.scope,reportTarget,d.reason,d.details,JSON.stringify(snapshot)]);return {ok:true,id};
}
export async function moderationQueue(db:RoomDatabase,uid:string){await requireModerator(db,uid);return {reports:(await db.query('SELECT r.*,(SELECT count(*)::int FROM rail_post_images i WHERE r.scope=\'rail\' AND i.post_id=r.target_id) AS images,u.name AS reporter FROM rail_reports r LEFT JOIN "user" u ON u.id=r.reporter_id ORDER BY (status=\'open\') DESC,created DESC LIMIT 100')).rows,audit:(await db.query('SELECT * FROM rail_audit WHERE kind LIKE \'moderation.%\' ORDER BY created DESC LIMIT 100')).rows};}
export async function moderate(db:RoomDatabase,uid:string,raw:unknown){
 await requireModerator(db,uid);
 const d=z.object({reportId:z.string().min(1).max(100),decision:z.enum(['dismiss','resolve','remove','restrict','restore']),note:z.string().trim().min(1).max(2000)}).parse(raw);
 const r=(await db.query<{id:string;scope:string;target_id:string;snapshot:{user_id?:string;comment_id?:string}}> ('SELECT * FROM rail_reports WHERE id=$1 FOR UPDATE',[d.reportId])).rows[0];if(!r)throw new RoomError('Report unavailable.',404);
 const user=r.snapshot.user_id;
 if(d.decision==='remove'){
  const table:Record<string,string>={rail:'rail_posts',room:'rail_room_posts',table:'rail_table_posts',announcement:'rail_room_announcements'};
  if(r.snapshot.comment_id)Object.assign(table,{rail:'rail_comments',room:'rail_room_comments',table:'rail_table_comments'});
  if(!table[r.scope])throw new RoomError('This report does not refer to a removable post.');
  await db.query(`DELETE FROM ${table[r.scope]} WHERE id=$1`,[r.target_id]);
 }
 if(d.decision==='restrict'||d.decision==='restore'){
  if(!user||user===uid||(await db.query('SELECT 1 FROM rail_admins WHERE user_id=$1',[user])).rows.length)throw new RoomError('This account cannot be restricted here.');
  if(d.decision==='restrict'){await db.query('INSERT INTO rail_restrictions(user_id,reason) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET reason=EXCLUDED.reason',[user,d.note]);await db.query('DELETE FROM "session" WHERE "userId"=$1',[user]);await db.query('DELETE FROM rail_push_devices WHERE user_id=$1',[user]);}
  else await db.query('DELETE FROM rail_restrictions WHERE user_id=$1',[user]);
 }
 await db.query('UPDATE rail_reports SET status=$2,resolution=$3,updated=now() WHERE id=$1',[r.id,d.decision==='dismiss'?'dismissed':'resolved',d.note]);
 await db.query('INSERT INTO rail_audit(actor_id,kind,target_id,details) VALUES($1,$2,$3,$4::jsonb)',[uid,'moderation.'+d.decision,r.id,JSON.stringify({note:d.note})]);return {ok:true};
}
