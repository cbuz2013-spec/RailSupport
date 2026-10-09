import webpush from 'web-push';
import {z} from 'zod';
import {RoomError,type RoomDatabase} from './rooms';
import {activityHref,contentFor,type ActivityScope} from './activity';

export const notificationWords:Record<string,string>={invitation:'invited you to a rail or room',stack:'updated their stack',post:'posted an update to a rail you joined',comment:'commented on a post',mention:'tagged you',like:'liked your post',comment_like:'liked your comment',follow:'started following you',session:'started a tournament or cash-game rail'};
type Event={id:string;scope:ActivityScope;target_id:string;actor_id:string;kind:string;detail:{id?:string;mentions?:string[];previousMentions?:string[];comment?:boolean};created:string};
type Notification={id:string;recipient_id:string;actor_id:string;scope:ActivityScope;target_id:string;kind:string;href:string};

// A saved endpoint is a capability. Accept only browser push providers, never arbitrary URLs.
export function validPushEndpoint(value:string){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&(!u.port||u.port==='443')&&
 (u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname==='push.services.mozilla.com'||u.hostname==='web.push.apple.com'||/^[a-z0-9-]+\.notify\.windows\.com$/.test(u.hostname));}catch{return false}
}
export const pushSubscriptionSchema=z.object({endpoint:z.string().max(4096).refine(validPushEndpoint,'This browser push provider is not supported.'),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/).min(80).max(100),auth:z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/).min(20).max(30)})});
export function pushConfigured(){return !!(process.env.RAILSOCIAL_VAPID_PUBLIC_KEY&&process.env.RAILSOCIAL_VAPID_PRIVATE_KEY&&process.env.RAILSOCIAL_VAPID_SUBJECT)}
export async function savePushDevice(database:RoomDatabase,userId:string,input:unknown){
 const parsed=pushSubscriptionSchema.safeParse(input);if(!parsed.success)throw new RoomError(parsed.error.issues[0].message);
 const s=parsed.data;
 if(Buffer.from(s.keys.p256dh,'base64url').length!==65||Buffer.from(s.keys.auth,'base64url').length!==16)throw new RoomError('Invalid push subscription keys.');
 // Rebinding the same browser after account switching removes the former account's pending pushes.
 await database.query(`DELETE FROM rail_push_outbox o USING rail_push_devices d WHERE o.device_id=d.id AND d.endpoint=$1 AND d.user_id<>$2`,[s.endpoint,userId]);
 const result=await database.query(`INSERT INTO rail_push_devices(user_id,endpoint,p256dh,auth)
 SELECT $1,$2,$3,$4 WHERE (SELECT count(*) FROM rail_push_devices WHERE user_id=$1)<12 OR EXISTS(SELECT 1 FROM rail_push_devices WHERE endpoint=$2)
 ON CONFLICT(endpoint) DO UPDATE SET user_id=EXCLUDED.user_id,p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth,updated=now() RETURNING id`,[userId,s.endpoint,s.keys.p256dh,s.keys.auth]);
 if(!result.rows.length)throw new RoomError('You have reached the limit of 12 notification devices. Turn off an old device first.');
}
async function enqueueNotification(database:RoomDatabase,event:Event,recipient:string,kind:string,c:Awaited<ReturnType<typeof contentFor>>,dedupe:string){
 if(recipient===event.actor_id)return;
 // Both content access and blocking are rechecked at creation, inbox reads, and delivery.
 await database.query(`WITH added AS (
 INSERT INTO rail_notifications(recipient_id,actor_id,event_id,scope,target_id,kind,href,dedupe_key)
 SELECT $1,$2,$3,$4,$5,$6,$7,$8 WHERE rail_visible_to($4,$5,$1) AND rail_unblocked($1,$2)
 ON CONFLICT(dedupe_key) DO NOTHING RETURNING id,recipient_id)
 INSERT INTO rail_push_outbox(notification_id,device_id) SELECT a.id,d.id FROM added a JOIN rail_push_devices d ON d.user_id=a.recipient_id ON CONFLICT DO NOTHING`,[recipient,event.actor_id,event.id,c.scope,c.id,kind,activityHref(c),dedupe]);
}
async function expandEvent(database:RoomDatabase,e:Event){
 let target=e.target_id,commentOwner:string|undefined;
 if(e.kind==='comment_like'){
  const comment=(await database.query<{post_id:string;user_id:string}>('SELECT post_id,user_id FROM rail_activity_comments WHERE scope=$1 AND id=$2',[e.scope,target])).rows[0];
  if(!comment)return;commentOwner=comment.user_id;target=comment.post_id;
  if(!(await database.query('SELECT 1 FROM rail_comment_likes WHERE scope=$1 AND comment_id=$2 AND user_id=$3',[e.scope,e.target_id,e.actor_id])).rows.length)return;
 }
 let c:Awaited<ReturnType<typeof contentFor>>;
 try{c=await contentFor(database,e.actor_id,e.scope,target)}catch(err){if(err instanceof RoomError)return;throw err}
 const recipients=new Map<string,string>();
 // A tag or comment may be removed while a queued event waits for delivery.
 const current=e.detail.comment?(await database.query<{mentions:string[]}>('SELECT mentions FROM rail_activity_comments WHERE scope=$1 AND id=$2 AND post_id=$3',[e.scope,e.detail.id,target])).rows[0]:null;
 if(e.detail.comment&&!current)return;
 const mentionIds=(e.detail.mentions||[]).filter(id=>!(e.detail.previousMentions||[]).includes(id)&&(!current||current.mentions.includes(id)));
 if(e.kind==='invitation'){
  const invite=(await database.query<{recipient_id:string}>('SELECT recipient_id FROM rail_invitations WHERE id=$1',[target])).rows[0];
  if(invite)recipients.set(invite.recipient_id,'invitation');
 }else if(e.kind==='follow'){
  if(!(await database.query('SELECT 1 FROM rail_follows WHERE follower_id=$1 AND followed_id=$2',[e.actor_id,target])).rows.length)return;
  recipients.set(target,'follow');c=await contentFor(database,e.actor_id,'profile',e.actor_id);
 }else if(e.kind==='like'){
  if(!(await database.query('SELECT 1 FROM rail_activity_likes WHERE scope=$1 AND target_id=$2 AND user_id=$3 AND NOT is_comment',[e.scope,target,e.actor_id])).rows.length)return;
  recipients.set(c.user_id,'like');
 }else if(e.kind==='comment_like')recipients.set(commentOwner!,'comment_like');
 else if(e.kind==='session'){
  const followers=await database.query<{follower_id:string}>('SELECT follower_id FROM rail_follows WHERE followed_id=$1',[e.actor_id]);
  for(const f of followers.rows)recipients.set(f.follower_id,'session');
 }else{
  if(e.kind==='comment'){
   if(!(await database.query('SELECT 1 FROM rail_activity_comments WHERE scope=$1 AND id=$2 AND post_id=$3',[e.scope,e.detail.id,target])).rows.length)return;
   recipients.set(c.user_id,'comment');
  }
  if(e.kind==='post'||e.kind==='stack'||e.kind==='comment'){
   const watched=await database.query<{user_id:string}>(`SELECT user_id FROM rail_watches WHERE (scope=$1 AND target_id=$2) OR (scope='session' AND target_id=$3)`,[c.scope,c.id,c.session_id]);
   for(const w of watched.rows)recipients.set(w.user_id,e.kind==='comment'?'comment':e.kind);
  }
  for(const id of mentionIds)recipients.set(id,'mention');
 }
 for(const [id,kind] of recipients){
  const once=['like','comment_like','follow'].includes(e.kind);
  const key=once?[e.scope,e.target_id,e.actor_id,e.kind,id].join(':'):[e.id,id].join(':');
  await enqueueNotification(database,e,id,kind,c,key);
 }
}
export async function processActivityEvents(database:RoomDatabase,limit=40){
 const events=(await database.query<Event>(`UPDATE rail_activity_events SET lease_until=now()+interval '2 minutes',attempts=attempts+1
 WHERE id IN(SELECT id FROM rail_activity_events WHERE processed IS NULL AND (lease_until IS NULL OR lease_until<now()) AND attempts<10 ORDER BY created LIMIT $1 FOR UPDATE SKIP LOCKED) RETURNING *`,[Math.min(limit,100)])).rows;
 for(const e of events){try{await expandEvent(database,e);await database.query('UPDATE rail_activity_events SET processed=now(),lease_until=NULL WHERE id=$1',[e.id])}catch{
  // Never log post bodies, subscription endpoints, or credential-bearing provider errors.
  await database.query("UPDATE rail_activity_events SET lease_until=now()+interval '30 seconds' WHERE id=$1",[e.id]);
 }}
 return events.length;
}
export async function notificationInbox(database:RoomDatabase,userId:string){
 const result=await database.query(`SELECT n.id,u.name AS actor,n.kind,n.href,n.created,n.read_at AS "readAt" FROM rail_notifications n JOIN "user" u ON u.id=n.actor_id
 WHERE n.recipient_id=$1 AND rail_visible_to(n.scope,n.target_id,$1) AND rail_unblocked($1,n.actor_id) ORDER BY n.created DESC LIMIT 60`,[userId]);
 const count=await database.query<{count:number}>(`SELECT count(*)::int AS count FROM rail_notifications n WHERE n.recipient_id=$1 AND n.read_at IS NULL AND rail_visible_to(n.scope,n.target_id,$1) AND rail_unblocked($1,n.actor_id)`,[userId]);
 return {items:result.rows,unread:count.rows[0].count,publicKey:pushConfigured()?process.env.RAILSOCIAL_VAPID_PUBLIC_KEY:null};
}
type Delivery=Notification&{notification_id:string;device_id:string;endpoint:string;p256dh:string;auth:string;attempts:number;device_user:string};
type Sender=(subscription:{endpoint:string;keys:{p256dh:string;auth:string}},payload:string)=>Promise<unknown>;
export async function deliverPush(database:RoomDatabase,send?:Sender){
 if(!send&&!pushConfigured())return {sent:0,failed:0};
 const rows=(await database.query<Delivery>(`WITH claimed AS (UPDATE rail_push_outbox SET lease_until=now()+interval '2 minutes',attempts=attempts+1
 WHERE (notification_id,device_id) IN(SELECT notification_id,device_id FROM rail_push_outbox WHERE sent_at IS NULL AND attempts<5 AND available_at<=now() AND (lease_until IS NULL OR lease_until<now()) ORDER BY available_at LIMIT 30 FOR UPDATE SKIP LOCKED) RETURNING *)
 SELECT o.*,n.*,d.endpoint,d.p256dh,d.auth,d.user_id AS device_user FROM claimed o JOIN rail_notifications n ON n.id=o.notification_id JOIN rail_push_devices d ON d.id=o.device_id`)).rows;
 let sent=0,failed=0;
 const sender:Sender=send||((subscription,payload)=>webpush.sendNotification(subscription,payload,{TTL:86400,urgency:'normal',timeout:5000,vapidDetails:{subject:process.env.RAILSOCIAL_VAPID_SUBJECT!,publicKey:process.env.RAILSOCIAL_VAPID_PUBLIC_KEY!,privateKey:process.env.RAILSOCIAL_VAPID_PRIVATE_KEY!}}));
 for(let i=0;i<rows.length;i+=5)await Promise.all(rows.slice(i,i+5).map(async d=>{
  const allowed=d.recipient_id===d.device_user&&(await database.query(`SELECT 1 FROM rail_activity_content c WHERE c.scope=$1 AND c.id=$2 AND rail_visible_to($1,$2,$3) AND rail_unblocked($3,$4)
   AND ($5 NOT IN ('post','stack','comment') OR ($5='comment' AND c.user_id=$3) OR EXISTS(SELECT 1 FROM rail_watches w WHERE w.user_id=$3 AND ((w.scope=c.scope AND w.target_id=c.id) OR (w.scope='session' AND w.target_id=c.session_id))))
   AND ($5<>'session' OR EXISTS(SELECT 1 FROM rail_follows WHERE follower_id=$3 AND followed_id=$4))
   AND ($5<>'follow' OR EXISTS(SELECT 1 FROM rail_follows WHERE follower_id=$4 AND followed_id=$3))`,[d.scope,d.target_id,d.recipient_id,d.actor_id,d.kind])).rows.length;
  if(!allowed||!validPushEndpoint(d.endpoint)){await database.query('DELETE FROM rail_push_outbox WHERE notification_id=$1 AND device_id=$2',[d.notification_id,d.device_id]);return}
  try{
   // Keep sensitive stack counts and private post text off the lock screen.
   await sender({endpoint:d.endpoint,keys:{p256dh:d.p256dh,auth:d.auth}},JSON.stringify({title:'Rail Social',body:notificationWords[d.kind]?'Someone '+notificationWords[d.kind]+'.':'New activity on Rail Social.',url:d.href,tag:d.id}));
   await database.query('UPDATE rail_push_outbox SET sent_at=now(),lease_until=NULL,last_error=NULL WHERE notification_id=$1 AND device_id=$2',[d.notification_id,d.device_id]);sent++;
  }catch(error){
   const status=(error as {statusCode?:number}).statusCode;
   if(status===404||status===410)await database.query('DELETE FROM rail_push_devices WHERE id=$1',[d.device_id]);
   else await database.query("UPDATE rail_push_outbox SET lease_until=NULL,available_at=now()+($3::int*interval '1 minute'),last_error=$4 WHERE notification_id=$1 AND device_id=$2",[d.notification_id,d.device_id,Math.min(60,2**d.attempts),status?'provider-'+status:'transport']);
   failed++;
  }
 }));
 return {sent,failed};
}
export async function flushActivity(database:RoomDatabase){
 const started=Date.now();let sent=0,failed=0,events=0;
 do{const processed=await processActivityEvents(database);events+=processed;const delivery=await deliverPush(database);sent+=delivery.sent;failed+=delivery.failed;if(processed<40&&delivery.sent+delivery.failed<30)break}while(Date.now()-started<45000);
 return {sent,failed,events};
}
