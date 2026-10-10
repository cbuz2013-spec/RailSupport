import {parseCards,type MultiwayOddsResult} from './odds';
import type {Hand} from './types';
import {postSchema} from './validation';

export type EquitySharePlayer={cards:string;position:string};
export type EquityShareDraft={players:EquitySharePlayer[];hand:Hand;result:MultiwayOddsResult|null};
export type ShareDestination={kind:'rail';id:string}|{kind:'room';id:string}|{kind:'table';audience:'friends'|'public'};
export type ShareNotes={context:string;action:string;question:string};

export function createEquityShareDraft(players:EquitySharePlayer[],board:string,result:MultiwayOddsResult|null,source?:Hand|null):EquityShareDraft{
 if(players.length<2||players.length>5)throw Error('Choose your hand and 1 to 4 opponents before sharing.');
 const hands=players.map((player,index)=>{
  const cards=parseCards(player.cards);
  if(cards.length!==2)throw Error(`Choose two cards for ${index===0?'your hand':`Opponent ${index}`} before sharing.`);
  return {...player,cards:cards.join(' ')};
 });
 const community=parseCards(board),known=[...hands.flatMap(player=>parseCards(player.cards)),...community];
 if(![0,3,4,5].includes(community.length))throw Error('Choose 3, 4, or 5 board cards, or clear the board for preflop, before sharing.');
 if(new Set(known).size!==known.length)throw Error('A card cannot appear twice.');
 return {players:hands,result,hand:{game:'NL Hold’em',hero:hands[0].cards,board:community.join(' '),position:hands[0].position,stakes:source?.stakes||'',stack:source?.stack||'',pot:source?.pot||'',action:source?.action||'',question:source?.question||'',result:'',revealed:false}};
}

export function equityShareSummary(draft:EquityShareDraft):string{
 const {hand,players,result}=draft;
 const count=parseCards(hand.board).length,street=count===0?'Preflop':count===3?'Flop':count===4?'Turn':'River';
 return [
  `Hand history · ${hand.game} · ${street}`,
  ...[hand.stakes&&`Stakes / event: ${hand.stakes}`,hand.stack&&`Effective stack: ${hand.stack}`,hand.pot&&`Pot: ${hand.pot}`].filter(Boolean),
  ...players.map((player,index)=>`${index===0?'Your hand':`Opponent ${index}`}${player.position?` (${player.position})`:''}: ${player.cards}${result?` · ${(result.players[index].equity*100).toFixed(1)}% equity`:''}`),
  `Board: ${hand.board||'No community cards (preflop)'}`,
  result?`${result.exact?'Exact':'Estimated'} equity · ${result.trials.toLocaleString('en-US')} ${result.exact?(result.trials===1?'runout':'runouts'):'sampled runouts'}. Includes shares of tied pots.`:'Equity not calculated.',
 ].join('\n');
}

export function equityShareRequest(draft:EquityShareDraft,destination:ShareDestination,notes:ShareNotes){
 const body=[equityShareSummary(draft),notes.context.trim()].filter(Boolean).join('\n\n');
 const hand={...draft.hand,action:notes.action.trim(),question:notes.question.trim()};
 if(destination.kind==='rail'){
  const parsed=postSchema.safeParse({groupId:destination.id,kind:'hand',body,hand});
  if(!parsed.success)throw Error(parsed.error.issues[0].message);
  return {path:'/api/rail',payload:{action:'post',...parsed.data}};
 }
 const history=[body,hand.action&&`Action by street:\n${hand.action}`,hand.question&&`Question: ${hand.question}`].filter(Boolean).join('\n\n');
 if(history.length>5000)throw Error('This hand history is over 5,000 characters. Shorten the context or action before sharing.');
 return destination.kind==='room'
  ?{path:'/api/community',payload:{action:'post',roomId:destination.id,body:history}}
  :{path:'/api/table-talk',payload:{action:'post',kind:'topic',audience:destination.audience,body:history,location:''}};
}

export function equityShareUrl(destination:ShareDestination,userId:string,postId?:string){
 const query=new URLSearchParams(destination.kind==='rail'?{group:destination.id}:destination.kind==='room'?{view:'rooms',room:destination.id}:{profile:userId});
 if(postId)query.set('post',postId);
 return '/?'+query.toString();
}
