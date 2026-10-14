'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Share2} from 'lucide-react';
import Image from 'next/image';
import {resizePhoto} from '@/lib/photo-resize';
import HandReviewFlow from './hand-review-flow';
import {REVIEW_SHARE_STEP,reviewPlayers} from '@/lib/hand-review';
import type {Group} from '@/lib/types';
import type {Room,RoomDirectory} from '@/lib/rooms-validation';
import {equityShareRequest,equityShareSummary,equityShareUrl,type EquityShareDraft,type ShareDestination} from '@/lib/equity-share';

export default function EquityShareComposer({draft,groups,activeGroupId,userId,onBack}:{draft:EquityShareDraft;groups:Group[];activeGroupId:string;userId:string;onBack:()=>void}){
 const [images,setImages]=useState<string[]>([]),[photoBusy,setPhotoBusy]=useState(false);
 const [hand,setHand]=useState(draft.hand),[step,setStep]=useState(0);
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
  event.preventDefault();if(sending.current||photoBusy||!target||step!==REVIEW_SHARE_STEP)return;
  sending.current=true;setBusy(true);setError('');
  let url='';
  try{
   const request=equityShareRequest({...draft,hand,players:reviewPlayers(hand),result:hand.review?.equity||null},target,{context,action:hand.action,question:hand.question});
   if(target.kind==='rail')Object.assign(request.payload,{images});
   const response=await fetch(request.path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request.payload)});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Could not share this hand. Your draft is unchanged.');
   url=equityShareUrl(target,userId,data.id);setSavedUrl(url);
  }catch(err){setError((err as Error).message);sending.current=false;setBusy(false);return;}
  // Keep submission locked after a successful write, even if navigation is interrupted.
  try{window.location.assign(url)}catch{setError('Your hand was shared. Use View your post to open it.');}
 }
 return <form className="post-form equity-share" onSubmit={submit}>
  <div className="equity-share-heading"><h3 ref={heading} tabIndex={-1}>Share this hand</h3><button type="button" className="text-link" disabled={busy} onClick={onBack}><ArrowLeft size={15}/>Back to calculator</button></div>
  <p className="muted">Your cards, positions and board are imported. Add any details you want before sharing.</p><HandReviewFlow hand={hand} onChange={setHand} step={step} onStep={setStep} busy={busy}>
  <label className="field">Share to<select aria-label="Share to" value={destination} disabled={busy} onChange={event=>{setDestination(event.target.value);setError('')}} required>
   {groups.length>0&&<optgroup label="My private rails">{groups.map(group=><option key={group.id} value={`rail:${group.id}`}>{group.name}</option>)}</optgroup>}
   {rooms.length>0&&<optgroup label="Followed rooms">{rooms.map(item=><option key={item.id} value={`room:${item.id}`}>{item.name}</option>)}</optgroup>}
   <optgroup label="My Table Talk"><option value="table:friends">Table Talk · Friends only</option><option value="table:public">Table Talk · Public</option></optgroup>
  </select></label>
  <p className="form-hint">{audience}</p>
  {loading&&<p className="form-hint" role="status">Loading followed rooms…</p>}
  {roomError&&<p className="error" role="alert">{roomError} <button type="button" className="text-link" disabled={busy} onClick={()=>setRevision(value=>value+1)}>Retry rooms</button></p>}
  <label className="field">Context (optional)<textarea value={context} disabled={busy} onChange={e=>setContext(e.target.value)} rows={3} maxLength={4000}/></label>
  {rail&&<div className="review-attachments"><label className="field">Attach images (optional)<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={busy||photoBusy} onChange={async e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(images.length+files.length>3){setError('Use up to three photos.');return}setPhotoBusy(true);setError('');try{const added=await Promise.all(files.map(resizePhoto));setImages(old=>[...old,...added])}catch(e){setError((e as Error).message)}finally{setPhotoBusy(false)}}}/></label><div className="photo-previews">{images.map((src,i)=><div key={i}><Image src={src} alt={'Photo '+(i+1)} width={140} height={105} unoptimized/><button type="button" onClick={()=>setImages(old=>old.filter((_,j)=>j!==i))}>Remove photo</button></div>)}</div>{photoBusy&&<p role="status">Preparing photos…</p>}</div>}
  <p className="form-hint">Share completed hands for review. Only the cards, equity snapshot, and details shown here will be posted.</p>
  {error&&<p className="error" role="alert">{error}</p>}
  {savedUrl?<p role="status">Hand shared. <a className="text-link" href={savedUrl}>View your post</a></p>:<button type="submit" className="primary" disabled={busy||photoBusy||!target}><Share2 size={16}/>{busy?'Sharing…':'Post hand history'}</button>}
 </HandReviewFlow></form>;
}
