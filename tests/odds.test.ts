import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateOdds,handScore} from '../lib/odds';

test('scores a straight flush above a full house',()=>{
 assert.ok(handScore(['Ah','Kh','Qh','Jh','Th','2c','3d'])[0]>handScore(['As','Ad','Ac','Ks','Kd','2c','3d'])[0]);
});
test('river comparison and tie are exact',async()=>{
 const win=await calculateOdds('Ah Qh','Ks Kd','Qs 9h 4c 7h 2s');
 assert.deepEqual(win,{hero:0,villain:1,ties:0,trials:1,exact:true});
 const tie=await calculateOdds('2c 3d','4c 5d','Ah Kh Qh Jh Th');
 assert.equal(tie.ties,1);
});
test('turn exhausts every possible river card',async()=>{
 const turn=await calculateOdds('Ah Qh','Ks Kd','Qs 9h 4c 7h');
 assert.equal(turn.trials,44);assert.equal(turn.exact,true);
 assert.equal(turn.hero+turn.villain+turn.ties,1);
});
test('flop and preflop give explicitly sampled estimates',async()=>{
 const flop=await calculateOdds('Ah Qh','Ks Kd','Qs 9h 4c');
 assert.equal(flop.exact,false);assert.ok(flop.hero>.2&&flop.hero<.35);
 const preflop=await calculateOdds('As Ad','Kc Kd','');
 assert.equal(preflop.exact,false);assert.ok(preflop.hero>.77&&preflop.hero<.88);
});
test('rejects duplicate cards, invalid notation and an impossible board length',async()=>{
 await assert.rejects(calculateOdds('Ah Ah','Ks Kd',''),/cannot appear twice/);
 await assert.rejects(calculateOdds('10h Qh','Ks Kd',''),/Write ten as T/);
 await assert.rejects(calculateOdds('Ah Qh','Ks Kd','Qs 9h'),/0, 3, 4, or 5/);
});
