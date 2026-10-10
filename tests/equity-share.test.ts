import test from 'node:test';
import assert from 'node:assert/strict';
import {createEquityShareDraft,equityShareRequest,equityShareSummary,equityShareUrl} from '../lib/equity-share';
import type {Hand} from '../lib/types';

const players=[{cards:'ah qh',position:'BTN'},{cards:'Ks Kd',position:'BB'},{cards:'Jc Tc',position:'SB'}];
const source:Hand={game:'NL Hold’em',hero:'2c 3c',board:'',position:'UTG',stakes:'$1 / $3',stack:'100 BB',pot:'$120',action:'Preflop: BTN raised, BB called.',question:'How would you play the turn?',result:'Private hidden showdown notes',revealed:false};
const result={players:[{equity:.25,win:.25,tie:0},{equity:.75,win:.75,tie:0},{equity:0,win:0,tie:0}],trials:42,exact:true};

test('share draft uses current calculator hands and retains source context without revealing a hidden result',()=>{
 const draft=createEquityShareDraft(players,'Qs 9h 4c 7h',result,source);
 assert.equal(draft.hand.hero,'Ah Qh');assert.equal(draft.hand.position,'BTN');assert.equal(draft.hand.board,'Qs 9h 4c 7h');
 assert.equal(draft.hand.stakes,'$1 / $3');assert.equal(draft.hand.action,source.action);assert.equal(draft.hand.result,'');
 const summary=equityShareSummary(draft);
 assert.match(summary,/Your hand \(BTN\): Ah Qh · 25.0% equity/);
 assert.match(summary,/Opponent 2 \(SB\): Jc Tc · 0.0% equity/);
 assert.match(summary,/Exact equity · 42 runouts/);
 assert.doesNotMatch(JSON.stringify(draft),/Private hidden showdown notes/);
});

test('sharing routes to the selected destination and preserves all opponents, the board, action and question',()=>{
 const draft=createEquityShareDraft(players,'Qs 9h 4c 7h',result,source);
 const notes={context:'Study this spot with me.',action:source.action,question:source.question};
 const rail=equityShareRequest(draft,{kind:'rail',id:'other-rail'},notes);
 assert.ok('groupId' in rail.payload);assert.ok('hand' in rail.payload);
 assert.equal(rail.path,'/api/rail');assert.equal(rail.payload.groupId,'other-rail');assert.equal(rail.payload.kind,'hand');
 assert.equal(rail.payload.hand?.hero,'Ah Qh');assert.equal(rail.payload.hand?.action,source.action);
 const room=equityShareRequest(draft,{kind:'room',id:'followed-room'},notes);
 assert.equal(room.path,'/api/community');assert.equal(room.payload.roomId,'followed-room');
 for(const audience of ['friends','public'] as const){
  const table=equityShareRequest(draft,{kind:'table',audience},notes);
  assert.equal(table.path,'/api/table-talk');assert.equal(table.payload.audience,audience);
  for(const body of [table.payload.body,room.payload.body]){
   assert.match(body,/Opponent 2 \(SB\): Jc Tc/);assert.match(body,/Board: Qs 9h 4c 7h/);
   assert.ok(body.includes(source.action));assert.ok(body.includes(source.question));assert.ok(body.includes(notes.context));
  }
 }
 assert.equal(equityShareUrl({kind:'rail',id:'other-rail'},'me','post-1'),'/?group=other-rail&post=post-1');
 assert.equal(equityShareUrl({kind:'room',id:'followed-room'},'me','post-1'),'/?view=rooms&room=followed-room&post=post-1');
 assert.equal(equityShareUrl({kind:'table',audience:'friends'},'me','post-1'),'/?profile=me&post=post-1');
});

test('sharing identifies uncalculated and estimated equity and rejects incomplete or duplicate hands',()=>{
 assert.match(equityShareSummary(createEquityShareDraft(players,'',null)),/Equity not calculated/);
 assert.match(equityShareSummary(createEquityShareDraft(players,'',{...result,exact:false})),/Estimated equity/);
 assert.throws(()=>createEquityShareDraft([{cards:'Ah Qh',position:''},{cards:'',position:''}],'',null),/Opponent 1/);
 assert.throws(()=>createEquityShareDraft(players,'Qs 9h',null),/3, 4, or 5/);
 assert.throws(()=>createEquityShareDraft(players,'Ah 9h 4c',null),/cannot appear twice/);
 assert.throws(()=>equityShareRequest(createEquityShareDraft(players,'',null),{kind:'room',id:'room'},{context:'x'.repeat(5000),action:'',question:''}),/5,000/);
});
