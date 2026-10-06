import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {canCreateRoom, listRooms, mutateRoom, readRoom, RoomError} from '../lib/rooms';
import {roomAction} from '../lib/rooms-validation';

let database: PGlite;
let roomId: string;
let otherRoom: string;
const details={name:'River Room',city:'Austin, Texas',description:'A friendly poker room.',address:'100 Test Street',website:'https://example.com/room'};
const rejected=(status:number)=> (error:unknown)=>error instanceof RoomError&&error.status===status;
before(async()=>{
  database=await PGlite.create();
  await database.exec('CREATE TABLE "user" (id text PRIMARY KEY,name text NOT NULL,email text UNIQUE NOT NULL)');
  await database.exec(await readFile(new URL('../scripts/schema.sql',import.meta.url),'utf8'));
  await database.exec(await readFile(new URL('../scripts/room-pages.sql',import.meta.url),'utf8'));
  await database.query('INSERT INTO "user" (id,name,email) VALUES ($1,$2,$3),($4,$5,$6),($7,$8,$9),($10,$11,$12)',
    ['owner','Room Owner','owner@example.com','host','Room Host','host@example.com','member','Member','member@example.com','outsider','Other Owner','outsider@example.com']);
  await database.exec("INSERT INTO rail_groups(id,name,kind,owner,code) VALUES('private','Private rail','Friends','owner','private-code'); INSERT INTO rail_members VALUES('private','owner'); INSERT INTO rail_posts(id,group_id,user_id,kind,body) VALUES('secret','private','owner','update','Private content')");
  process.env.RAILSOCIAL_ROOM_CREATOR_IDS='owner, outsider';
});
after(async()=>{await database?.close();delete process.env.RAILSOCIAL_ROOM_CREATOR_IDS;});

test('approval is exact and defaults closed',()=>{
  assert.equal(canCreateRoom('owner',''),false);
  assert.equal(canCreateRoom('own','owner'),false);
  assert.equal(canCreateRoom('owner',' member, owner '),true);
});
test('room fields reject unsafe URLs, blank names, oversized bodies and malformed actions',()=>{
  for(const website of ['javascript:alert(1)','http://example.com','https://user:secret@example.com'])assert.equal(roomAction.safeParse({action:'create',...details,website}).success,false);
  assert.equal(roomAction.safeParse({action:'create',...details,name:'  '}).success,false);
  assert.equal(roomAction.safeParse({action:'announce',roomId:'x',body:'a'.repeat(3001)}).success,false);
  assert.equal(roomAction.safeParse({action:'publish',roomId:'x',published:'true'}).success,false);
});
test('ordinary members cannot create; approved owners create drafts and cannot spoof owner or publication',async()=>{
  await assert.rejects(mutateRoom(database,'member',{action:'create',...details}),rejected(403));
  roomId=(await mutateRoom(database,'owner',{action:'create',...details,owner_id:'member',published:true})).id!;
  otherRoom=(await mutateRoom(database,'outsider',{action:'create',...details,name:'Another Room'})).id!;
  const draft=await readRoom(database,'owner',roomId);
  assert.equal(draft.room.published,false);assert.equal(draft.room.role,'owner');
});
test('drafts are absent from directory and inaccessible by direct ID or follow',async()=>{
  assert.equal((await listRooms(database,'member',new URLSearchParams())).rooms.length,0);
  await assert.rejects(readRoom(database,'member',roomId),rejected(404));
  await assert.rejects(mutateRoom(database,'member',{action:'follow',roomId,following:true}),rejected(404));
  assert.equal((await listRooms(database,'owner',new URLSearchParams('scope=hosting'))).rooms.length,1);
});
test('non-hosts cannot edit, announce, publish or invite hosts',async()=>{
  for(const data of [{action:'edit',...details},{action:'announce',body:'Forged update'},{action:'publish',published:true},{action:'inviteHost',email:'host@example.com'}]){
    await assert.rejects(mutateRoom(database,'member',{...data,roomId}),error=>error instanceof RoomError);
  }
});
test('host invites require consent and expose no account emails',async()=>{
  await mutateRoom(database,'owner',{action:'inviteHost',roomId,email:'HOST@example.com'});
  const directory=await listRooms(database,'host',new URLSearchParams());
  assert.deepEqual(directory.invitations,[{id:roomId,name:details.name}]);
  assert.equal(directory.rooms.length,0);
  await assert.rejects(readRoom(database,'host',roomId),rejected(404));
  await assert.rejects(mutateRoom(database,'member',{action:'acceptHost',roomId}),rejected(404));
  await mutateRoom(database,'host',{action:'acceptHost',roomId});
  const detail=await readRoom(database,'host',roomId);
  assert.equal(detail.room.role,'host');assert.equal(JSON.stringify(detail).includes('@example.com'),false);
});
test('co-hosts can edit and announce but cannot publish or manage the team',async()=>{
  await mutateRoom(database,'host',{action:'edit',roomId,...details,description:'Updated by co-host.'});
  await mutateRoom(database,'host',{action:'announce',roomId,body:'Welcome to the room.'});
  await assert.rejects(mutateRoom(database,'host',{action:'publish',roomId,published:true}),rejected(404));
  await assert.rejects(mutateRoom(database,'host',{action:'removeHost',roomId,userId:'owner'}),rejected(404));
  await assert.rejects(mutateRoom(database,'host',{action:'inviteHost',roomId,email:'member@example.com'}),rejected(400));
  await mutateRoom(database,'owner',{action:'publish',roomId,published:true});
});
test('members find published rooms, follow idempotently, and retain no private-rail access',async()=>{
  assert.equal((await listRooms(database,'member',new URLSearchParams('q=austin'))).rooms[0].id,roomId);
  assert.equal((await listRooms(database,'member',new URLSearchParams('q=%25'))).rooms.length,0);
  for(let i=0;i<2;i++)await mutateRoom(database,'member',{action:'follow',roomId,following:true});
  const following=await listRooms(database,'member',new URLSearchParams('scope=following'));
  assert.equal(following.rooms.length,1);assert.equal(following.rooms[0].followers,1);
  assert.equal((await database.query("SELECT * FROM rail_members WHERE user_id='member'")).rows.length,0);
  const read=await readRoom(database,'member',roomId);
  assert.equal(read.announcements.length,1);assert.equal(JSON.stringify(read).includes('Private content'),false);
});
test('announcement removal checks both the room and host authority',async()=>{
  const announcement=(await readRoom(database,'member',roomId)).announcements[0].id;
  await assert.rejects(mutateRoom(database,'member',{action:'removeAnnouncement',roomId,announcementId:announcement}),rejected(404));
  await assert.rejects(mutateRoom(database,'outsider',{action:'removeAnnouncement',roomId:otherRoom,announcementId:announcement}),rejected(404));
  assert.equal((await readRoom(database,'member',roomId)).announcements.length,1);
});
test('blocks suppress announcements in both directions',async()=>{
  await database.query('INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES($1,$2)',['member','host']);
  assert.equal((await readRoom(database,'member',roomId)).announcements.length,0);
  await database.exec('DELETE FROM rail_blocks');
  await database.query('INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES($1,$2)',['host','member']);
  assert.equal((await readRoom(database,'member',roomId)).announcements.length,0);
  await database.exec('DELETE FROM rail_blocks');
});
test('unpublishing hides direct links and following lists, preserving follows for republication',async()=>{
  await mutateRoom(database,'owner',{action:'publish',roomId,published:false});
  await assert.rejects(readRoom(database,'member',roomId),rejected(404));
  assert.equal((await listRooms(database,'member',new URLSearchParams('scope=following'))).rooms.length,0);
  assert.equal((await readRoom(database,'owner',roomId)).room.followers,1);
});
test('revocation immediately removes co-host access and prevents reaccepting an old invite',async()=>{
  await mutateRoom(database,'owner',{action:'removeHost',roomId,userId:'host'});
  await assert.rejects(readRoom(database,'host',roomId),rejected(404));
  await assert.rejects(mutateRoom(database,'host',{action:'announce',roomId,body:'Stale session'}),rejected(404));
  await assert.rejects(mutateRoom(database,'host',{action:'acceptHost',roomId}),rejected(404));
  await assert.rejects(mutateRoom(database,'owner',{action:'removeHost',roomId,userId:'owner'}),rejected(404));
});
test('declined invitations can be reissued; pending invitees are hidden from members',async()=>{
  await mutateRoom(database,'owner',{action:'inviteHost',roomId,email:'host@example.com'});
  await mutateRoom(database,'host',{action:'declineHost',roomId});
  assert.equal((await listRooms(database,'host',new URLSearchParams())).invitations.length,0);
  await mutateRoom(database,'owner',{action:'inviteHost',roomId,email:'host@example.com'});
  await mutateRoom(database,'owner',{action:'publish',roomId,published:true});
  assert.equal((await readRoom(database,'member',roomId)).hosts.length,1);
  assert.equal((await readRoom(database,'owner',roomId)).hosts.length,2);
});
test('announcement pagination is deterministic without duplicating updates',async()=>{
  for(let i=0;i<24;i++)await mutateRoom(database,'owner',{action:'announce',roomId,body:'Update '+i});
  const first=await readRoom(database,'member',roomId);
  assert.equal(first.announcements.length,20);assert.ok(first.nextBefore);
  const second=await readRoom(database,'member',roomId,first.nextBefore);
  assert.equal(second.announcements.length,5);assert.equal(second.nextBefore,null);
  assert.equal(new Set([...first.announcements,...second.announcements].map(p=>p.id)).size,25);
});
test('directory pagination and filters handle more than a page of rooms',async()=>{
  for(let i=0;i<26;i++){
    const id=(await mutateRoom(database,'owner',{action:'create',...details,name:'Directory '+String(i).padStart(2,'0')})).id!;
    await mutateRoom(database,'owner',{action:'publish',roomId:id,published:true});
  }
  const first=await listRooms(database,'member',new URLSearchParams('q=Directory'));
  assert.equal(first.rooms.length,24);assert.equal(first.nextOffset,24);
  const second=await listRooms(database,'member',new URLSearchParams('q=Directory&offset=24'));
  assert.equal(second.rooms.length,2);assert.equal(second.nextOffset,null);
  assert.equal(new Set([...first.rooms,...second.rooms].map(r=>r.id)).size,26);
  await assert.rejects(listRooms(database,'member',new URLSearchParams('offset=-1')),rejected(400));
});
test('unfollow is idempotent and existing private rail data stays intact',async()=>{
  for(let i=0;i<2;i++)await mutateRoom(database,'member',{action:'follow',roomId,following:false});
  assert.equal((await readRoom(database,'member',roomId)).room.followers,0);
  assert.equal((await database.query<{body:string}>("SELECT body FROM rail_posts WHERE id='secret'")).rows[0].body,'Private content');
});
