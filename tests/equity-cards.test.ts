import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {EquityCards} from '../app/equity-table';
import {streetBoardSlots} from '../lib/hand-board';
import {withStreetBoard} from '../lib/hand-review';
import type {Hand} from '../lib/types';

const hand:Hand={game:'NL Hold’em',hero:'Ah Ad',board:'',position:'',stack:'',stakes:'',pot:'',action:'',question:'',revealed:false};
const render=(slots:string[])=>renderToStaticMarkup(createElement(EquityCards,{value:'',count:5,slots}));
const labels=(html:string)=>[...html.matchAll(/aria-label="([^"]*)"/g)].map(match=>match[1]);

test('saved preflop and incomplete hands render unknown board slots without crashing the feed',()=>{
 for(const board of ['','2c','2c 3d','2c 3d 4h','2c 3d 4h Ks','2c 3d 4h Ks Qc']){
  for(const street of ['preflop','flop','turn','river'] as const){
   const slots=streetBoardSlots({...hand,board},street);
   const result=labels(render(slots));
   assert.equal(result.length,5);
   assert.equal(result.filter(label=>label==='Card not selected').length,5-slots.filter(Boolean).length);
  }
 }
});

test('turn and river remain in the right rendered slots when earlier cards are skipped or cleared',()=>{
 let draft=withStreetBoard(withStreetBoard(hand,'turn','Ks'),'river','Qc');
 assert.deepEqual(labels(render(streetBoardSlots(draft,'river'))),['Card not selected','Card not selected','Card not selected','King of spades','Queen of clubs']);
 draft=withStreetBoard(draft,'flop','2c 3d 4h');
 draft=withStreetBoard(draft,'turn','');
 assert.deepEqual(labels(render(streetBoardSlots(draft,'river'))),['2 of clubs','3 of diamonds','4 of hearts','Card not selected','Queen of clubs']);
 assert.deepEqual(labels(render(streetBoardSlots(draft,'flop'))),['2 of clubs','3 of diamonds','4 of hearts','Card not selected','Card not selected']);
});
