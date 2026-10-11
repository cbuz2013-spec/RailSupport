import type {ReactNode} from 'react';
import type {MultiwayOddsResult} from '@/lib/odds';
import {equitySeats} from '@/lib/equity-seats';

export type EquityPlayer={id:string;cards:string;position:string;stackLabel?:string};
const suits:Record<string,string>={s:'♠',h:'♥',d:'♦',c:'♣'};
const suitNames:Record<string,string>={s:'spades',h:'hearts',d:'diamonds',c:'clubs'};
const rankNames:Record<string,string>={A:'Ace',K:'King',Q:'Queen',J:'Jack',T:'10'};

export function EquityCards({value,count,slots}:{value:string;count:2|3|4|5;slots?:string[]}){
 const cards=slots??value.trim().split(/\s+/).filter(Boolean);
 return <span className="equity-cards">{Array.from({length:count},(_,index)=>{
  const card=cards[index],rank=card?.[0].toUpperCase(),suit=card?.[1]?.toLowerCase();
  return <span key={index} className={`equity-mini-card${!card?' is-hidden':/[hd]/.test(suit||'')?' is-red':''}`} aria-label={card?`${rankNames[rank]||rank} of ${suitNames[suit]}`:'Card not selected'}><b aria-hidden="true">{card?(rank==='T'?'10':rank):'?'}</b><span aria-hidden="true">{card?suits[suit]:'♠'}</span></span>;
 })}</span>;
}

export default function EquityTable({players,board,active,result,disabled,onSelect,readOnly=false,center,boardSlots}:{players:EquityPlayer[];board:string;active:string;result:MultiwayOddsResult|null;disabled:boolean;onSelect:(id:string)=>void;readOnly?:boolean;center?:ReactNode;boardSlots?:string[]}){
 return <div className={`equity-table players-${players.length}`} role="group" aria-label="Poker table">
  <div className="equity-felt" aria-hidden="true"/>
  {equitySeats(players).map(({player,index,slot})=>{
   const name=index===0?(readOnly?'Hero':'You'):`Opponent ${index}`;
   return <button type="button" key={player.id} className={`equity-seat seat-${slot===0?'hero':slot}${active===player.id?' is-active':''}`} disabled={disabled} tabIndex={readOnly?-1:0} aria-pressed={active===player.id} aria-label={`${readOnly?'':'Edit '}${name}${player.position?`, ${player.position}`:''}`} onClick={()=>{if(!readOnly)onSelect(player.id)}}>
    <span className="equity-seat-name">{name}</span><span className="equity-seat-position">{player.position||'Position —'}</span><EquityCards value={player.cards} count={2}/><strong className="equity-seat-value">{result?`${(result.players[index].equity*100).toFixed(1)}%`:'—'}</strong><small>equity</small>{player.stackLabel&&<span className="equity-seat-stack">{player.stackLabel}</span>}
   </button>;
  })}
  <button type="button" className={`equity-board${active==='board'?' is-active':''}`} disabled={disabled} tabIndex={readOnly?-1:0} aria-label={readOnly?'Community cards':'Edit community cards'} aria-pressed={active==='board'} onClick={()=>{if(!readOnly)onSelect('board')}}>{center}<span>{boardSlots?.length||board.trim()?'Community cards':readOnly?'Preflop':'Preflop · tap to add board'}</span><EquityCards value={board} slots={boardSlots} count={5}/></button>
 </div>;
}
