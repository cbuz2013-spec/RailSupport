'use client';
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {Camera,ImagePlus,X,RefreshCw} from 'lucide-react';
import type {Post,Tournament} from '@/lib/types';
import type {GameHistory,GameSnapshot} from '@/lib/game-history';
import {resizePhoto} from '@/lib/photo-resize';
import {StackStats} from './post-composer';
import PostTimestamp from './post-timestamp';
import './game-summary.css';

export function ChipGraph({updates}:{updates:GameSnapshot[]}){
 const [selectedId,setSelectedId]=useState('');
 const selected=updates.find(u=>u.id===selectedId)||updates.at(-1),index=updates.findIndex(u=>u.id===selected?.id);
 const valid=updates.filter(u=>u.stats.chips!==undefined);
 if(!valid.length)return <div className="chip-chart-empty"><strong>Chip history</strong><p>Add your current stack to start the graph.</p></div>;
 const first=new Date(updates[0].created).getTime(),last=new Date(updates.at(-1)!.created).getTime();
 const maximum=Math.max(...valid.map(u=>u.stats.chips!),1),width=600,height=210,left=58,right=580,top=20,bottom=172;
 const x=(u:GameSnapshot)=>left+(last===first ? .5 :(new Date(u.created).getTime()-first)/(last-first))*(right-left);
 const y=(chips:number)=>bottom-chips/maximum*(bottom-top);
 let connected=false;const path=updates.map(u=>{if(u.stats.chips===undefined){connected=false;return ''}const segment=(connected?'L':'M')+x(u)+' '+y(u.stats.chips);connected=true;return segment}).join(' ');
 function choose(e:React.MouseEvent<SVGSVGElement>){const bounds=e.currentTarget.getBoundingClientRect();if(!bounds.width)return;const px=(e.clientX-bounds.left)/bounds.width*width;setSelectedId(updates.reduce((a,b)=>Math.abs(x(a)-px)<Math.abs(x(b)-px)?a:b).id)}
 const label=(n:number)=>n>=1000000?(n/1000000).toLocaleString(undefined,{maximumFractionDigits:1})+'m':n>=1000?(n/1000).toLocaleString(undefined,{maximumFractionDigits:1})+'k':n.toLocaleString(undefined,{maximumFractionDigits:0});
 return <section className="chip-chart" aria-label="Chip history"><div className="game-section-heading"><h3>Chip history</h3><span>{updates.length} saved {updates.length===1?'update':'updates'}</span></div>
 <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Chip count over time. Use the update controls below to read each point." onClick={choose}>
 {[0,.5,1].map(f=><g key={f}><line className="chart-grid" x1={left} x2={right} y1={y(maximum*f)} y2={y(maximum*f)}/><text x={left-9} y={y(maximum*f)+4} textAnchor="end">{label(maximum*f)}</text></g>)}
 <text x={left} y={height-9}>{new Date(updates[0].created).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</text><text x={right} y={height-9} textAnchor="end">{new Date(updates.at(-1)!.created).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</text>
 <path className="chart-line" d={path}/>{valid.map(u=><circle className={u.id===selected?.id?'chart-point selected':'chart-point'} key={u.id} cx={x(u)} cy={y(u.stats.chips!)} r={u.id===selected?.id?6:3}/>)}
 {selected&&<line className="chart-cursor" x1={x(selected)} x2={x(selected)} y1={top} y2={bottom}/>}</svg>
 {updates.length===1&&<p className="form-hint">First saved update. Your next stack update will extend the graph.</p>}
 {selected&&<><div className="chart-controls"><button type="button" className="outline" aria-label="Previous update" disabled={index<=0} onClick={()=>setSelectedId(updates[index-1].id)}>←</button><label>Update {index+1} of {updates.length}<input aria-label="Select history update" type="range" min="0" max={updates.length-1} value={index} disabled={updates.length===1} onChange={e=>setSelectedId(updates[Number(e.target.value)].id)}/></label><button type="button" className="outline" aria-label="Next update" disabled={index===updates.length-1} onClick={()=>setSelectedId(updates[index+1].id)}>→</button></div>
 <div className="chart-detail" aria-live="polite"><PostTimestamp created={selected.created}/><p><strong>{selected.stats.chips?.toLocaleString()??'—'} chips</strong>{selected.stats.bigBlind!==undefined?' · Big blind '+selected.stats.bigBlind.toLocaleString():''}</p><p>{selected.stats.remaining!==undefined?selected.stats.remaining.toLocaleString()+' players left':''}{selected.stats.started!==undefined?' / '+selected.stats.started.toLocaleString()+' started':''}{selected.stats.paid!==undefined?' · '+selected.stats.paid.toLocaleString()+' paid places':''}</p><p>{[selected.stats.stage,selected.stats.status==='Playing'?'Still Playing':selected.stats.status==='Out'?'Busted':selected.stats.status==='Cashed'?'Finished':selected.stats.status].filter(Boolean).join(' · ')}</p>{selected.baseline&&<p className="form-hint">First recorded value. Earlier overwritten updates are unavailable.</p>}</div></>}
 </section>;
}
function ClockPhoto({src,onClose}:{src:string;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog className="clock-photo-dialog" ref={ref} onCancel={onClose} aria-label="Game photo" onClick={e=>{if(e.target===ref.current)onClose()}}><button type="button" className="outline" onClick={onClose} autoFocus><X size={20}/> Close photo</button><Image src={src} alt="Enlarged game or tournament clock photo" width={1600} height={1200} unoptimized/></dialog>;
}
export default function GameSummary({post,userId,onQuick}:{post:Post;userId:string;onQuick:(part:'stack'|'stage'|'status',current:Tournament)=>void}){
 const [data,setData]=useState<GameHistory|null>(null),[error,setError]=useState(''),[photoError,setPhotoError]=useState(''),[revision,setRevision]=useState(0),[photoBusy,setPhotoBusy]=useState(false),[more,setMore]=useState(false),[enlarged,setEnlarged]=useState(false);
 const generation=useRef(0),moreLoaded=useRef(false),photoLock=useRef(false),camera=useRef<HTMLInputElement>(null),upload=useRef<HTMLInputElement>(null);
 const session=post.sessionId!;
 useEffect(()=>{const n=++generation.current,c=new AbortController();let running=false;moreLoaded.current=false;
  async function load(){if(running||document.hidden)return;running=true;try{const r=await fetch('/api/game-history?'+new URLSearchParams({session}),{signal:c.signal});const result=await r.json();if(!r.ok)throw Error(result.error);if(n===generation.current){setData(result);setError('')}}catch(e){if(!c.signal.aborted&&n===generation.current)setError((e as Error).message)}finally{running=false}}
  void load();const timer=setInterval(()=>{if(!moreLoaded.current)void load()},20000);return()=>{c.abort();clearInterval(timer)};
 },[session,post.edited,revision]);
 async function earlier(){if(!data?.before||more)return;setMore(true);moreLoaded.current=true;const n=generation.current;try{const r=await fetch('/api/game-history?'+new URLSearchParams({session,before:data.before}));const result:GameHistory&{error?:string}=await r.json();if(!r.ok)throw Error(result.error);if(n===generation.current)setData(old=>old?{...old,updates:[...result.updates,...old.updates],before:result.before}:result)}catch(e){setError((e as Error).message)}finally{setMore(false)}}
 async function savePhoto(file:File|null){if(photoLock.current)return;photoLock.current=true;setPhotoBusy(true);setPhotoError('');try{const image=file?await resizePhoto(file):null;const r=await fetch('/api/game-history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session,image})});const result=await r.json();if(!r.ok)throw Error(result.error);setEnlarged(false);setRevision(v=>v+1)}catch(e){setPhotoError((e as Error).message)}finally{photoLock.current=false;setPhotoBusy(false)}}
 const current=data?.current||post.tournament!,owner=data?.ownerId===userId;
 return <StackStats value={current} onUpdate={owner?()=>onQuick('stack',current):undefined} onStage={owner?()=>onQuick('stage',current):undefined} onStatus={owner?()=>onQuick('status',current):undefined}>
 {error&&<p className="error" role="alert">{error} <button type="button" className="text-link" onClick={()=>setRevision(v=>v+1)}>Retry</button></p>}
 {!data&&!error?<p role="status">Loading game history…</p>:data&&<><ChipGraph updates={data.updates}/>{data.before&&<button type="button" className="outline history-more" disabled={more} onClick={()=>void earlier()}>{more?'Loading…':'Earlier updates'}</button>}<button type="button" className="text-link game-refresh" onClick={()=>setRevision(v=>v+1)}><RefreshCw size={14}/> Refresh game</button></>}
 <section className="game-photo" aria-label="Game photo"><div className="game-section-heading"><h3>{current.gameType==='cash'?'Game photo':'Tournament clock photo'}</h3><span>Optional</span></div>
 {data?.photo?<button type="button" className="clock-photo-preview" aria-label="Enlarge game photo" onClick={()=>setEnlarged(true)}><Image src={data.photo} alt="Game or live tournament clock" width={800} height={600} unoptimized/><span>Tap to enlarge</span></button>:<div className="clock-photo-empty"><Camera size={28}/><p>{owner?'Add a photo of the live tournament clock or your game.':'No photo added yet.'}</p></div>}
 {owner&&<><div className="game-photo-actions"><button type="button" className="outline" disabled={photoBusy} onClick={()=>camera.current?.click()}><Camera size={18}/> Take photo</button><button type="button" className="outline" disabled={photoBusy} onClick={()=>upload.current?.click()}><ImagePlus size={18}/>{data?.photo?'Replace photo':'Choose photo'}</button>{data?.photo&&<button type="button" className="text-link" disabled={photoBusy} onClick={()=>void savePhoto(null)}>Remove photo</button>}</div><input hidden ref={camera} type="file" accept="image/*" capture="environment" aria-label="Take game photo" onChange={e=>{const file=e.target.files?.[0];if(file)void savePhoto(file);e.target.value=''}}/><input hidden ref={upload} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" aria-label="Choose game photo" onChange={e=>{const file=e.target.files?.[0];if(file)void savePhoto(file);e.target.value=''}}/></>}
 {photoBusy&&<p role="status">Saving photo…</p>}{photoError&&<p className="error" role="alert">{photoError}</p>}
 </section>{enlarged&&data?.photo&&<ClockPhoto src={data.photo} onClose={()=>setEnlarged(false)}/>}
 </StackStats>;
}
