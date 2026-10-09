'use client';
import {useCallback,useEffect,useState} from 'react';
import PostActivity from './post-activity';
import MentionInput from './mention-input';
import {activeMentions,type Mention} from './activity-client';
import {Heart,MessageCircle,MapPin,Globe,Users} from 'lucide-react';
type TalkComment={id:string;userId:string;name:string;body:string;created:string};
type TalkPost={id:string;userId:string;name:string;kind:string;audience:'public'|'friends';body:string;location:string;created:string;edited?:string;mentions:string[];likes:number;liked:boolean;comments:TalkComment[]};
export default function TableTalk({id,me,relationshipVersion}:{id:string;me:string;relationshipVersion:number}){
 const [posts,setPosts]=useState<TalkPost[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[more,setMore]=useState(false);
 const [body,setBody]=useState(''),[location,setLocation]=useState(''),[kind,setKind]=useState('status'),[audience,setAudience]=useState('friends');
 const [mentions,setMentions]=useState<Mention[]>([]);
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[confirmDelete,setConfirmDelete]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async(before?:string,signal?:AbortSignal)=>{
  const r=await fetch('/api/table-talk?id='+encodeURIComponent(id)+(before?'&before='+encodeURIComponent(before):'&focus='+encodeURIComponent(new URLSearchParams(window.location.search).get('post')||'')),{signal});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not load Table Talk.');
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
  {id===me&&<form className="talk-composer" onSubmit={async e=>{e.preventDefault();if(await mutate({action:'post',body,location,kind,audience,mentions:activeMentions(body,mentions)})){setBody('');setMentions([]);setLocation('');setNotice('Posted to your Table Talk.')}}}>
   <MentionInput label="What’s on your mind?" value={body} onChange={setBody} mentions={mentions} onMentions={setMentions} context={{}} maxLength={5000}/>
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
   <PostActivity scope="table" postId={post.id} author={{id:post.userId,name:post.name}} body={post.body} postMentions={post.mentions} onChanged={()=>void load().catch(e=>setError(e.message))}/>
  </article>)}
  {more&&<button className="outline" disabled={busy} onClick={async()=>{setBusy(true);try{await load(posts.at(-1)?.id)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>Load more posts</button>}
 </section>
}
