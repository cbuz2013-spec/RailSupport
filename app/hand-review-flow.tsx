'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Banknote,Plus,Trash2,Trophy} from 'lucide-react';
import type {Hand,HandReview,StackUnit} from '@/lib/types';
import {calculateStreetEquities,stackLabel} from '@/lib/hand-streets';
import {EQUITY_POSITIONS} from '@/lib/equity-seats';
import {equityUnavailable,reviewDetails,reviewPlayers,REVIEW_STEPS,STREETS,withReview} from '@/lib/hand-review';
import CardPicker from './card-picker';
import EquityTable from './equity-table';
import HandReviewSummary from './hand-review-summary';
import './odds-panel.css';
import './hand-review.css';

export default function HandReviewFlow({hand,onChange,step,onStep,busy,children}:{hand:Hand;onChange:(hand:Hand)=>void;step:number;onStep:(step:number)=>void;busy:boolean;children:ReactNode}){
 const review=reviewDetails(hand),players=reviewPlayers(hand);
 const [active,setActive]=useState('hero'),[calculating,setCalculating]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState('');
 const heading=useRef<HTMLHeadingElement>(null),calculation=useRef<AbortController|null>(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'nearest'});setError('');return()=>{calculation.current?.abort();calculation.current=null;};},[step]);
 const activeIndex=players.findIndex(player=>player.id===active),player=players[activeIndex];
 const playerName=active==='hero'?'Your hand':`Opponent ${activeIndex}`;
 function update(patch:Partial<HandReview>,clearEquity=false){onChange(withReview(hand,patch,clearEquity));setError('');}
 function changePlayer(index:number,patch:{cards?:string;position?:string;stack?:string;stackUnit?:StackUnit}){
  if(index===0){const next=withReview(hand,patch.stackUnit!==undefined?{stackUnit:patch.stackUnit}:{},patch.cards!==undefined);onChange({...next,...(patch.cards!==undefined?{hero:patch.cards}:{}),...(patch.position!==undefined?{position:patch.position}:{}),...(patch.stack!==undefined?{stack:patch.stack}:{})});}
  else update({opponents:review.opponents.map((item,i)=>i===index-1?{...item,...patch}:item)},patch.cards!==undefined);
 }
 function addOpponent(){if(review.opponents.length>=4)return;update({opponents:[...review.opponents,{cards:'',position:'',stack:''}]},true);setActive(`opponent-${review.opponents.length+1}`);}
 function removeOpponent(index:number){update({opponents:review.opponents.filter((_,i)=>i!==index-1)},true);setActive('hero');}
 async function calculate(){
  if(calculation.current)return;const controller=new AbortController();calculation.current=controller;setCalculating(true);setProgress(0);setError('');
  try{const streetEquities=await calculateStreetEquities(hand,{signal:controller.signal,onProgress:setProgress});const street=hand.board.trim().split(/\s+/).filter(Boolean).length;const equity=streetEquities[street===5?'river':street===4?'turn':street===3?'flop':'preflop']?.result;if(!controller.signal.aborted)onChange(withReview(hand,{equity,streetEquities}));}
  catch(err){if(!controller.signal.aborted)setError((err as Error).message);}
  finally{if(calculation.current===controller){calculation.current=null;setCalculating(false);}}
 }
 function go(next:number){calculation.current?.abort();calculation.current=null;setCalculating(false);onStep(next);}
 const textField=(key:'blinds'|'ante'|'event'|'level'|'remaining'|'totalPlayers'|'bigBlind'|'location'|'startingStack'|'buyIn'|'guarantee',label:string,max:number,placeholder?:string)=><label className="field" key={key}>{label} (optional)<input value={review[key]||''} maxLength={max} placeholder={placeholder} onChange={event=>update({[key]:event.target.value})}/></label>;
 const unavailable=equityUnavailable(hand);
 return <div className={"review-flow review-step-"+step}>
  <div className="review-progress" aria-label={`Step ${step+1} of ${REVIEW_STEPS.length}: ${REVIEW_STEPS[step]}`}><span>Step {step+1} of {REVIEW_STEPS.length}</span><span>{REVIEW_STEPS[step]}</span><progress max={REVIEW_STEPS.length} value={step+1} aria-label="Hand review progress"/></div>
  <h3 ref={heading} tabIndex={-1} className="review-heading">{['What were you playing?','Where were you playing?','Where were you in the game?','Your hand and opponents','The community cards','Action on the flop','Action on the turn','Action on the river','Context and photos','Review and share your hand'][step]}</h3>
  <p className="form-hint">Every detail is optional. Skip any screen; Back keeps what you entered.</p>
  <fieldset className="review-fields" disabled={busy||calculating}>
   {step===0&&<div className="review-game-options">
    <button type="button" className={review.format==='tournament'?'selected':''} aria-pressed={review.format==='tournament'} onClick={()=>{update({format:'tournament',blindUnit:review.blindUnit||'chips'});go(1);}}><Trophy size={32} aria-hidden="true"/><strong>Tournament</strong></button>
    <button type="button" className={review.format==='cash'?'selected':''} aria-pressed={review.format==='cash'} onClick={()=>{update({format:'cash',blindUnit:review.blindUnit||'currency'});go(1);}}><Banknote size={32} aria-hidden="true"/><strong>Cash Game</strong></button>
   </div>}
   {step===1&&<div className="form-grid">{review.format!=='cash'&&textField('event','Tournament name',120)}{textField('location','Location',120)}{review.format!=='cash'?textField('startingStack','Tournament starting stack',30):<>{textField('blinds','Stakes',60)}{textField('buyIn','Buy-in',30)}</>}</div>}
   {step===2&&<>
    <div className="form-grid">{textField('blinds','Blinds',60)}{review.format==='tournament'&&<>{textField('ante','Ante',30)}{textField('level','Level',30)}{textField('remaining','Players remaining',30)}{textField('totalPlayers','Players who started',30)}</>}</div>
    <label className="field">Your current stack in big blinds (optional)<input value={hand.stack} maxLength={30} placeholder="e.g. 45" onChange={e=>changePlayer(0,{stack:e.target.value,stackUnit:'bb'})}/></label>
    <details><summary>Stack units and conversion</summary><label className="field">Your stack unit<select value={review.stackUnit||''} onChange={e=>update({stackUnit:e.target.value as StackUnit})}><option value="">Not specified</option><option value="bb">Big blinds</option><option value="chips">Chips</option><option value="currency">Cash amount</option></select></label>{textField('bigBlind','Big blind amount',30)}<label className="field">Big blind unit<select value={review.blindUnit||''} onChange={e=>update({blindUnit:e.target.value as StackUnit})}><option value="">Not specified</option><option value="chips">Chips</option><option value="currency">Cash amount</option></select></label></details>
   </>}
   {step===3&&<>
    <div className="review-player-tabs" role="group" aria-label="Choose a player or board">{players.map((item,index)=><button type="button" key={item.id} aria-pressed={active===item.id} onClick={()=>setActive(item.id)}>{index===0?'You':`Opponent ${index}`}<small>{item.cards||'Cards optional'}</small></button>)}</div>
    <div className="equity-toolbar"><span>{review.opponents.length} of 4 opponents</span><button type="button" className="outline" disabled={review.opponents.length===4} onClick={addOpponent}><Plus size={16} aria-hidden="true"/>Add opponent</button></div>
    {active==='board'?<CardPicker label="Board (optional)" value={hand.board} maxCards={5} unavailable={players.map(item=>item.cards).join(' ')} onChange={board=>onChange({...withReview(hand,{},true),board})} hint="Select any known community cards, or leave them blank." disabled={busy}/>:player&&<>
     <div className="review-player-heading"><h4>{playerName}</h4>{activeIndex>0&&review.opponents.length>1&&<button type="button" className="equity-remove" onClick={()=>removeOpponent(activeIndex)}><Trash2 size={15} aria-hidden="true"/>Remove opponent</button>}</div>
     <label className="field">Position (optional)<select aria-label={`${playerName} position`} value={player.position} onChange={event=>changePlayer(activeIndex,{position:event.target.value})}><option value="">Not specified</option>{player.position&&!EQUITY_POSITIONS.some(item=>item.value===player.position)&&<option value={player.position}>{player.position}</option>}{EQUITY_POSITIONS.map(position=><option key={position.value} value={position.value}>{position.label} ({position.value})</option>)}</select></label>
     <div className="stack-entry"><label className="field">{playerName} stack (optional)<input value={player.stack} maxLength={30} placeholder="e.g. 45" onChange={e=>changePlayer(activeIndex,{stack:e.target.value,stackUnit:player.stackUnit||'bb'})}/></label><label className="field">Stack unit<select value={player.stackUnit||''} onChange={e=>changePlayer(activeIndex,{stackUnit:e.target.value as StackUnit})}><option value="">Not specified</option><option value="bb">Big blinds</option><option value="chips">Chips</option><option value="currency">Cash amount</option></select></label></div>
     <CardPicker key={active} label={`${playerName} cards (optional)`} value={player.cards} maxCards={2} unavailable={[hand.board,...players.filter(item=>item.id!==active).map(item=>item.cards)].join(' ')} onChange={cards=>changePlayer(activeIndex,{cards})} hint="Tap the cards you know. Unknown cards can stay blank." disabled={busy}/>
    </>}
   </>}
   {step===4&&<><CardPicker label="Flop, turn and river (optional)" value={hand.board} maxCards={5} unavailable={players.map(p=>p.cards).join(' ')} onChange={board=>onChange({...withReview(hand,{},true),board})} hint="Cards 1–3 are the flop, card 4 is the turn and card 5 is the river. Leave future streets blank."/><details><summary>Preflop action (optional)</summary><textarea aria-label="Preflop action" value={review.streets.preflop} rows={4} maxLength={1200} onChange={e=>update({actionMode:'streets',streets:{...review.streets,preflop:e.target.value}})}/></details></>}
   {step>=5&&step<=7&&<label className="field">{['Flop','Turn','River'][step-5]} action (optional)<textarea rows={6} maxLength={1200} value={review.streets[STREETS[step-4]]} onChange={e=>update({actionMode:'streets',streets:{...review.streets,[STREETS[step-4]]:e.target.value}})} placeholder="Record each action, or add a short description of what happened."/></label>}
   {step===8&&<><label className="field">Additional action notes (optional)<textarea value={review.notes} onChange={e=>update({notes:e.target.value})} rows={4} maxLength={5000}/></label><label className="field">Pot size (optional)<input value={hand.pot} maxLength={30} onChange={e=>onChange({...hand,pot:e.target.value})}/></label><label className="field">Your question (optional)<input value={hand.question} maxLength={500} onChange={e=>onChange({...hand,question:e.target.value})}/></label>{children}</>}
   {step===9&&<><HandReviewSummary hand={hand}/>{hand.question&&<p><strong>Question:</strong> {hand.question}</p>}{children}</>}
  </fieldset>
  {calculating&&<div className="review-calculating"><p role="status">Calculating… {Math.round(progress*100)}%</p><button type="button" className="outline" onClick={()=>calculation.current?.abort()}>Cancel calculation</button></div>}
  {error&&<p className="error" role="alert">{error}</p>}
  <nav className="review-navigation" aria-label="Hand review steps">
   {step>0&&<button type="button" className="outline" disabled={busy} onClick={()=>go(step-1)}>Back</button>}
   {step<9&&<button type="button" className="text-link" disabled={busy} onClick={()=>go(step+1)}>Skip for now</button>}
   {step>0&&step<9&&<button type="button" className="primary" disabled={busy} onClick={()=>go(step+1)}>Continue</button>}
  </nav>
 </div>;
}
