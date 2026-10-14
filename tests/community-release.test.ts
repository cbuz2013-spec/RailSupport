import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import type {Pool} from 'pg';
import {manageCommunity,managementState} from '../lib/community-management';
import {reactStreet,streetState,reactionPeople} from '../lib/street-reactions';
import {guardMember,reportContent,moderate,moderationQueue} from '../lib/safety';
import {mutateCommunity,leagues,people} from '../lib/community';
import {saveRailPost} from '../lib/save-rail-post';
import {zonedInput,zonedToInstant} from '../lib/league-time';
import {RoomError} from '../lib/rooms';
let db:PGlite,pool:Pool;
const q=(d:Record<string,string>)=>new URLSearchParams(d);
before(async()=>{
 db=await PGlite.create();await db.exec('CREATE TABLE "user"(id text PRIMARY KEY,name text,email text,"emailVerified" boolean DEFAULT false,"createdAt" timestamptz DEFAULT now(),"updatedAt" timestamptz DEFAULT now());CREATE TABLE "session"(id text PRIMARY KEY,"userId" text REFERENCES "user"(id) ON DELETE CASCADE)');
 await db.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));
 pool={connect:async()=>({query:async(sql:string,v?:unknown[])=>{const r=await db.query(sql,v);return {...r,rowCount:r.rows.length||r.affectedRows}},release(){}})} as unknown as Pool;
});
after(()=>db.close());
beforeEach(async()=>{await db.exec(`TRUNCATE "user" CASCADE;DELETE FROM rail_audit;DELETE FROM rail_invitation_history;
 INSERT INTO "user"(id,name,email) VALUES('a','Alex','a@example.test'),('b','Blair','b@example.test'),('c','Casey','c@example.test');
 INSERT INTO rail_groups(id,name,kind,owner,code) VALUES('g','Test group','Friends','a','old-code');INSERT INTO rail_members VALUES('g','a'),('g','b');
 INSERT INTO rail_rooms(id,name,city,owner_id,published) VALUES('r','Test room','Online','a',true);INSERT INTO rail_room_follows(room_id,user_id) VALUES('r','b');
 INSERT INTO rail_posts(id,group_id,user_id,kind,body,hand) VALUES('p','g','a','hand','Hand','{"hero":"As Ah","board":"","review":{"format":"cash"}}');
 INSERT INTO rail_admins VALUES('a');`)});
test('street reactions are independent, visible by name, private, and do not create subscriptions',async()=>{
 await reactStreet(db,'b',{scope:'rail',postId:'p',street:'flop',reaction:'so_sick'});
 await reactStreet(db,'b',{scope:'rail',postId:'p',street:'turn',reaction:'shark'});
 assert.equal((await streetState(db,'b',{scope:'rail',postId:'p',street:'flop'})).myReaction,'so_sick');
 assert.equal((await reactionPeople(db,'a',{scope:'rail',postId:'p',street:'turn'})).people[0].name,'Blair');
 assert.equal((await db.query('SELECT * FROM rail_watches')).rows.length,0);
 await assert.rejects(reactionPeople(db,'c',{scope:'rail',postId:'p',street:'flop'}),RoomError);
 await db.exec("INSERT INTO rail_blocks VALUES('a','b',now())");
 assert.equal((await reactionPeople(db,'a',{scope:'rail',postId:'p',street:'turn'})).people.length,0);
 await assert.rejects(reactStreet(db,'b',{scope:'rail',postId:'p',street:'flop',reaction:'heart'}),RoomError);
});
test('group owners transfer access; removing a member revokes watches and invite acceptance',async()=>{
 await assert.rejects(manageCommunity(db,'b',{action:'transferGroup',groupId:'g',userId:'b'}),RoomError);
 await assert.rejects(manageCommunity(db,'a',{action:'leaveGroup',groupId:'g'}),RoomError);
 await mutateCommunity(db,'b',{action:'invite',groupId:'g',recipientId:'c'});
 await db.exec("INSERT INTO rail_watches(user_id,scope,target_id) VALUES('b','rail','p')");
 await manageCommunity(db,'a',{action:'removeMember',groupId:'g',userId:'b'});
 assert.equal((await db.query('SELECT * FROM rail_watches')).rows.length,0);assert.equal((await db.query('SELECT * FROM rail_invitations')).rows.length,0);
 await db.exec("INSERT INTO rail_members VALUES('g','b')");await manageCommunity(db,'a',{action:'transferGroup',groupId:'g',userId:'b'});
 await manageCommunity(db,'a',{action:'leaveGroup',groupId:'g'});assert.equal((await db.query<{owner:string}>("SELECT owner FROM rail_groups WHERE id='g'")).rows[0].owner,'b');
});
test('invite withdrawal is sender-only and history survives withdrawal',async()=>{
 await mutateCommunity(db,'a',{action:'invite',groupId:'g',recipientId:'c'});const id=String((await managementState(db,'a')).invitations[0].id);
 await assert.rejects(manageCommunity(db,'b',{action:'revokeInvite',invitationId:id}),RoomError);
 await manageCommunity(db,'a',{action:'revokeInvite',invitationId:id});
 await assert.rejects(mutateCommunity(db,'c',{action:'accept',invitationId:id}),RoomError);
 assert.equal((await managementState(db,'a')).history[0]?.status,'withdrawn');
});
test('reports require content access and moderator actions require an administrator',async()=>{
 await assert.rejects(reportContent(db,'c',{scope:'rail',targetId:'p',reason:'spam'}),RoomError);
 const r=await reportContent(db,'b',{scope:'rail',targetId:'p',reason:'spam',details:'Review this'});
 await assert.rejects(moderationQueue(db,'b'),RoomError);
 await assert.rejects(moderate(db,'b',{reportId:r.id,decision:'remove',note:'Unauthorized'}),RoomError);
 await moderate(db,'a',{reportId:r.id,decision:'remove',note:'Confirmed duplicate spam'});
 assert.equal((await db.query("SELECT id FROM rail_posts WHERE id='p'")).rows.length,0);
 assert.equal((await moderationQueue(db,'a')).audit.length,1);
 const accountReport=await reportContent(db,'a',{scope:'profile',targetId:'b',reason:'harassment'});
 await moderate(db,'a',{reportId:accountReport.id,decision:'restrict',note:'Repeated abuse'});await assert.rejects(guardMember(db,'b'),RoomError);
 await reportContent(db,'b',{scope:'support',targetId:'support',reason:'support',details:'Appeal'});
 await moderate(db,'a',{reportId:accountReport.id,decision:'restore',note:'Appeal approved'});await guardMember(db,'b');
});
test('league archives and roster removal preserve recorded standings and correction history',async()=>{
 await mutateCommunity(db,'a',{action:'createLeague',roomId:'r',name:'Season One',rules:'Host points',timezone:'America/Chicago'});
 const id=String((await db.query<{id:string}>('SELECT id FROM rail_leagues')).rows[0].id);
 await mutateCommunity(db,'b',{action:'joinLeague',roomId:'r',leagueId:id});
 await mutateCommunity(db,'a',{action:'saveEvent',roomId:'r',leagueId:id,name:'Game one',starts:'2026-11-10T20:00:00Z',details:'',status:'completed'});
 let data=await leagues(db,'a',q({roomId:'r',leagueId:String(id)}));const eventId=data.events[0].id;
 await mutateCommunity(db,'a',{action:'result',roomId:'r',leagueId:id,eventId,userId:'b',place:1,points:25});
 await mutateCommunity(db,'a',{action:'removePlayer',roomId:'r',leagueId:id,userId:'b'});
 data=await leagues(db,'a',q({roomId:'r',leagueId:String(id)}));assert.equal(data.standings[0].points,25);assert.equal(data.standings[0].removed,true);assert.ok((data.corrections||[]).length>=2);
 await mutateCommunity(db,'a',{action:'editLeague',roomId:'r',leagueId:id,name:'Season One',rules:'Host points',timezone:'America/Chicago',active:false,archived:true});
 await assert.rejects(mutateCommunity(db,'b',{action:'joinLeague',roomId:'r',leagueId:id}),RoomError);
 await assert.rejects(mutateCommunity(db,'a',{action:'result',roomId:'r',leagueId:id,eventId,userId:'b',place:2,points:5}),RoomError);
 assert.equal((await leagues(db,'b',q({roomId:'r',leagueId:String(id)}))).corrections?.length,0);
});
test('deletion is atomic, protects owned communities, removes content and anonymizes historical league results',async()=>{
 await assert.rejects(db.query('DELETE FROM "user" WHERE id=$1',['a']),/ownership/);assert.equal((await db.query("SELECT id FROM rail_posts WHERE id='p'")).rows.length,1);
 await db.exec(`INSERT INTO rail_leagues(id,room_id,name,rules) VALUES('l','r','Season','');INSERT INTO rail_league_players(league_id,user_id) VALUES('l','b');INSERT INTO rail_league_events(id,league_id,name,starts,status) VALUES('e','l','Game',now(),'completed');INSERT INTO rail_league_results(event_id,user_id,place,points) VALUES('e','b',1,10);INSERT INTO rail_comments(id,post_id,user_id,body) VALUES('bc','p','b','Comment');`);
 await db.query('DELETE FROM "user" WHERE id=$1',['b']);assert.equal((await db.query("SELECT * FROM rail_comments WHERE id='bc'")).rows.length,0);
 const results=(await db.query<{name:string;points:string}>('SELECT u.name,r.points FROM rail_league_results r JOIN "user" u ON u.id=r.user_id')).rows;assert.equal(results[0].name,'Deleted player');assert.equal(results[0].points,'10.00');
 assert.equal((await people(db,'a',q({q:'Deleted'}))).people.length,0);
});
test('session details survive optional post editing and additive migration reruns',async()=>{
 const created=await saveRailPost(pool,'a',{groupId:'g',kind:'update',startSession:'cash',tournament:{event:'',gameType:'cash'},sessionDetails:{location:'Preview room',stakes:'1/3',buyIn:'300'}});
 await saveRailPost(pool,'a',{groupId:'g',kind:'update',body:'Update',tournament:{chips:400,gameType:'cash'}},created.id);
 assert.equal((await db.query<{tournament:{location:string}}>('SELECT tournament FROM rail_posts WHERE id=$1',[created.id])).rows[0].tournament.location,'Preview room');
 await db.exec(await readFile(new URL('../scripts/community-2.5.sql',import.meta.url),'utf8'));
 assert.equal((await db.query<{details:{stakes:string}}>('SELECT details FROM rail_sessions WHERE id=$1',[created.sessionId])).rows[0].details.stakes,'1/3');
});
test('league dates respect local time zones and reject ambiguous or nonexistent clock-change times',()=>{
 const instant=zonedToInstant('2026-10-15T19:30','America/Chicago');assert.equal(instant,'2026-10-16T00:30:00.000Z');assert.equal(zonedInput(instant,'America/Chicago'),'2026-10-15T19:30');
 assert.throws(()=>zonedToInstant('2026-11-01T01:30','America/New_York'),/twice/);assert.throws(()=>zonedToInstant('2026-03-08T02:30','America/New_York'),/does not exist/);
});

test('content screening rejects configured threats while poker discussion remains allowed',async()=>{
 await assert.rejects(db.query("INSERT INTO rail_comments(id,post_id,user_id,body) VALUES('bad','p','b',$1)",['kill yourself']),/Community safety filter/);
 await db.query("INSERT INTO rail_comments(id,post_id,user_id,body) VALUES('fine','p','b',$1)",['That river killed my equity.']);
 const r=await reportContent(db,'a',{scope:'rail',targetId:'p',commentId:'fine',reason:'other'});
 await moderate(db,'a',{reportId:r.id,decision:'remove',note:'Comment test'});
 assert.equal((await db.query("SELECT id FROM rail_comments WHERE id='fine'")).rows.length,0);assert.equal((await db.query("SELECT id FROM rail_posts WHERE id='p'")).rows.length,1);
});
