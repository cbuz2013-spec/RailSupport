import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateMultiwayOdds,calculateOdds,handScore,RANKS,SUITS} from '../lib/odds';

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
test('flop exhausts runouts while preflop is explicitly estimated',async()=>{
 const flop=await calculateOdds('Ah Qh','Ks Kd','Qs 9h 4c');
 assert.equal(flop.exact,true);assert.equal(flop.trials,990);assert.ok(flop.hero>.2&&flop.hero<.35);
 const preflop=await calculateOdds('As Ad','Kc Kd','');
 assert.equal(preflop.exact,false);assert.ok(preflop.hero>.77&&preflop.hero<.88);
});

test('divides a shared board equally among two through five players',async()=>{
 const hands=['2c 3d','4c 5d','6c 7d','8c 9d','Tc Jd'];
 for(let count=2;count<=5;count++){
  const result=await calculateMultiwayOdds(hands.slice(0,count),'Ah Kh Qh Jh Th');
  assert.equal(result.trials,1);assert.equal(result.exact,true);
  for(const player of result.players)assert.deepEqual(player,{equity:1/count,win:0,tie:1});
 }
});

test('splits a pot only among winners and gives losing players zero equity',async()=>{
 const result=await calculateMultiwayOdds(['Tc 3c','Td 4d','9h 9c','8h 8c','7h 7c'],'As Kd Qc Jh 2s');
 assert.deepEqual(result.players.map(player=>player.equity),[.5,.5,0,0,0]);
 assert.deepEqual(result.players.map(player=>player.tie),[1,1,0,0,0]);
 const winner=await calculateMultiwayOdds(['Ah 5h','Ks Kc','Qs Qd','Jc Jd','Tc Td'],'2h 3h 4h 9c Kd');
 assert.deepEqual(winner.players.map(player=>player.equity),[1,0,0,0,0]);
});

test('excludes all five hands from flop and turn runouts and conserves pot equity',async()=>{
 const hands=['Ah Qh','Ks Kd','8c 8d','Jc Tc','6s 5s'];
 const flop=await calculateMultiwayOdds(hands,'Qs 9h 4c');
 const turn=await calculateMultiwayOdds(hands,'Qs 9h 4c 7h');
 assert.equal(flop.trials,741);assert.equal(turn.trials,38);
 for(const result of [flop,turn]){
  assert.equal(result.exact,true);
  assert.ok(Math.abs(result.players.reduce((sum,player)=>sum+player.equity,0)-1)<1e-12);
  for(const player of result.players){assert.ok(player.equity>=0&&player.equity<=1);assert.ok(player.equity>=player.win);}
 }
});

test('multiway validation covers every hand, the player limit and cross-player duplicates',async()=>{
 await assert.rejects(calculateMultiwayOdds(['Ah Ad'],''),/1 to 4 opponents/);
 await assert.rejects(calculateMultiwayOdds(Array(6).fill('Ah Ad'),''),/1 to 4 opponents/);
 await assert.rejects(calculateMultiwayOdds(['','Ks Kd'],''),/your hand/);
 await assert.rejects(calculateMultiwayOdds(['Ah Ad','Ks Kd','Qs Qd','Js Jd','Tc'],''),/Opponent 4/);
 await assert.rejects(calculateMultiwayOdds(['Ah Ad','Ks Kd','Qs Ah'],''),/cannot appear twice/);
 await assert.rejects(calculateMultiwayOdds(['Ah Ad','Ks Kd','Qs Qd'],'2c 3d Qd'),/cannot appear twice/);
});

test('can cancel before or during a preflop estimate',async()=>{
 const before=new AbortController();before.abort();
 await assert.rejects(calculateMultiwayOdds(['Ah Ad','Ks Kd'],'',{signal:before.signal}),{name:'AbortError'});
 const during=new AbortController();let lastProgress=0;
 await assert.rejects(calculateMultiwayOdds(['Ah Ad','Ks Kd'],'',{signal:during.signal,onProgress:value=>{lastProgress=value;if(value>0)during.abort();}}),{name:'AbortError'});
 assert.ok(lastProgress>0&&lastProgress<1);
});

function referenceWinners(hands:string[],board:string):number[]{
 const scores=hands.map(hand=>handScore([...hand.split(' '),...board.split(' ')]));
 const compare=(a:number[],b:number[])=>{for(let i=0;i<Math.max(a.length,b.length);i++)if((a[i]||0)!==(b[i]||0))return (a[i]||0)-(b[i]||0);return 0;};
 const best=scores.reduce((a,b)=>compare(a,b)>=0?a:b);
 return scores.map((score,index)=>compare(score,best)===0?index:-1).filter(index=>index>=0);
}

test('fast multiway evaluator agrees with five-card enumeration on tricky hands and seeded deals',async()=>{
 const fixtures:[string[],string][]=[
  [['Ah 2c','6d 7s'],'3d 4s 5h Kd Qc'], // Wheel against seven-high straight.
  [['Kh Ks','Qh Qs'],'Ah Ad Ac Kd Qc'], // Two trips must form the best full house.
  [['Kh 2s','Qh 3s'],'Ah Jh 9h 6h 4h'], // Six-card flush compares all five kickers.
  [['Ah Ad','Kh Kd'],'2c 2d 2h 2s Qc'], // Board quads use the hole-card kicker.
  [['Ah Ad','Kh Kd'],'Qc Qd Jc Jd 2s'], // Three pairs use the top two plus best kicker.
  [['Ah 2h','6h 7h'],'3h 4h 5h Kd Qc'], // Wheel straight flush.
  [['As Kd','Ah Qd'],'Ac 9s 7h 4d 2c'], // Pair kickers.
  [['As Kd','Ah Qd'],'Ac Ad 7h 4d 2c'], // Trips kickers.
 ];
 let seed=0x12345678;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 for(let deal=0;deal<320;deal++){
  const deck=[...RANKS].flatMap(rank=>[...SUITS].map(suit=>rank+suit));
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const count=2+deal%4;
  fixtures.push([Array.from({length:count},(_,index)=>deck.slice(index*2,index*2+2).join(' ')),deck.slice(count*2,count*2+5).join(' ')]);
 }
 for(const [hands,board] of fixtures){
  const winners=referenceWinners(hands,board),result=await calculateMultiwayOdds(hands,board);
  assert.deepEqual(result.players.map(player=>player.equity),hands.map((_,index)=>winners.includes(index)?1/winners.length:0),`${hands.join(' / ')} on ${board}`);
 }
});
test('rejects duplicate cards, invalid notation and an impossible board length',async()=>{
 await assert.rejects(calculateOdds('Ah Ah','Ks Kd',''),/cannot appear twice/);
 await assert.rejects(calculateOdds('10h Qh','Ks Kd',''),/Write ten as T/);
 await assert.rejects(calculateOdds('Ah Qh','Ks Kd','Qs 9h'),/0, 3, 4, or 5/);
});
