import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import type {Pool} from 'pg';
import {startTournament,updateTournament} from '../lib/tournament-rails';
import {saveRailPost} from '../lib/save-rail-post';
import {activeGames} from '../lib/active-games';
import {contentFor} from '../lib/activity';
import {processActivityEvents,notificationInbox,deliverPush,savePushDevice} from '../lib/notifications';
import {mutateCommunity} from '../lib/community';
let db:PGlite,pool:Pool;
before(async()=>{db=await PGlite.create();await db.exec('CREATE TABLE "user"(id text PRIMARY KEY,name text,email text)');await db.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));pool={connect:async()=>({query:async(s:string,v?:unknown[])=>{const r=await db.query(s,v);return {...r,rowCount:r.rows.length||r.affectedRows}},release(){}})} as unknown as Pool});
after(()=>db.close());
beforeEach(async()=>{await db.exec(`TRUNCATE "user" CASCADE;DELETE FROM rail_watches;INSERT INTO "user" VALUES('a','Alex','a@example.test'),('b','Blair','b@example.test'),('c','Casey','c@example.test');INSERT INTO rail_groups(id,name,kind,owner,code) VALUES('g','Private parent','Friends','a','parent');INSERT INTO rail_members VALUES('g','a');INSERT INTO rail_follows(follower_id,followed_id) VALUES('b','a');INSERT INTO rail_rooms(id,name,city,owner_id,published) VALUES('r','Test Room','Online','a',true);INSERT INTO rail_room_follows(room_id,user_id) VALUES('r','b');INSERT INTO rail_leagues(id,room_id,name,rules) VALUES('l','r','League','');DELETE FROM rail_activity_events;`)});
const create=()=>startTournament(pool,'a',{groupId:'g',event:'Private event name',location:'Private location',chips:50000,bigBlind:1000});
const inbox=async()=> (await notificationInbox(db,'b')).items;
const finish=(r:{postId:string})=>updateTournament(pool,'a',{postId:r.postId,part:'status',values:{status:'Cashed',winnings:3000}});

test('followers get one start and one finish alert without joining or seeing private tournament information',async()=>{
 const r=await create();await processActivityEvents(db,100);await processActivityEvents(db,100);
 assert.deepEqual((await inbox()).map(n=>n.kind),['tournament_start']);assert.equal((await inbox())[0].href,'/?view=games&game='+r.sessionId);
 assert.equal((await db.query("SELECT * FROM rail_members WHERE user_id='b'")).rows.length,0);
 await assert.rejects(contentFor(db,'b','session',r.sessionId));await assert.rejects(contentFor(db,'b','rail',r.postId));
 assert.equal((await contentFor(db,'b','game',r.sessionId)).body,'');
 const listed=(await activeGames(db,'b',{})).games;assert.equal(listed.length,1);assert.equal(listed[0].private,true);assert.equal(listed[0].name,'');assert.equal(listed[0].groupId,null);assert.equal(listed[0].railName,null);assert.equal(listed[0].tournament,null);assert.doesNotMatch(JSON.stringify(listed),/Private event|Private location|50000|3000/);
 await finish(r);await finish(r);await processActivityEvents(db,100);assert.deepEqual((await inbox()).map(n=>n.kind).sort(),['tournament_finish','tournament_start']);
 assert.equal((await activeGames(db,'b',{})).games.length,0);const selected=(await activeGames(db,'b',{game:r.sessionId})).selected;assert.equal(selected?.active,false);assert.ok(selected?.finishedAt);assert.equal(selected?.tournament,null);
 // Correcting a status does not spam followers with a second completion alert.
 await updateTournament(pool,'a',{postId:r.postId,part:'status',values:{status:'Playing'}});await finish(r);await processActivityEvents(db,100);assert.equal((await inbox()).filter(n=>n.kind==='tournament_finish').length,1);
});
test('unfollowing or blocking before push delivery cancels tournament alerts and removes inaccessible games',async()=>{
 await savePushDevice(db,'b',{endpoint:'https://fcm.googleapis.com/fcm/send/games-test',keys:{p256dh:Buffer.alloc(65,1).toString('base64url'),auth:Buffer.alloc(16,2).toString('base64url')}});
 const r=await create();await processActivityEvents(db,100);await db.exec("DELETE FROM rail_follows WHERE follower_id='b'");let sent=0;await deliverPush(db,async()=>{sent++});assert.equal(sent,0);assert.equal((await activeGames(db,'b',{})).games.length,0);
 await db.exec("INSERT INTO rail_follows(follower_id,followed_id) VALUES('b','a');INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES('a','b')");await finish(r);await processActivityEvents(db,100);assert.equal((await inbox()).length,0);assert.equal((await activeGames(db,'b',{})).games.length,0);
});
test('push lifecycle alerts contain no private event names, stack counts or winnings',async()=>{
 await savePushDevice(db,'b',{endpoint:'https://fcm.googleapis.com/fcm/send/games-test',keys:{p256dh:Buffer.alloc(65,1).toString('base64url'),auth:Buffer.alloc(16,2).toString('base64url')}});
 const r=await create();await processActivityEvents(db,100);await finish(r);await processActivityEvents(db,100);const payloads:string[]=[];await deliverPush(db,async(_device,payload)=>{payloads.push(payload)});
 assert.equal(payloads.length,2);assert.match(payloads.join(),/started a tournament/);assert.match(payloads.join(),/finished a tournament/);assert.doesNotMatch(payloads.join(),/Private event|50000|3000/);
});
test('rail membership includes active games without following the player; child rails retain private details',async()=>{
 await db.exec("DELETE FROM rail_follows;INSERT INTO rail_members VALUES('g','b')");const r=await create();
 const cards=(await activeGames(db,'b',{filter:'rails'})).games;assert.equal(cards.length,1);assert.equal(cards[0].private,true);assert.equal((await activeGames(db,'b',{filter:'players'})).games.length,0);
 await db.query('INSERT INTO rail_members VALUES($1,$2)',[r.id,'b']);const full=(await activeGames(db,'b',{filter:'rails'})).games[0];assert.equal(full.private,false);assert.equal(full.name,'Private event name');assert.equal(full.tournament?.chips,50000);assert.ok(full.href.includes('group='+r.id));
 await db.exec("DELETE FROM rail_members WHERE user_id='b';DELETE FROM rail_follows");assert.equal((await activeGames(db,'b',{})).games.length,0);assert.equal((await activeGames(db,'c',{game:r.sessionId})).selected,null);
});
test('cash sessions appear for followed players and disappear on completion without tournament lifecycle alerts',async()=>{
 const r=await saveRailPost(pool,'a',{groupId:'g',kind:'update',startSession:'cash',tournament:{gameType:'cash',chips:500}});assert.equal((await activeGames(db,'b',{})).games[0].kind,'cash');await processActivityEvents(db,100);assert.equal((await inbox()).length,0);
 await updateTournament(pool,'a',{postId:r.id,part:'status',values:{status:'Out'}});await processActivityEvents(db,100);assert.equal((await activeGames(db,'b',{})).games.length,0);assert.equal((await inbox()).length,0);
});
test('followed room games require explicit In Progress status and host authority; completion, unfollow and unpublish remove them',async()=>{
 const event={action:'saveEvent',roomId:'r',leagueId:'l',name:'Room tournament',starts:new Date().toISOString(),details:'Room game',status:'scheduled'};
 await mutateCommunity(db,'a',event);const id=(await db.query<{id:string}>('SELECT id FROM rail_league_events')).rows[0].id;
 assert.equal((await activeGames(db,'b',{filter:'rooms'})).games.length,0);await assert.rejects(mutateCommunity(db,'b',{...event,eventId:id,status:'active'}));
 await mutateCommunity(db,'a',{...event,eventId:id,status:'active'});const games=(await activeGames(db,'b',{filter:'rooms'})).games;assert.equal(games.length,1);assert.equal(games[0].source,'room');assert.ok(games[0].href.includes('league=l'));assert.equal((await activeGames(db,'c',{})).games.length,0);
 await db.exec("UPDATE rail_rooms SET published=false");assert.equal((await activeGames(db,'b',{})).games.length,0);await db.exec("UPDATE rail_rooms SET published=true;DELETE FROM rail_room_follows");assert.equal((await activeGames(db,'b',{})).games.length,0);
 await db.exec("INSERT INTO rail_room_follows VALUES('r','b',now())");await mutateCommunity(db,'a',{...event,eventId:id,status:'completed'});assert.equal((await activeGames(db,'b',{})).games.length,0);
});
test('combined game list paginates deterministically and does not duplicate a game followed through both player and rail',async()=>{
 await db.exec("INSERT INTO rail_members VALUES('g','b');INSERT INTO rail_sessions(id,group_id,user_id,kind,name) SELECT 's'||n,'g','a','cash','Cash '||n FROM generate_series(1,55) n");
 const first=await activeGames(db,'b',{}),second=await activeGames(db,'b',{offset:first.nextOffset});assert.equal(first.games.length,50);assert.equal(second.games.length,5);assert.equal(new Set([...first.games,...second.games].map(g=>g.id)).size,55);assert.equal(second.nextOffset,null);
 await assert.rejects(activeGames(db,'b',{filter:'unknown'}));await assert.rejects(activeGames(db,'b',{offset:-1}));
});
test('migration reruns do not replay starts or finishes or alter existing active state',async()=>{
 const r=await create();await finish(r);const before=(await db.query('SELECT kind,target_id FROM rail_activity_events ORDER BY id')).rows;
 await db.exec(await readFile(new URL('../scripts/active-games-2.7.sql',import.meta.url),'utf8'));assert.deepEqual((await db.query('SELECT kind,target_id FROM rail_activity_events ORDER BY id')).rows,before);assert.equal((await activeGames(db,'a',{})).games.length,0);
});
