'use client';
import {useRef,useState} from 'react';
import {Trophy,Banknote} from 'lucide-react';
import type {Group,Tournament} from '@/lib/types';
import {StackFields,StatusFields,countsOf,countValues} from './tournament-controls';
export default function StartRail({groups,activeGroupId,onCreated,onCreateGroup}:{groups:Group[];activeGroupId:string;onCreated:(groupId:string)=>void|Promise<void>;onCreateGroup:()=>void}){
 const [groupId,setGroupId]=useState(activeGroupId||groups[0]?.id||''),[kind,setKind]=useState<'cash'|'tournament'|''>(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const sending=useRef(false),group=groups.find(g=>g.id===groupId);
 const cashGroup=group?.tournament?groups.find(g=>g.id===group.parentGroupId&&!g.tournament)||groups.find(g=>!g.tournament):group;
 const [counts,setCounts]=useState(countsOf()),[status,setStatus]=useState<Tournament['status']>('Playing'),[winnings,setWinnings]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!kind||!groupId||sending.current)return;sending.current=true;setBusy(true);setError('');const f=new FormData(e.currentTarget);
  const details={event:f.get('event')||'',location:f.get('location')||'',buyIn:f.get('buyIn')||'',guarantee:f.get('guarantee')||'',startingStack:f.get('startingStack')||'',stakes:f.get('stakes')||''};
  try{const r=await fetch('/api/rail',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(kind==='tournament'?{action:'startTournament',groupId,...details,...countValues(counts),status,...(status==='Out'&&winnings!==''?{winnings:Number(winnings)}:{})}:{action:'post',groupId:cashGroup?.id,kind:'update',body:'',startSession:'cash',tournament:{gameType:'cash',event:'',status:'Playing'},sessionDetails:details})});const d=await r.json();if(!r.ok)throw Error(d.error);await onCreated(kind==='tournament'?d.id:cashGroup!.id)}catch(e){setError((e as Error).message);sending.current=false;setBusy(false)}
 }
 return <form className="post-form new-game-form" onSubmit={submit}>
 {activeGroupId?<p className="muted">Starting from {group?.name}.</p>:<label className="field">Private rail<select value={groupId} onChange={e=>setGroupId(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}
 {!groups.length&&<button type="button" className="primary" onClick={onCreateGroup}>Create a private rail</button>}
 {!kind?<div className="review-game-options"><button type="button" onClick={()=>setKind('tournament')}><Trophy/><strong>Start Tournament</strong></button><button type="button" disabled={!cashGroup} onClick={()=>setKind('cash')}><Banknote/><strong>Start Cash Game</strong></button></div>:<>
 <button type="button" className="text-link" disabled={busy} onClick={()=>setKind('')}>Back to game choice</button>
 <p className="form-hint">All details are optional. {kind==='tournament'?'Your tournament gets its own rail. Invite your people next.':'Start a cash game in '+cashGroup?.name+'.'}</p>
 {kind==='tournament'&&<label className="field">Event information (optional)<input name="event" maxLength={120}/></label>}
 <label className="field">Buy-in (optional)<input name="buyIn" maxLength={30}/></label>
 {kind==='tournament'&&<label className="field">Starting stack (optional)<input name="startingStack" maxLength={30} inputMode="numeric"/></label>}
 <label className="field">Location (optional)<input name="location" maxLength={120}/></label>
 {kind==='cash'?<label className="field">Stakes (optional)<input name="stakes" maxLength={60}/></label>:<label className="field">Prize guarantee (optional)<input name="guarantee" maxLength={40}/></label>}
 {kind==='tournament'&&<><p className="form-hint">Current stack and player counts (optional)</p><StackFields value={counts} onChange={setCounts}/><StatusFields status={status} winnings={winnings} onStatus={setStatus} onWinnings={setWinnings}/></>}
 <button className="primary" disabled={busy||!groupId}>{busy?'Starting…':kind==='tournament'?'Start Tournament':'Start Cash Game'}</button>
 </>}{error&&<p className="error" role="alert">{error}</p>}
 </form>;
}
