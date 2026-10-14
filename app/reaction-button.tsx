'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {activityRequest} from './activity-client';
import {Heart,X} from 'lucide-react';
import PokerReactionIcon from './poker-reaction-icon';
import {REACTIONS,type Reaction,type ReactionCounts} from '@/lib/reactions';

function ReactionIcon({value}:{value:Reaction}){
 if(['all_in','muck_that','slow_roll','chip_shuffle','tank'].includes(value))return <PokerReactionIcon value={value}/>;
 if(value==='nice_hand')return <svg className="reaction-hoodie" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 37c0-12 1-31 15-33 14 2 15 21 15 33Z" fill="#173d32" stroke="#8bd5b0" strokeWidth="2"/><path d="M12 24c-2-13 18-13 16 0l-4 8h-8Z" fill="#f0c79d"/><path d="M11 18q9-7 18 0l-1 7-7-1-1-3-1 3-7 1Z" fill="#101e1a"/><path d="M17 28q3 2 6 0" fill="none" stroke="#723e2e" strokeWidth="1.5"/><path d="m12 32-3 5m19-5 3 5" stroke="#8bd5b0" strokeWidth="2"/></svg>;
 if(value==='so_sick')return <span className="reaction-sick" aria-hidden="true"><b>So sick</b><span>🤢</span></span>;
 if(value==='heart')return <Heart size={18} fill="currentColor" aria-hidden="true"/>;
 return <span className="reaction-emoji" aria-hidden="true">{REACTIONS.find(r=>r.id===value)?.emoji}</span>;
}
export default function ReactionButton({value,counts={},disabled=false,onChange,context}:{value?:Reaction|null;counts?:ReactionCounts;disabled?:boolean;onChange:(value:Reaction|null)=>Promise<boolean>;context?:Record<string,string>}){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
 const [people,setPeople]=useState<{id:string;name:string;reaction:Reaction}[]|null>(null),[peopleError,setPeopleError]=useState(''),[next,setNext]=useState<number|null>(null);
 async function who(offset=0){if(!context)return;setPeopleError('');try{const d=await activityRequest<{people:{id:string;name:string;reaction:Reaction}[];nextOffset:number|null}>(undefined,{reactions:'1',...context,offset:String(offset)});setPeople(old=>offset?[...(old||[]),...d.people]:d.people);setNext(d.nextOffset)}catch(e){setPeopleError((e as Error).message)}}
 const total=Object.values(counts).reduce((a,b)=>a+(b||0),0);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[open]);
 async function choose(next:Reaction|null){if(await onChange(next)){setOpen(false);setPeople(null);trigger.current?.focus()}}
 return <div className="reaction-control" ref={root} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setOpen(false);setPeople(null);trigger.current?.focus()}}}>
  <button type="button" ref={trigger} className={'social-action '+(value?'is-active':'')} aria-label={`Reaction${value?': '+REACTIONS.find(r=>r.id===value)?.label:''}${total?', '+total+' total':''}`} aria-expanded={open} aria-controls={id} disabled={disabled} onClick={()=>setOpen(v=>!v)}>{value?<ReactionIcon value={value}/>:<Heart size={18} aria-hidden="true"/>}<span>Reaction</span>{total>0&&<small>{total}</small>}</button>
  {open&&<div className="reaction-picker" id={id} role="group" aria-label="Poker reactions"><div className="reaction-picker-heading"><strong>Pick your reaction</strong><button type="button" aria-label="Close reactions" onClick={()=>{setOpen(false);setPeople(null);trigger.current?.focus()}}><X size={16}/></button></div><div className="reaction-options">{REACTIONS.map(item=><button type="button" key={item.id} aria-label={item.label+(counts[item.id]?`, ${counts[item.id]} reactions`:'')} aria-pressed={value===item.id} disabled={disabled} onClick={()=>void choose(value===item.id?null:item.id)}><ReactionIcon value={item.id}/><span>{item.label}</span><small>{counts[item.id]||0}</small></button>)}</div>{value&&<button type="button" className="text-link" disabled={disabled} onClick={()=>void choose(null)}>Remove my reaction</button>}</div>}
  {context&&total>0&&<button type="button" className="text-link reaction-who" onClick={()=>void who()}>See who reacted ({total})</button>}
  {people&&<div className="reaction-people" role="region" aria-label="People who reacted"><button type="button" aria-label="Close reaction list" onClick={()=>setPeople(null)}><X size={16}/></button>{people.length===0&&<p>No reactions yet.</p>}{people.map(p=><p key={p.id}><a href={'/?profile='+encodeURIComponent(p.id)}>{p.name}</a> · {REACTIONS.find(r=>r.id===p.reaction)?.label}</p>)}{next!==null&&<button type="button" onClick={()=>void who(next)}>More reactions</button>}</div>}{peopleError&&<p role="alert">{peopleError}</p>}
 </div>;
}
