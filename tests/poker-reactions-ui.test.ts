import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createElement,act,useState} from 'react';
import {JSDOM} from 'jsdom';
import type {Reaction} from '../lib/reactions';
let dom:JSDOM,createRoot:typeof import('react-dom/client').createRoot,ReactionButton:typeof import('../app/reaction-button').default;
before(async()=>{
 dom=new JSDOM('<html><body></body></html>',{url:'https://reactions.test/'});
 for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 ({createRoot}=await import('react-dom/client'));({default:ReactionButton}=await import('../app/reaction-button'));
});
after(()=>dom.window.close());
test('all five poker icons can be selected, replaced and removed using the shared reaction picker',async()=>{
 const el=document.createElement('div');document.body.append(el);const root=createRoot(el),changes:(Reaction|null)[]=[];
 function Harness(){const [value,setValue]=useState<Reaction|null>(null);return createElement(ReactionButton,{value,counts:value?{[value]:1}:{},onChange:async next=>{changes.push(next);setValue(next);return true}})}
 await act(async()=>root.render(createElement(Harness)));
 try{
  const trigger=()=>el.querySelector<HTMLButtonElement>('.social-action')!;
  const entries=[['All In','all_in'],['Muck That','muck_that'],['Slow Roll','slow_roll'],['Chip Shuffling','chip_shuffle'],['Tank','tank']] as const;
  for(const [label,id] of entries){
   await act(async()=>trigger().click());const button=el.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);assert.ok(button);assert.ok(button.querySelector('svg.poker-reaction-icon'));
   await act(async()=>button.click());assert.equal(changes.at(-1),id);assert.equal(el.querySelector('.reaction-picker'),null);assert.equal(trigger().getAttribute('aria-label'),`Reaction: ${label}, 1 total`);assert.equal(document.activeElement,trigger());
  }
  await act(async()=>trigger().click());await act(async()=>el.querySelector<HTMLButtonElement>('[aria-label="Tank, 1 reactions"]')!.click());assert.equal(changes.at(-1),null);
 }finally{await act(async()=>root.unmount());el.remove()}
});
