'use client';
import {useEffect,useState} from 'react';
import {activityRequest,type Mention} from './activity-client';
export default function MentionInput({label,value,onChange,mentions,onMentions,context={},maxLength=2000,rows=3,placeholder}:{label:string;value:string;onChange:(value:string)=>void;mentions:Mention[];onMentions:(mentions:Mention[])=>void;context?:Record<string,string>;maxLength?:number;rows?:number;placeholder?:string}){
 const [people,setPeople]=useState<Mention[]>([]),[dismissed,setDismissed]=useState('');
 const query=value.match(/@([^@\n]{0,60})$/)?.[1];const contextKey=JSON.stringify(context);
 useEffect(()=>{
  if(query===undefined||dismissed===value){setPeople([]);return}
  const c=new AbortController(),timer=setTimeout(()=>activityRequest<{people:Mention[]}>(undefined,{mentions:'1',q:query,...JSON.parse(contextKey)},c.signal).then(d=>setPeople(d.people)).catch(()=>setPeople([])),200);
  return()=>{c.abort();clearTimeout(timer)};
 },[query,contextKey,dismissed,value]);
 return <div className="mention-field"><label className="field">{label}<textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} maxLength={maxLength} placeholder={placeholder||'Write a message. Use @ to tag someone.'} onKeyDown={e=>{if(e.key==='Escape'){setDismissed(value);setPeople([])}}}/></label>
 {people.length>0&&<div className="mention-choices" aria-label="People to tag">{people.map(p=><button key={p.id} type="button" onClick={()=>{const next=value.slice(0,value.lastIndexOf('@'))+'@'+p.name+' ';onChange(next);onMentions([...mentions.filter(m=>m.id!==p.id),p]);setDismissed(next);setPeople([])}}>@{p.name}</button>)}</div>}</div>;
}
