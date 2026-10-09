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
function cardsIn(value:string){return value.trim().split(/\s+/).filter(Boolean).map(card=>card[0].toUpperCase()+card.slice(1).toLowerCase());}
function cardName(card:string){return `${ranks.find(([rank])=>rank===card[0])?.[1]||card[0]} of ${suits.find(suit=>suit.code===card[1])?.name.toLowerCase()||''}`;}

type Props={label:string;value:string;onChange:(value:string)=>void;maxCards:2|5;unavailable?:string;hint?:string;disabled?:boolean};

export default function CardPicker({label,value,onChange,maxCards,unavailable='',hint,disabled=false}:Props){
 const id=useId();
 const [selectedSuit,setSelectedSuit]=useState<string|null>(null);
 const [editingIndex,setEditingIndex]=useState<number|null>(null);
 const [announcement,setAnnouncement]=useState('');
 const picker=useRef<HTMLFieldSetElement>(null);
 const focusNext=useRef<'suit'|'rank'|null>(null);
 const cards=cardsIn(value);
 const target=editingIndex!==null&&editingIndex<cards.length?editingIndex:cards.length;
 const canPick=target<maxCards;
 const blocked=new Set([...cardsIn(unavailable),...cards.filter((_,index)=>index!==target)]);
 const suit=suits.find(item=>item.code===selectedSuit);

 useEffect(()=>{
  if(!focusNext.current)return;
  const selector=focusNext.current==='rank'?'.card-picker-ranks button:not(:disabled)':'.card-picker-suits button';
  (picker.current?.querySelector<HTMLButtonElement>(selector)||picker.current?.querySelector<HTMLButtonElement>('.card-picker-card'))?.focus();
  focusNext.current=null;
 },[value,selectedSuit,editingIndex]);

 function chooseCard(card:string){
  if(disabled||!canPick||blocked.has(card))return;
  const next=[...cards];next[target]=card;
  focusNext.current='suit';onChange(next.join(' '));setSelectedSuit(null);setEditingIndex(null);
  setAnnouncement(`${cardName(card)} selected. ${next.length} of ${maxCards} cards selected.`);
 }
 function removeCard(index:number){
  focusNext.current='suit';onChange(cards.filter((_,position)=>position!==index).join(' '));
  setEditingIndex(null);setSelectedSuit(null);setAnnouncement(`${cardName(cards[index])} removed.`);
 }

 return <fieldset ref={picker} className="card-picker" disabled={disabled} aria-describedby={`${id}-hint`}>
  <legend>{label}</legend>
  <div className="card-picker-selection">
   {Array.from({length:Math.min(maxCards,cards.length+1)},(_,index)=>{
    const card=cards[index],cardSuit=card?suits.find(item=>item.code===card[1]):undefined;
    return <div className="card-picker-slot" key={index}>
     <button type="button" className={`card-picker-card${cardSuit?.red?' is-red':''}${index===target?' is-current':''}${!card?' is-empty':''}`} aria-label={card?`Change card ${index+1}: ${cardName(card)}`:`Choose card ${index+1}`} aria-pressed={index===target} onClick={()=>{focusNext.current='suit';setEditingIndex(card?index:null);setSelectedSuit(null);picker.current?.querySelector<HTMLButtonElement>('.card-picker-suits button')?.focus()}}>
      {card&&cardSuit?<><b>{card[0]==='T'?'10':card[0]}</b><cardSuit.Icon size={22} fill="currentColor" aria-hidden="true"/></>:<><span aria-hidden="true">+</span><small>Card {index+1}</small></>}
     </button>
     {card&&<button type="button" className="card-picker-remove" aria-label={`Remove ${cardName(card)}`} onClick={()=>removeCard(index)}><X size={14} aria-hidden="true"/></button>}
    </div>;
   })}
   {cards.length>0&&<button type="button" className="card-picker-clear" onClick={()=>{focusNext.current='suit';onChange('');setEditingIndex(null);setSelectedSuit(null);setAnnouncement('All cards cleared.')}}>Clear</button>}
  </div>
  <p id={`${id}-hint`} className="form-hint">{hint||`Choose ${maxCards} cards.`}</p>
  {canPick?<div className="card-picker-controls">
   <p className="card-picker-step">{target<cards.length?`Change card ${target+1}`:`Card ${target+1}`} · {suit?'Choose a value':'Choose a suit'}</p>
   <div className="card-picker-suits" role="group" aria-label="Card suit">
    {suits.map(({code,name,Icon,red})=><button key={code} type="button" className={`${red?'is-red ':''}${selectedSuit===code?'is-selected':''}`} aria-label={name} aria-pressed={selectedSuit===code} aria-expanded={selectedSuit===code} aria-controls={`${id}-ranks`} onClick={()=>{focusNext.current='rank';setSelectedSuit(code);if(selectedSuit===code)picker.current?.querySelector<HTMLButtonElement>('.card-picker-ranks button:not(:disabled)')?.focus()}}><Icon size={30} fill="currentColor" aria-hidden="true"/><span>{name}</span></button>)}
   </div>
   <div id={`${id}-ranks`}>
    {suit&&<div className="card-picker-ranks" role="group" aria-label={`${suit.name} values`}>
     {ranks.map(([rank,name])=>{
      const card=rank+suit.code,used=blocked.has(card);
      return <button key={rank} type="button" className={suit.red?'is-red':''} disabled={used} aria-label={`${name} of ${suit.name.toLowerCase()}${used?' — already selected':''}`} title={used?'Already selected in this hand':undefined} onClick={()=>chooseCard(card)}><b>{rank==='T'?'10':rank}</b><suit.Icon size={17} fill="currentColor" aria-hidden="true"/></button>;
     })}
    </div>}
   </div>
  </div>:<p className="form-hint">Tap a card to change it, or × to remove it.</p>}
  <span className="card-picker-announcement" role="status">{announcement}</span>
 </fieldset>;
}
