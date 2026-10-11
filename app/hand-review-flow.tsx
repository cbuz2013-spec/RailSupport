'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Banknote,Plus,Trash2,Trophy} from 'lucide-react';
import type {Hand,HandReview} from '@/lib/types';
import {calculateMultiwayOdds} from '@/lib/odds';
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
 function changePlayer(index:number,patch:{cards?:string;position?:string;stack?:string}){
  if(index===0){const next=withReview(hand,{},patch.cards!==undefined);onChange({...next,...(patch.cards!==undefined?{hero:patch.cards}:{}),...(patch.position!==undefined?{position:patch.position}:{}),...(patch.stack!==undefined?{stack:patch.stack}:{})});}
  else update({opponents:review.opponents.map((item,i)=>i===index-1?{...item,...patch}:item)},patch.cards!==undefined);
 }
 function addOpponent(){if(review.opponents.length>=4)return;update({opponents:[...review.opponents,{cards:'',position:'',stack:''}]},true);setActive(`opponent-${review.opponents.length+1}`);}
 function removeOpponent(index:number){update({opponents:review.opponents.filter((_,i)=>i!==index-1)},true);setActive('hero');}
 async function calculate(){
  if(calculation.current)return;const controller=new AbortController();calculation.current=controller;setCalculating(true);setProgress(0);setError('');
  try{const result=await calculateMultiwayOdds(players.map(item=>item.cards),hand.board,{signal:controller.signal,onProgress:setProgress});if(!controller.signal.aborted)onChange(withReview(hand,{equity:result}));}
  catch(err){if(!controller.signal.aborted)setError((err as Error).message);}
  finally{if(calculation.current===controller){calculation.current=null;setCalculating(false);}}
 }
 function go(next:number){calculation.current?.abort();calculation.current=null;setCalculating(false);onStep(next);}
 const textField=(key:'blinds'|'ante'|'event'|'level'|'remaining',label:string,max:number,placeholder?:string)=><label className="field" key={key}>{label} (optional)<input value={review[key]} maxLength={max} placeholder={placeholder} onChange={event=>update({[key]:event.target.value})}/></label>;
 const unavailable=equityUnavailable(hand);
 return <div className="review-flow">
  <div className="review-progress" aria-label={`Step ${step+1} of ${REVIEW_STEPS.length}: ${REVIEW_STEPS[step]}`}><span>Step {step+1} of {REVIEW_STEPS.length}</span><span>{REVIEW_STEPS[step]}</span><progress max={REVIEW_STEPS.length} value={step+1} aria-label="Hand review progress"/></div>
  <h3 ref={heading} tabIndex={-1} className="review-heading">{['What were you playing?','Tell us about the game','Choose the cards you know','Compare the hands','How did the hand play out?','Review and share your hand'][step]}</h3>
  <p className="form-hint">Every detail is optional. Skip any screen; Back keeps what you entered.</p>
  <fieldset className="review-fields" disabled={busy||calculating}>
   {step===0&&<div className="review-game-options">
    <button type="button" className={review.format==='tournament'?'selected':''} aria-pressed={review.format==='tournament'} onClick={()=>{update({format:'tournament'});go(1);}}><Trophy size={32} aria-hidden="true"/><strong>Tournament</strong></button>
    <button type="button" className={review.format==='cash'?'selected':''} aria-pressed={review.format==='cash'} onClick={()=>{update({format:'cash'});go(1);}}><Banknote size={32} aria-hidden="true"/><strong>Cash Game</strong></button>
   </div>}
   {step===1&&<>
    <div className="form-grid">{textField('blinds','What are the blinds?',60,review.format==='cash'?'e.g. $1 / $3':'e.g. 500 / 1,000')}{review.format==='tournament'&&textField('ante','Ante',30,'e.g. 1,000')}</div>
    {review.format==='tournament'&&<div className="form-grid">{textField('event','Tournament name',120)}{textField('level','Level',30)}{textField('remaining','Players remaining',30)}</div>}
    {players.map((item,index)=><label key={item.id} className="field">{index===0?'Your stack':`Opponent ${index} stack`} (optional)<input value={item.stack} maxLength={30} onChange={event=>changePlayer(index,{stack:event.target.value})} placeholder={review.format==='cash'?'e.g. $300 or 100 BB':'e.g. 50,000 chips or 50 BB'}/></label>)}
    <button type="button" className="outline" disabled={review.opponents.length===4} onClick={addOpponent}><Plus size={16} aria-hidden="true"/>Add opponent</button>
    {!!hand.stakes&&<label className="field">Previous stakes / event (optional)<input value={hand.stakes} maxLength={60} onChange={event=>onChange({...hand,stakes:event.target.value})}/></label>}
   </>}
   {step===2&&<>
    <div className="review-player-tabs" role="group" aria-label="Choose a player or board">{players.map((item,index)=><button type="button" key={item.id} aria-pressed={active===item.id} onClick={()=>setActive(item.id)}>{index===0?'You':`Opponent ${index}`}<small>{item.cards||'Cards optional'}</small></button>)}<button type="button" aria-pressed={active==='board'} onClick={()=>setActive('board')}>Board<small>{hand.board||'Optional'}</small></button></div>
    <div className="equity-toolbar"><span>{review.opponents.length} of 4 opponents</span><button type="button" className="outline" disabled={review.opponents.length===4} onClick={addOpponent}><Plus size={16} aria-hidden="true"/>Add opponent</button></div>
    {active==='board'?<CardPicker label="Board (optional)" value={hand.board} maxCards={5} unavailable={players.map(item=>item.cards).join(' ')} onChange={board=>onChange({...withReview(hand,{},true),board})} hint="Select any known community cards, or leave them blank." disabled={busy}/>:player&&<>
     <div className="review-player-heading"><h4>{playerName}</h4>{activeIndex>0&&review.opponents.length>1&&<button type="button" className="equity-remove" onClick={()=>removeOpponent(activeIndex)}><Trash2 size={15} aria-hidden="true"/>Remove opponent</button>}</div>
     <label className="field">Position (optional)<select aria-label={`${playerName} position`} value={player.position} onChange={event=>changePlayer(activeIndex,{position:event.target.value})}><option value="">Not specified</option>{player.position&&!EQUITY_POSITIONS.some(item=>item.value===player.position)&&<option value={player.position}>{player.position}</option>}{EQUITY_POSITIONS.map(position=><option key={position.value} value={position.value}>{position.label} ({position.value})</option>)}</select></label>
     <CardPicker key={active} label={`${playerName} cards (optional)`} value={player.cards} maxCards={2} unavailable={[hand.board,...players.filter(item=>item.id!==active).map(item=>item.cards)].join(' ')} onChange={cards=>changePlayer(activeIndex,{cards})} hint="Tap the cards you know. Unknown cards can stay blank." disabled={busy}/>
    </>}
   </>}
   {step===3&&<>
    <EquityTable players={players} board={hand.board} active="" result={review.equity||null} disabled={busy||calculating} onSelect={id=>{setActive(id);go(2);}}/>
    {unavailable?<p className="review-info">{unavailable}</p>:<button type="button" className="primary" onClick={()=>void calculate()}>{review.equity?'Recalculate equity':'Calculate equity'}</button>}
    {review.equity&&<HandReviewSummary hand={hand} equityOnly/>}
    <p className="form-hint">Known-hand equity for completed hands. Positions and stacks do not change the calculation; ranges and side pots are not included.</p>
   </>}
   {step===4&&<>
    <div className="compose-toggle" role="group" aria-label="Action entry style"><button type="button" className={review.actionMode==='notes'?'selected':''} aria-pressed={review.actionMode==='notes'} onClick={()=>update({actionMode:'notes'})}>Quick notes</button><button type="button" className={review.actionMode==='streets'?'selected':''} aria-pressed={review.actionMode==='streets'} onClick={()=>update({actionMode:'streets'})}>Action by street</button></div>
    {review.actionMode==='notes'?<label className="field">Action notes (optional)<textarea value={review.notes} onChange={event=>update({notes:event.target.value})} rows={5} maxLength={5000} placeholder="Describe the key action or the spot you want to discuss."/></label>:<>{STREETS.map(street=><label className="field" key={street}>{street[0].toUpperCase()+street.slice(1)} action (optional)<textarea value={review.streets[street]} onChange={event=>update({streets:{...review.streets,[street]:event.target.value}})} rows={3} maxLength={1200} placeholder="e.g. UTG raises to 3 BB; button calls; big blind folds."/></label>)}<p className="form-hint">Record every action, or leave any street blank. Switching styles keeps both drafts; only the selected style appears in your post.</p></>}
    <label className="field">Pot size (optional)<input value={hand.pot} maxLength={30} onChange={event=>onChange({...hand,pot:event.target.value})}/></label>
    <label className="field">Your question (optional)<input value={hand.question} maxLength={500} onChange={event=>onChange({...hand,question:event.target.value})}/></label>
   </>}
   {step===5&&<><HandReviewSummary hand={hand}/>{hand.action&&<div className="review-preview"><strong>Action</strong><p>{hand.action}</p></div>}{hand.question&&<p><strong>Question:</strong> {hand.question}</p>}{children}</>}
  </fieldset>
  {calculating&&<div className="review-calculating"><p role="status">Calculating… {Math.round(progress*100)}%</p><button type="button" className="outline" onClick={()=>calculation.current?.abort()}>Cancel calculation</button></div>}
  {error&&<p className="error" role="alert">{error}</p>}
  <nav className="review-navigation" aria-label="Hand review steps">
   {step>0&&<button type="button" className="outline" disabled={busy} onClick={()=>go(step-1)}>Back</button>}
   {step<5&&<button type="button" className="text-link" disabled={busy} onClick={()=>go(step+1)}>Skip for now</button>}
   {step>0&&step<5&&<button type="button" className="primary" disabled={busy} onClick={()=>go(step+1)}>Continue</button>}
  </nav>
 </div>;
}
