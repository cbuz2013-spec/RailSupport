'use client';

import {useEffect,useId,useRef,useState} from 'react';
import {Club,Diamond,Heart,Spade,X} from 'lucide-react';
import './card-picker.css';

const suits=[
 {code:'s',name:'Spades',Icon:Spade,red:false},
 {code:'h',name:'Hearts',Icon:Heart,red:true},
 {code:'d',name:'Diamonds',Icon:Diamond,red:true},
 {code:'c',name:'Clubs',Icon:Club,red:false},
] as const;
const ranks=[['A','Ace'],['K','King'],['Q','Queen'],['J','Jack'],['T','10'],['9','9'],['8','8'],['7','7'],['6','6'],['5','5'],['4','4'],['3','3'],['2','2']] as const;
const deck=suits.flatMap(suit=>ranks.map(([rank])=>rank+suit.code));
function cardsIn(value:string){return value.trim().split(/\s+/).filter(Boolean).map(card=>card[0].toUpperCase()+card.slice(1).toLowerCase());}
function cardName(card:string){return `${ranks.find(([rank])=>rank===card[0])?.[1]||card[0]} of ${suits.find(suit=>suit.code===card[1])?.name.toLowerCase()||''}`;}

function CardFace({card}:{card:string}){
 const suit=suits.find(item=>item.code===card[1]);
 if(!suit)return null;
 const rank=card[0]==='T'?'10':card[0];
 return <svg className={`card-picker-image${suit.red?' is-red':''}`} viewBox="0 0 64 88" aria-hidden="true" focusable="false">
  <rect className="card-picker-paper" x="1" y="1" width="62" height="86" rx="6"/>
  <text x="7" y="22">{rank}</text>
  <suit.Icon x="6" y="26" width="12" height="12" fill="currentColor" strokeWidth="1"/>
  <suit.Icon x="22" y="31" width="29" height="29" fill="currentColor" strokeWidth="1"/>
  <g transform="rotate(180 32 44)"><text x="7" y="22">{rank}</text></g>
 </svg>;
}

type Props={label:string;value:string;onChange:(value:string)=>void;maxCards:2|5;unavailable?:string;hint?:string;disabled?:boolean};

export default function CardPicker({label,value,onChange,maxCards,unavailable='',hint,disabled=false}:Props){
 const id=useId();
 const [editingIndex,setEditingIndex]=useState<number|null>(null);
 const [announcement,setAnnouncement]=useState('');
 const picker=useRef<HTMLFieldSetElement>(null);
 const focusNext=useRef<{card?:string;slot?:number}|null>(null);
 const cards=cardsIn(value);
 const target=editingIndex!==null&&editingIndex<cards.length?editingIndex:cards.length;
 const canPick=target<maxCards;
 // Every selected card stays out of the deck, including the card being replaced.
 const blocked=new Set([...cardsIn(unavailable),...cards]);
 const available=deck.filter(card=>!blocked.has(card));

 useEffect(()=>{
  const next=focusNext.current;
  if(!next)return;
  const button=next.slot!==undefined
   ?picker.current?.querySelector<HTMLButtonElement>(`[data-slot="${next.slot}"]`)
   :picker.current?.querySelector<HTMLButtonElement>(next.card?`[data-card="${next.card}"]`:'.card-picker-option:not(:disabled)');
  button?.focus({preventScroll:true});
  focusNext.current=null;
 },[value,editingIndex]);

 function chooseCard(card:string){
  if(disabled||!canPick||blocked.has(card))return;
  const next=[...cards],replaced=next[target];next[target]=card;
  const nextCard=available[(available.indexOf(card)+1)%available.length];
  focusNext.current=next.length<maxCards?{card:nextCard}:{slot:target};
  onChange(next.join(' '));setEditingIndex(null);
  setAnnouncement(`${cardName(card)} selected.${replaced?` ${cardName(replaced)} returned to the deck.`:''} ${next.length} of ${maxCards} cards selected.`);
 }
 function removeCard(index:number){
  if(disabled)return;
  focusNext.current={card:cards[index]};onChange(cards.filter((_,position)=>position!==index).join(' '));
  setEditingIndex(null);setAnnouncement(`${cardName(cards[index])} removed and available again.`);
 }

 return <fieldset ref={picker} className="card-picker" disabled={disabled} aria-describedby={`${id}-hint ${id}-step`}>
  <legend>{label}</legend>
  <div className="card-picker-selection">
   {Array.from({length:Math.min(maxCards,cards.length+1)},(_,index)=>{
    const card=cards[index];
    return <div className="card-picker-slot" key={index}>
     <button type="button" data-slot={index} className={`card-picker-card${index===target?' is-current':''}${!card?' is-empty':''}`} aria-label={card?`Change card ${index+1}: ${cardName(card)}`:`Choose card ${index+1}`} aria-pressed={index===target} onClick={()=>{
      focusNext.current={};setEditingIndex(card?index:null);
      picker.current?.querySelector<HTMLButtonElement>('.card-picker-option:not(:disabled)')?.focus({preventScroll:true});
     }}>
      {card?<CardFace card={card}/>:<><span aria-hidden="true">+</span><small>Card {index+1}</small></>}
     </button>
     {card&&<button type="button" className="card-picker-remove" aria-label={`Remove ${cardName(card)}`} onClick={()=>removeCard(index)}><X size={14} aria-hidden="true"/></button>}
    </div>;
   })}
   {cards.length>0&&<button type="button" className="card-picker-clear" onClick={()=>{focusNext.current={};onChange('');setEditingIndex(null);setAnnouncement('All cards cleared and available again.')}}>Clear</button>}
  </div>
  <p id={`${id}-hint`} className="form-hint">{hint||`Choose ${maxCards} cards.`} Selected cards are removed from the deck.</p>
  <div className="card-picker-deck-heading">
   <p id={`${id}-step`} className="card-picker-step">{canPick?`${target<cards.length?'Replace':'Choose'} card ${target+1} · tap a card below`:'Hand complete · tap a selected card to replace it'}</p>
   <span>{available.length} / 52 available</span>
  </div>
  <div className="card-picker-deck" role="group" aria-label="Available cards">
   {suits.map(suit=>{
    const suitCards=available.filter(card=>card[1]===suit.code);
    return <div className="card-picker-suit" role="group" aria-label={suit.name} key={suit.code}>
     <div className={`card-picker-suit-label${suit.red?' is-red':''}`}><suit.Icon size={14} fill="currentColor" aria-hidden="true"/>{suit.name}</div>
     <div className="card-picker-grid">
      {suitCards.map(card=><button type="button" key={card} data-card={card} className="card-picker-option" aria-label={`Select ${cardName(card)}`} disabled={!canPick} onClick={()=>chooseCard(card)}><CardFace card={card}/></button>)}
     </div>
     {suitCards.length===0&&<p className="form-hint">All {suit.name.toLowerCase()} are selected.</p>}
    </div>;
   })}
  </div>
  <span className="card-picker-announcement" role="status">{announcement}</span>
 </fieldset>;
}
