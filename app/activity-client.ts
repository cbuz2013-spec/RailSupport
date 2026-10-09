import type {PostScope} from '@/lib/activity';
export type Mention={id:string;name:string};
export type ActivityState={scope:PostScope;id:string;canEdit:boolean;canRemove:boolean;canComment:boolean;watching:boolean;hasSession:boolean;likes:number;liked:boolean;comments:number};
export async function activityRequest<T>(data?:Record<string,unknown>,params:Record<string,string>={},signal?:AbortSignal):Promise<T>{
 const r=await fetch('/api/activity?'+new URLSearchParams(params),data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal}:{cache:'no-store',signal});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save your activity.');return d;
}
type Pending={scope:PostScope;id:string;resolve:(s:ActivityState)=>void;reject:(e:Error)=>void};
let pending:Pending[]=[];let scheduled=false;
export function loadActivityState(scope:PostScope,id:string):Promise<ActivityState>{
 return new Promise((resolve,reject)=>{
  pending.push({scope,id,resolve,reject});if(scheduled)return;scheduled=true;
  setTimeout(async()=>{
   const requests=pending;pending=[];scheduled=false;
   for(let i=0;i<requests.length;i+=40){const batch=requests.slice(i,i+40);
    try{const d=await activityRequest<{states:ActivityState[]}>({action:'states',targets:batch.map(r=>({scope:r.scope,id:r.id}))});for(const r of batch){const s=d.states.find(s=>s.scope===r.scope&&s.id===r.id);if(s)r.resolve(s);else r.reject(Error('This post is no longer available.'))}}
    catch(e){for(const r of batch)r.reject(e as Error)}
   }
  },10);
 });
}
export function activeMentions(body:string,mentions:Mention[]){return mentions.filter(m=>body.includes('@'+m.name)).map(m=>m.id)}
export function activityChanged(){window.dispatchEvent(new Event('rail-activity-changed'))}
