'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Banknote,Plus,Trash2,Trophy} from 'lucide-react';
import type {Hand,HandReview,StackUnit} from '@/lib/types';
import {EQUITY_POSITIONS} from '@/lib/equity-seats';
import {reviewDetails,reviewPlayers,REVIEW_STEPS,REVIEW_SHARE_STEP,REVIEW_CONTEXT_STEP,STREETS,withReview,withStreetBoard} from '@/lib/hand-review';
import {knownBoardCards,reviewBoard,streetBoardSlots} from '@/lib/hand-board';
import {EquityCards} from './equity-table';
import CardPicker from './card-picker';
import HandReviewSummary from './hand-review-summary';
import HandActionEditor from './hand-action-editor';
import './odds-panel.css';
import './hand-review.css';

export default function HandReviewFlow({hand,onChange,step,onStep,busy,children}:{hand:Hand;onChange:(hand:Hand)=>void;step:number;onStep:(step:number)=>void;busy:boolean;children:ReactNode}){
 const review=reviewDetails(hand),players=reviewPlayers(hand),board=reviewBoard(hand);
 const boardStreet=step>=4&&step<=6?STREETS[step-3] as 'flop'|'turn'|'river':null;
 const [active,setActive]=useState('hero');
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'nearest'});},[step]);
 const activeIndex=players.findIndex(player=>player.id===active),player=players[activeIndex];
 const playerName=active==='hero'?'Your hand':`Opponent ${activeIndex}`;
 function update(patch:Partial<HandReview>,clearEquity=false){onChange(withReview(hand,patch,clearEquity));}
 function changePlayer(index:number,patch:{cards?:string;position?:string;stack?:string;stackUnit?:StackUnit}){
  if(index===0){const next=withReview(hand,patch.stackUnit!==undefined?{stackUnit:patch.stackUnit}:{},patch.cards!==undefined);onChange({...next,...(patch.cards!==undefined?{hero:patch.cards}:{}),...(patch.position!==undefined?{position:patch.position}:{}),...(patch.stack!==undefined?{stack:patch.stack}:{})});}
  else update({opponents:review.opponents.map((item,i)=>i===index-1?{...item,...patch}:item)},patch.cards!==undefined);
 }
 function addOpponent(){if(review.opponents.length>=4)return;update({headsUp:false,opponents:[...review.opponents,{cards:'',position:'',stack:''}]},true);setActive(`opponent-${review.opponents.length+1}`);}
 function removeOpponent(index:number){update({opponents:review.opponents.filter((_,i)=>i!==index-1)},true);setActive('hero');}
 function go(next:number){onStep(next);}
 const textField=(key:'blinds'|'ante'|'event'|'level'|'remaining'|'totalPlayers'|'bigBlind'|'location'|'startingStack'|'buyIn'|'guarantee',label:string,max:number,placeholder?:string)=><label className="field" key={key}>{label} (optional)<input value={review[key]||''} maxLength={max} placeholder={placeholder} onChange={event=>update({[key]:event.target.value})}/></label>;
 return <div className={"review-flow review-step-"+step+(step===REVIEW_CONTEXT_STEP?" review-context-step":"")}>
  <div className="review-progress" aria-label={`Step ${step+1} of ${REVIEW_STEPS.length}: ${REVIEW_STEPS[step]}`}><span>Step {step+1} of {REVIEW_STEPS.length}</span><span>{REVIEW_STEPS[step]}</span><progress max={REVIEW_STEPS.length} value={step+1} aria-label="Hand review progress"/></div>
  <h3 ref={heading} tabIndex={-1} className="review-heading">{['What were you playing?','Where were you playing?','Where were you in the game?','Preflop: hands and action','Flop: cards and action','Turn: card and action','River: card and action','Context and photos','Review and share your hand'][step]}</h3>
  <p className="form-hint">Every detail is optional. Skip any screen; Back keeps what you entered.</p>
  <fieldset className="review-fields" disabled={busy}>
   {step===0&&<div className="review-game-options">
    <button type="button" className={review.format==='tournament'?'selected':''} aria-pressed={review.format==='tournament'} onClick={()=>{update({format:'tournament',blindUnit:review.blindUnit||'chips'});go(1);}}><Trophy size={32} aria-hidden="true"/><strong>Tournament</strong></button>
    <button type="button" className={review.format==='cash'?'selected':''} aria-pressed={review.format==='cash'} onClick={()=>{update({format:'cash',blindUnit:review.blindUnit||'currency'});go(1);}}><Banknote size={32} aria-hidden="true"/><strong>Cash Game</strong></button>
   </div>}
   {step===1&&<div className="form-grid">{review.format!=='cash'&&textField('event','Tournament name',120)}{textField('location','Location',120)}{review.format!=='cash'?textField('startingStack','Tournament starting stack',30):<>{textField('blinds','Stakes',60)}{textField('buyIn','Buy-in',30)}</>}</div>}
   {step===2&&<>
    <div className="form-grid">{textField('blinds','Blinds',60)}{review.format==='tournament'&&<>{textField('ante','Ante',30)}{textField('level','Level',30)}{textField('remaining','Players remaining',30)}{textField('totalPlayers','Players who started',30)}</>}</div>
    <div className="stack-entry"><label className="field">Your current stack (optional)<input value={hand.stack} maxLength={30} inputMode="decimal" placeholder={review.stackUnit==='chips'?'e.g. 45,000':'e.g. 45'} onChange={e=>changePlayer(0,{stack:e.target.value,stackUnit:review.stackUnit||'bb'})}/></label><label className="field">Your stack unit<select value={review.stackUnit||(hand.stack?'':'bb')} onChange={e=>changePlayer(0,{stackUnit:e.target.value as StackUnit})}>{hand.stack&&!review.stackUnit&&<option value="">Choose units</option>}{review.stackUnit==='currency'&&<option value="currency">Cash amount (saved)</option>}<option value="chips">Chips</option><option value="bb">Big blinds</option></select></label></div>
   </>}
   {step===3&&<>
    <div className="review-player-tabs" role="group" aria-label="Choose a player">{players.map((item,index)=><button type="button" key={item.id} aria-pressed={active===item.id} onClick={()=>setActive(item.id)}>{index===0?'You':`Opponent ${index}`}<small>{item.cards||'Cards optional'}</small></button>)}</div>
    {players.length===2&&<label className="action-all-in"><input type="checkbox" checked={review.headsUp||false} onChange={e=>update({headsUp:e.target.checked})}/>Heads-up table (only two players were dealt in)</label>}
    <div className="equity-toolbar"><span>{review.opponents.length} of 4 opponents</span><button type="button" className="outline" disabled={review.opponents.length===4} onClick={addOpponent}><Plus size={16} aria-hidden="true"/>Add opponent</button></div>
    {player&&<>
     <div className="review-player-heading"><h4>{playerName}</h4>{activeIndex>0&&review.opponents.length>1&&<button type="button" className="equity-remove" onClick={()=>removeOpponent(activeIndex)}><Trash2 size={15} aria-hidden="true"/>Remove opponent</button>}</div>
     <label className="field">Position (optional)<select aria-label={`${playerName} position`} value={player.position} onChange={event=>changePlayer(activeIndex,{position:event.target.value})}><option value="">Not specified</option>{player.position&&!EQUITY_POSITIONS.some(item=>item.value===player.position)&&<option value={player.position}>{player.position}</option>}{EQUITY_POSITIONS.map(position=><option key={position.value} value={position.value}>{position.label} ({position.value})</option>)}</select></label>
     {activeIndex>0&&<div className="stack-entry"><label className="field">{playerName} stack (optional)<input value={player.stack} maxLength={30} placeholder="e.g. 45" onChange={e=>changePlayer(activeIndex,{stack:e.target.value,stackUnit:player.stackUnit||'bb'})}/></label><label className="field">Stack unit<select value={player.stackUnit||''} onChange={e=>changePlayer(activeIndex,{stackUnit:e.target.value as StackUnit})}><option value="">Not specified</option><option value="bb">Big blinds</option><option value="chips">Chips</option><option value="currency">Cash amount</option></select></label></div>}
     <CardPicker key={active} label={`${playerName} cards (optional)`} value={player.cards} maxCards={2} unavailable={[knownBoardCards(hand).join(' '),...players.filter(item=>item.id!==active).map(item=>item.cards)].join(' ')} onChange={cards=>changePlayer(activeIndex,{cards})} hint="Tap the cards you know. Unknown cards can stay blank." disabled={busy}/>
    </>}
    <HandActionEditor hand={hand} street="preflop" onChange={update}/>
   </>}
   {boardStreet&&<>
    {boardStreet!=='flop'&&<div className="review-board-context"><span>Board before the {boardStreet}</span><EquityCards value="" slots={streetBoardSlots(hand,boardStreet==='turn'?'flop':'turn')} count={boardStreet==='turn'?3:4}/></div>}
    <CardPicker key={boardStreet} label={`${boardStreet==='flop'?'Flop cards':boardStreet==='turn'?'Turn card':'River card'} (optional)`} value={board[boardStreet]} maxCards={boardStreet==='flop'?3:1} unavailable={[...players.map(p=>p.cards),...(['flop','turn','river'] as const).filter(street=>street!==boardStreet).map(street=>board[street])].join(' ')} onChange={value=>onChange(withStreetBoard(hand,boardStreet,value))} hint={boardStreet==='flop'?'Choose up to three flop cards, then record the flop action below.':'Choose this street’s card, then record its action below. Earlier cards can stay blank.'} disabled={busy}/>
    <HandActionEditor key={boardStreet} hand={hand} street={boardStreet} onChange={update}/>
   </>}
   {step===REVIEW_CONTEXT_STEP&&<><label className="field">Additional action notes (optional)<textarea value={review.notes} onChange={e=>update({notes:e.target.value})} rows={4} maxLength={5000}/></label><label className="field">Pot size (optional)<input value={hand.pot} maxLength={30} onChange={e=>onChange({...hand,pot:e.target.value})}/></label><label className="field">Your question (optional)<input value={hand.question} maxLength={500} onChange={e=>onChange({...hand,question:e.target.value})}/></label>{children}</>}
   {step===REVIEW_SHARE_STEP&&<><HandReviewSummary hand={hand}/>{hand.question&&<p><strong>Question:</strong> {hand.question}</p>}{children}</>}
  </fieldset>
  <nav className="review-navigation" aria-label="Hand review steps">
   {step>0&&<button type="button" className="outline" disabled={busy} onClick={()=>go(step-1)}>Back</button>}
   {step<REVIEW_SHARE_STEP&&<button type="button" className="text-link" disabled={busy} onClick={()=>go(step+1)}>Skip for now</button>}
   {step>0&&step<REVIEW_SHARE_STEP&&<button type="button" className="primary" disabled={busy} onClick={()=>go(step+1)}>Continue</button>}
  </nav>
 </div>;
}
