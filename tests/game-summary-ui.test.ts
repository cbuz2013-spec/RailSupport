import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createElement,act} from 'react';
import {JSDOM} from 'jsdom';
import type {Post} from '../lib/types';
import type {GameHistory} from '../lib/game-history';
const hook=registerHooks({load(url,context,next){return url.endsWith('.css')?{format:'module',source:'export default {};',shortCircuit:true}:next(url,context)}});
let dom:JSDOM,createRoot:typeof import('react-dom/client').createRoot,Summary:typeof import('../app/game-summary').default,RailApp:typeof import('../app/rail-app').default;
const originalFetch=globalThis.fetch;
const post={id:'p',sessionId:'s',groupId:'g',userId:'a',name:'Alex',kind:'update',body:'Tournament started',created:'2026-10-13T20:00:00Z',imageCount:0,tournament:{event:'Game',status:'Playing',chips:10000,bigBlind:100,remaining:25,started:25,paid:4}} as Post;
const fixture:GameHistory={sessionId:'s',ownerId:'a',current:{...post.tournament!,chips:20000,bigBlind:200,remaining:20},updates:[{id:'1',stats:post.tournament!,created:post.created,baseline:false},{id:'2',stats:{chips:20000,bigBlind:200,remaining:20,started:25,paid:4,status:'Playing'},created:'2026-10-13T20:30:00Z',baseline:false}],before:null,photo:'/api/game-history?session=s&photo=revision'};
before(async()=>{dom=new JSDOM('<html><body></body></html>',{url:'https://games.test/',pretendToBeVisual:true});for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,location:dom.window.location,history:dom.window.history,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};({createRoot}=await import('react-dom/client'));({default:Summary}=await import('../app/game-summary'));({default:RailApp}=await import('../app/rail-app'))});
after(()=>{globalThis.fetch=originalFetch;dom.window.close();hook.deregister()});
async function mount(element:React.ReactNode){const el=document.createElement('div');document.body.append(el);const root=createRoot(el);await act(async()=>root.render(element));return {el,close:async()=>{await act(async()=>root.unmount());el.remove()}}}
async function click(el:HTMLElement,text:string){const button=Array.from(el.querySelectorAll('button')).find(b=>b.textContent===text);assert.ok(button,'Missing '+text);await act(async()=>button.click())}
async function input(el:HTMLInputElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}))})}

test('one graphic contains current figures, history and photo; selecting a past point never changes the current summary',async()=>{
 globalThis.fetch=async()=>Response.json(fixture);let updated=0;const ui=await mount(createElement(Summary,{post,userId:'a',onQuick(_part,current){updated=current.chips!}}));try{
 const card=ui.el.querySelector('.game-summary')!;for(const text of ['CURRENT STACK','CURRENT BIG BLIND','PLAYERS LEFT','TOTAL PLAYERS','PLAYERS IN THE MONEY','Still Playing','Chip history','Tournament clock photo'])assert.ok(card.textContent?.includes(text),text);
 assert.equal(ui.el.querySelectorAll('.game-summary').length,1);assert.ok(card.querySelector('svg[role=img]'));assert.equal(card.querySelector('.stats strong')?.textContent,'20,000');assert.ok(card.querySelector('.game-photo img'));
 await act(async()=>ui.el.querySelector<HTMLButtonElement>('[aria-label="Previous update"]')!.click());assert.match(card.querySelector('.chart-detail')?.textContent||'',/10,000 chips/);assert.equal(card.querySelector('.stats strong')?.textContent,'20,000');await click(ui.el,'Update Stack');assert.equal(updated,20000);
 await act(async()=>ui.el.querySelector<HTMLButtonElement>('[aria-label="Enlarge game photo"]')!.click());assert.equal(ui.el.querySelector('dialog')?.open,true);await click(ui.el,' Close photo');assert.equal(ui.el.querySelector('dialog'),null);
 }finally{await ui.close()}
});
test('members can read the graphic and enlarge the photo but do not get update or photo controls',async()=>{
 globalThis.fetch=async()=>Response.json(fixture);const ui=await mount(createElement(Summary,{post,userId:'b',onQuick(){throw Error('Forbidden')}}));try{assert.doesNotMatch(ui.el.textContent||'',/Update Stack|Take photo|Replace photo|Remove photo/);assert.ok(ui.el.querySelector('[aria-label="Enlarge game photo"]'))}finally{await ui.close()}
});
test('photo removal calls the game-specific API and refreshes the same graphic',async()=>{
 const writes:unknown[]=[];let removed=false;globalThis.fetch=async(_url,options)=>{if(options?.method==='POST'){writes.push(JSON.parse(String(options.body)));removed=true;return Response.json({ok:true})}return Response.json({...fixture,photo:removed?null:fixture.photo})};
 const ui=await mount(createElement(Summary,{post,userId:'a',onQuick(){}}));try{await click(ui.el,'Remove photo');assert.deepEqual(writes,[{session:'s',image:null}]);assert.equal(ui.el.querySelector('.game-photo img'),null);assert.match(ui.el.textContent||'',/Add a photo/)}finally{await ui.close()}
});
test('Manage Rail is accessible in the main view; deletion requires matching the name and returns to My Rails',async()=>{
 const writes:Record<string,unknown>[]=[];let deleted=false;
 globalThis.fetch=async(input,options)=>{const url=String(input);if(url==='/api/rail')return Response.json({user:{id:'a',name:'Alex'},groups:deleted?[]:[{id:'g',name:'Test rail',owner:'a',members:1,kind:'Friends & family'}]});if(url.startsWith('/api/rail?group='))return Response.json({posts:[],members:[],following:[]});if(url.startsWith('/api/activity'))return Response.json({items:[],unread:0,publicKey:null});if(url.startsWith('/api/community'))return Response.json({invitations:[]});if(url.startsWith('/api/manage')){if(options?.method==='POST'){writes.push(JSON.parse(String(options.body)));deleted=true;return Response.json({ok:true})}return Response.json({group:{id:'g',name:'Test rail',owner:'a'},members:[{id:'a',name:'Alex'}],invitations:[],history:[]})}throw Error('Unexpected '+url)};
 const ui=await mount(createElement(RailApp,{ready:true}));try{
 assert.ok(Array.from(ui.el.querySelectorAll('.main-content button')).some(b=>b.textContent==='Manage Rail'));await click(ui.el,'Manage Rail');await click(ui.el,'Delete Rail');const button=Array.from(ui.el.querySelectorAll('button')).find(b=>b.textContent==='Permanently delete rail')!;assert.equal(button.disabled,true);
 await input(ui.el.querySelector('[aria-label="Rail name to confirm deletion"]')!,'Wrong rail');assert.equal(button.disabled,true);assert.equal(writes.length,0);await click(ui.el,'Keep rail');assert.equal(writes.length,0);await click(ui.el,'Delete Rail');await input(ui.el.querySelector('[aria-label="Rail name to confirm deletion"]')!,'Test rail');
 await act(async()=>ui.el.querySelector('.delete-rail form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
 assert.deepEqual(writes,[{action:'deleteGroup',groupId:'g',confirmName:'Test rail'}]);assert.equal(location.search,'?view=groups');assert.equal(ui.el.querySelector('main h1')?.textContent,'My Rails');assert.equal(ui.el.querySelector('dialog'),null);assert.match(ui.el.textContent||'',/Rail deleted/);
 }finally{await ui.close();history.replaceState(null,'','/')}
});
