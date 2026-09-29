'use client';
import {useCallback,useEffect,useState} from 'react';
import {Heart,MessageCircle,MapPin,Globe,Users} from 'lucide-react';
type TalkComment={id:string;userId:string;name:string;body:string;created:string};
type TalkPost={id:string;userId:string;name:string;kind:string;audience:'public'|'friends';body:string;location:string;created:string;likes:number;liked:boolean;comments:TalkComment[]};
export default function TableTalk({id,me,relationshipVersion}:{id:string;me:string;relationshipVersion:number}){
 const [posts,setPosts]=useState<TalkPost[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[more,setMore]=useState(false);
 const [body,setBody]=useState(''),[location,setLocation]=useState(''),[kind,setKind]=useState('status'),[audience,setAudience]=useState('friends');
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[confirmDelete,setConfirmDelete]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async(before?:string,signal?:AbortSignal)=>{
  const r=await fetch('/api/table-talk?id='+encodeURIComponent(id)+(before?'&before='+encodeURIComponent(before):''),{signal});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not load Table Talk.');
  setPosts(old=>before?[...old,...d.posts]:d.posts);setMore(d.hasMore);
 },[id]);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setPosts([]);setError('');load(undefined,controller.signal).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[load,relationshipVersion]);
 async function mutate(values:Record<string,unknown>){
  if(busy)return false;setBusy(true);setError('');setNotice('');
  try{const r=await fetch('/api/table-talk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save.');
   // A successful write must not be resubmitted if the follow-up read fails.
   try{await load()}catch{setError('Saved, but the feed could not refresh. Use Refresh Table Talk.')}
   return true;
  }catch(e){setError((e as Error).message);return false}finally{setBusy(false)}
 }
 return <section className="table-talk" aria-labelledby="table-talk-title">
  <div className="talk-heading"><div><span className="eyebrow">OFF THE FELT</span><h3 id="table-talk-title">Table Talk</h3></div><button className="text-link" disabled={busy||loading} onClick={async()=>{setError('');setLoading(true);try{await load()}catch(e){setError((e as Error).message)}finally{setLoading(false)}}}>Refresh Table Talk</button></div>
  <p className="muted">Updates, places, news, and conversations.</p>
  {id===me&&<form className="talk-composer" onSubmit={async e=>{e.preventDefault();if(await mutate({action:'post',body,location,kind,audience})){setBody('');setLocation('');setNotice('Posted to your Table Talk.')}}}>
   <label className="field">What’s on your mind?<textarea required value={body} onChange={e=>setBody(e.target.value)} maxLength={5000} rows={3} placeholder="Share a status, news, or a topic for your friends…"/></label>
   <div className="form-grid"><label className="field">Post type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="status">Status</option><option value="location">Location</option><option value="news">News</option><option value="topic">Topic</option></select></label>
   <label className="field">Who can see this?<select value={audience} onChange={e=>setAudience(e.target.value)}><option value="friends">Friends only</option><option value="public">Public</option></select></label></div>
   <label className="field">Location (optional)<input value={location} onChange={e=>setLocation(e.target.value)} maxLength={120} placeholder="Add a city, venue, or place"/></label>
   <p className="form-hint">{audience==='friends'?'Friends only: visible to people you follow who also follow you.':'Public: visible to anyone signed in to Rail Social.'} Private rail posts stay in their rails.</p>
   <button className="primary" disabled={busy||!body.trim()}>{busy?'Saving…':'Post to Table Talk'}</button>
  </form>}
  {error&&<p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {loading?<p role="status" className="muted">Loading Table Talk…</p>:posts.length===0&&!error?<p className="talk-empty">{id===me?'Start the conversation with your first post.':'No Table Talk posts to show. Friends-only posts appear when you follow each other.'}</p>:null}
  {posts.map(post=><article className="talk-post" key={post.id} aria-label={post.name+' Table Talk post'}>
   <header><strong>{post.name}</strong><div className="talk-meta"><span>{post.kind}</span><time dateTime={post.created}>{new Date(post.created).toLocaleString()}</time><span>{post.audience==='friends'?<Users size={13}/>:<Globe size={13}/>} {post.audience==='friends'?'Friends only':'Public'}</span></div></header>
   <p className="talk-body">{post.body}</p>{post.location&&<p className="talk-location"><MapPin size={14}/>{post.location}</p>}
   <div className="talk-actions"><button aria-pressed={post.liked} disabled={busy} onClick={()=>void mutate({action:post.liked?'unlike':'like',postId:post.id})}><Heart size={16} fill={post.liked?'currentColor':'none'}/>{post.liked?'Unlike':'Like'} · {post.likes}</button><span><MessageCircle size={16}/>{post.comments.length} comments</span>{post.userId===me&&<button disabled={busy} onClick={()=>setConfirmDelete(post.id)}>Delete post</button>}</div>
   {confirmDelete===post.id&&<div className="talk-delete"><p>Delete this Table Talk post and its comments?</p><button className="outline" onClick={()=>setConfirmDelete('')}>Keep post</button><button className="danger" disabled={busy} onClick={async()=>{if(await mutate({action:'delete',postId:post.id}))setConfirmDelete('')}}>Confirm delete</button></div>}
   <div className="talk-comments">{post.comments.map(c=><div key={c.id}><strong>{c.name}</strong><p>{c.body}</p></div>)}</div>
   <form className="talk-comment-form" onSubmit={async e=>{e.preventDefault();if(await mutate({action:'comment',postId:post.id,body:drafts[post.id]||''}))setDrafts(old=>({...old,[post.id]:''}))}}><label className="field">Comment<textarea rows={2} required maxLength={2000} value={drafts[post.id]||''} onChange={e=>setDrafts(old=>({...old,[post.id]:e.target.value}))} placeholder="Join the conversation…"/></label><button className="outline" disabled={busy||!drafts[post.id]?.trim()}>Add comment</button></form>
  </article>)}
  {more&&<button className="outline" disabled={busy} onClick={async()=>{setBusy(true);try{await load(posts.at(-1)?.id)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>Load more posts</button>}
 </section>
}
