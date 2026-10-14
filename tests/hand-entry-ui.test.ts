import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createElement,act,useState,StrictMode} from 'react';
import type {Root} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {withReview} from '../lib/hand-review';
import {reviewBoard} from '../lib/hand-board';
import {postSchema} from '../lib/validation';
import type {Hand} from '../lib/types';

// Exercise React DOM reconciliation and real event handlers without a browser,
// network requests, authentication, or production data.
const styleHook=registerHooks({load(url,context,next){
 if(url.endsWith('.css'))return {format:'module',source:'export default {};',shortCircuit:true};
 return next(url,context);
}});
let dom:JSDOM;
let createRoot:typeof import('react-dom/client').createRoot;
let HandReviewFlow:typeof import('../app/hand-review-flow').default;
const seed=()=>withReview({game:'NL Hold’em',stakes:'',position:'SB',stack:'100',hero:'Ah Ad',board:'',pot:'',action:'',question:'',revealed:false},{format:'tournament',stackUnit:'bb',opponents:[{cards:'Kh Kd',position:'BB',stack:'100',stackUnit:'bb'}]});

before(async()=>{
 dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://hand-entry.test'});
 for(const [name,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 ({createRoot}=await import('react-dom/client'));
 ({default:HandReviewFlow}=await import('../app/hand-review-flow'));
});
after(()=>{dom?.window.close();styleHook.deregister();});

async function mount(initial:Hand,startStep:number){
 const container=document.createElement('div');document.body.append(container);
 const root:Root=createRoot(container);
 let saved=initial;
 function Harness(){
  const [hand,setHand]=useState(initial),[step,setStep]=useState(startStep);
  saved=hand;
  return createElement('form',{onSubmit:event=>event.preventDefault()},createElement(HandReviewFlow,{hand,onChange:setHand,step,onStep:setStep,busy:false,children:null}));
 }
 await act(async()=>root.render(createElement(StrictMode,null,createElement(Harness))));
 const button=(label:string,scope:ParentNode=container)=>{
  const found=Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(item=>item.textContent?.trim()===label);
  assert.ok(found,`Missing button: ${label}`);return found;
 };
 const click=async(element:HTMLElement)=>{assert.ok(!element.matches(':disabled'),'Control must be enabled');await act(async()=>element.click());};
 const pick=async(card:string)=>{
  const option=container.querySelector<HTMLButtonElement>(`[data-card="${card}"]`);assert.ok(option,`Missing card ${card}`);await click(option);
 };
 const checkControls=()=>{
  assert.equal(container.querySelectorAll('.card-picker').length,1,'Exactly one card picker per street');
  assert.equal(container.querySelectorAll('.hand-action-editor').length,1,'Exactly one action editor per street');
 };
 const size=async(value:string)=>{
  const input=container.querySelector<HTMLInputElement>('.action-sizing input');assert.ok(input);
  await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
 };
 return {container,button,click,pick,checkControls,size,hand:()=>saved,close:async()=>{await act(async()=>root.unmount());container.remove();}};
}

test('one villain becomes numbered villains when another player is added, with consistent card-editor labels',async()=>{
 const ui=await mount(seed(),3);
 try{
  const tabs=()=>Array.from(ui.container.querySelectorAll<HTMLButtonElement>('.review-player-tabs button'));
  assert.match(tabs()[1].textContent||'',/^VillainKh Kd$/);assert.doesNotMatch(ui.container.textContent||'',/Opponent/);
  await ui.click(tabs()[1]);assert.equal(ui.container.querySelector('.review-player-heading h4')?.textContent,'Villain');assert.ok(ui.container.querySelector('[aria-label="Villain position"]'));
  await ui.click(ui.button('Add villain'));
  assert.match(tabs()[1].textContent||'',/^Villain 1/);assert.match(tabs()[2].textContent||'',/^Villain 2/);assert.equal(ui.container.querySelector('.review-player-heading h4')?.textContent,'Villain 2');
  await ui.click(ui.button('Remove villain'));assert.match(tabs()[1].textContent||'',/^VillainKh Kd$/);assert.equal(ui.hand().review?.opponents[0].cards,'Kh Kd');
 }finally{await ui.close()}
});

test('flop card clicks stay in one three-card picker across edits, actions and street navigation',async()=>{
 const ui=await mount(seed(),4);
 try{
  ui.checkControls();
  for(const [index,card] of ['2s','3h','4d'].entries()){
   await ui.pick(card);ui.checkControls();
   assert.equal(reviewBoard(ui.hand()).flop.split(' ').length,index+1);
   assert.ok(ui.container.querySelectorAll('.card-picker-slot').length<=3);
  }
  assert.equal(ui.container.querySelectorAll('.card-picker-slot').length,3);
  assert.ok(ui.container.querySelector<HTMLButtonElement>('[data-card="5c"]')!.disabled,'Fourth flop card is disabled');
  await ui.click(ui.container.querySelector<HTMLButtonElement>('[data-slot="1"]')!);
  await ui.pick('5c');ui.checkControls();assert.equal(reviewBoard(ui.hand()).flop,'2s 5c 4d');
  await ui.click(ui.container.querySelector<HTMLButtonElement>('[aria-label="Remove 4 of diamonds"]')!);
  await ui.pick('6d');ui.checkControls();assert.equal(reviewBoard(ui.hand()).flop,'2s 5c 6d');
  await ui.click(ui.button('Check'));ui.checkControls();
  await ui.click(ui.button('Continue'));ui.checkControls();
  await ui.pick('7c');assert.equal(ui.container.querySelectorAll('.card-picker-slot').length,1);
  await ui.click(ui.button('Continue'));ui.checkControls();
  await ui.pick('8s');assert.equal(ui.container.querySelectorAll('.card-picker-slot').length,1);
  for(let repeat=0;repeat<3;repeat++){
   await ui.click(ui.button('Back'));await ui.click(ui.button('Back'));ui.checkControls();
   assert.equal(ui.container.querySelectorAll('.card-picker-slot').length,3);
   await ui.click(ui.button('Continue'));await ui.click(ui.button('Continue'));ui.checkControls();
  }
  assert.deepEqual(reviewBoard(ui.hand()),{flop:'2s 5c 6d',turn:'7c',river:'8s'});
  const parsed=postSchema.safeParse({groupId:'test-only',kind:'hand',hand:JSON.parse(JSON.stringify(ui.hand()))});
  assert.ok(parsed.success,'Completed hand must survive save validation');
 }finally{await ui.close();}
});

test('postflop players can act a second and third time after a bet, raise and reraise',async()=>{
 const ui=await mount(seed(),4);
 try{
  await ui.click(ui.button('Check'));
  await ui.click(ui.button('Bet'));await ui.size('4');await ui.click(ui.button('Add bet'));
  assert.match(ui.container.querySelector('.action-turn')!.textContent!,/SB/);
  await ui.click(ui.button('Raise'));await ui.size('12');await ui.click(ui.button('Add raise'));
  assert.match(ui.container.querySelector('.action-turn')!.textContent!,/BB/);
  await ui.click(ui.button('Raise'));await ui.size('30');await ui.click(ui.button('Add raise'));
  assert.match(ui.container.querySelector('.action-turn')!.textContent!,/SB/);
  await ui.click(ui.button('Call'));ui.checkControls();
  assert.match(ui.container.textContent!,/Betting round complete/);
  assert.deepEqual(ui.hand().review?.actions?.flop?.map(a=>[a.playerId,a.kind,a.amount]),[
   ['hero','check',''],['opponent-1','bet','4'],['hero','raise','12'],['opponent-1','raise','30'],['hero','call',''],
  ]);
  await ui.click(ui.button('Undo last action'));await ui.click(ui.button('Call'));ui.checkControls();
  for(const card of ['2s','3h','4d'])await ui.pick(card);
  assert.equal(reviewBoard(ui.hand()).flop,'2s 3h 4d');ui.checkControls();
  assert.equal(ui.hand().review?.actions?.flop?.length,5,'Card edits preserve the repeated-action history');
 }finally{await ui.close();}
});

test('preflop raise responses remain editable and separate from the following street',async()=>{
 const initial=withReview({...seed(),position:'UTG'},{opponents:[{cards:'Kh Kd',position:'BTN',stack:'100',stackUnit:'bb'}]});
 const ui=await mount(initial,3);
 try{
  for(const amount of ['3','10','25']){await ui.click(ui.button('Raise'));await ui.size(amount);await ui.click(ui.button('Add raise'));}
  await ui.click(ui.button('Call'));
  assert.match(ui.container.textContent!,/Betting round complete/);
  assert.deepEqual(ui.hand().review?.actions?.preflop?.map(a=>a.playerId),['hero','opponent-1','hero','opponent-1']);
  await ui.click(ui.button('Continue'));ui.checkControls();
  for(const card of ['2s','3h','4d'])await ui.pick(card);
  await ui.click(ui.button('Check'));ui.checkControls();
  await ui.click(ui.button('Back'));
  assert.equal(ui.hand().review?.actions?.preflop?.length,4);
  assert.equal(ui.hand().review?.actions?.flop?.length,1);
  assert.equal(reviewBoard(ui.hand()).flop,'2s 3h 4d');
 }finally{await ui.close();}
});
