'use client';
import {useSyncExternalStore} from 'react';
import './post-timestamp.css';

const subscribe=()=>()=>{};
const clientSnapshot=()=>true;
const serverSnapshot=()=>false;

export default function PostTimestamp({created,edited}:{created:string;edited?:string|null}){
 const local=useSyncExternalStore(subscribe,clientSnapshot,serverSnapshot);
 const posted=new Date(created),changed=edited?new Date(edited):null;
 if(!Number.isFinite(posted.getTime()))return <span className="post-timestamp">Time unavailable</span>;
 // Stable UTC output during hydration, then the viewer's local time zone.
 const format=(date:Date)=>date.toLocaleString(local?undefined:'en-US',{
  year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short',
  ...(local?{}:{timeZone:'UTC'}),
 });
 const postedLabel=format(posted);
 return <span className="post-timestamp">
  <time dateTime={posted.toISOString()} title={'Posted '+postedLabel}>{postedLabel}</time>
  {changed&&Number.isFinite(changed.getTime())&&<time className="timestamp-edited" dateTime={changed.toISOString()} title={'Edited '+format(changed)} aria-label={'Edited '+format(changed)}>· Edited</time>}
 </span>;
}
