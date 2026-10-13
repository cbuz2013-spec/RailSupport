'use client';
import {useEffect,useRef,useState} from 'react';
import {Send,MessageCircle} from 'lucide-react';
import PostTimestamp from './post-timestamp';
type Message={id:string;userId:string;name:string;body:string;created:string};
export default function TournamentChat({groupId,userId,placement}:{groupId:string;userId:string;placement:'desktop'|'mobile'}){
 const [messages,setMessages]=useState<Message[]>([]),[body,setBody]=useState(''),[connection,setConnection]=useState('Connecting…'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef<{id:string;body:string}|null>(null),list=useRef<HTMLDivElement>(null),nearBottom=useRef(true);
 useEffect(()=>{
  let stream:EventSource|undefined;
  const viewport=window.matchMedia(placement==='desktop'?'(min-width: 1201px)':'(max-width: 1200px)');
  function connect(){stream?.close();if(document.hidden||!viewport.matches)return;setConnection('Connecting…');stream=new EventSource('/api/tournament-chat?group='+encodeURIComponent(groupId));
   stream.onmessage=e=>{try{setMessages(JSON.parse(e.data));setConnection('Live')}catch{setConnection('Reconnecting…')}};
   stream.onerror=()=>setConnection('Reconnecting…');
   stream.addEventListener('unavailable',()=>{stream?.close();setMessages([]);setConnection('Chat unavailable');setError('Your access changed. Refresh the rail to continue.');});
  }
  connect();document.addEventListener('visibilitychange',connect);viewport.addEventListener('change',connect);return()=>{stream?.close();document.removeEventListener('visibilitychange',connect);viewport.removeEventListener('change',connect)};
 },[groupId,placement]);
 useEffect(()=>{if(nearBottom.current&&list.current)list.current.scrollTop=list.current.scrollHeight},[messages]);
 async function send(e:React.FormEvent){e.preventDefault();const text=body.trim();if(!text||busy)return;setBusy(true);setError('');
  if(pending.current?.body!==text)pending.current={id:crypto.randomUUID(),body:text};
  try{const r=await fetch('/api/tournament-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...pending.current,groupId})});const d=await r.json();if(!r.ok)throw Error(d.error);pending.current=null;setBody('');nearBottom.current=true;}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <section className="panel tournament-chat" aria-label="Tournament rail chat"><header><h2><MessageCircle size={19}/> Rail chat</h2><span role="status">{connection}</span></header><p className="form-hint">Cheer on the player. Talk poker. Talk trash.</p>
 <div className="chat-messages" ref={list} role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions" onScroll={()=>{const el=list.current;if(el)nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<80}}>{messages.length===0?<p className="muted">Start the conversation.</p>:messages.map(m=><div className={'chat-message '+(m.userId===userId?'mine':'')} key={m.id}><strong>{m.name}</strong><p>{m.body}</p><PostTimestamp created={m.created}/></div>)}</div>
 <form onSubmit={send}><label className="field">Message<textarea aria-label="Chat message" rows={2} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Say something to the rail…"/></label><button className="primary" disabled={busy||!body.trim()||connection==='Chat unavailable'}><Send size={17}/>{busy?'Sending…':'Send message'}</button>{error&&<p className="error" role="alert">{error}</p>}</form></section>;
}
