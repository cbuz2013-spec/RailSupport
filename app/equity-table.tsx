import type {MultiwayOddsResult} from '@/lib/odds';
import {equitySeats} from '@/lib/equity-seats';

export type EquityPlayer={id:string;cards:string;position:string};
const suits:Record<string,string>={s:'♠',h:'♥',d:'♦',c:'♣'};
const suitNames:Record<string,string>={s:'spades',h:'hearts',d:'diamonds',c:'clubs'};
const rankNames:Record<string,string>={A:'Ace',K:'King',Q:'Queen',J:'Jack',T:'10'};

export function EquityCards({value,count}:{value:string;count:2|5}){
 const cards=value.trim().split(/\s+/).filter(Boolean);
 return <span className="equity-cards">{Array.from({length:count},(_,index)=>{
  const card=cards[index],rank=card?.[0].toUpperCase(),suit=card?.[1]?.toLowerCase();
  return <span key={index} className={`equity-mini-card${!card?' is-hidden':/[hd]/.test(suit||'')?' is-red':''}`} aria-label={card?`${rankNames[rank]||rank} of ${suitNames[suit]}`:'Card not selected'}><b aria-hidden="true">{card?(rank==='T'?'10':rank):'?'}</b><span aria-hidden="true">{card?suits[suit]:'♠'}</span></span>;
 })}</span>;
}

export default function EquityTable({players,board,active,result,disabled,onSelect}:{players:EquityPlayer[];board:string;active:string;result:MultiwayOddsResult|null;disabled:boolean;onSelect:(id:string)=>void}){
 return <div className={`equity-table players-${players.length}`} role="group" aria-label="Poker table">
  <div className="equity-felt" aria-hidden="true"/>
  {equitySeats(players).map(({player,index,slot})=>{
   const name=index===0?'You':`Opponent ${index}`;
   return <button type="button" key={player.id} className={`equity-seat seat-${slot===0?'hero':slot}${active===player.id?' is-active':''}`} disabled={disabled} aria-pressed={active===player.id} aria-label={`Edit ${name}${player.position?`, ${player.position}`:''}`} onClick={()=>onSelect(player.id)}>
    <span className="equity-seat-name">{name}</span><span className="equity-seat-position">{player.position||'Position —'}</span><EquityCards value={player.cards} count={2}/><strong className="equity-seat-value">{result?`${(result.players[index].equity*100).toFixed(1)}%`:'—'}</strong><small>equity</small>
   </button>;
  })}
  <button type="button" className={`equity-board${active==='board'?' is-active':''}`} disabled={disabled} aria-label="Edit community cards" aria-pressed={active==='board'} onClick={()=>onSelect('board')}><span>{board.trim()?'Community cards':'Preflop · tap to add board'}</span><EquityCards value={board} count={5}/></button>
 </div>;
}
