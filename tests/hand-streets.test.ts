import test from 'node:test';
import assert from 'node:assert/strict';
import {stackInBB,stackLabel,streetInput,calculateStreetEquities,savedStreetEquity} from '../lib/hand-streets';
import {withReview} from '../lib/hand-review';
import {postSchema} from '../lib/validation';
import type {Hand} from '../lib/types';
const base:Hand={game:'NL Hold’em',hero:'Ah Ad',board:'2c 3d 4h Ks Kc',position:'BTN',stack:'100',stakes:'',pot:'',action:'',question:'',revealed:false};
const hand=withReview(base,{format:'tournament',stackUnit:'bb',bigBlind:'1000',blindUnit:'chips',totalPlayers:'300',remaining:'40',opponents:[{cards:'Kh Kd',position:'BB',stack:'50000',stackUnit:'chips'}]});
test('BB conversions require explicit compatible units, handle zero stacks, and preserve unknown values',()=>{
 assert.equal(stackInBB('50,000','chips','1,000','chips'),50);
 assert.equal(stackInBB('300','currency','3','currency'),100);
 assert.equal(stackInBB('25 BB',undefined,undefined,undefined),25);
 assert.equal(stackInBB('0','bb','',''),0);
 for(const [stack,unit,blind,blindUnit] of [['1,,000','chips','100','chips'],['300','','3','currency'],['300','chips','3','currency'],['300','currency','0','currency'],['$300','currency','3','currency'],['-1','bb','',''],['300','chips','','chips']] as const)assert.equal(stackInBB(stack,unit,blind,blindUnit),null);
 assert.equal(stackLabel('$300','','3','currency'),'$300 · BB unknown');
});
test('each street uses only its own board and earlier streets ignore future board changes',()=>{
 assert.equal(streetInput(hand,'preflop').board,'');assert.equal(streetInput(hand,'flop').board,'2c 3d 4h');assert.equal(streetInput(hand,'turn').board,'2c 3d 4h Ks');
 const changed={...hand,board:'2c 3d 4h Qs Qc'};
 assert.equal(streetInput(hand,'preflop').key,streetInput(changed,'preflop').key);assert.equal(streetInput(hand,'flop').key,streetInput(changed,'flop').key);assert.notEqual(streetInput(hand,'turn').key,streetInput(changed,'turn').key);
 assert.match(streetInput({...hand,board:'2c 3d'},'flop').reason,/not entered/);
 assert.match(streetInput({...hand,hero:''},'preflop').reason,/two known/);
});
test('street snapshots preserve independent equities through save and reject stale cards',async()=>{
 const streetEquities=await calculateStreetEquities(hand);
 assert.deepEqual(Object.keys(streetEquities),['preflop','flop','turn','river']);
 assert.ok(streetEquities.preflop!.result.players[0].equity>.7);assert.equal(streetEquities.river!.result.players[0].equity,0);
 assert.equal(streetEquities.preflop!.result.exact,false);assert.equal(streetEquities.flop!.result.exact,true);
 const snapshot=withReview(hand,{streetEquities});const parsed=postSchema.safeParse({groupId:'g',kind:'hand',hand:snapshot});assert.ok(parsed.success);
 assert.equal(savedStreetEquity(snapshot,'river')?.players[1].equity,1);
 assert.equal(postSchema.safeParse({groupId:'g',kind:'hand',hand:{...snapshot,board:'2c 3d 4h Qs Qc'}}).success,false);
 assert.equal(withReview(snapshot,{},true).review?.streetEquities,undefined);
});
test('five-player tied river and incomplete boards do not invent missing street results',async()=>{
 const tied=withReview({...base,hero:'2c 3d',board:'Ah Kh Qh Jh Th'},{opponents:[{cards:'4c 5d',position:'SB',stack:''},{cards:'6c 7d',position:'BB',stack:''},{cards:'8c 9d',position:'CO',stack:''},{cards:'Tc Jd',position:'UTG',stack:''}]});
 const result=await calculateStreetEquities(tied);for(const player of result.river!.result.players)assert.equal(player.equity,.2);
 const partial=await calculateStreetEquities({...hand,board:'2c 3d'});assert.deepEqual(Object.keys(partial),['preflop']);
});
