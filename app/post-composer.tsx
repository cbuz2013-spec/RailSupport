'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {X} from 'lucide-react';
import type {Hand,Post,Tournament} from '@/lib/types';
import {postSchema} from '@/lib/validation';
import {activityRequest,activeMentions,type Mention} from './activity-client';
import MentionInput from './mention-input';
const emptyHand:Hand={game:'NL Hold’em',stakes:'',position:'',stack:'',hero:'',board:'',pot:'',action:'',question:'',result:'',revealed:false};
async function resizePhoto(file:File){
 if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)||file.size>12_000_000)throw Error('Choose a JPG, PNG, WebP, or HEIC photo under 12 MB.');
 const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
 canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');
 if(!ctx){bitmap.close();throw Error('Photo processing is unavailable.')};ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 for(const quality of [.78,.64,.48,.32]){const value=canvas.toDataURL('image/jpeg',quality);if(value.length<=400000)return value}throw Error('Choose a smaller photo.');
}
export default function PostComposer({groupId,initial,kind:defaultKind,mode,onSave,busy}:{groupId:string;initial?:Post;kind:'hand'|'update';mode:string;onSave:(data:Record<string,unknown>)=>Promise<boolean>;busy:boolean}){
 const [kind,setKind]=useState(initial?.kind||defaultKind),[body,setBody]=useState(initial?.body||''),[hand,setHand]=useState<Hand>(initial?.hand||emptyHand);
 const [chips,setChips]=useState(String(initial?.tournament?.chips??'')),[bigBlind,setBigBlind]=useState(String(initial?.tournament?.bigBlind??'')),[remaining,setRemaining]=useState(String(initial?.tournament?.remaining??''));
 const [event,setEvent]=useState(initial?.tournament?.event||''),[status,setStatus]=useState<Tournament['status']>(initial?.tournament?.status||'Playing');
 const [sessions,setSessions]=useState<{id:string;name:string;kind:string}[]>([]),[sessionChoice,setSessionChoice]=useState(initial?.sessionId||(mode==='cash'?'new-cash':mode==='new-tournament'?'new-tournament':''));
 const [mentions,setMentions]=useState<Mention[]>([]),[images,setImages]=useState<string[]>([]),[keepImages,setKeepImages]=useState(Array.from({length:initial?.imageCount||0},(_,i)=>i));
 const [photoBusy,setPhotoBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();activityRequest<{sessions:{id:string;name:string;kind:string}[]}>(undefined,{sessions:'1',groupId},c.signal).then(d=>{setSessions(d.sessions);if(!initial&&mode==='tournament')setSessionChoice(d.sessions.find(s=>s.kind==='tournament')?.id||'new-tournament')}).catch(()=>{});return()=>c.abort()},[groupId,initial,mode]);
 async function photos(files:FileList|null){
  if(!files?.length)return;if(keepImages.length+images.length+files.length>3){setError('Use up to three photos.');return}setPhotoBusy(true);setError('');
  try{const loaded=await Promise.all(Array.from(files).map(resizePhoto));setImages(old=>[...old,...loaded])}catch(e){setError((e as Error).message)}finally{setPhotoBusy(false)}
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');const number=(s:string)=>s.trim()===''?undefined:Number(s);
  const startSession=sessionChoice==='new-tournament'?'tournament':sessionChoice==='new-cash'?'cash':undefined;
  const hasStats=!!(chips||bigBlind||remaining||event||sessionChoice)||status!=='Playing';
  const tournament=hasStats?{event,chips:number(chips),bigBlind:number(bigBlind),remaining:number(remaining),status,gameType:startSession||sessions.find(s=>s.id===sessionChoice)?.kind||initial?.tournament?.gameType||'tournament'}:undefined;
  const parsed=postSchema.safeParse({groupId,kind,body,hand:kind==='hand'?hand:undefined,tournament,images,keepImages,sessionId:startSession?undefined:sessionChoice||undefined,startSession,mentions:[...((initial as Post&{mentions?:string[]})?.mentions||[]),...activeMentions(body,mentions)]});
  if(!parsed.success){setError(parsed.error.issues[0].message);return}
  await onSave({...parsed.data,...(initial?{postId:initial.id}:{})});
 }
 return <form className="post-form" onSubmit={submit}>
 <p className="form-hint">Every field is optional. Share only what you have.</p>
 <div className="quick-stack-fields">
  <label className="field">Chips<input type="number" min="0" max="1000000000000" step="1" inputMode="numeric" value={chips} onChange={e=>setChips(e.target.value)} placeholder="e.g. 125000"/></label>
  <label className="field">Current big blind<input type="number" min="0.01" max="10000000000" step="any" inputMode="decimal" value={bigBlind} onChange={e=>setBigBlind(e.target.value)} placeholder="e.g. 2000"/></label>
  <label className="field">Players left<input type="number" min="0" max="1000000" step="1" inputMode="numeric" value={remaining} onChange={e=>setRemaining(e.target.value)} placeholder="e.g. 48"/></label>
 </div>
 {chips&&bigBlind&&Number(bigBlind)>0&&<p className="stack-equivalent">{(Number(chips)/Number(bigBlind)).toFixed(1)} big blinds</p>}
 <label className="field">Images (optional)<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={photoBusy} onChange={e=>{void photos(e.target.files);e.target.value=''}}/><span className="form-hint">Up to 3 photos, visible only to this rail’s members.</span></label>
 {(images.length>0||keepImages.length>0)&&<div className="photo-previews">{keepImages.map(position=><div key={'saved'+position}><Image src={'/api/post-image?post='+encodeURIComponent(initial!.id)+'&position='+position} alt={'Saved photo '+(position+1)} width={140} height={105} unoptimized/><button type="button" aria-label={'Remove saved photo '+(position+1)} onClick={()=>setKeepImages(old=>old.filter(i=>i!==position))}><X size={16}/></button></div>)}{images.map((src,i)=><div key={i}><Image src={src} alt={'New photo '+(i+1)} width={140} height={105} unoptimized/><button type="button" aria-label={'Remove new photo '+(i+1)} onClick={()=>setImages(old=>old.filter((_,n)=>n!==i))}><X size={16}/></button></div>)}</div>}{photoBusy&&<p role="status">Preparing photos…</p>}
 <div className="compose-toggle"><button type="button" className={kind==='update'?'selected':''} onClick={()=>setKind('update')}>Rail update</button><button type="button" className={kind==='hand'?'selected':''} onClick={()=>setKind('hand')}>Hand review</button></div>
 <MentionInput label={kind==='hand'?'Context (optional)':'Your update (optional)'} value={body} onChange={setBody} mentions={mentions} onMentions={setMentions} context={{groupId}} maxLength={5000}/>
 <label className="field">Tournament or cash-game rail (optional)<select value={sessionChoice} disabled={!!initial?.sessionId} onChange={e=>setSessionChoice(e.target.value)}><option value="">Just this conversation</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.name||(s.kind==='cash'?'Cash-game rail':'Tournament rail')}</option>)}{initial?.sessionId&&!sessions.some(s=>s.id===initial.sessionId)&&<option value={initial.sessionId}>This post’s rail</option>}<option value="new-tournament">Start a new tournament rail</option><option value="new-cash">Start a new cash-game rail</option></select></label>
 {sessionChoice&&<p className="form-hint">People who join this session get its updates. Followers who belong to this private group are notified when a new session starts.</p>}
 <div className="form-grid"><label className="field">Event / game name (optional)<input value={event} onChange={e=>setEvent(e.target.value)} maxLength={120} placeholder="e.g. Weekend Main Event"/></label><label className="field">Status (optional)<select value={status} onChange={e=>setStatus(e.target.value as Tournament['status'])}>{['Playing','On break','Bagged','Cashed','Out'].map(s=><option key={s}>{s}</option>)}</select></label></div>
 {kind==='hand'&&<>
 <div className="form-grid">{([['stakes','Stakes / event','$1 / $3'],['stack','Effective stack','100 BB'],['hero','Your hole cards','Ah Qh'],['board','Board','Qs 9h 4c'],['pot','Pot size','$120']] as const).map(([key,label,placeholder])=><label key={key} className="field">{label} (optional)<input value={hand[key]} onChange={e=>setHand({...hand,[key]:e.target.value})} maxLength={key==='hero'?8:key==='board'?20:key==='stack'||key==='pot'?30:60} placeholder={placeholder}/></label>)}<label className="field">Position (optional)<select value={hand.position} onChange={e=>setHand({...hand,position:e.target.value})}><option value="">Not specified</option>{['UTG','UTG+1','MP','LJ','HJ','CO','BTN','SB','BB'].map(s=><option key={s}>{s}</option>)}</select></label></div>
 <label className="field">Action by street (optional)<textarea rows={3} value={hand.action} onChange={e=>setHand({...hand,action:e.target.value})} maxLength={5000}/></label>
 <label className="field">Your question (optional)<input value={hand.question} onChange={e=>setHand({...hand,question:e.target.value})} maxLength={500}/></label>
 <label className="field">Result (optional)<textarea value={hand.result} onChange={e=>setHand({...hand,result:e.target.value})} maxLength={2000} rows={2}/></label>
 <p className="form-hint">Review completed hands only. Card notation: Ah Qh, or Qs 9h 4c. Results stay hidden until you reveal them.</p>
 </>}
 {error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy||photoBusy}>{busy?'Saving…':initial?'Save changes':'Share with my rail'}</button>
 </form>;
}

export function StackStats({value,onUpdate}:{value:Tournament;onUpdate?:()=>void}){
 return <div className="tournament-card"><div className="tournament-label"><span>{value.event||(value.gameType==='cash'?'Cash-game rail':'Tournament update')}</span><span className="status">{value.status}</span></div><div className="stats"><div><span>CHIPS</span><strong>{value.chips?.toLocaleString()??'—'}</strong></div><div><span>CURRENT BIG BLIND</span><strong>{value.bigBlind?.toLocaleString()??'—'}</strong></div><div><span>PLAYERS LEFT</span><strong>{value.remaining?.toLocaleString()??'—'}</strong></div></div><div className="stack-footer">{value.chips!==undefined&&!!value.bigBlind&&<span>{(value.chips/value.bigBlind).toFixed(1)} BB</span>}{onUpdate&&<button className="outline" onClick={onUpdate}>Update stack</button>}</div></div>;
}
