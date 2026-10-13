'use client';
import {useState} from 'react';
import Image from 'next/image';
import {X} from 'lucide-react';
import type {Hand,Post,Tournament} from '@/lib/types';
import {postSchema} from '@/lib/validation';
import {activeMentions,type Mention} from './activity-client';
import MentionInput from './mention-input';
import HandReviewFlow from './hand-review-flow';
import {REVIEW_SHARE_STEP,withReview} from '@/lib/hand-review';
const emptyHand:Hand={game:'NL Hold’em',stakes:'',position:'',stack:'',hero:'',board:'',pot:'',action:'',question:'',result:'',revealed:false};
import {StackFields,StatusFields,countsOf,countValues} from './tournament-controls';
import {resizePhoto} from '@/lib/photo-resize';
export default function PostComposer({groupId,initial,kind:defaultKind,mode,tournament:contextTournament,onSave,busy}:{groupId:string;tournament?:Tournament;initial?:Post;kind:'hand'|'update';mode:string;onSave:(data:Record<string,unknown>)=>Promise<boolean>;busy:boolean}){
 const [kind]=useState(initial?.kind||defaultKind),[body,setBody]=useState(initial?.body||''),[hand,setHand]=useState<Hand>(initial?.hand||emptyHand);
 const seed=initial?.tournament||contextTournament;
 const showTournament=!!initial?.tournament||(!initial&&mode==='tournament');
 const [counts,setCounts]=useState(countsOf(seed)),[status,setStatus]=useState<Tournament['status']>(seed?.status||'Playing'),[winnings,setWinnings]=useState(String(seed?.winnings??''));
 const [mentions,setMentions]=useState<Mention[]>([]),[images,setImages]=useState<string[]>([]),[keepImages,setKeepImages]=useState(Array.from({length:initial?.imageCount||0},(_,i)=>i));
 const [reviewStep,setReviewStep]=useState(0);
 const [photoBusy,setPhotoBusy]=useState(false),[error,setError]=useState('');
 async function photos(files:FileList|null){
  if(!files?.length)return;if(keepImages.length+images.length+files.length>3){setError('Use up to three photos.');return}setPhotoBusy(true);setError('');
  try{const loaded=await Promise.all(Array.from(files).map(resizePhoto));setImages(old=>[...old,...loaded])}catch(e){setError((e as Error).message)}finally{setPhotoBusy(false)}
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();if(kind==='hand'&&reviewStep!==REVIEW_SHARE_STEP)return;setError('');
  const tournament=showTournament?{...seed,event:seed?.event||'',chips:undefined,bigBlind:undefined,remaining:undefined,started:undefined,...countValues(counts),status,winnings:winnings!==''&&['Out','Cashed'].includes(status)?Number(winnings):undefined}:undefined;
  const parsed=postSchema.safeParse({groupId,kind,body,hand:kind==='hand'?withReview(hand,{}):undefined,tournament,images,keepImages,sessionId:initial?.sessionId,mentions:[...(initial?.mentions||[]),...activeMentions(body,mentions)]});
  if(!parsed.success){setError(parsed.error.issues[0].message);return}
  await onSave({...parsed.data,...(initial?{postId:initial.id}:{})});
 }
 const photoFields=<div className="review-attachments"><strong>Attach images (optional)</strong>
 <label className="field">Images (optional)<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={photoBusy} onChange={e=>{void photos(e.target.files);e.target.value=''}}/><span className="form-hint">Up to 3 photos, visible only to this rail’s members.</span></label>
 {(images.length>0||keepImages.length>0)&&<div className="photo-previews">{keepImages.map(position=><div key={'saved'+position}><Image src={'/api/post-image?post='+encodeURIComponent(initial!.id)+'&position='+position} alt={'Saved photo '+(position+1)} width={140} height={105} unoptimized/><button type="button" aria-label={'Remove saved photo '+(position+1)} onClick={()=>setKeepImages(old=>old.filter(i=>i!==position))}><X size={16}/></button></div>)}{images.map((src,i)=><div key={i}><Image src={src} alt={'New photo '+(i+1)} width={140} height={105} unoptimized/><button type="button" aria-label={'Remove new photo '+(i+1)} onClick={()=>setImages(old=>old.filter((_,n)=>n!==i))}><X size={16}/></button></div>)}</div>}{photoBusy&&<p role="status">Preparing photos…</p>}
 </div>;
 return <form className="post-form" onSubmit={submit}>
 {kind==='hand'?<HandReviewFlow hand={hand} onChange={setHand} step={reviewStep} onStep={step=>{setReviewStep(step);setError('')}} busy={busy||photoBusy}>
  <MentionInput label="Context (optional)" value={body} onChange={setBody} mentions={mentions} onMentions={setMentions} context={{groupId}} maxLength={5000}/>
  {photoFields}
  <label className="field">Result (optional)<textarea value={hand.result||''} onChange={e=>setHand({...hand,result:e.target.value})} maxLength={2000} rows={2}/></label>
  <p className="form-hint">Review completed hands only. Results stay hidden until you reveal them. Your hand and attached photos are shared only with this private rail.</p>
  {error&&<p className="error" role="alert">{error}</p>}<button type="submit" className="primary" disabled={busy||photoBusy}>{busy?'Saving…':initial?'Save changes':'Share with my rail'}</button>
 </HandReviewFlow>:<>

 <MentionInput label={showTournament?'Your update (optional)':'Your post'} value={body} onChange={setBody} mentions={mentions} onMentions={setMentions} context={{groupId}} maxLength={5000}/>
 {photoFields}
 {showTournament&&<><p className="form-hint">Stack and player details are optional.</p><StackFields value={counts} onChange={setCounts}/>
 {counts.chips&&counts.bigBlind&&Number(counts.bigBlind)>0&&<p className="stack-equivalent">{(Number(counts.chips)/Number(counts.bigBlind)).toFixed(1)} big blinds</p>}
 <StatusFields status={status} winnings={winnings} onStatus={setStatus} onWinnings={setWinnings}/></>}
 {error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy||photoBusy}>{busy?'Saving…':initial?'Save changes':'Share with my rail'}</button>
 </>}
 </form>;
}

export function StackStats({value,onUpdate,onStage,onStatus}:{value:Tournament;onUpdate?:()=>void;onStage?:()=>void;onStatus?:()=>void}){
 const status=value.status==='Playing'?'Still Playing':value.status==='Out'?'Busted':value.status==='Cashed'?'Finished':value.status;
 return <div className="tournament-card"><div className="tournament-label"><span>{value.event||(value.gameType==='cash'?'Cash game':'Tournament update')}</span><span className="status">{status}</span></div>
 <p className="form-hint">{[value.location,value.stakes&&'Stakes '+value.stakes,value.buyIn&&'Buy-in '+value.buyIn,value.guarantee&&'Guarantee '+value.guarantee,value.startingStack&&'Starting stack '+value.startingStack].filter(Boolean).join(' · ')}</p>
 <div className="stats"><div><span>CHIPS</span><strong>{value.chips?.toLocaleString()??'—'}</strong></div><div><span>CURRENT BIG BLIND</span><strong>{value.bigBlind?.toLocaleString()??'—'}</strong></div><div><span>PLAYERS LEFT / STARTED</span><strong>{value.remaining?.toLocaleString()??'—'}{value.started!==undefined?' out of '+value.started.toLocaleString():''}</strong></div></div>
 {value.winnings!==undefined&&['Out','Cashed'].includes(value.status)&&<p>Winnings: {value.winnings.toLocaleString(undefined,{maximumFractionDigits:2})}</p>}
 <div className="stack-footer">{value.chips!==undefined&&!!value.bigBlind&&<span>{(value.chips/value.bigBlind).toFixed(1)} BB</span>}{!onStage&&value.stage&&<span>{value.stage}</span>}</div>
 {onUpdate&&<div className="tournament-quick-actions"><button className="outline" onClick={onUpdate}>Update Stack</button>{value.gameType!=='cash'&&onStage&&<button className="outline" aria-label={'Tournament stage: '+(value.stage||'Set stage')} onClick={onStage}>{value.stage||'Tournament stage'}</button>}{onStatus&&<button className="outline" aria-label={'Status: '+status} onClick={onStatus}>Status: {status}</button>}</div>}
 </div>;
}
