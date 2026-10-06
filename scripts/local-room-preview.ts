// Disposable local preview: no cloud database, existing .env, or production credentials are used.
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';

async function main() {
  if(process.env.VERCEL)throw new Error('The local preview must not run on Vercel.');
  process.env.DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5439/postgres';
  process.env.BETTER_AUTH_URL='http://127.0.0.1:3100';
  process.env.BETTER_AUTH_SECRET=randomBytes(32).toString('hex');
  process.env.RAILSUPPORT_READY='true';
  Object.assign(process.env,{NODE_ENV:'development'});
  const database=await PGlite.create();
  const server=new PGLiteSocketServer({db:database,host:'127.0.0.1',port:5439,maxConnections:6});
  await server.start();
  const {auth}=await import('../lib/auth');
  const {db}=await import('../lib/db');
  const {getMigrations}=await import('better-auth/db/migration');
  await (await getMigrations(auth().options)).runMigrations();
  await db().query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
  const users=[];
  for(const [label,name] of [['owner','Alex · Preview Host'],['member','Sam · Preview Player'],['cohost','Jordan · Preview Co-host']]){
    const result=await auth().api.signUpEmail({body:{name,email:`preview-${label}@example.test`,password:'LocalRoomPreview123!'}});
    users.push(result.user.id);
  }
  process.env.RAILSOCIAL_ROOM_CREATOR_IDS=users[0];
  const {mutateRoom}=await import('../lib/rooms');
  for(const [name,city,description] of [
    ['The River Room','Austin, Texas','A friendly place to find your next game and your poker people. Meet our hosts and keep up with room announcements.'],
    ['High Desert Poker','Las Vegas, Nevada','A home for players who love the game and the conversation around it. Follow our room for news from the host team.'],
    ['Lakeside Card Club','Chicago, Illinois','Your neighborhood seat at the table. Join our community of players and catch the latest updates from the room.'],
  ]){
    const room=await mutateRoom(db(),users[0],{action:'create',name,city,description,address:'',website:'https://example.com'});
    await mutateRoom(db(),users[0],{action:'announce',roomId:room.id,body:'Welcome to our Rail Social room page. Follow the room to keep us in your favorites and meet the people behind the felt. This is fictional data for the local preview.'});
    await mutateRoom(db(),users[0],{action:'publish',roomId:room.id,published:true});
  }
  await db().end();
  console.log('Disposable Room Pages preview: http://127.0.0.1:3100/?view=rooms');
  console.log('Accounts: preview-owner@example.test / preview-member@example.test / preview-cohost@example.test');
  console.log('Local-only password: LocalRoomPreview123!');
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3100'],{stdio:'inherit',env:process.env});
  const close=async()=>{child.kill();await server.stop();await database.close();};
  process.once('SIGINT',()=>{void close();});
  process.once('SIGTERM',()=>{void close();});
  child.once('exit',async code=>{await server.stop();await database.close();process.exitCode=code||0;});
}
main().catch(error=>{console.error(error);process.exit(1);});
