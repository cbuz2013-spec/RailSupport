import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {betterAuth} from 'better-auth';
import {memoryAdapter} from 'better-auth/adapters/memory';
import {authOptions} from '../lib/auth-options';
import {passwordEmailConfigured, resetEmailContent, sendPasswordResetEmail} from '../lib/password-email';
import {recoveryReturnTo} from '../lib/password-recovery';

const origin='http://127.0.0.1:3211';
const original={...process.env};
const fixture={user:{email:'recovery@example.test',name:'<img src=x onerror=alert(1)>'},token:'synthetic-reset-token',url:origin+'/api/auth/reset-password/synthetic-reset-token?callbackURL='+encodeURIComponent(origin+'/reset-password')};
before(()=>{Object.assign(process.env,{BETTER_AUTH_URL:origin,BETTER_AUTH_SECRET:'synthetic-local-test-secret-32-characters-long',RESEND_API_KEY:'test-only-not-a-key',RAILSOCIAL_EMAIL_FROM:'Rail Social <noreply@phabfive.com>'});});
after(()=>{for(const key of ['BETTER_AUTH_URL','BETTER_AUTH_SECRET','RESEND_API_KEY','RAILSOCIAL_EMAIL_FROM']){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}});

test('recovery keeps rail and room invitations but rejects external redirects and unrelated query data',()=>{
  assert.equal(recoveryReturnTo('/?view=rooms&room=abc&joinRoom=1&token=secret'), '/?view=rooms&room=abc&joinRoom=1');
  assert.equal(recoveryReturnTo('/?invite=abc'), '/?invite=abc');
  for(const unsafe of ['https://evil.test','//evil.test','/\\evil.test','/reset-password?token=x','/\n/evil.test'])assert.equal(recoveryReturnTo(unsafe),'/');
});

test('email requires configuration, escapes names, and restricts the reset destination',()=>{
  assert.equal(passwordEmailConfigured(),true);
  const message=resetEmailContent(fixture);
  assert.match(message.html,/&lt;img/);assert.ok(!message.html.includes('<img'));
  assert.match(message.text,/30 minutes/);assert.ok(message.text.includes(fixture.url));
  assert.throws(()=>resetEmailContent({...fixture,url:'https://evil.test/api/auth/reset-password/stolen'}));
  assert.throws(()=>resetEmailContent({...fixture,url:origin+'/wrong'}));
  delete process.env.RESEND_API_KEY;assert.equal(passwordEmailConfigured(),false);process.env.RESEND_API_KEY='test-only-not-a-key';
});

test('transient provider failures retry with the same idempotency key; permanent errors omit private content',async t=>{
  const requests:RequestInit[]=[];
  const stub=t.mock.method(globalThis,'fetch',async(_url:unknown,options:RequestInit)=>{requests.push(options);return requests.length===1?new Response('{}',{status:503}):Response.json({id:'synthetic'});});
  await sendPasswordResetEmail(fixture);
  assert.equal(requests.length,2);assert.deepEqual(requests[0].headers,requests[1].headers);
  assert.ok(!String((requests[0].headers as Record<string,string>)['Idempotency-Key']).includes(fixture.token));
  assert.equal(JSON.parse(String(requests[0].body)).from,'Rail Social <noreply@phabfive.com>');
  stub.mock.restore();
  t.mock.method(globalThis,'fetch',async()=>new Response('private@email.test secret',{status:401}));
  await assert.rejects(sendPasswordResetEmail(fixture),error=>error instanceof Error&&error.message.includes('HTTP 401')&&!error.message.includes('private@')&&!error.message.includes('secret'));
});

test('password recovery completes once, revokes sessions, rejects expired links and hides unknown accounts',async t=>{
  const database={user:[],account:[],session:[],verification:[],rateLimit:[]};
  const auth=betterAuth({...authOptions(memoryAdapter(database)),logger:{disabled:true}});
  const sent:Array<{text:string;to:string[]}>=[];
  t.mock.method(globalThis,'fetch',async(_url:unknown,options:RequestInit)=>{sent.push(JSON.parse(String(options.body)));return Response.json({id:'synthetic-email'});});
  const signup=await auth.api.signUpEmail({body:{name:'Recovery Test',email:fixture.user.email,password:'OriginalPassword123!'}});
  const oldSession=signup.token!;
  let ip=10;
  const call=(action:string,body:Record<string,unknown>,address='192.0.2.'+ip++)=>auth.handler(new Request(origin+'/api/auth/'+action,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'x-forwarded-for':address},body:JSON.stringify(body)}));
  const known=await call('request-password-reset',{email:fixture.user.email,redirectTo:origin+'/reset-password'});
  const unknown=await call('request-password-reset',{email:'not-registered@example.test',redirectTo:origin+'/reset-password'});
  assert.equal(known.status,200);assert.equal(unknown.status,200);assert.deepEqual(await known.json(),await unknown.json());assert.equal(sent.length,1);
  const emailedUrl=sent[0].text.match(/http:\/\/[^\s]+/)![0];
  const callback=await auth.handler(new Request(emailedUrl));assert.equal(callback.status,302);
  const resetUrl=new URL(callback.headers.get('location')!);assert.equal(resetUrl.pathname,'/reset-password');
  const token=resetUrl.searchParams.get('token')!;
  const rejected=await call('reset-password',{token,newPassword:'short'});assert.equal(rejected.status,400);
  const successful=await call('reset-password',{token,newPassword:'ChangedPassword456!'});assert.equal(successful.status,200);
  assert.equal(database.session.length,0);
  const previousSession=await auth.api.getSession({headers:new Headers({cookie:'better-auth.session_token='+oldSession})});assert.equal(previousSession,null);
  assert.equal((await call('reset-password',{token,newPassword:'AnotherPassword789!'})).status,400);
  assert.equal((await call('sign-in/email',{email:fixture.user.email,password:'OriginalPassword123!'})).status,401);
  assert.equal((await call('sign-in/email',{email:fixture.user.email,password:'ChangedPassword456!'})).status,200);
  await call('request-password-reset',{email:fixture.user.email,redirectTo:origin+'/reset-password'});
  const expired=database.verification as Array<{identifier:string;expiresAt:Date}>;
  const record=expired.find(row=>row.identifier.startsWith('reset-password:'))!;record.expiresAt=new Date(Date.now()-1000);
  const expiredToken=record.identifier.slice('reset-password:'.length);
  assert.equal((await call('reset-password',{token:expiredToken,newPassword:'MustNotChange789!'})).status,400);
  const before=sent.length;
  const evil=await call('request-password-reset',{email:fixture.user.email,redirectTo:'https://evil.test/steal'});assert.equal(evil.status,403);assert.equal(sent.length,before);
  const statuses=[];
  for(let i=0;i<4;i++)statuses.push((await call('request-password-reset',{email:'nobody@example.test',redirectTo:origin+'/reset-password'},'192.0.2.250')).status);
  assert.deepEqual(statuses,[200,200,200,429]);
});
