'use client';
import {useSyncExternalStore} from 'react';
import {Moon,Sun} from 'lucide-react';
const event='rail-theme-change',storageKey='rail-social-theme-v1';
function subscribe(notify:()=>void){
 const storage=(e:StorageEvent)=>{if(e.key===storageKey){document.documentElement.dataset.theme=e.newValue==='dark'?'dark':'light';notify()}};
 window.addEventListener(event,notify);window.addEventListener('storage',storage);return()=>{window.removeEventListener(event,notify);window.removeEventListener('storage',storage)};
}
export default function ThemeToggle(){
 const theme=useSyncExternalStore(subscribe,()=>document.documentElement.dataset.theme==='dark'?'dark':'light',()=> 'light');
 function toggle(){const next=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem(storageKey,next)}catch{}window.dispatchEvent(new Event(event))}
 return <div className="theme-bar"><span>YOUR PEOPLE. YOUR POKER.</span><button type="button" className="theme-toggle" aria-label={theme==='dark'?'Switch to light mode':'Switch to dark felt mode'} aria-pressed={theme==='dark'} onClick={toggle}>{theme==='dark'?<Moon size={17} aria-hidden="true"/>:<Sun size={17} aria-hidden="true"/>}<span>{theme==='dark'?'Dark felt':'Light mode'}</span><span className="theme-switch" aria-hidden="true"><i/></span></button></div>;
}
