'use client';
import {useState} from 'react';
import type {Post,Tournament} from '@/lib/types';
export const stages=['Registration','Reg Closed','In the Money','Final Table'] as const;
export type Counts={chips:string;bigBlind:string;remaining:string;started:string};
export function countsOf(t?:Tournament):Counts{return {chips:String(t?.chips??''),bigBlind:String(t?.bigBlind??''),remaining:String(t?.remaining??''),started:String(t?.started??'')}}
export function countValues(c:Counts){return Object.fromEntries(Object.entries(c).filter(([,v])=>v.trim()!=='').map(([k,v])=>[k,Number(v)]))}
export function StackFields({value,onChange}:{value:Counts;onChange:(value:Counts)=>void}){
 return <div className="quick-stack-fields">{([['chips','Chips',1e12],['bigBlind','Current big blind',1e10],['remaining','Players left',1e6],['started','Players started',1e6]] as const).map(([key,label,max])=><label className="field" key={key}>{label}<input aria-label={label} type="number" min={key==='bigBlind'?.01:0} max={max} step={key==='bigBlind'?'any':1} inputMode={key==='bigBlind'?'decimal':'numeric'} value={value[key]} onChange={e=>onChange({...value,[key]:e.target.value})}/></label>)}</div>;
}
export function StatusFields({status,winnings,onStatus,onWinnings,allowFinished=true}:{status:Tournament['status'];winnings:string;onStatus:(value:Tournament['status'])=>void;onWinnings:(value:string)=>void;allowFinished?:boolean}){
 return <><label className="field">Status<select aria-label="Status" value={status} onChange={e=>onStatus(e.target.value as Tournament['status'])}><option value="Playing">Still Playing</option><option value="Out">Busted</option>{allowFinished&&<option value="Cashed">Finished</option>}{!['Playing','Out',...(allowFinished?['Cashed']:[])].includes(status)&&<option value={status}>{status} (previous status)</option>}</select></label>{(status==='Out'||status==='Cashed')&&<label className="field">Winnings (optional)<input aria-label="Winnings (optional)" type="number" min="0" max="1000000000000" step="0.01" inputMode="decimal" value={winnings} onChange={e=>onWinnings(e.target.value)}/></label>}</>;
}
export default function QuickTournamentUpdate({post,part,onSave,busy}:{post:Post;part:'stack'|'stage'|'status';onSave:(data:Record<string,unknown>)=>Promise<boolean>;busy:boolean}){
 const [counts,setCounts]=useState(countsOf(post.tournament)),[stage,setStage]=useState(post.tournament?.stage||'Registration'),[status,setStatus]=useState<Tournament['status']>(post.tournament?.status||'Playing'),[winnings,setWinnings]=useState(String(post.tournament?.winnings??''));
 return <form className="post-form" onSubmit={e=>{e.preventDefault();void onSave({postId:post.id,part,values:part==='stack'?countValues(counts):part==='stage'?{stage}:{status,...(winnings!==''&&['Out','Cashed'].includes(status)?{winnings:Number(winnings)}:{})}})}}>
 {part==='stack'?<StackFields value={counts} onChange={setCounts}/>:part==='stage'?<div className="stage-choices" role="group" aria-label="Tournament stage">{stages.map(s=><button type="button" className={'outline '+(stage===s?'selected':'')} aria-pressed={stage===s} onClick={()=>setStage(s)} key={s}>{s}</button>)}</div>:<StatusFields status={status} winnings={winnings} onStatus={setStatus} onWinnings={setWinnings}/>}
 <button className="primary" disabled={busy}>{busy?'Saving…':'Save update'}</button></form>;
}
