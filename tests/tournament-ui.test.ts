import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createElement,act} from 'react';
import {JSDOM} from 'jsdom';
import type {Post,Group} from '../lib/types';
const hook=registerHooks({load(url,context,next){return url.endsWith('.css')?{format:'module',source:'export default {};',shortCircuit:true}:next(url,context)}});
let dom:JSDOM,createRoot:typeof import('react-dom/client').createRoot,Composer:typeof import('../app/post-composer').default,Quick:typeof import('../app/tournament-controls').default,Start:typeof import('../app/start-rail').default;
const originalFetch=globalThis.fetch;
before(async()=>{
 dom=new JSDOM('<html><body></body></html>',{url:'http://127.0.0.1:3100'});
 for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 ({createRoot}=await import('react-dom/client'));({default:Composer}=await import('../app/post-composer'));({default:Quick}=await import('../app/tournament-controls'));({default:Start}=await import('../app/start-rail'));
});
after(()=>{globalThis.fetch=originalFetch;dom.window.close();hook.deregister()});
async function mount(element:React.ReactNode){const el=document.createElement('div');document.body.append(el);const root=createRoot(el);await act(async()=>root.render(element));return {el,close:async()=>{await act(async()=>root.unmount());el.remove()}}}
async function input(el:HTMLInputElement|HTMLTextAreaElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}))})}
async function submit(el:HTMLElement){await act(async()=>{el.querySelector('form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}))})}
const base={groupId:'g',kind:'update' as const,mode:'text',busy:false,onSave:async()=>true};
test('New Post has only text and optional photos and saves without tournament data',async()=>{
 let saved:Record<string,unknown>|undefined;const ui=await mount(createElement(Composer,{...base,onSave:async data=>{saved=data;return true}}));
 try{assert.equal(ui.el.querySelectorAll('textarea').length,1);assert.equal(ui.el.querySelectorAll('input[type=file]').length,1);assert.equal(ui.el.querySelectorAll('input[type=number],select').length,0);await input(ui.el.querySelector('textarea')!,'A basic rail post');await submit(ui.el);assert.equal(saved?.body,'A basic rail post');assert.equal(saved?.tournament,undefined)}finally{await ui.close()}
});
test('Tournament Update puts words and images first, then four optional counts and status',async()=>{
 const ui=await mount(createElement(Composer,{...base,mode:'tournament'}));try{
 const controls=Array.from(ui.el.querySelectorAll('textarea,input,select'));assert.equal(controls[0].tagName,'TEXTAREA');assert.equal((controls[1] as HTMLInputElement).type,'file');
 assert.deepEqual(controls.slice(2,6).map(e=>e.getAttribute('aria-label')),['Chips','Current big blind','Players left','Players started']);assert.equal(controls[6].getAttribute('aria-label'),'Status');assert.equal(controls.length,7);assert.equal(ui.el.querySelectorAll('[required]').length,0);
 assert.doesNotMatch(ui.el.textContent||'',/Event.*optional|Start a new|Tournament or cash game rail/);
 }finally{await ui.close()}
});
test('Update Stack saves only the four counts, including zero and omitted blank fields',async()=>{
 let saved:Record<string,unknown>|undefined;const post={id:'p',tournament:{event:'Test',status:'Playing',chips:200,bigBlind:20,remaining:24,started:73}} as Post;
 const ui=await mount(createElement(Quick,{post,part:'stack',busy:false,onSave:async data=>{saved=data;return true}}));try{
 assert.equal(ui.el.querySelectorAll('input').length,4);assert.equal(ui.el.querySelectorAll('select,textarea,input[type=file]').length,0);
 await input(ui.el.querySelector('input[aria-label="Chips"]')!,'0');await input(ui.el.querySelector('input[aria-label="Players left"]')!,'');await submit(ui.el);
 assert.deepEqual(saved,{postId:'p',part:'stack',values:{chips:0,bigBlind:20,started:73}});
 }finally{await ui.close()}
});
test('Start Tournament accepts empty optional setup and sends the chosen stack and status',async()=>{
 let saved:Record<string,unknown>|undefined,created='';globalThis.fetch=async(_url,options)=>{saved=JSON.parse(String(options?.body));return Response.json({id:'new-tournament'})};
 const ui=await mount(createElement(Start,{groups:[{id:'g',name:'Private rail'} as Group],activeGroupId:'g',onCreateGroup(){},onCreated:id=>{created=id}}));try{
 const start=Array.from(ui.el.querySelectorAll('button')).find(b=>b.textContent==='Start Tournament')!;await act(async()=>start.click());
 assert.equal(ui.el.querySelectorAll('[required]').length,0);assert.equal(ui.el.querySelectorAll('input[type=number]').length,4);
 await input(ui.el.querySelector('input[aria-label="Chips"]')!,'30000');await input(ui.el.querySelector('input[aria-label="Current big blind"]')!,'100');await submit(ui.el);
 assert.equal(saved?.action,'startTournament');assert.equal(saved?.event,'');assert.equal(saved?.chips,30000);assert.equal(saved?.bigBlind,100);assert.equal(saved?.status,'Playing');assert.equal(created,'new-tournament');
 }finally{await ui.close();globalThis.fetch=originalFetch}
});
test('New Game can start a cash game from a tournament by using its private parent',async()=>{
 let saved:Record<string,unknown>|undefined,created='';globalThis.fetch=async(_url,options)=>{saved=JSON.parse(String(options?.body));return Response.json({ok:true})};
 const ui=await mount(createElement(Start,{groups:[{id:'g',name:'Private rail'} as Group,{id:'t',name:'Tournament',tournament:true,parentGroupId:'g'} as Group],activeGroupId:'t',onCreateGroup(){},onCreated:id=>{created=id}}));try{
 const start=Array.from(ui.el.querySelectorAll('button')).find(b=>b.textContent==='Start Cash Game')!;assert.equal(start.disabled,false);await act(async()=>start.click());await submit(ui.el);assert.equal(saved?.groupId,'g');assert.equal(saved?.startSession,'cash');assert.equal(created,'g');
 }finally{await ui.close();globalThis.fetch=originalFetch}
});
