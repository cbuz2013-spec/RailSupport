'use client';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Heart,MessageCircle,Pencil,Trash2,Check} from 'lucide-react';
import type {PostScope} from '@/lib/activity';
import {activityRequest,loadActivityState,activeMentions,activityChanged,type ActivityState,type Mention} from './activity-client';
import {useNotifications} from './notifications';
import MentionInput from './mention-input';
type Comment={id:string;userId:string;name:string;body:string;created:string;edited?:string;mentions:string[];canEdit:boolean;canRemove:boolean;likes:number;liked:boolean};
type Thread={comments:Comment[];nextBefore:string|null};
export default function PostActivity({scope,postId,author,body,postMentions=[],onEdit,onChanged,children}:{scope:PostScope;postId:string;author:Mention;body:string;postMentions?:string[];onEdit?:()=>void;onChanged?:()=>void;children?:React.ReactNode}){
 const [state,setState]=useState<ActivityState|null>(null),[thread,setThread]=useState<Thread|null>(null),[expanded,setExpanded]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const [draft,setDraft]=useState(''),[tagged,setTagged]=useState<Mention[]>([]),[editing,setEditing]=useState(''),[editBody,setEditBody]=useState(''),[editMentions,setEditMentions]=useState<Mention[]>([]);
 const lock=useRef(false),n=useNotifications();const context={scope,postId};
 const refresh=useCallback(async()=>{setState(await loadActivityState(scope,postId))},[scope,postId]);
 const readThread=useCallback(async()=>{setThread(await activityRequest<Thread>(undefined,{comments:'1',scope,postId}))},[scope,postId]);
 useEffect(()=>{let active=true;loadActivityState(scope,postId).then(s=>{if(active)setState(s)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[scope,postId]);
 useEffect(()=>{const sync=()=>void refresh().catch(()=>{});window.addEventListener('rail-activity-changed',sync);return()=>window.removeEventListener('rail-activity-changed',sync)},[refresh]);
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible'){void refresh().catch(()=>{});if(expanded)void readThread().catch(()=>{})}},30000);return()=>clearInterval(timer)},[refresh,readThread,expanded]);
 useEffect(()=>{if(new URLSearchParams(location.search).get('post')===postId)setExpanded(true)},[postId]);
 useEffect(()=>{if(!expanded)return;void readThread().catch(e=>setError(e.message))},[expanded,readThread]);
 async function act(action:string,extra:Record<string,unknown>={},after?:()=>void){
  if(lock.current)return false;lock.current=true;setBusy(true);setError('');
  try{await activityRequest({action,scope,postId,...extra});after?.();
   // Do not report a completed write as a failed write if only the refresh fails.
   try{if(action!=='deletePost'){await refresh();if(expanded)await readThread()}}catch{setStatus('Saved. Refresh to see the latest activity.')}
   activityChanged();return true;
  }catch(e){setError((e as Error).message);return false}finally{setBusy(false);lock.current=false}
 }
 function reply(person:Mention){setExpanded(true);setDraft(old=>old.includes('@'+person.name)?old:'@'+person.name+' '+old);setTagged(old=>[...old.filter(p=>p.id!==person.id),person])}
 function edit(id:string,text:string){setEditing(id);setEditBody(text);setEditMentions([])}
 const commentEditing=thread?.comments.find(c=>c.id===editing);
 return <div className="post-activity">
 <div className="post-actions">
  <button className={'join-rail-button '+(state?.watching?'joined':'')} aria-pressed={!!state?.watching} disabled={busy||!state} title={state?.hasSession?'Get updates from this tournament or cash-game rail':'Get updates from this conversation'} onClick={async()=>{
   const enabled=!state?.watching;
   const push=enabled&&n&&!n.deviceOn?n.enable():Promise.resolve('');
   if(await act('watch',{enabled})){setStatus(enabled?'Joined this rail. Updates will appear in Notifications.':'Left this rail. These alerts are off.');const message=await push;if(message)setStatus(message)}
  }}><Image src="/railsocial-logo-light.png" alt="" width={100} height={35}/><span>{state?.watching?<><Check size={14}/> On rail</>:'Join rail'}</span></button>
  {scope!=='announcement'&&<><button aria-pressed={!!state?.liked} disabled={busy||!state?.canComment} onClick={()=>void act('like',{enabled:!state?.liked})}><Heart size={17} fill={state?.liked?'currentColor':'none'}/>Like{state?.likes?' · '+state.likes:''}</button><button aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><MessageCircle size={17}/>Comments{state?.comments?' · '+state.comments:''}</button><button disabled={!state?.canComment} onClick={()=>reply(author)}>Reply</button></>}
  {children}
  {state?.canEdit&&<button onClick={()=>onEdit?onEdit():edit('post',body)}><Pencil size={15}/>Edit</button>}
  {state?.canRemove&&<button disabled={busy} onClick={()=>{if(window.confirm('Delete this post and its comments?'))void act('deletePost',{},onChanged)}}><Trash2 size={15}/>Delete</button>}
 </div>
 {error&&<p className="error" role="alert">{error}</p>}{status&&<p className="form-hint" role="status">{status}</p>}
 {editing==='post'&&<form className="activity-editor" onSubmit={e=>{e.preventDefault();void act('editPost',{body:editBody,mentions:[...postMentions,...activeMentions(editBody,editMentions)]},()=>{setEditing('');onChanged?.()})}}><MentionInput label="Edit post" value={editBody} onChange={setEditBody} mentions={editMentions} onMentions={setEditMentions} context={context} maxLength={scope==='announcement'?3000:5000}/><div className="room-actions"><button className="primary" disabled={busy||!editBody.trim()}>Save changes</button><button type="button" className="outline" onClick={()=>setEditing('')}>Cancel</button></div></form>}
 {expanded&&scope!=='announcement'&&<section className="activity-comments" aria-label="Comments">
  {state?.canComment&&<form className="activity-editor" onSubmit={e=>{e.preventDefault();void act('comment',{body:draft,mentions:activeMentions(draft,tagged)},()=>{setDraft('');setTagged([])})}}><MentionInput label="Add a comment" value={draft} onChange={setDraft} mentions={tagged} onMentions={setTagged} context={context} rows={2}/><p className="form-hint">Replies add an @tag. Delete the tag from your message to leave them untagged.</p><button className="outline" disabled={busy||!draft.trim()}>Post comment</button></form>}
  {!thread&&!error&&<p role="status">Loading comments…</p>}
  {thread?.comments.length===0&&<p className="muted">No comments yet.</p>}
  {thread?.comments.map(c=><article className="activity-comment" key={c.id}><a className="profile-name" href={'/?profile='+encodeURIComponent(c.userId)}>{c.name}</a>
   {editing===c.id?<form className="activity-editor" onSubmit={e=>{e.preventDefault();void act('editComment',{commentId:c.id,body:editBody,mentions:[...(commentEditing?.mentions||[]),...activeMentions(editBody,editMentions)]},()=>setEditing(''))}}><MentionInput label="Edit comment" value={editBody} onChange={setEditBody} mentions={editMentions} onMentions={setEditMentions} context={context}/><div className="room-actions"><button className="primary" disabled={busy||!editBody.trim()}>Save comment</button><button type="button" className="outline" onClick={()=>setEditing('')}>Cancel</button></div></form>:<p>{c.body}</p>}
   <small>{new Date(c.created).toLocaleString()}{c.edited?' · Edited':''}</small><div className="comment-controls"><button disabled={busy||!state?.canComment} aria-pressed={c.liked} onClick={()=>void act('likeComment',{commentId:c.id,enabled:!c.liked})}><Heart size={14} fill={c.liked?'currentColor':'none'}/>Like{c.likes?' · '+c.likes:''}</button><button disabled={!state?.canComment} onClick={()=>reply({id:c.userId,name:c.name})}>Reply</button>{c.canEdit&&<button onClick={()=>edit(c.id,c.body)}>Edit</button>}{c.canRemove&&<button disabled={busy} onClick={()=>{if(window.confirm('Delete this comment?'))void act('deleteComment',{commentId:c.id})}}>Delete</button>}</div>
  </article>)}
  {thread?.nextBefore&&<button className="outline" disabled={busy} onClick={async()=>{try{const more=await activityRequest<Thread>(undefined,{comments:'1',scope,postId,before:thread.nextBefore!});setThread({...more,comments:[...thread.comments,...more.comments]})}catch(e){setError((e as Error).message)}}}>Earlier comments</button>}
 </section>}
 </div>;
}
