import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createElement,act} from 'react';
import {JSDOM} from 'jsdom';
import type {ActiveGame} from '../lib/active-games';
const hook=registerHooks({load(url,context,next){return url.endsWith('.css')?{format:'module',source:'export default {};',shortCircuit:true}:next(url,context)}});
let dom:JSDOM,createRoot:typeof import('react-dom/client').createRoot,RailApp:typeof import('../app/rail-app').default,GameCard:typeof import('../app/active-games').GameCard;
const originalFetch=globalThis.fetch;
const game:ActiveGame={id:'game',source:'player',kind:'tournament',name:'Secret event',playerId:'a',playerName:'Alex',groupId:null,railName:null,roomId:null,roomName:null,leagueId:null,active:true,created:'2026-10-13T12:00:00Z',finishedAt:null,private:true,followingPlayer:true,followingRail:false,followingRoom:false,tournament:{event:'Secret event',status:'Playing',chips:99999},href:'/?profile=a'};
before(async()=>{dom=new JSDOM('<html><body></body></html>',{url:'https://games.test/',pretendToBeVisual:true});for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,location:dom.window.location,history:dom.window.history,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});({createRoot}=await import('react-dom/client'));({default:RailApp}=await import('../app/rail-app'));({GameCard}=await import('../app/active-games'))});
after(()=>{globalThis.fetch=originalFetch;dom.window.close();hook.deregister()});
async function mount(element:React.ReactNode){const el=document.createElement('div');document.body.append(el);const root=createRoot(el);await act(async()=>root.render(element));return {el,close:async()=>{await act(async()=>root.unmount());el.remove()}}}
test('private game cards show player and status but never event details or chip counts',async()=>{
 const ui=await mount(createElement(GameCard,{game}));try{assert.match(ui.el.textContent||'',/Alex’s tournament/);assert.match(ui.el.textContent||'',/invite-only/);assert.doesNotMatch(ui.el.textContent||'',/Secret event|99999/);assert.equal(ui.el.querySelector('a')?.getAttribute('href'),'/?profile=a')}finally{await ui.close()}
});
test('bottom Active Games menu opens the real screen and filters room games without dropping other navigation',async()=>{
 const requests:string[]=[];
 globalThis.fetch=async input=>{const url=String(input);requests.push(url);if(url==='/api/rail')return Response.json({user:{id:'b',name:'Blair'},groups:[]});if(url.startsWith('/api/community'))return Response.json({invitations:[]});if(url.startsWith('/api/activity'))return Response.json({items:[],unread:0,publicKey:null});if(url.startsWith('/api/games')){const room={...game,id:'room-game',source:'room',kind:'room',private:false,name:'Room game',roomName:'River Room',tournament:null,href:'/?view=rooms&room=r'};return Response.json({games:url.includes('filter=rooms')?[room]:[game],selected:null,nextOffset:null})}throw Error('Unexpected request: '+url)};
 const ui=await mount(createElement(RailApp,{ready:true}));try{
 const nav=ui.el.querySelector('nav[aria-label="Mobile navigation"]')!;assert.ok(nav);assert.equal(nav.querySelectorAll('button').length,6);const button=Array.from(nav.querySelectorAll('button')).find(b=>b.textContent==='Active Games');assert.ok(button,'Active Games must be in the bottom menu');await act(async()=>button.click());
 assert.equal(location.search,'?view=games');assert.equal(ui.el.querySelector('main h1')?.textContent,'Active Games');assert.match(ui.el.querySelector('main')?.textContent||'',/Alex’s tournament/);
 const rooms=Array.from(ui.el.querySelectorAll<HTMLButtonElement>('[aria-label="Filter active games"] button')).find(b=>b.textContent==='Rooms')!;await act(async()=>rooms.click());assert.match(ui.el.querySelector('main')?.textContent||'',/River Room/);assert.doesNotMatch(ui.el.querySelector('main')?.textContent||'',/Alex’s tournament/);assert.ok(requests.some(url=>url.includes('filter=rooms')));
 }finally{await ui.close();globalThis.fetch=originalFetch;history.replaceState(null,'','/')}
});
