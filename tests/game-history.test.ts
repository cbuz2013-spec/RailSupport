import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import type {Pool} from 'pg';
import {startTournament,updateTournament} from '../lib/tournament-rails';
import {saveRailPost} from '../lib/save-rail-post';
import {gameHistory,saveGamePhoto,gamePhoto} from '../lib/game-history';
import {manageCommunity} from '../lib/community-management';
import {activeGames} from '../lib/active-games';
import {processActivityEvents} from '../lib/notifications';
let db:PGlite,pool:Pool;
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4tAAAAAASUVORK5CYII=';
before(async()=>{db=await PGlite.create();await db.exec('CREATE TABLE "user"(id text PRIMARY KEY,name text,email text)');await db.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));pool={connect:async()=>({query:async(s:string,v?:unknown[])=>{const r=await db.query(s,v);return {...r,rowCount:r.rows.length||r.affectedRows}},release(){}})} as unknown as Pool});
after(()=>db.close());
beforeEach(async()=>{await db.exec(`TRUNCATE "user" CASCADE;DELETE FROM rail_watches;DELETE FROM rail_comment_likes;DELETE FROM rail_street_reactions;INSERT INTO "user" VALUES('a','Alex','a@example.test'),('b','Blair','b@example.test'),('c','Casey','c@example.test');INSERT INTO rail_groups(id,name,kind,owner,code) VALUES('g','Test rail','Friends','a','parent'),('other','Keep rail','Friends','c','other');INSERT INTO rail_members VALUES('g','a'),('g','b'),('other','c');INSERT INTO rail_follows(follower_id,followed_id) VALUES('b','a');`)});
const create=()=>startTournament(pool,'a',{groupId:'g',event:'Game',chips:10000,bigBlind:100,remaining:25,started:25,paid:4});
const history=(session:string,uid='a',before?:string)=>gameHistory(db,uid,{session,before});
const stack=(postId:string,values:Record<string,unknown>)=>updateTournament(pool,'a',{postId,part:'stack',values});

test('snapshots retain chip, blind, player and paid-place history; repeated saves do not duplicate points',async()=>{
 const r=await create();await stack(r.postId,{chips:18000,bigBlind:200,remaining:20,started:25,paid:4});await stack(r.postId,{chips:18000,bigBlind:200,remaining:20,started:25,paid:4});
 const h=await history(r.sessionId);assert.deepEqual(h.updates.map(u=>u.stats.chips),[10000,18000]);assert.equal(h.current.bigBlind,200);assert.equal(h.current.remaining,20);assert.equal(h.current.paid,4);assert.ok(h.updates.every(u=>u.created));assert.equal(h.updates[0].baseline,false);
});
test('history follows the game across posts and editing an older post preserves newer unrelated values',async()=>{
 const r=await create();await saveRailPost(pool,'a',{groupId:r.id,kind:'update',body:'Next level',tournament:{chips:20000,bigBlind:500,remaining:12,started:30,paid:5,status:'Playing'}});
 await updateTournament(pool,'a',{postId:r.postId,part:'stage',values:{stage:'In the Money'}});
 const h=await history(r.sessionId);assert.equal(h.current.chips,20000);assert.equal(h.current.bigBlind,500);assert.equal(h.current.started,30);assert.equal(h.current.paid,5);assert.equal(h.current.stage,'In the Money');assert.equal(h.updates.length,3);
});
test('zero values and cleared fields are recorded faithfully and finish preserves history',async()=>{
 const r=await create();await stack(r.postId,{chips:0,bigBlind:200,remaining:0,started:25,paid:4});await stack(r.postId,{bigBlind:200,remaining:0,started:25,paid:4});
 await updateTournament(pool,'a',{postId:r.postId,part:'status',values:{status:'Out',winnings:0}});
 const h=await history(r.sessionId);assert.equal(h.updates[1].stats.chips,0);assert.equal(h.current.chips,undefined);assert.equal(h.current.status,'Out');assert.equal(h.current.winnings,0);assert.equal(h.updates.length,4);assert.equal((await activeGames(db,'a',{})).games.length,0);
});
test('cash games have their own chip history and cannot mix another game or another player into it',async()=>{
 const a=await saveRailPost(pool,'a',{groupId:'g',kind:'update',startSession:'cash',tournament:{gameType:'cash',chips:500,bigBlind:2}});const b=await create();await stack(a.id,{chips:800,bigBlind:2});
 assert.deepEqual((await history(a.sessionId!)).updates.map(u=>u.stats.chips),[500,800]);assert.equal((await history(a.sessionId!)).current.gameType,'cash');assert.deepEqual((await history(b.sessionId)).updates.map(u=>u.stats.chips),[10000]);
 await assert.rejects(updateTournament(pool,'b',{postId:a.id,part:'stack',values:{chips:99999}}),/Only the player/);
});
test('game history and photos require membership, enforce blocks, and restrict photo changes to the player',async()=>{
 const r=await create();await saveGamePhoto(db,'a',{session:r.sessionId,image:photo});await assert.rejects(history(r.sessionId,'b'),/private/);await assert.rejects(gamePhoto(db,'b',r.sessionId),/private/);
 await db.query('INSERT INTO rail_members VALUES($1,$2)',[r.id,'b']);assert.ok((await history(r.sessionId,'b')).photo);assert.equal((await gamePhoto(db,'b',r.sessionId)).mime,'image/png');
 await assert.rejects(saveGamePhoto(db,'b',{session:r.sessionId,image:null}),/Only the player/);await db.exec("INSERT INTO rail_blocks VALUES('a','b',now())");await assert.rejects(gamePhoto(db,'b',r.sessionId),/private/);
});
test('photo replacement changes its URL, deletion removes bytes, and invalid image data is rejected',async()=>{
 const r=await create();await saveGamePhoto(db,'a',{session:r.sessionId,image:photo});const first=(await history(r.sessionId)).photo;await saveGamePhoto(db,'a',{session:r.sessionId,image:photo});assert.notEqual((await history(r.sessionId)).photo,first);
 await assert.rejects(saveGamePhoto(db,'a',{session:r.sessionId,image:'data:image/png;base64,aGVsbG8='}),/verified/);assert.equal((await gamePhoto(db,'a',r.sessionId)).mime,'image/png');
 await saveGamePhoto(db,'a',{session:r.sessionId,image:null});assert.equal((await history(r.sessionId)).photo,null);await assert.rejects(gamePhoto(db,'a',r.sessionId),/unavailable/);
});
test('history pages preserve every saved update without duplicates and retain the latest summary',async()=>{
 const r=await create();for(let n=1;n<=105;n++)await stack(r.postId,{chips:10000+n,bigBlind:100});
 const latest=await history(r.sessionId);assert.equal(latest.updates.length,100);assert.ok(latest.before);const earlier=await history(r.sessionId,'a',latest.before!);assert.equal(earlier.updates.length,6);assert.equal(earlier.before,null);assert.equal(new Set([...earlier.updates,...latest.updates].map(u=>u.id)).size,106);assert.equal(earlier.current.chips,10105);
});
test('migration seeds only known saved values, reruns preserve history and do not replay notifications',async()=>{
 const r=await create();await stack(r.postId,{chips:12345,bigBlind:200});await db.query('DELETE FROM rail_game_updates WHERE session_id=$1',[r.sessionId]);const before=(await db.query('SELECT count(*)::int AS n FROM rail_activity_events')).rows[0];
 const sql=await readFile(new URL('../scripts/game-history-2.8.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);const h=await history(r.sessionId);assert.equal(h.updates.length,1);assert.equal(h.updates[0].stats.chips,12345);assert.equal(h.updates[0].baseline,true);assert.deepEqual((await db.query('SELECT count(*)::int AS n FROM rail_activity_events')).rows[0],before);
});
test('only the owner with the exact current rail name can delete; other members and stale confirmations cannot',async()=>{
 await assert.rejects(manageCommunity(db,'b',{action:'deleteGroup',groupId:'g',confirmName:'Test rail'}),/Only the group owner/);await assert.rejects(manageCommunity(db,'a',{action:'deleteGroup',groupId:'g'}),/Type the rail name/);await assert.rejects(manageCommunity(db,'a',{action:'deleteGroup',groupId:'g',confirmName:'Wrong'}),/Type the rail name/);assert.equal((await db.query("SELECT * FROM rail_groups WHERE id='g'")).rows.length,1);
});
test('deleting a tournament cascades its content, history, photo, members and alerts but preserves accounts and other rails',async()=>{
 const r=await create();await db.query('INSERT INTO rail_members VALUES($1,$2)',[r.id,'b']);await saveGamePhoto(db,'a',{session:r.sessionId,image:photo});await db.query("INSERT INTO rail_tournament_chat(id,group_id,user_id,body) VALUES('chat',$1,'b','Hi')",[r.id]);await processActivityEvents(db,100);
 await db.exec('BEGIN');try{await manageCommunity(db,'a',{action:'deleteGroup',groupId:r.id,confirmName:'Game'});await db.exec('COMMIT')}catch(e){await db.exec('ROLLBACK');throw e}
 for(const table of ['rail_game_updates','rail_game_photos','rail_sessions'])assert.equal((await db.query(`SELECT * FROM ${table}`)).rows.length,0);
 assert.equal((await db.query('SELECT * FROM rail_tournament_chat')).rows.length,0);assert.equal((await db.query('SELECT * FROM rail_posts')).rows.length,0);assert.equal((await db.query('SELECT * FROM "user"')).rows.length,3);assert.equal((await db.query('SELECT * FROM rail_groups')).rows.length,2);assert.equal((await db.query("SELECT * FROM rail_notifications WHERE scope IN('session','game','rail')")).rows.length,0);assert.equal((await activeGames(db,'b',{})).games.length,0);
 await assert.rejects(history(r.sessionId),/no longer available/);
});
test('deleting a parent rail preserves separate tournament rails and cleans comments, reactions, invitations and watches',async()=>{
 const r=await create();const cash=await saveRailPost(pool,'a',{groupId:'g',kind:'update',startSession:'cash',body:'Cash',tournament:{gameType:'cash',chips:500}});
 await db.query("INSERT INTO rail_comments(id,post_id,user_id,body) VALUES('comment',$1,'b','Nice')",[cash.id]);await db.exec("INSERT INTO rail_comment_likes(scope,comment_id,user_id) VALUES('rail','comment','a')");
 await db.query("INSERT INTO rail_street_reactions(scope,post_id,user_id,street,reaction) VALUES('rail',$1,'b','preflop','heart')",[cash.id]);
 await db.query("INSERT INTO rail_invitations(id,sender_id,recipient_id,group_id) VALUES('invite','a','c','g')");await processActivityEvents(db,100);
 await manageCommunity(db,'a',{action:'deleteGroup',groupId:'g',confirmName:'Test rail'});
 assert.equal((await db.query<{parent_group_id:string|null}>('SELECT parent_group_id FROM rail_groups WHERE id=$1',[r.id])).rows[0].parent_group_id,null);assert.equal((await history(r.sessionId)).current.chips,10000);
 for(const table of ['rail_comments','rail_comment_likes','rail_street_reactions','rail_invitations','rail_invitation_history'])assert.equal((await db.query(`SELECT * FROM ${table}`)).rows.length,0);
 assert.equal((await db.query('SELECT * FROM rail_watches WHERE target_id=$1',[cash.sessionId])).rows.length,0);assert.equal((await db.query("SELECT * FROM rail_groups WHERE id='other'")).rows.length,1);
});
