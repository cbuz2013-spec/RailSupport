'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Share2} from 'lucide-react';
import type {Group} from '@/lib/types';
import type {Room,RoomDirectory} from '@/lib/rooms-validation';
import {equityShareRequest,equityShareSummary,equityShareUrl,type EquityShareDraft,type ShareDestination} from '@/lib/equity-share';

export default function EquityShareComposer({draft,groups,activeGroupId,userId,onBack}:{draft:EquityShareDraft;groups:Group[];activeGroupId:string;userId:string;onBack:()=>void}){
 const [destination,setDestination]=useState(groups.some(group=>group.id===activeGroupId)?`rail:${activeGroupId}`:'table:friends');
 const [rooms,setRooms]=useState<Room[]>([]),[loading,setLoading]=useState(true),[roomError,setRoomError]=useState(''),[revision,setRevision]=useState(0);
 const [context,setContext]=useState(''),[action,setAction]=useState(draft.hand.action),[question,setQuestion]=useState(draft.hand.question);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[savedUrl,setSavedUrl]=useState('');
 const sending=useRef(false),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();heading.current?.scrollIntoView({block:'nearest'});},[]);
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setRoomError('');
  async function load(){
   const found:Room[]=[];let offset:number|null=0;
   do{
    const response=await fetch(`/api/rooms?scope=following&offset=${offset}`,{signal:controller.signal});
    const data:RoomDirectory&{error?:string}=await response.json();
    if(!response.ok)throw Error(data.error||'Could not load followed rooms.');
    found.push(...data.rooms.filter(room=>room.following&&room.published));offset=data.nextOffset;
   }while(offset!==null);
   if(!controller.signal.aborted)setRooms(found);
  }
  load().catch(err=>{if(!controller.signal.aborted)setRoomError((err as Error).message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[revision]);
 const rail=groups.find(group=>destination===`rail:${group.id}`),room=rooms.find(item=>destination===`room:${item.id}`);
 const target:ShareDestination|null=rail?{kind:'rail',id:rail.id}:room?{kind:'room',id:room.id}:destination==='table:friends'?{kind:'table',audience:'friends'}:destination==='table:public'?{kind:'table',audience:'public'}:null;
 const audience=rail?`Only members of ${rail.name} can see this hand.`:room?`Visible to signed-in members who can view ${room.name}.`:destination==='table:friends'?'Friends only: visible to people you follow who also follow you.':'Public: visible to anyone signed in to Rail Social.';
 async function submit(event:React.FormEvent){
  event.preventDefault();if(sending.current||!target)return;
  sending.current=true;setBusy(true);setError('');
  let url='';
  try{
   const request=equityShareRequest(draft,target,{context,action,question});
   const response=await fetch(request.path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request.payload)});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Could not share this hand. Your draft is unchanged.');
   url=equityShareUrl(target,userId,data.id);setSavedUrl(url);
  }catch(err){setError((err as Error).message);sending.current=false;setBusy(false);return;}
  // Keep submission locked after a successful write, even if navigation is interrupted.
  try{window.location.assign(url)}catch{setError('Your hand was shared. Use View your post to open it.');}
 }
 return <form className="post-form equity-share" onSubmit={submit}>
  <div className="equity-share-heading"><h3 ref={heading} tabIndex={-1}>Share this hand</h3><button type="button" className="text-link" disabled={busy} onClick={onBack}><ArrowLeft size={15}/>Back to calculator</button></div>
  <p className="muted">Review the hand history, choose where it goes, and add any action or question before posting.</p>
  <label className="field">Share to<select aria-label="Share to" value={destination} disabled={busy} onChange={event=>{setDestination(event.target.value);setError('')}} required>
   {groups.length>0&&<optgroup label="My private rails">{groups.map(group=><option key={group.id} value={`rail:${group.id}`}>{group.name}</option>)}</optgroup>}
   {rooms.length>0&&<optgroup label="Followed rooms">{rooms.map(item=><option key={item.id} value={`room:${item.id}`}>{item.name}</option>)}</optgroup>}
   <optgroup label="My Table Talk"><option value="table:friends">Table Talk · Friends only</option><option value="table:public">Table Talk · Public</option></optgroup>
  </select></label>
  <p className="form-hint">{audience}</p>
  {loading&&<p className="form-hint" role="status">Loading followed rooms…</p>}
  {roomError&&<p className="error" role="alert">{roomError} <button type="button" className="text-link" disabled={busy} onClick={()=>setRevision(value=>value+1)}>Retry rooms</button></p>}
  <pre className="equity-share-history" aria-label="Hand history preview">{equityShareSummary(draft)}</pre>
  <label className="field">Context (optional)<textarea aria-label="Context (optional)" value={context} disabled={busy} onChange={event=>setContext(event.target.value)} rows={3} maxLength={4000} placeholder="What should people know about this hand?"/></label>
  <label className="field">Action by street (optional)<textarea aria-label="Action by street (optional)" value={action} disabled={busy} onChange={event=>setAction(event.target.value)} rows={4} maxLength={5000} placeholder="Preflop: …&#10;Flop: …&#10;Turn: …&#10;River: …"/></label>
  <label className="field">Your question (optional)<input aria-label="Your question (optional)" value={question} disabled={busy} onChange={event=>setQuestion(event.target.value)} maxLength={500} placeholder="What would you do here?"/></label>
  <p className="form-hint">Share completed hands for review. Only the cards, equity snapshot, and details shown here will be posted.</p>
  {error&&<p className="error" role="alert">{error}</p>}
  {savedUrl?<p role="status">Hand shared. <a className="text-link" href={savedUrl}>View your post</a></p>:<button className="primary" disabled={busy||!target}><Share2 size={16}/>{busy?'Sharing…':'Post hand history'}</button>}
 </form>;
}
