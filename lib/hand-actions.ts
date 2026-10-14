import {villainLabel} from './player-labels';
import type {Hand,HandAction,HandActionKind,HandReview} from './types';
import {reviewDetails,reviewPlayers,STREETS} from './hand-review';
import type {Street} from './hand-streets';

const preflop=['UTG','UTG+1','MP','LJ','HJ','CO','BTN','SB','BB'];
const postflop=['SB','BB','UTG','UTG+1','MP','LJ','HJ','CO','BTN'];
export const ACTION_LABELS:Record<HandActionKind,string>={check:'Check',bet:'Bet',call:'Call',fold:'Fold',raise:'Raise'};
export const actionPlayerName=(id:string,count:number)=>id==='hero'?'You':villainLabel(Number(id.split('-')[1]),count);
export function actionOrder(hand:Hand,street:Street){
 const players=reviewPlayers(hand),order=street==='preflop'?preflop:postflop;
 // A recorded heads-up SB/button acts first preflop and last after the flop.
 const headsUp=hand.review?.headsUp===true&&players.length===2&&players.some(p=>p.position==='BB')&&players.some(p=>p.position==='SB'||p.position==='BTN');
 return [...players].sort((a,b)=>headsUp?(street==='preflop'?(a.position==='BB'?1:-1):(a.position==='BB'?-1:1)):order.indexOf(a.position)-order.indexOf(b.position));
}
export function actionText(action:HandAction,count:number){
 const size=action.amount?` ${action.kind==='raise'?'to ':''}${action.amount} ${action.unit==='bb'?'BB':'chips'}`:'';
 return `${action.position} · ${action.playerId==='hero'?'Hero':actionPlayerName(action.playerId,count)}: ${ACTION_LABELS[action.kind]}${size}${action.allIn?' (all-in)':''}`;
}
export function streetActionText(review:HandReview,street:Street){
 return [...(review.actions?.[street]||[]).map(action=>actionText(action,review.opponents.length)),review.streets[street]].filter(Boolean).join('\n');
}
export function actionState(hand:Hand,street:Street){
 const review=reviewDetails(hand),players=actionOrder(hand,street),prior=STREETS.slice(0,STREETS.indexOf(street)).flatMap(s=>review.actions?.[s]||[]);
 const folded=new Set(prior.filter(a=>a.kind==='fold').map(a=>a.playerId));
 const allIn=new Set(prior.filter(a=>a.allIn).map(a=>a.playerId));
 const active=()=>players.filter(p=>!folded.has(p.id)&&!allIn.has(p.id));
 let pending=active().map(p=>p.id),hasWager=street==='preflop',raised=false,error='';
 let knownSize:number|null=null,sizeUnit:'chips'|'bb'|undefined;
 if(players.some(p=>!preflop.includes(p.position)))error='Choose positions in step 4 to use action buttons, or use the optional notes below.';
 else if(new Set(players.map(p=>p.position)).size!==players.length)error='Each player needs a different position for guided action. You can still use notes.';
 else if(prior.some(a=>!players.some(p=>p.id===a.playerId&&p.position===a.position)))error='Earlier street actions no longer match these players. Go back to correct them, or use notes.';
 const facing=(id:string)=>hasWager&&(street!=='preflop'||raised||players.find(p=>p.id===id)?.position!=='BB');
 const legal=(id:string):HandActionKind[]=>[...(facing(id)?['call' as const]:['check' as const]),...(active().length<2?[]:!hasWager?['bet' as const]:['raise' as const]),'fold'];
 if(players.filter(p=>!folded.has(p.id)).length<=1||active().length<2)pending=[];
 for(const action of review.actions?.[street]||[]){
  if(error)break;
  const player=players.find(p=>p.id===action.playerId);
  if(!player||player.position!==action.position||pending[0]!==action.playerId||!legal(action.playerId).includes(action.kind)){
   error='The recorded actions no longer match the player positions or previous streets. Undo the affected actions, or keep them as notes.';break;
  }
  if(action.kind==='bet'||action.kind==='raise'){
   const amount=action.amount?Number(action.amount.replace(/,/g,'')):null;
   if(amount!==null&&(!Number.isFinite(amount)||amount<=0||knownSize!==null&&sizeUnit===action.unit&&amount<=knownSize)){
    error='Bet sizes must be positive, and a raise must be to more than the previous wager in the same units.';break;
   }
   knownSize=amount;sizeUnit=action.unit;hasWager=true;raised=true;
   if(action.allIn)allIn.add(action.playerId);
   const seat=players.findIndex(p=>p.id===action.playerId);
   pending=[...players.slice(seat+1),...players.slice(0,seat)].filter(p=>!folded.has(p.id)&&!allIn.has(p.id)).map(p=>p.id);
  }else{
   pending.shift();if(action.kind==='fold')folded.add(action.playerId);if(action.allIn)allIn.add(action.playerId);
  }
  if(players.filter(p=>!folded.has(p.id)).length<=1)pending=[];
 }
 const current=players.find(p=>p.id===pending[0]);
 return {players,current,pending,error,allowed:current&&!error?legal(current.id):[],complete:!error&&!pending.length,folded,allIn};
}
