// Run against `npm run preview:rooms` only. Uses synthetic accounts on a fixed loopback URL.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3100';
async function login(label:string) {
  const response=await fetch(base+'/api/auth/sign-in/email',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({email:`preview-${label}@example.test`,password:'LocalRoomPreview123!'})});
  assert.equal(response.status,200,await response.text());
  return response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
}
async function main() {
  assert.equal((await fetch(base+'/api/rooms')).status,401);
  const owner=await login('owner'),member=await login('member'),host=await login('cohost');
  async function call(cookie:string,body?:unknown,query='',expected=200,origin=base) {
    const response=await fetch(base+'/api/rooms'+query,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    assert.equal(response.headers.get('cache-control'),'private, no-store');
    const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;
  }
  const fields={name:'HTTP Verification Room',city:'Local test',description:'Synthetic verification data.',address:'',website:''};
  await call(member,{action:'create',...fields},'',403);
  await call(owner,{action:'create',...fields},'',403,'https://example.invalid');
  const malformed=await fetch(base+'/api/rooms',{method:'POST',headers:{Cookie:owner,Origin:base,'Content-Type':'application/json'},body:'{'});
  assert.equal(malformed.status,400);
  const oversized=await fetch(base+'/api/rooms',{method:'POST',headers:{Cookie:owner,Origin:base,'Content-Type':'application/json'},body:'x'.repeat(16001)});
  assert.equal(oversized.status,413);
  const created=await call(owner,{action:'create',...fields}),roomId=created.id;
  await call(member,undefined,'?id='+roomId,404);
  await call(owner,{action:'inviteHost',roomId,email:'preview-cohost@example.test'});
  await call(host,undefined,'?id='+roomId,404);
  await call(host,{action:'acceptHost',roomId});
  assert.equal((await call(host,undefined,'?id='+roomId)).room.role,'host');
  await call(host,{action:'publish',roomId,published:true},'',404);
  await call(host,{action:'announce',roomId,body:'Test update from an accepted co-host.'});
  await call(owner,{action:'publish',roomId,published:true});
  await call(member,{action:'follow',roomId,following:true});
  const room=await call(member,undefined,'?id='+roomId);
  assert.equal(room.room.following,true);assert.equal(room.announcements.length,1);
  assert.equal((await call(member,undefined,'?scope=following')).rooms.some((room:{id:string})=>room.id===roomId),true);
  await call(owner,{action:'removeHost',roomId,userId:room.hosts.find((person:{role:string})=>person.role==='host').id});
  await call(host,{action:'announce',roomId,body:'Revoked host'},'',404);
  await call(owner,{action:'publish',roomId,published:false});
  await call(member,undefined,'?id='+roomId,404);
  const rail=await fetch(base+'/api/rail',{headers:{Cookie:member}});
  assert.equal(rail.status,200);assert.equal((await rail.json()).groups.length,0);
  console.log('PASS: HTTP authentication, origin, body limits, drafts, invitations, host consent, publishing, follows, revocation, unpublishing, and private-rail isolation.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
