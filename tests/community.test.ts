import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {people,community,leagues,mutateCommunity as mutate} from '../lib/community';
import {RoomError} from '../lib/rooms';
let db:PGlite;
const query=(x:Record<string,string>)=>new URLSearchParams(x);
const denied=(e:unknown)=>e instanceof RoomError;
before(async()=>{
 db=await PGlite.create();await db.exec('CREATE TABLE "user" (id text PRIMARY KEY,name text NOT NULL,email text UNIQUE NOT NULL)');
 await db.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));
 await db.exec(`INSERT INTO "user" VALUES ('owner','Alex Owner','private@example.test'),('member','Sam Member','member@example.test'),('guest','Jordan Guest','guest@example.test'),('stranger','Other Person','stranger@example.test');
 INSERT INTO rail_groups(id,name,kind,owner,code) VALUES('rail','Fab Test','Friends','owner','test-secret-code');
 INSERT INTO rail_members VALUES('rail','owner');
 INSERT INTO rail_rooms(id,owner_id,name,city,published) VALUES('room','owner','Dealer Room','Online',true),('draft','owner','Draft Room','Online',false),('other','stranger','Other Room','Online',true);
 INSERT INTO rail_room_follows(room_id,user_id) VALUES('room','member');`);
});
after(async()=>await db?.close());
test('member discovery searches names, has no emails or invite codes, and honors mutual follow filters',async()=>{
 const all=await people(db,'owner',query({q:'sam'}));assert.equal(all.people.length,1);assert.equal(all.people[0].id,'member');
 assert.equal(JSON.stringify(all).includes('@'),false);assert.equal(JSON.stringify(all).includes('test-secret'),false);
 await db.exec("INSERT INTO rail_follows(follower_id,followed_id) VALUES('owner','member'),('member','owner')");
 assert.equal((await people(db,'owner',query({scope:'friends'}))).people.length,1);
 assert.equal((await people(db,'owner',query({q:'%'}))).people.length,0);
 await assert.rejects(people(db,'owner',query({offset:'NaN'})),denied);
});
test('both directions of blocking remove people and prevent invitations',async()=>{
 for(const pair of [['owner','guest'],['guest','owner']]){
  await db.query('INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES($1,$2)',pair);
  assert.equal((await people(db,'owner',query({q:'Jordan'}))).people.length,0);
  await assert.rejects(mutate(db,'owner',{action:'invite',groupId:'rail',recipientId:'guest'}),denied);
  await db.exec('DELETE FROM rail_blocks');
 }
});
test('private rail invitations require membership, recipient consent, and open the correct destination',async()=>{
 await assert.rejects(mutate(db,'guest',{action:'invite',groupId:'rail',recipientId:'member'}),denied);
 await mutate(db,'owner',{action:'invite',groupId:'rail',recipientId:'guest'});
 await mutate(db,'owner',{action:'invite',groupId:'rail',recipientId:'guest'});
 const pending=await people(db,'guest',query({}));assert.equal(pending.invitations.length,1);
 const id=pending.invitations[0].id;
 await assert.rejects(mutate(db,'member',{action:'accept',invitationId:id}),denied);
 assert.deepEqual(await mutate(db,'guest',{action:'accept',invitationId:id}),{groupId:'rail',roomId:null});
 assert.equal((await db.query("SELECT 1 FROM rail_members WHERE group_id='rail' AND user_id='guest'")).rows.length,1);
 await assert.rejects(mutate(db,'guest',{action:'accept',invitationId:id}),denied);
});
test('followers invite people to rooms and acceptance follows without host or private-rail access',async()=>{
 await mutate(db,'member',{action:'invite',roomId:'room',recipientId:'stranger'});
 const id=(await people(db,'stranger',query({}))).invitations[0].id;
 assert.deepEqual(await mutate(db,'stranger',{action:'accept',invitationId:id}),{groupId:null,roomId:'room'});
 assert.equal((await db.query("SELECT 1 FROM rail_room_follows WHERE room_id='room' AND user_id='stranger'")).rows.length,1);
 assert.equal((await db.query("SELECT 1 FROM rail_room_hosts WHERE user_id='stranger'")).rows.length,0);
 assert.equal((await db.query("SELECT 1 FROM rail_members WHERE user_id='stranger'")).rows.length,0);
 await assert.rejects(mutate(db,'guest',{action:'invite',roomId:'room',recipientId:'owner'}),denied);
 await assert.rejects(mutate(db,'owner',{action:'invite',roomId:'draft',recipientId:'guest'}),denied);
});
test('declines are recipient-only; blocking, expired invitations and revoked senders prevent acceptance',async()=>{
 await mutate(db,'member',{action:'invite',roomId:'room',recipientId:'guest'});
 let id=(await people(db,'guest',query({}))).invitations[0].id;
 await assert.rejects(mutate(db,'owner',{action:'decline',invitationId:id}),denied);
 await mutate(db,'guest',{action:'decline',invitationId:id});
 await mutate(db,'member',{action:'invite',roomId:'room',recipientId:'guest'});
 id=(await people(db,'guest',query({}))).invitations[0].id;
 await db.exec("DELETE FROM rail_room_follows WHERE user_id='member'");
 await assert.rejects(mutate(db,'guest',{action:'accept',invitationId:id}),denied);
 await db.exec("INSERT INTO rail_room_follows(room_id,user_id) VALUES('room','member');INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES('guest','owner')");
 await assert.rejects(mutate(db,'guest',{action:'accept',invitationId:id}),denied);
 await db.exec("DELETE FROM rail_blocks;UPDATE rail_invitations SET created=now()-interval '31 days'");
 await assert.rejects(mutate(db,'guest',{action:'accept',invitationId:id}),denied);
});
test('followers post and comment; unfollowed users, drafts and forged authors are denied',async()=>{
 await assert.rejects(mutate(db,'guest',{action:'post',roomId:'room',body:'Not following'}),denied);
 await assert.rejects(mutate(db,'member',{action:'post',roomId:'draft',body:'Draft'}),denied);
 await mutate(db,'member',{action:'post',roomId:'room',body:'Our game tonight',userId:'owner'});
 const feed=await community(db,'guest',query({roomId:'room'}));assert.ok(feed.posts);
 assert.equal(feed.posts[0].userId,'member');
 const postId=feed.posts[0].id;
 await mutate(db,'stranger',{action:'comment',roomId:'room',postId,body:'I’m in.'});
 await assert.rejects(mutate(db,'guest',{action:'comment',roomId:'room',postId,body:'Not following'}),denied);
 await db.exec("DELETE FROM rail_room_follows WHERE user_id='member'");
 await assert.rejects(mutate(db,'member',{action:'post',roomId:'room',body:'Stale client'}),denied);
 await db.exec("INSERT INTO rail_room_follows(room_id,user_id) VALUES('room','member')");
});
test('room conversation and comments respect blocking and room boundaries; hosts moderate',async()=>{
 const feed=await community(db,'owner',query({roomId:'room'}));assert.ok(feed.posts);const postId=String(feed.posts[0].id);
 await assert.rejects(mutate(db,'guest',{action:'removePost',roomId:'room',postId}),denied);
 await assert.rejects(mutate(db,'stranger',{action:'removePost',roomId:'other',postId}),denied);
 await db.exec("INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES('guest','member')");
 const hidden=await community(db,'guest',query({roomId:'room'}));assert.equal(hidden.posts?.length,0);
 await assert.rejects(community(db,'guest',query({roomId:'room',postId})),denied);
 await db.exec('DELETE FROM rail_blocks');
 const comments=await community(db,'owner',query({roomId:'room',postId}));assert.ok(comments.comments);
 await mutate(db,'owner',{action:'removeComment',roomId:'room',commentId:comments.comments[0].id});
 await mutate(db,'owner',{action:'removePost',roomId:'room',postId});
});
test('feed pagination is stable with same-time posts and oversized content is rejected',async()=>{
 for(let i=0;i<24;i++)await mutate(db,'member',{action:'post',roomId:'room',body:'Post '+i});
 const first=await community(db,'member',query({roomId:'room'}));assert.ok(first.posts);
 assert.equal(first.posts.length,20);assert.ok(first.nextBefore);
 const next=await community(db,'member',query({roomId:'room',before:String(first.nextBefore)}));assert.ok(next.posts);assert.equal(next.posts.length,4);
 assert.equal(new Set([...first.posts,...next.posts].map(p=>p.id)).size,24);
 await assert.rejects(mutate(db,'member',{action:'post',roomId:'room',body:'x'.repeat(5001)}),denied);
});
test('hosts create leagues; followers self-enroll but cannot manage events or results',async()=>{
 await assert.rejects(mutate(db,'member',{action:'createLeague',roomId:'room',name:'Forged League',rules:''}),denied);
 await mutate(db,'owner',{action:'createLeague',roomId:'room',name:'Dealer League',rules:'Ten points for first.'});
 const league=(await leagues(db,'member',query({roomId:'room'}))).leagues[0];
 await mutate(db,'member',{action:'joinLeague',roomId:'room',leagueId:league.id});
 await assert.rejects(mutate(db,'guest',{action:'joinLeague',roomId:'room',leagueId:league.id}),denied);
 const event={action:'saveEvent',roomId:'room',leagueId:league.id,name:'Game one',starts:'2026-10-15T22:00:00Z',details:'Online',status:'scheduled'};
 await assert.rejects(mutate(db,'member',event),denied);await mutate(db,'owner',event);
 const schedule=await leagues(db,'member',query({roomId:'room'}));const eventId=schedule.events[0].id;
 const result={action:'result',roomId:'room',leagueId:league.id,eventId,userId:'member',place:1,points:10};
 await assert.rejects(mutate(db,'member',result),denied);await mutate(db,'owner',result);
 assert.equal((await leagues(db,'member',query({roomId:'room'}))).standings[0].points,0);
 await mutate(db,'owner',{...event,eventId,status:'completed'});
 assert.equal((await leagues(db,'member',query({roomId:'room'}))).standings[0].points,10);
 await mutate(db,'owner',{...result,points:12.5});
 assert.equal((await leagues(db,'member',query({roomId:'room'}))).standings[0].points,12.5);
 await mutate(db,'owner',{...event,eventId,status:'cancelled'});
 assert.equal((await leagues(db,'member',query({roomId:'room'}))).standings[0].points,0);
 await assert.rejects(mutate(db,'owner',result),denied);
 await assert.rejects(mutate(db,'stranger',{...event,eventId,roomId:'other'}),denied);
 await mutate(db,'owner',{action:'editLeague',roomId:'room',leagueId:league.id,name:'Closed season',rules:'Final',active:false});
 await assert.rejects(mutate(db,'stranger',{action:'joinLeague',roomId:'room',leagueId:league.id}),denied);
 await mutate(db,'owner',{action:'removeResult',roomId:'room',leagueId:league.id,eventId,userId:'member'});
});
