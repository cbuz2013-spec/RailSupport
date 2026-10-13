import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {startTournament,updateTournament,readTournamentChat,sendTournamentChat} from '../lib/tournament-rails';
import {saveRailPost} from '../lib/save-rail-post';
import {mutateCommunity} from '../lib/community';
import {mutateActivity} from '../lib/activity';
import {postSchema} from '../lib/validation';
let db:PGlite,pool:Pool;
before(async()=>{db=await PGlite.create();await db.exec('CREATE TABLE "user"(id text PRIMARY KEY,name text,email text)');await db.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));pool={connect:async()=>({query:async(s:string,v?:unknown[])=>{const r=await db.query(s,v);return {...r,rowCount:r.rows.length||r.affectedRows}},release(){}})} as unknown as Pool;});
after(()=>db.close());
beforeEach(async()=>{await db.exec(`TRUNCATE "user" CASCADE;DELETE FROM rail_watches;INSERT INTO "user" VALUES('a','Alex','a@example.test'),('b','Blair','b@example.test'),('c','Casey','c@example.test');INSERT INTO rail_groups(id,name,kind,owner,code) VALUES('g','Private parent','Friends','a','parent');INSERT INTO rail_members VALUES('g','a');`)});
const create=()=>startTournament(pool,'a',{groupId:'g'});
test('optional tournament setup creates an isolated rail, session, opening update and player watch',async()=>{
 const r=await create();const g=(await db.query<{tournament:boolean;parent_group_id:string;owner:string}>('SELECT * FROM rail_groups WHERE id=$1',[r.id])).rows[0];
 assert.equal(g.tournament,true);assert.equal(g.parent_group_id,'g');assert.equal(g.owner,'a');
 assert.equal((await db.query('SELECT * FROM rail_posts WHERE group_id=$1 AND session_id=$2',[r.id,r.sessionId])).rows.length,1);
 await assert.rejects(startTournament(pool,'b',{groupId:'g'}));
 assert.ok(postSchema.safeParse({groupId:'g',kind:'update',body:'Just text'}).success);
 assert.ok(postSchema.safeParse({groupId:'g',kind:'update',body:'',tournament:{started:73}}).success);
});
test('joining gives mutual player follows and a tournament watch, never parent access; retry and migration rerun are safe',async()=>{
 const r=await create();await db.query('INSERT INTO rail_members VALUES($1,$2) ON CONFLICT DO NOTHING',[r.id,'b']);await db.query('INSERT INTO rail_members VALUES($1,$2) ON CONFLICT DO NOTHING',[r.id,'b']);
 assert.equal((await db.query('SELECT * FROM rail_follows')).rows.length,2);
 assert.equal((await db.query("SELECT * FROM rail_members WHERE group_id='g' AND user_id='b'")).rows.length,0);
 assert.equal((await db.query("SELECT * FROM rail_watches WHERE user_id='b' AND target_id=$1",[r.sessionId])).rows.length,1);
 await db.exec(await readFile(new URL('../scripts/tournaments-2.6.sql',import.meta.url),'utf8'));
 assert.equal((await db.query('SELECT * FROM rail_follows')).rows.length,2);
});
test('existing-user invitation acceptance joins and follows only when accepted, including the inviter',async()=>{
 const r=await create();await db.query('INSERT INTO rail_members VALUES($1,$2)',[r.id,'b']);await mutateCommunity(db,'b',{action:'invite',groupId:r.id,recipientId:'c'});
 assert.equal((await db.query("SELECT * FROM rail_follows WHERE follower_id='c' OR followed_id='c'")).rows.length,0);
 const i=(await db.query<{id:string}>('SELECT id FROM rail_invitations')).rows[0].id;await mutateCommunity(db,'c',{action:'accept',invitationId:i});
 assert.equal((await db.query("SELECT * FROM rail_follows WHERE follower_id='c' AND followed_id='a'")).rows.length,1);
 assert.equal((await db.query("SELECT * FROM rail_follows WHERE follower_id IN ('a','b') AND followed_id='c'")).rows.length,2);
});
test('only the player can publish updates; followers can comment and chat',async()=>{
 const r=await create();await db.query('INSERT INTO rail_members VALUES($1,$2)',[r.id,'b']);
 await assert.rejects(saveRailPost(pool,'b',{groupId:r.id,kind:'update',body:'Impersonation'}));
 await assert.rejects(db.query("INSERT INTO rail_posts(id,group_id,user_id,kind,body) VALUES('bad',$1,'b','update','No')",[r.id]));
 const p=await saveRailPost(pool,'a',{groupId:r.id,kind:'update',body:'Good run'});assert.equal(p.sessionId,r.sessionId);
 await mutateActivity(db,'b',{action:'comment',scope:'rail',postId:r.postId,body:'Good luck!'});
 await sendTournamentChat(db,'b',{groupId:r.id,id:randomUUID(),body:'Let’s go!'});assert.equal((await readTournamentChat(db,'a',r.id)).length,1);
 await assert.rejects(readTournamentChat(db,'c',r.id));await assert.rejects(sendTournamentChat(db,'c',{groupId:r.id,id:randomUUID(),body:'No access'}));
});
test('quick updates preserve unrelated fields, accept zero, clear optional values and reactivate the session',async()=>{
 const r=await create();await updateTournament(pool,'a',{postId:r.postId,part:'stack',values:{chips:125000,bigBlind:2000,remaining:24,started:73}});
 await updateTournament(pool,'a',{postId:r.postId,part:'stage',values:{stage:'Final Table'}});
 await updateTournament(pool,'a',{postId:r.postId,part:'status',values:{status:'Out',winnings:0}});
 const p=(await db.query<{tournament:Record<string,unknown>;body:string}>('SELECT * FROM rail_posts WHERE id=$1',[r.postId])).rows[0];
 assert.equal(p.tournament.started,73);assert.equal(p.tournament.remaining,24);assert.equal(p.tournament.chips,125000);assert.equal(p.tournament.stage,'Final Table');assert.equal(p.tournament.winnings,0);assert.equal(p.body,'Tournament started');
 await assert.rejects(updateTournament(pool,'b',{postId:r.postId,part:'status',values:{status:'Out'}}));
 await updateTournament(pool,'a',{postId:r.postId,part:'stack',values:{chips:0}});await updateTournament(pool,'a',{postId:r.postId,part:'status',values:{status:'Playing'}});
 const t=(await db.query<{tournament:Record<string,unknown>}>('SELECT tournament FROM rail_posts WHERE id=$1',[r.postId])).rows[0].tournament;assert.equal(t.chips,0);assert.equal(t.remaining,undefined);assert.equal(t.winnings,undefined);assert.equal(t.stage,'Final Table');
 assert.equal((await db.query<{active:boolean}>('SELECT active FROM rail_sessions WHERE id=$1',[r.sessionId])).rows[0].active,true);
});
test('chat retries do not duplicate messages and blocked or removed followers lose access',async()=>{
 const r=await create();await db.query('INSERT INTO rail_members VALUES($1,$2)',[r.id,'b']);const msg={groupId:r.id,id:randomUUID(),body:'One message'};
 await sendTournamentChat(db,'b',msg);await sendTournamentChat(db,'b',msg);assert.equal((await readTournamentChat(db,'a',r.id)).length,1);
 await db.exec("INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES('a','b')");await assert.rejects(readTournamentChat(db,'b',r.id));assert.equal((await readTournamentChat(db,'a',r.id)).length,0);
 await db.exec('DELETE FROM rail_blocks');await db.query("DELETE FROM rail_members WHERE group_id=$1 AND user_id='b'",[r.id]);await assert.rejects(sendTournamentChat(db,'b',{...msg,id:randomUUID()}));
});
