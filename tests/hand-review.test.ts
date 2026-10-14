import test from 'node:test';
import assert from 'node:assert/strict';
import type {Hand} from '../lib/types';
import {equityUnavailable,reviewDetails,reviewPlayers,withReview} from '../lib/hand-review';
import {postSchema} from '../lib/validation';
import {calculateMultiwayOdds} from '../lib/odds';
const empty:Hand={game:'NL Hold’em',stakes:'',stack:'',hero:'',board:'',position:'',pot:'',action:'',question:'',revealed:false};
const valid=(hand:Hand,extra:Record<string,unknown>={})=>postSchema.safeParse({groupId:'review-rail',kind:'hand',hand,...extra});

test('review can skip all fields and post only a photo, notes, position or a single known card',()=>{
 const hand=withReview(empty,{});
 assert.equal(valid(hand).success,false); // A completely empty post is still not content.
 for(const detail of [{...hand,hero:'Ah'},{...hand,board:'2c 3c'},{...hand,position:'BTN'},withReview(hand,{notes:'Only remember the river raise.'}),withReview(hand,{opponents:[{cards:'',position:'',stack:'$450'}]})])assert.equal(valid(detail).success,true);
 assert.equal(valid(hand,{images:['data:image/jpeg;base64,/9j/2Q==']}).success,true);
 assert.ok(equityUnavailable({...hand,hero:'Ah'}));
});

test('cash and tournament details, opponents and both action drafts survive serialization',()=>{
 let hand=withReview({...empty,stack:'100 BB'},{format:'tournament',blinds:'500 / 1000',ante:'1000',event:'Weekend Main',level:'8',remaining:'42',opponents:[{cards:'Ks Kd',position:'SB',stack:'50 BB'},{cards:'',position:'BB',stack:'80 BB'}],notes:'River decision.',streets:{preflop:'BTN raises; blinds call.',flop:'Checks around.',turn:'',river:''}});
 hand=withReview(hand,{actionMode:'streets'});
 assert.match(hand.action,/Preflop: BTN raises/);
 assert.equal(reviewDetails(hand).notes,'River decision.');
 hand=withReview(hand,{format:'cash',actionMode:'notes'});
 assert.equal(hand.action,'River decision.');assert.equal(hand.review?.event,'Weekend Main');
 const parsed=valid(JSON.parse(JSON.stringify(hand)));
 assert.equal(parsed.success,true);if(parsed.success)assert.deepEqual(parsed.data.hand?.review,hand.review);
 assert.equal(reviewPlayers(hand)[2].stack,'80 BB');
});

test('duplicate cards across all opponents/board and a fifth opponent are rejected',()=>{
 for(const opponents of [[{cards:'ah Kd',position:'',stack:''}],[{cards:'2x 3c',position:'',stack:''}],Array.from({length:5},()=>({cards:'',position:'',stack:''}))])assert.equal(valid(withReview({...empty,hero:'Ah Qh'},{opponents})).success,false);
 assert.equal(valid(withReview({...empty,board:'Ks 2c'},{opponents:[{cards:'Ks',position:'',stack:''}]})).success,false);
});

test('equity requires full known hands, persists for the correct players and is cleared on card changes',async()=>{
 let hand=withReview({...empty,hero:'Ah Ad',board:'2c 3d 4h 9s Kc'},{opponents:[{cards:'Kh Kd',position:'BB',stack:'100 BB'},{cards:'Qs Qd',position:'SB',stack:'80 BB'}]});
 assert.equal(equityUnavailable(hand),'');
 const equity=await calculateMultiwayOdds(reviewPlayers(hand).map(player=>player.cards),hand.board);
 hand=withReview(hand,{equity});assert.equal(valid(hand).success,true);
 assert.equal(valid({...hand,hero:''}).success,false);
 assert.equal(valid(withReview(hand,{equity:{...equity,players:equity.players.slice(0,2)}})).success,false);
 hand=withReview(hand,{},true);assert.equal(hand.review?.equity,undefined);
 assert.equal(valid({...hand,hero:''}).success,true);
});

test('legacy hand action and position load without inventing opponents or losing hidden results',()=>{
 const source={...empty,action:'Legacy free-form action',position:'UTG+1',result:'Hidden outcome'};
 const hand=withReview(source,{});
 assert.equal(hand.action,source.action);assert.equal(hand.result,source.result);assert.equal(hand.position,'UTG+1');
 assert.equal(reviewPlayers(hand).length,2);assert.equal(reviewPlayers(hand)[1].cards,'');
});
