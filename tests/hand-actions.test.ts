import test from 'node:test';
import assert from 'node:assert/strict';
import {actionOrder,actionState,streetActionText} from '../lib/hand-actions';
import {reviewDetails,withReview} from '../lib/hand-review';
import {stackLabel} from '../lib/hand-streets';
import {postSchema} from '../lib/validation';
import type {Hand,HandAction,HandActionKind} from '../lib/types';
import type {Street} from '../lib/hand-streets';
const base:Hand={game:'NL Hold’em',stakes:'',position:'UTG',stack:'40000',hero:'',board:'',pot:'',action:'',question:'',revealed:false};
const initial=()=>withReview(base,{format:'tournament',stackUnit:'chips',opponents:[{cards:'',position:'SB',stack:'50',stackUnit:'bb'},{cards:'',position:'BB',stack:''},{cards:'',position:'BTN',stack:'20000',stackUnit:'chips'}],actionMode:'streets'});
function act(hand:Hand,street:Street,kind:HandActionKind,extra:Partial<HandAction>={}){
 const state=actionState(hand,street);assert.equal(state.error,'');assert.ok(state.current);assert.ok(state.allowed.includes(kind));
 const review=reviewDetails(hand),action:HandAction={playerId:state.current.id,position:state.current.position,kind,amount:'',unit:'bb',...extra};
 return withReview(hand,{actions:{...review.actions,[street]:[...review.actions?.[street]||[],action]}});
}
test('preflop starts UTG, postflop starts SB, and sparse positions stay in clockwise order',()=>{
 assert.deepEqual(actionOrder(initial(),'preflop').map(p=>p.position),['UTG','BTN','SB','BB']);
 for(const street of ['flop','turn','river'] as const)assert.deepEqual(actionOrder(initial(),street).map(p=>p.position),['SB','BB','UTG','BTN']);
 const h=withReview({...base,position:'HJ'},{opponents:[{cards:'',position:'LJ',stack:''},{cards:'',position:'MP',stack:''},{cards:'',position:'CO',stack:''}]});
 assert.deepEqual(actionOrder(h,'preflop').map(p=>p.position),['MP','LJ','HJ','CO']);
});
test('preflop callers leave BB a check or raise option, and a raise reopens action in order',()=>{
 let h=initial();assert.ok(!actionState(h,'preflop').allowed.includes('check'));
 h=act(h,'preflop','call');h=act(h,'preflop','call');h=act(h,'preflop','call');
 assert.equal(actionState(h,'preflop').current?.position,'BB');assert.ok(actionState(h,'preflop').allowed.includes('check'));
 h=act(h,'preflop','raise',{amount:'4'});
 assert.deepEqual(actionState(h,'preflop').pending,['hero','opponent-3','opponent-1']);
 h=act(h,'preflop','raise',{amount:'12'});
 assert.deepEqual(actionState(h,'preflop').pending,['opponent-3','opponent-1','opponent-2']);
 h=act(h,'preflop','fold');h=act(h,'preflop','call');h=act(h,'preflop','call');assert.equal(actionState(h,'preflop').complete,true);
});
test('postflop checks close the round; bets reopen prior checkers and forbid checking into a bet',()=>{
 let h=initial();for(let i=0;i<4;i++)h=act(h,'flop','check');assert.equal(actionState(h,'flop').complete,true);
 h=initial();h=act(h,'flop','check');h=act(h,'flop','bet',{amount:'2.5'});
 assert.deepEqual(actionState(h,'flop').pending,['hero','opponent-3','opponent-1']);
 assert.deepEqual(actionState(h,'flop').allowed,['call','raise','fold']);
 h=act(h,'flop','call');h=act(h,'flop','fold');h=act(h,'flop','call');assert.equal(actionState(h,'flop').complete,true);
 assert.deepEqual(actionState(h,'turn').pending,['opponent-1','opponent-2','hero']);
});
test('explicit folds/all-ins persist across streets, while free text does not invent player state',()=>{
 let h=initial();h=act(h,'preflop','raise',{amount:'20',allIn:true});h=act(h,'preflop','fold');h=act(h,'preflop','call');h=act(h,'preflop','call');
 assert.deepEqual(actionState(h,'flop').pending,['opponent-1','opponent-2']);
 const r=reviewDetails(initial());h=withReview(initial(),{streets:{...r.streets,preflop:'UTG folds, SB all in (unstructured note)'}});assert.equal(actionState(h,'flop').pending.length,4);
 h=initial();h=act(h,'flop','bet',{allIn:true});h=act(h,'flop','call',{allIn:true});h=act(h,'flop','fold');h=act(h,'flop','fold');assert.equal(actionState(h,'turn').complete,true);
});
test('heads-up SB/button acts first preflop and BB acts first postflop',()=>{
 for(const position of ['SB','BTN']){const h=withReview({...base,position},{headsUp:true,opponents:[{cards:'',position:'BB',stack:''}]});assert.equal(actionState(h,'preflop').current?.id,'hero');assert.equal(actionState(h,'flop').current?.id,'opponent-1');}
});
test('missing/duplicate positions, out-of-turn actions and invalid raises are explicit errors',()=>{
 assert.match(actionState({...initial(),position:''},'flop').error,/Choose positions/);
 assert.match(actionState({...initial(),position:'BB'},'flop').error,/different position/);
 assert.match(actionState({...act(initial(),'preflop','fold'),position:'CO'},'flop').error,/Earlier street actions/);
 let h=act(initial(),'flop','bet',{amount:'20',unit:'chips'});
 h=act(h,'flop','raise',{amount:'10',unit:'chips'});assert.match(actionState(h,'flop').error,/raise must/);
 h=act(initial(),'flop','check');const r=reviewDetails(h);h=withReview(h,{actions:{flop:[{...r.actions!.flop![0],playerId:'hero'}]}});assert.match(actionState(h,'flop').error,/no longer match/);
});
test('optional sizes, notes and selected stack units survive validated save/edit without duplication',()=>{
 let h=act(initial(),'flop','bet');h=act(h,'flop','call');const r=reviewDetails(h);h=withReview(h,{streets:{...r.streets,flop:'Size unknown, live read.'}});
 const parsed=postSchema.safeParse({groupId:'private',kind:'hand',hand:JSON.parse(JSON.stringify(h))});assert.equal(parsed.success,true);
 if(parsed.success){assert.deepEqual(parsed.data.hand?.review?.actions,h.review?.actions);assert.equal(parsed.data.hand?.stack,'40000');assert.equal(parsed.data.hand?.review?.stackUnit,'chips');}
 assert.match(streetActionText(reviewDetails(h),'flop'),/SB · Villain 1: Bet\nBB · Villain 2: Call\nSize unknown/);
 assert.equal(stackLabel('40000','chips'),'40000 chips');assert.equal(stackLabel('40','bb'),'40 BB');
 assert.equal(stackLabel('40000','chips','1000','chips'),'40000 chips · 40 BB');
 const undone=withReview(h,{actions:{...r.actions,flop:r.actions!.flop!.slice(0,-1)}});assert.equal(actionState(undone,'flop').current?.position,'BB');
 assert.equal(reviewDetails(undone).streets.flop,'Size unknown, live read.');
});

test('two entered players do not imply heads-up; SB starts postflop unless explicitly selected',()=>{
 const h=withReview({...base,position:'SB'},{opponents:[{cards:'',position:'BB',stack:''}]});assert.equal(actionState(h,'flop').current?.id,'hero');
});
