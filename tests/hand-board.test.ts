import test from 'node:test';
import assert from 'node:assert/strict';
import {knownBoardCards,reviewBoard,streetBoardSlots} from '../lib/hand-board';
import {withReview,withStreetBoard,reviewPlayers} from '../lib/hand-review';
import {calculateStreetEquities,streetInput} from '../lib/hand-streets';
import {postSchema} from '../lib/validation';
import {createEquityShareDraft,equityShareRequest,equityShareSummary} from '../lib/equity-share';
import type {Hand} from '../lib/types';

const empty:Hand={game:'NL Hold’em',hero:'',board:'',position:'',stack:'',stakes:'',pot:'',action:'',question:'',revealed:false};
const hand=withReview({...empty,hero:'Ah Ad',board:'2c 3d 4h Ks Kc',position:'BTN',stack:'40'}, {stackUnit:'bb',opponents:[{cards:'Kh Kd',position:'BB',stack:'20',stackUnit:'bb'}]});
const valid=(h:Hand)=>postSchema.safeParse({groupId:'g',kind:'hand',hand:h});

test('legacy boards split into streets; editing one preserves all other cards and notes',()=>{
 assert.deepEqual(reviewBoard(hand),{flop:'2c 3d 4h',turn:'Ks',river:'Kc'});
 const next=withStreetBoard(hand,'flop','2c 3d 5h');
 assert.equal(next.board,'2c 3d 5h Ks Kc');assert.deepEqual(reviewBoard(next),{flop:'2c 3d 5h',turn:'Ks',river:'Kc'});
 assert.equal(next.stack,'40');assert.equal(next.review?.opponents[0].stack,'20');assert.ok(valid(next).success);
 assert.equal(hand.board,'2c 3d 4h Ks Kc');
});

test('skipped and cleared streets never shift later cards into earlier board slots',()=>{
 let next=withStreetBoard(hand,'flop','2c');
 assert.equal(next.board,'2c');assert.deepEqual(streetBoardSlots(next,'river'),['2c','','','Ks','Kc']);
 assert.deepEqual(knownBoardCards(next),['2c','Ks','Kc']);assert.ok(valid(next).success);
 assert.match(streetInput(next,'turn').reason,/not entered/);
 next=withStreetBoard(next,'flop','2c 3d 4h');assert.equal(next.board,hand.board);
 next=withStreetBoard(next,'turn','');assert.equal(next.board,'2c 3d 4h');
 assert.deepEqual(streetBoardSlots(next,'river'),['2c','3d','4h','','Kc']);
 assert.equal(streetInput(next,'flop').reason,'');assert.match(streetInput(next,'river').reason,/not entered/);
});

test('a single later card is optional valid content, but duplicates, overfull and inconsistent boards are rejected',()=>{
 for(const street of ['flop','turn','river'] as const)assert.ok(valid(withStreetBoard(empty,street,'As')).success);
 assert.ok(!valid(withStreetBoard(withStreetBoard(empty,'turn','As'),'river','As')).success);
 assert.ok(!valid(withStreetBoard(hand,'turn','Ah')).success);
 assert.ok(!valid(withStreetBoard(hand,'flop','2c 3d 4h 5s')).success);
 assert.ok(!valid(withStreetBoard(hand,'river','2x')).success);
 assert.ok(!valid({...hand,board:'2c 3d 4h Ks Kc 9s'}).success);
 const next=withStreetBoard(hand,'flop','');assert.ok(!valid({...next,board:'Ks Kc'}).success);
});

test('incomplete boards only calculate complete earlier streets and edits invalidate snapshots',async()=>{
 const next=withStreetBoard(hand,'turn','');
 const equities=await calculateStreetEquities(next);
 assert.deepEqual(Object.keys(equities),['preflop','flop']);
 const saved=withReview(next,{streetEquities:equities});assert.ok(valid(saved).success);
 const edited=withStreetBoard(saved,'river','Qs');assert.equal(edited.review?.streetEquities,undefined);
 assert.equal(streetInput(next,'flop').key,streetInput(edited,'flop').key);
 assert.deepEqual(streetInput(edited,'flop').slots,['2c','3d','4h']);
 assert.deepEqual(streetInput(edited,'river').slots,['2c','3d','4h','','Qs']);
 const filled=withStreetBoard(edited,'turn','Js');assert.equal(streetInput(filled,'river').reason,'');
});

test('calculator import maps complete boards, preserves skipped streets until the board changes, and shares safely',()=>{
 const next=withStreetBoard(hand,'flop','');
 const draft=createEquityShareDraft(reviewPlayers(next),next.board,null,next);
 assert.deepEqual(draft.hand.review?.boardByStreet,next.review?.boardByStreet);
 assert.match(equityShareSummary(draft),/flop: not entered · turn: Ks · river: Kc/);
 for(const destination of [{kind:'rail',id:'g'},{kind:'room',id:'r'},{kind:'table',audience:'friends'}] as const){
  const request=equityShareRequest(draft,destination,{context:'',action:'',question:''});
  assert.deepEqual(request.payload.hand?.review?.boardByStreet,next.review?.boardByStreet);
 }
 const changed=createEquityShareDraft(reviewPlayers(next),'2c 3d 4h Qs',null,next);
 assert.equal(changed.hand.review?.boardByStreet,undefined);
 assert.deepEqual(reviewBoard(changed.hand),{flop:'2c 3d 4h',turn:'Qs',river:''});
 assert.ok(valid(changed.hand).success);
 assert.throws(()=>createEquityShareDraft([{cards:'Ks Qh',position:''},{cards:'Kh Kd',position:''}],'',null,next),/cannot appear twice/);
});
