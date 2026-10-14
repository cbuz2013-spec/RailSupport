// Synthetic accounts and loopback only. Never connects to production.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3100';
async function login(label:string){const r=await fetch(base+'/api/auth/sign-in/email',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({email:`preview-${label}@example.test`,password:'LocalRoomPreview123!'})});assert.equal(r.status,200);return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')}
async function call(cookie:string,path:string,body?:unknown,status=200,origin=base){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d}
async function main(){
 await call('','/api/community',undefined,401);
 const owner=await login('owner'),member=await login('member'),guest=await login('cohost');
 const people=await call(owner,'/api/community?q=Sam');assert.equal(people.people.length,1);assert.ok(!JSON.stringify(people).includes('@'));
 const memberId=people.people[0].id,guestId=(await call(owner,'/api/community?q=Jordan')).people[0].id;
 await call(owner,'/api/social',{action:'follow',id:memberId});
 assert.equal((await call(owner,'/api/community?scope=following')).people[0].id,memberId);
 await call(owner,'/api/social',{action:'unfollow',id:memberId});
 const rail=await call(owner,'/api/rail',{action:'create',name:'Invitation HTTP Rail',description:'Synthetic',kind:'Friends & family'});
 const railInfo=(await call(owner,'/api/rail')).groups.find((g:{id:string})=>g.id===rail.id);
 await call(member,'/api/rail',{action:'join',code:base+'/?invite='+railInfo.code.toUpperCase()});
 await call(owner,'/api/community',{action:'invite',groupId:rail.id,recipientId:guestId});
 const invitation=(await call(guest,'/api/community')).invitations[0];
 assert.equal((await call(guest,'/api/community',{action:'accept',invitationId:invitation.id})).groupId,rail.id);
 const roomId=(await call(owner,'/api/rooms')).rooms.find((r:{published:boolean})=>r.published).id;
 await call(member,'/api/community',{action:'post',roomId,body:'Not yet following'},404);
 await call(member,'/api/rooms',{action:'follow',roomId,following:true});
 await call(member,'/api/community',{action:'post',roomId,body:'Community test'},403,'https://example.invalid');
 await call(member,'/api/community',{action:'post',roomId,body:'Community test'});
 const postId=(await call(owner,'/api/community?roomId='+roomId)).posts[0].id;
 await call(owner,'/api/community',{action:'comment',roomId,postId,body:'Welcome'});
 assert.equal((await call(member,`/api/community?roomId=${roomId}&postId=${postId}`)).comments.length,1);
 await call(member,'/api/community',{action:'invite',roomId,recipientId:guestId});
 const roomInvite=(await call(guest,'/api/community')).invitations.find((i:{kind:string})=>i.kind==='room');
 await call(guest,'/api/community',{action:'accept',invitationId:roomInvite.id});
 const detail=(await call(guest,'/api/rooms?id='+roomId)).room;assert.equal(detail.following,true);assert.equal(detail.role,'member');
 await call(owner,'/api/community',{action:'createLeague',roomId,name:'HTTP Dealer League',rules:'Ten points for first.'});
 const leagueId=(await call(member,'/api/community?kind=leagues&roomId='+roomId)).leagueId;
 await call(member,'/api/community',{action:'joinLeague',roomId,leagueId});
 await call(owner,'/api/community',{action:'saveEvent',roomId,leagueId,name:'Friday game',starts:'2026-10-16T23:00:00Z',details:'Synthetic',status:'completed'});
 const eventId=(await call(owner,'/api/community?kind=leagues&roomId='+roomId)).events[0].id;
 await call(owner,'/api/community',{action:'result',roomId,leagueId,eventId,userId:memberId,place:1,points:10});
 assert.equal((await call(member,'/api/community?kind=leagues&roomId='+roomId)).standings[0].points,10);
 const bad=await fetch(base+'/api/community',{method:'POST',headers:{Cookie:owner,Origin:base},body:'{'});assert.equal(bad.status,400);
 const large=await fetch(base+'/api/community',{method:'POST',headers:{Cookie:owner,Origin:base},body:'x'.repeat(16001)});assert.equal(large.status,413);
 console.log('PASS: signed-in People/follow, link and in-app rail invitations, room invitations, follower posts/comments, host-only leagues, standings, authentication, origin and input limits.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
