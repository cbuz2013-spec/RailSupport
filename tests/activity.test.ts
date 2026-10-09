import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import type {Pool} from 'pg';
import {mutateActivity,activityComments,activityStates,validMentions} from '../lib/activity';
import {processActivityEvents,notificationInbox,deliverPush,savePushDevice,validPushEndpoint} from '../lib/notifications';
import {saveRailPost} from '../lib/save-rail-post';
import {postSchema} from '../lib/validation';
import {mutateCommunity,people} from '../lib/community';
let db:PGlite;
let pool:Pool;
before(async()=>{
 db=await PGlite.create();await db.exec('CREATE TABLE "user"(id text PRIMARY KEY,name text,email text)');
 await db.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));
 // A rerun must preserve schema and triggers, with no duplicated events.
 await db.exec(await readFile(new URL('../scripts/activity-2.3.sql',import.meta.url),'utf8'));
 pool={connect:async()=>({query:async(sql:string,values?:unknown[])=>{const r=await db.query(sql,values);return {...r,rowCount:r.rows.length||r.affectedRows}},release(){}})} as unknown as Pool;
});
after(async()=>db.close());
beforeEach(async()=>{
 await db.exec(`TRUNCATE "user" CASCADE;DELETE FROM rail_comment_likes;DELETE FROM rail_watches;
 INSERT INTO "user" VALUES('a','Alex','a@example.test'),('b','Blair','b@example.test'),('c','Casey','c@example.test');
 INSERT INTO rail_groups(id,name,kind,owner,code) VALUES('g','Test Rail','Friends','a','test-code');
 INSERT INTO rail_members VALUES('g','a'),('g','b');
 INSERT INTO rail_rooms(id,name,city,owner_id,published) VALUES('r','Test Room','Online','a',true);
 INSERT INTO rail_room_follows(room_id,user_id) VALUES('r','b');
 INSERT INTO rail_posts(id,group_id,user_id,kind,body) VALUES('p','g','a','update','Original');
 INSERT INTO rail_room_posts(id,room_id,user_id,body) VALUES('rp','r','b','Room post');
 INSERT INTO rail_table_posts(id,user_id,kind,audience,body) VALUES('tp','a','status','public','Table post');
 DELETE FROM rail_activity_events;`);
});
const inbox=async(u:string)=>(await notificationInbox(db,u)).items;
const act=(user:string,action:string,extra:Record<string,unknown>={})=>mutateActivity(db,user,{scope:'rail',postId:'p',action,...extra});
const subscription=(suffix='one')=>({endpoint:'https://fcm.googleapis.com/fcm/send/'+suffix,keys:{p256dh:Buffer.alloc(65,1).toString('base64url'),auth:Buffer.alloc(16,2).toString('base64url')}});

test('optional post fields preserve zero, allow partial hands, reject malformed cards and empty posts',()=>{
 for(const details of [{body:'Hello'},{tournament:{chips:0}},{tournament:{status:'Out'}},{hand:{question:'Which line?'}},{hand:{position:'BTN'}},{images:['data:image/jpeg;base64,test']}])assert.equal(postSchema.safeParse({groupId:'g',kind:'hand',...details}).success,true);
 for(const details of [{},{tournament:{bigBlind:0}},{hand:{hero:'Ah Ah'}},{hand:{hero:'Ah'}},{hand:{board:'2c 3c'}}])assert.equal(postSchema.safeParse({groupId:'g',kind:'hand',...details}).success,false);
});
test('post edits enforce author and membership, preserve images, and rollback events on invalid uploads',async()=>{
 const p=await saveRailPost(pool,'a',{groupId:'g',kind:'hand',hand:{question:'Review this?'}});
 await assert.rejects(saveRailPost(pool,'b',{groupId:'g',kind:'update',body:'Forged'},p.id));
 await assert.rejects(saveRailPost(pool,'c',{groupId:'g',kind:'update',body:'No access'}));
 await db.query("INSERT INTO rail_post_images(post_id,position,mime,data) VALUES($1,0,'image/jpeg',$2)",[p.id,Buffer.from([255,216,255,217])]);
 await saveRailPost(pool,'a',{groupId:'g',kind:'update',tournament:{chips:0},keepImages:[0]},p.id);
 assert.equal((await db.query('SELECT * FROM rail_post_images WHERE post_id=$1',[p.id])).rows.length,1);
 const count=(await db.query('SELECT count(*)::int AS n FROM rail_activity_events')).rows;
 await assert.rejects(saveRailPost(pool,'a',{groupId:'g',kind:'update',body:'Bad photo',startSession:'cash',images:['not an image']}));
 assert.deepEqual((await db.query('SELECT count(*)::int AS n FROM rail_activity_events')).rows,count);
 assert.equal((await db.query('SELECT * FROM rail_sessions')).rows.length,0);
});
test('watching is scoped, idempotent, and cannot unlock a private group',async()=>{
 await assert.rejects(act('c','watch',{enabled:true}));
 await act('b','watch',{enabled:true});await act('b','watch',{enabled:true});
 await db.exec(`UPDATE rail_posts SET tournament='{"chips":1200}' WHERE id='p'`);
 await processActivityEvents(db);await processActivityEvents(db);
 assert.equal((await inbox('b')).length,1);assert.equal((await inbox('b'))[0].kind,'stack');
 assert.equal((await inbox('c')).length,0);
 await act('b','watch',{enabled:false});await db.exec(`UPDATE rail_posts SET tournament='{"chips":1500}' WHERE id='p'`);await processActivityEvents(db);
 assert.equal((await inbox('b')).length,1);
});
test('new sessions notify only followers with private access; session watches cover new updates',async()=>{
 await db.exec("INSERT INTO rail_follows(follower_id,followed_id) VALUES('b','a'),('c','a');DELETE FROM rail_activity_events");
 const first=await saveRailPost(pool,'a',{groupId:'g',kind:'update',startSession:'tournament',tournament:{chips:1000}});
 await processActivityEvents(db);assert.equal((await inbox('b')).length,1);assert.equal((await inbox('b'))[0].kind,'session');assert.equal((await inbox('c')).length,0);
 await mutateActivity(db,'b',{action:'watch',scope:'rail',postId:first.id,enabled:true});
 await saveRailPost(pool,'a',{groupId:'g',kind:'update',sessionId:first.sessionId,tournament:{chips:2000}});
 await processActivityEvents(db);assert.equal((await inbox('b')).length,2);
 await assert.rejects(saveRailPost(pool,'b',{groupId:'g',kind:'update',sessionId:first.sessionId,body:'Hijack'}));
});
test('likes, comment likes, comments and follows notify once, never notify yourself',async()=>{
 await act('b','like',{enabled:true});await act('b','like',{enabled:true});await act('a','like',{enabled:true});
 const comment=await act('b','comment',{body:'Nice hand'}) as {id:string};
 await act('a','likeComment',{commentId:comment.id,enabled:true});
 await db.exec("INSERT INTO rail_follows(follower_id,followed_id) VALUES('b','a')");
 await processActivityEvents(db);
 assert.deepEqual((await inbox('a')).map(n=>n.kind).sort(),['comment','follow','like']);
 assert.deepEqual((await inbox('b')).map(n=>n.kind),['comment_like']);
 await act('b','like',{enabled:false});await act('b','like',{enabled:true});await processActivityEvents(db);assert.equal((await inbox('a')).length,3);
});
test('tag deletion suppresses mentions and edits only notify newly added tags',async()=>{
 assert.deepEqual(await validMentions(db,'a','Hello',['b']),[]);
 assert.deepEqual(await validMentions(db,'a','@Blair Hello',['b']),['b']);
 await act('a','comment',{body:'@Blair Hello',mentions:['b']});await processActivityEvents(db);assert.equal((await inbox('b')).length,1);
 const comment=(await activityComments(db,'a','rail','p')).comments[0];
 await act('a','editComment',{commentId:comment.id,body:'@Blair Edited',mentions:['b']});await processActivityEvents(db);assert.equal((await inbox('b')).length,1);
 await act('a','editComment',{commentId:comment.id,body:'Untagged',mentions:['b']});
 assert.deepEqual((await activityComments(db,'a','rail','p')).comments[0].mentions,[]);
});
test('comment authors edit/delete after unfollowing; hosts remove but cannot edit another author',async()=>{
 const c=await mutateActivity(db,'b',{scope:'room',postId:'rp',action:'comment',body:'Mine'}) as {id:string};
 await db.exec("DELETE FROM rail_room_follows WHERE user_id='b'");
 await mutateActivity(db,'b',{scope:'room',postId:'rp',action:'editComment',commentId:c.id,body:'Changed'});
 await assert.rejects(mutateActivity(db,'a',{scope:'room',postId:'rp',action:'editComment',commentId:c.id,body:'Forged'}));
 await mutateActivity(db,'b',{scope:'room',postId:'rp',action:'deleteComment',commentId:c.id});
 await assert.rejects(mutateActivity(db,'a',{scope:'room',postId:'rp',action:'editPost',body:'Forged'}));
 await mutateActivity(db,'a',{scope:'room',postId:'rp',action:'deletePost'});
 assert.equal((await activityStates(db,'b',[{scope:'room',id:'rp'}])).length,0);
});
test('blocks and revoked membership remove inbox entries and cancel queued push before delivery',async()=>{
 await savePushDevice(db,'a',subscription());await act('b','like',{enabled:true});await processActivityEvents(db);
 assert.equal((await inbox('a')).length,1);await db.exec("INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES('a','b')");
 assert.equal((await inbox('a')).length,0);
 let sent=0;await deliverPush(db,async()=>{sent++});assert.equal(sent,0);
 await db.exec("DELETE FROM rail_blocks;DELETE FROM rail_members WHERE user_id='a'");
 assert.equal((await inbox('a')).length,0);await assert.rejects(act('a','watch',{enabled:true}));
});
test('encrypted delivery payloads omit private content; dead endpoints are removed and transient errors retry',async()=>{
 await savePushDevice(db,'a',subscription());await act('b','comment',{body:'Secret private chips 123456'});await processActivityEvents(db);
 const failed=await deliverPush(db,async()=>{throw {statusCode:503}});assert.equal(failed.failed,1);
 assert.equal((await deliverPush(db,async()=>{})).sent,0);
 await db.exec("UPDATE rail_push_outbox SET available_at=now()-interval '1 minute'");
 const delivered=await deliverPush(db,async(s,payload)=>{assert.equal(s.endpoint,subscription().endpoint);assert.ok(!payload.includes('Secret'));assert.ok(!payload.includes('123456'));assert.equal(JSON.parse(payload).url,'/?group=g&post=p')});assert.equal(delivered.sent,1);
 await act('b','like',{enabled:true});await processActivityEvents(db);await deliverPush(db,async()=>{throw {statusCode:410}});
 assert.equal((await db.query('SELECT * FROM rail_push_devices')).rows.length,0);
});
test('push endpoints reject SSRF and account switching drops the previous account queue',async()=>{
 for(const url of ['http://fcm.googleapis.com/test','https://localhost/test','https://127.0.0.1/test','https://fcm.googleapis.com.evil.example/test','https://u:p@fcm.googleapis.com/test','https://fcm.googleapis.com:123/test'])assert.equal(validPushEndpoint(url),false);
 await assert.rejects(savePushDevice(db,'a',{...subscription(),keys:{p256dh:'x',auth:'x'}}));
 await savePushDevice(db,'a',subscription());await act('b','like',{enabled:true});await processActivityEvents(db);
 assert.equal((await db.query('SELECT * FROM rail_push_outbox')).rows.length,1);
 await savePushDevice(db,'b',subscription());assert.equal((await db.query('SELECT * FROM rail_push_outbox')).rows.length,0);
});
test('leaving a rail cancels pending watch alerts; deleted comments cannot emit delayed tags',async()=>{
 await savePushDevice(db,'b',subscription());await act('b','watch',{enabled:true});
 await db.exec(`UPDATE rail_posts SET tournament='{"chips":7000}' WHERE id='p'`);await processActivityEvents(db);
 await act('b','watch',{enabled:false});let calls=0;await deliverPush(db,async()=>{calls++});assert.equal(calls,0);
 const c=await act('a','comment',{body:'@Blair Removed',mentions:['b']}) as {id:string};
 await act('a','deleteComment',{commentId:c.id});await processActivityEvents(db);
 assert.equal((await inbox('b')).filter(n=>n.kind==='mention').length,0);
});
test('invitations notify nonmembers without exposing private posts, and acceptance clears the pending alert',async()=>{
 await savePushDevice(db,'c',subscription());
 await mutateCommunity(db,'a',{action:'invite',groupId:'g',recipientId:'c'});
 await mutateCommunity(db,'a',{action:'invite',groupId:'g',recipientId:'c'});
 await processActivityEvents(db);const items=await inbox('c');assert.equal(items.length,1);assert.equal(items[0].kind,'invitation');assert.equal(items[0].href,'/?view=people');
 await assert.rejects(act('c','watch',{enabled:true}));
 let delivered=0;await deliverPush(db,async(_s,payload)=>{delivered++;assert.equal(JSON.parse(payload).body,'Someone invited you to a rail or room.')});assert.equal(delivered,1);
 const suggestions=await people(db,'a',new URLSearchParams({inviteGroup:'g'}));assert.equal(suggestions.people.find(p=>p.id==='b')?.alreadyMember,true);assert.equal(suggestions.people.find(p=>p.id==='c')?.invited,true);
 const invitation=(await people(db,'c',new URLSearchParams())).invitations[0];
 await mutateCommunity(db,'c',{action:'accept',invitationId:invitation.id});assert.equal((await inbox('c')).length,0);
 await act('c','watch',{enabled:true});
});
test('revoking the inviter or blocking them suppresses queued invitation delivery',async()=>{
 await savePushDevice(db,'c',subscription());
 await mutateCommunity(db,'b',{action:'invite',groupId:'g',recipientId:'c'});await processActivityEvents(db);
 await db.exec("DELETE FROM rail_members WHERE user_id='b'");assert.equal((await inbox('c')).length,0);let delivered=0;await deliverPush(db,async()=>{delivered++});assert.equal(delivered,0);
 await assert.rejects(people(db,'c',new URLSearchParams({inviteGroup:'g'})));
});
