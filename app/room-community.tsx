'use client';
import PostTimestamp from './post-timestamp';
import {useEffect,useRef,useState} from 'react';
import {communityRequest} from './community-client';
import PostActivity from './post-activity';
import MentionInput from './mention-input';
import {activeMentions,type Mention} from './activity-client';
import './community.css';
type Entry={id:string;userId:string;name:string;body:string;created:string;edited?:string;mentions:string[]};
type Feed={posts:Entry[];nextBefore:string|null};
export default function RoomCommunity({roomId,canPost}:{roomId:string;canPost:boolean}){
 const [data,setData]=useState<Feed|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0),[body,setBody]=useState(''),[mentions,setMentions]=useState<Mention[]>([]);const lock=useRef(false);
 useEffect(()=>{const c=new AbortController();setError('');communityRequest<Feed>({roomId,focus:new URLSearchParams(location.search).get('post')||''},undefined,c.signal).then(setData).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[roomId,revision]);
 async function act(fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn()}catch(e){setError((e as Error).message)}finally{lock.current=false;setBusy(false)}}
 return <section className="community-section"><div className="room-heading"><div><span className="eyebrow">ROOM CONVERSATION</span><h2>At the table.</h2></div><button className="outline" disabled={busy} onClick={()=>setRevision(v=>v+1)}>Refresh</button></div>{error&&<p className="error" role="alert">{error}</p>}
 {canPost?<form className="panel post-form community-section" onSubmit={e=>{e.preventDefault();void act(async()=>{await communityRequest({}, {action:'post',roomId,body,mentions:activeMentions(body,mentions)});setBody('');setMentions([]);setRevision(v=>v+1)})}}><MentionInput label="Post to this room" value={body} onChange={setBody} mentions={mentions} onMentions={setMentions} context={{}} maxLength={5000}/><p className="form-hint">Visible to signed-in members who can view this room.</p><button className="primary" disabled={busy||!body.trim()}>Post to room</button></form>:<p className="panel community-section">Follow this room to post and comment.</p>}
 {!data&&!error&&<p role="status">Loading conversation…</p>}{data?.posts.length===0&&<div className="panel empty"><h3>Be the first to say hello.</h3><p>Room followers can start a conversation here.</p></div>}
 {data?.posts.map(p=><article className="panel community-section" key={p.id} id={'post-'+p.id}><a className="profile-name" href={'/?profile='+encodeURIComponent(p.userId)}>{p.name}</a><p className="room-caption"><PostTimestamp created={p.created} edited={p.edited}/></p><p className="community-body">{p.body}</p><PostActivity scope="room" postId={p.id} author={{id:p.userId,name:p.name}} body={p.body} postMentions={p.mentions} onChanged={()=>setRevision(v=>v+1)}/></article>)}
 {data?.nextBefore&&<button className="outline" disabled={busy} onClick={()=>void act(async()=>{const more=await communityRequest<Feed>({roomId,before:data.nextBefore!});setData({...more,posts:[...data.posts,...more.posts].filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i)})})}>Earlier posts</button>}</section>;
}
