import {hasBoardGaps,knownBoardCards,streetBoardSlots} from './hand-board';
import type {Hand,StackUnit,StreetEquities} from './types';
import {reviewDetails,reviewPlayers,STREETS} from './hand-review';
import {calculateMultiwayOdds,parseCards,type MultiwayOddsResult} from './odds';
export type Street=typeof STREETS[number];
const boardCounts={preflop:0,flop:3,turn:4,river:5};
export const streetName=(street:Street)=>street[0].toUpperCase()+street.slice(1);

export function stackInBB(stack:string,unit:StackUnit|undefined,bigBlind:string|undefined,blindUnit:StackUnit|undefined){
 const raw=stack.trim(),explicit=raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*bb$/i);
 if(explicit)return Number.isFinite(Number(explicit[1]))?Number(explicit[1]):null;
 const numeric=/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
 if(!numeric.test(raw))return null;
 const value=Number(raw.replace(/,/g,''));if(!Number.isFinite(value))return null;
 if(unit==='bb')return value;
 if(!unit||unit!==blindUnit||!bigBlind?.trim()||!numeric.test(bigBlind.trim()))return null;
 const blind=Number(bigBlind.replace(/,/g,''));return blind>0&&Number.isFinite(blind)?value/blind:null;
}
export function stackLabel(stack:string,unit:StackUnit|undefined,bigBlind?:string,blindUnit?:StackUnit){
 const bb=stackInBB(stack,unit,bigBlind,blindUnit),raw=stack.trim();
 if(!raw)return '—';
 const bbText=bb===null?'':`${bb.toLocaleString('en-US',{maximumFractionDigits:1})} BB`;
 if(unit==='chips')return `${raw} chips${bbText?' · '+bbText:''}`;
 if(unit==='currency')return `${raw} cash${bbText?' · '+bbText:''}`;
 return bbText||`${raw} · BB unknown`;
}
export function streetInput(hand:Hand,street:Street){
 let slots:string[],cards:string[],hands:string[][];
 try{slots=streetBoardSlots(hand,street);cards=parseCards(knownBoardCards(hand).join(' '));hands=reviewPlayers(hand).map(player=>parseCards(player.cards))}catch{return {board:'',slots:[],key:'',reason:'Some cards are invalid. Edit the hand to calculate equity.'}}
 const missing=slots.indexOf(''),board=(missing===-1?slots:slots.slice(0,missing)).join(' '),key=JSON.stringify([hands,board]);
 if(missing!==-1)return {board,slots,key,reason:`${streetName(street)} board not entered completely. Fill the missing cards up to this street for equity, or keep them blank.`};
 if(hands.some(cards=>cards.length!==2))return {board,slots,key,reason:'Equity unavailable: each player needs two known cards.'};
 const known=[...hands.flat(),...cards];
 if(new Set(known).size!==known.length)return {board,slots,key,reason:'A card is used more than once. Edit the hand to calculate equity.'};
 return {board,slots,key,reason:''};
}

export function savedStreetEquity(hand:Hand,street:Street):MultiwayOddsResult|undefined{
 const input=streetInput(hand,street);if(input.reason)return;
 const snapshot=hand.review?.streetEquities?.[street];
 if(snapshot?.key===input.key&&snapshot.result.players.length===reviewPlayers(hand).length)return snapshot.result;
 // The previous release saved equity only for its full entered board.
 if(hand.review?.equity&&!hasBoardGaps(hand)&&parseCards(hand.board).length===boardCounts[street]&&hand.review.equity.players.length===reviewPlayers(hand).length)return hand.review.equity;
}
export async function calculateStreetEquities(hand:Hand,options:{signal?:AbortSignal;onProgress?:(n:number)=>void}={}):Promise<StreetEquities>{
 const available=STREETS.filter(street=>!streetInput(hand,street).reason),hands=reviewPlayers(hand).map(player=>player.cards),results:StreetEquities={};
 if(!available.length)throw Error('Choose two known cards for each player to calculate equity.');
 for(const [index,street] of available.entries()){
  const input=streetInput(hand,street),result=await calculateMultiwayOdds(hands,input.board,{signal:options.signal,onProgress:p=>options.onProgress?.((index+p)/available.length)});
  results[street]={key:input.key,result};
 }
 return results;
}
export function handHeader(hand:Hand){
 const r=reviewDetails(hand);
 return [r.format==='cash'?'Cash Game':r.format==='tournament'?(r.event||'Tournament'):(r.event||'Hand review'),r.blinds||(hand.stakes||''),r.format==='tournament'&&r.ante&&`Ante ${r.ante}`].filter(Boolean).join(' · ');
}
