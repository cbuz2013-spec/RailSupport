'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,MoveHorizontal} from 'lucide-react';
import type {Hand} from '@/lib/types';
import {reviewDetails,reviewPlayers,STREETS} from '@/lib/hand-review';
import {handHeader,savedStreetEquity,stackLabel,streetInput,streetName,type Street} from '@/lib/hand-streets';
import {calculateMultiwayOdds,type MultiwayOddsResult} from '@/lib/odds';
import {EquityCards} from './equity-table';
import './hand-review.css';
import './hand-street-frames.css';

const results=new Map<string,MultiwayOddsResult>();
function StreetFrame({hand,street,enabled}:{hand:Hand;street:Street;enabled:boolean}){
 const input=streetInput(hand,street),saved=savedStreetEquity(hand,street),players=reviewPlayers(hand),review=reviewDetails(hand);
 const [computed,setComputed]=useState<{key:string;result:MultiwayOddsResult}|null>(null),[error,setError]=useState(''),[progress,setProgress]=useState<number|null>(null),[retry,setRetry]=useState(0);
 const result=input.reason?undefined:saved||(computed?.key===input.key?computed.result:undefined)||results.get(input.key);
 useEffect(()=>{
  if(!enabled||input.reason||saved||results.has(input.key))return;
  const controller=new AbortController();setError('');setProgress(0);
  const [hands,board]=JSON.parse(input.key) as [string[][],string];
  void calculateMultiwayOdds(hands.map(cards=>cards.join(' ')),board,{signal:controller.signal,onProgress:setProgress}).then(result=>{
   if(controller.signal.aborted)return;if(results.size>=100)results.delete(results.keys().next().value!);results.set(input.key,result);setComputed({key:input.key,result});setProgress(null);
  }).catch(err=>{if(!controller.signal.aborted){setError((err as Error).message);setProgress(null)}});
  return()=>controller.abort();
 },[enabled,input.key,input.reason,!!saved,retry]);
 const action=review.actionMode==='streets'?review.streets[street]:'';
 return <section className="street-frame" aria-label={`${streetName(street)} hand review`}>
  <header className="street-frame-title"><strong>{streetName(street)}</strong><span>{street==='preflop'?'Before the flop':input.reason.includes('not entered')?'Board incomplete':'Community cards'}</span></header>
  {street==='preflop'?<p className="street-no-board">No community cards yet</p>:<div className="street-board"><EquityCards value={input.board} count={street==='flop'?3:street==='turn'?4:5}/></div>}
  <div className="street-players">{players.map((player,index)=><div className={'street-player '+(index===0?'street-hero':'')} key={player.id}>
   <div className="street-player-name"><strong>{index===0?'Your hand':`Opponent ${index}`}</strong><span>{player.position||'Position —'}</span><small>{stackLabel(player.stack,player.stackUnit,review.bigBlind,review.blindUnit)}</small></div>
   <EquityCards value={player.cards} count={2}/><div className="street-player-equity"><strong>{result?`${(result.players[index].equity*100).toFixed(1)}%`:'—'}</strong><small>equity</small></div>
  </div>)}</div>
  {input.reason?<p className="form-hint">{input.reason}</p>:result?<p className="form-hint">{result.exact?'Exact':'Estimated'} equity · {result.trials.toLocaleString()} {result.exact?'runouts':'samples'} · includes tied pots</p>:<p className="form-hint" role={enabled?'status':undefined}>{enabled&&progress!==null?`Calculating ${streetName(street).toLowerCase()} equity… ${Math.round(progress*100)}%`:'Equity calculates when you view this street.'}</p>}
  {error&&enabled&&<p className="error" role="alert">{error} <button type="button" onClick={()=>setRetry(v=>v+1)}>Retry calculation</button></p>}
  <div className="street-action"><span>Action</span><p>{action||'No street action entered.'}</p></div>
 </section>;
}
export default function HandStreetFrames({hand}:{hand:Hand}){
 const [active,setActive]=useState(0),[visible,setVisible]=useState(false),track=useRef<HTMLDivElement>(null),root=useRef<HTMLElement>(null),review=reviewDetails(hand);
 useEffect(()=>{if(!root.current)return;const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)),{threshold:.1});observer.observe(root.current);return()=>observer.disconnect()},[]);
 function go(index:number){setActive(index);const el=track.current;if(el)el.scrollTo({left:el.clientWidth*index,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 return <section ref={root} className="hand-story" aria-label="Hand review by street">
  <header className="hand-story-header"><span className="eyebrow">{hand.game}</span><h3>{handHeader(hand)}</h3><div className="hand-situation"><div><span>Your stack</span><strong>{stackLabel(hand.stack,review.stackUnit,review.bigBlind,review.blindUnit)}</strong></div>{review.format==='tournament'&&<><div><span>Players left / total</span><strong>{review.remaining||'—'} / {review.totalPlayers||'—'}</strong></div><div><span>Level</span><strong>{review.level||'—'}</strong></div></>}{hand.pot&&<div><span>Pot</span><strong>{hand.pot}</strong></div>}</div></header>
  <div className="street-tabs" role="group" aria-label="Choose a street">{STREETS.map((street,index)=><button type="button" key={street} aria-pressed={active===index} onClick={()=>go(index)}>{streetName(street)}</button>)}</div>
  <div className="street-navigation"><button type="button" aria-label="Previous street" disabled={active===0} onClick={()=>go(active-1)}><ChevronLeft size={20}/></button><span><MoveHorizontal size={16} aria-hidden="true"/>Swipe to view streets <b>{active+1} of 4</b></span><button type="button" aria-label="Next street" disabled={active===3} onClick={()=>go(active+1)}><ChevronRight size={20}/></button></div>
  <div className="street-track" ref={track} tabIndex={0} aria-label="Swipe between hand streets" onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(Math.max(0,Math.min(3,active+(e.key==='ArrowRight'?1:-1))))}}} onScroll={()=>{const el=track.current;if(el?.clientWidth)setActive(Math.max(0,Math.min(3,Math.round(el.scrollLeft/el.clientWidth))))}}>{STREETS.map((street,index)=><StreetFrame key={street} hand={hand} street={street} enabled={visible&&index===active}/>)}</div>
  {review.actionMode==='notes'&&hand.action&&<div className="review-preview"><strong>Action notes</strong><p>{hand.action}</p></div>}
 </section>;
}
