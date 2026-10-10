'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {Bell} from 'lucide-react';
import {activityRequest} from './activity-client';
type Item={id:string;actor:string;kind:string;href:string;created:string;readAt:string|null};
type Inbox={items:Item[];unread:number;publicKey:string|null};
const words:Record<string,string>={invitation:'invited you to a rail or room',stack:'updated their stack',post:'posted in a rail you joined',comment:'commented on a post',mention:'tagged you',like:'liked your post',comment_like:'liked your comment',follow:'started following you',session:'started a tournament or cash-game rail'};
const Context=createContext<{data:Inbox;error:string;refresh:()=>Promise<void>;enable:()=>Promise<string>;disable:()=>Promise<void>;deviceOn:boolean;deviceNote:string}|null>(null);
export const useNotifications=()=>useContext(Context);
async function detachDevice(){
 if(!('serviceWorker' in navigator))return;
 const registration=await navigator.serviceWorker.getRegistration('/');const sub=await registration?.pushManager?.getSubscription();
 if(sub){await activityRequest({action:'unsubscribe',endpoint:sub.endpoint});await sub.unsubscribe()}
}
export async function detachNotificationsForSignOut(){try{await detachDevice()}catch{throw Error('Could not turn off this device’s notifications. Please retry sign out.')}}
export function NotificationProvider({children,userId}:{children:React.ReactNode;userId:string}){
 const [data,setData]=useState<Inbox>({items:[],unread:0,publicKey:null}),[error,setError]=useState(''),[deviceOn,setDeviceOn]=useState(false),[deviceNote,setDeviceNote]=useState('');
 const refresh=useCallback(async()=>{try{const next=await activityRequest<Inbox>();setData(next);setError('')}catch(e){setError((e as Error).message)}},[]);
 useEffect(()=>{let active=true;const load=()=>{if(active&&document.visibilityState!=='hidden')void refresh()};load();const timer=setInterval(load,30000);window.addEventListener('focus',load);window.addEventListener('rail-activity-changed',load);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',load);window.removeEventListener('rail-activity-changed',load)}},[refresh,userId]);
 useEffect(()=>{
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return;
  let cancelled=false;
  navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(async reg=>{
   const sub=await reg.pushManager.getSubscription();
   if(sub&&Notification.permission==='granted'&&data.publicKey){await activityRequest({action:'subscribe',subscription:sub.toJSON()});if(!cancelled)setDeviceOn(true)}
  }).catch(()=>{if(!cancelled)setDeviceNote('Device notifications could not connect. Try enabling them again.')});
  return()=>{cancelled=true};
 },[userId,data.publicKey]);
 async function enable(){
  let message='';
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))message='Your rail is saved. On iPhone, open Rail Social in Safari, tap Share → Add to Home Screen, then enable notifications from that app.';
  else if(!data.publicKey)message='Your rail is saved. Push setup is unavailable; check your in-app notifications.';
  else try{
   // Ask in the click gesture before any network work, as required by Safari.
   const permission=await Notification.requestPermission();
   if(permission!=='granted')message='Your rail is saved. Allow notifications in your browser settings for push alerts. Activity still appears in Notifications.';
   else{
    const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});await navigator.serviceWorker.ready;
    const bytes=Uint8Array.from(atob(data.publicKey.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(data.publicKey.length/4)*4,'=')),c=>c.charCodeAt(0));
    const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
    await activityRequest({action:'subscribe',subscription:sub.toJSON()});setDeviceOn(true);message='Push notifications are on for this device.';
   }
  }catch{message='Your rail is saved, but push could not connect. Open Notifications to try again.'}
  setDeviceNote(message);return message;
 }
 async function disable(){await detachDevice();setDeviceOn(false);setDeviceNote('Push notifications are off on this device. Your in-app activity stays available.')}
 return <Context.Provider value={{data,error,refresh,enable,disable,deviceOn,deviceNote}}>{children}</Context.Provider>;
}
export function NotificationBell({onClick}:{onClick:()=>void}){
 const n=useNotifications();return <button className="notification-bell" onClick={onClick} aria-label={'Notifications'+(n?.data.unread?', '+n.data.unread+' unread':'')}><Bell size={22}/>{!!n?.data.unread&&<span>{n.data.unread>99?'99+':n.data.unread}</span>}</button>;
}
export default function Notifications(){
 const n=useNotifications();const [busy,setBusy]=useState(false),[error,setError]=useState('');if(!n)return null;
 async function act(fn:()=>Promise<unknown>){setBusy(true);setError('');try{await fn()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="notification-page"><div className="page-title"><div><span className="eyebrow">STAY ON THE RAIL</span><h1>Notifications</h1></div><button className="outline" onClick={()=>void n.refresh()}>Refresh</button></div>
 <div className="panel notification-settings"><h2>Your rail, in real time.</h2><p>Stack updates, tags, likes, comments, new followers, and new tournament or cash-game rails from people you follow.</p><p className="form-hint">Private-rail alerts are only sent to members who can view that rail.</p>
 <button className="primary" disabled={busy||!n.data.publicKey} onClick={()=>void act(n.deviceOn?n.disable:n.enable)}>{n.deviceOn?'Turn off push on this device':'Enable push notifications'}</button>
 <p className="form-hint">On iPhone or iPad: open in Safari, choose Share → Add to Home Screen, then enable notifications in the installed app.</p>{n.deviceNote&&<p role="status">{n.deviceNote}</p>}</div>
 {(error||n.error)&&<p className="error" role="alert">{error||n.error}</p>}
 <div className="notification-tools"><button className="text-link" disabled={busy||!n.data.unread} onClick={()=>void act(async()=>{await activityRequest({action:'read'});await n.refresh()})}>Mark all read</button></div>
 {n.data.items.length===0?<div className="panel empty"><Bell/><h2>You’re all caught up.</h2><p>Join a rail or follow a player to see activity here.</p></div>:<div className="notification-list">{n.data.items.map(item=><a className={'panel notification-item '+(!item.readAt?'unread':'')} key={item.id} href={item.href} onClick={()=>{void activityRequest({action:'read',id:item.id}).catch(()=>{})}}><span><strong>{item.actor}</strong> {words[item.kind]||'shared an update'}.</span><time dateTime={item.created}>{new Date(item.created).toLocaleString()}</time>{!item.readAt&&<span className="notification-dot" aria-label="Unread"/>}</a>)}</div>}
 </section>;
}
