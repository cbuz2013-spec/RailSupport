'use client';
import {useState} from 'react';
import type {Hand,HandActionKind,HandReview} from '@/lib/types';
import {reviewDetails,withReview} from '@/lib/hand-review';
import {ACTION_LABELS,actionPlayerName,actionState,actionText,streetActionText} from '@/lib/hand-actions';
import {streetName,type Street} from '@/lib/hand-streets';

export default function HandActionEditor({hand,street,onChange}:{hand:Hand;street:Street;onChange:(patch:Partial<HandReview>)=>void}){
 const review=reviewDetails(hand),actions=review.actions?.[street]||[],state=actionState(hand,street);
 const [sizing,setSizing]=useState<'bet'|'raise'|null>(null),[amount,setAmount]=useState(''),[unit,setUnit]=useState<'chips'|'bb'>(actions.at(-1)?.unit||'bb'),[allIn,setAllIn]=useState(false),[error,setError]=useState('');
 function record(kind:HandActionKind){
  if(!state.current)return;
  if(sizing&&amount&&!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(amount.trim())){setError('Enter a positive size, or leave it blank.');return;}
  const next=[...actions,{playerId:state.current.id,position:state.current.position,kind,amount:kind==='bet'||kind==='raise'?amount.trim():'',unit,allIn:(kind==='bet'||kind==='raise'||kind==='call')&&allIn}];
  const patch={actionMode:'streets' as const,actions:{...review.actions,[street]:next}},draft=withReview(hand,patch),check=actionState(draft,street);
  if(check.error){setError(check.error);return;}
  if(next.length>80||draft.action.length>5000){setError('This hand has reached the action limit. Shorten the history or use a summary in notes.');return;}
  onChange(patch);setSizing(null);setAmount('');setAllIn(false);setError('');
 }
 function undo(){onChange({actions:{...review.actions,[street]:actions.slice(0,-1)}});setSizing(null);setError('');}
 return <section className="hand-action-editor" aria-label={`${streetName(street)} action entry`}>
  <h4>{streetName(street)} action</h4>
  <p className="form-hint">{street==='preflop'?'Preflop: UTG → MP → LJ → HJ → CO → BTN → SB → BB.':'After the flop: SB → BB → UTG → MP → LJ → HJ → CO → BTN.'} Only entered players are included. If Heads-up table is selected, button/SB acts first preflop and BB acts first postflop.</p>
  <p className="form-hint">Use the buttons or just add notes. Folded and all-in players are skipped on later streets; skipped notes do not imply a fold.</p>
  {state.error?<p className="form-hint" role="status">{state.error}</p>:state.current?<>
   <div className="action-turn" role="status"><span>Next to act</span><strong>{state.current.position} · {actionPlayerName(state.current.id)}</strong></div>
   <div className="action-order" aria-label="Action order">{state.players.map(p=><span key={p.id} aria-current={p.id===state.current?.id?'step':undefined} className={state.folded.has(p.id)?'is-folded':''}>{p.position}{state.folded.has(p.id)?' · folded':state.allIn.has(p.id)?' · all-in':''}</span>)}</div>
   <div className="action-buttons">{(['check','bet','call','fold','raise'] as const).map(kind=><button type="button" className="outline" key={kind} disabled={!state.allowed.includes(kind)} aria-pressed={sizing===kind} onClick={()=>{setError('');if(kind==='bet'||kind==='raise'){setSizing(kind);setAmount('');}else record(kind);}}>{ACTION_LABELS[kind]}</button>)}</div>
   {sizing&&<div className="action-sizing"><div className="stack-entry"><label className="field">{sizing==='raise'?'Raise to':'Bet size'} (optional)<input inputMode="decimal" maxLength={30} value={amount} onChange={e=>setAmount(e.target.value)} placeholder={unit==='bb'?'e.g. 3':'e.g. 1,200'}/></label><label className="field">Action size unit<select value={unit} onChange={e=>setUnit(e.target.value as 'chips'|'bb')}><option value="bb">Big blinds</option><option value="chips">Chips</option></select></label></div><p className="form-hint">Raise to is the total wager for this street. You can record the action without remembering its size.</p><button className="primary" type="button" onClick={()=>record(sizing)}>Add {sizing}</button><button className="text-link" type="button" onClick={()=>{setSizing(null);setAmount('');setAllIn(false)}}>Cancel size entry</button></div>}
   {(sizing||state.allowed.includes('call'))&&<label className="action-all-in"><input type="checkbox" checked={allIn} onChange={e=>setAllIn(e.target.checked)}/>This bet, raise or call puts this player all-in</label>}
  </>:<p className="review-info" role="status">Betting round complete. Continue to the next screen, or undo to correct an action.</p>}
  {actions.length>0&&<><ol className="action-history">{actions.map((action,i)=><li key={i}>{actionText(action)}</li>)}</ol><button type="button" className="outline" onClick={undo}>Undo last action</button>{state.error&&streetActionText(review,street).length<=1200&&<button type="button" className="text-link" onClick={()=>onChange({actions:{...review.actions,[street]:[]},streets:{...review.streets,[street]:streetActionText(review,street)}})}>Keep recorded actions as notes</button>}</>}
  {error&&<p className="error" role="alert">{error}</p>}
  <label className="field">{streetName(street)} action notes (optional)<textarea rows={4} maxLength={1200} value={review.streets[street]} onChange={e=>onChange({actionMode:'streets',streets:{...review.streets,[street]:e.target.value}})} placeholder="Add context, an incomplete action sequence, or anything you remember."/></label>
 </section>;
}
