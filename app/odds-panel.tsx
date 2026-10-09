'use client';
import {useState} from 'react';
import {calculateOdds,type OddsResult} from '@/lib/odds';
import type {Hand} from '@/lib/types';

export default function OddsPanel({hand}:{hand?:Hand|null}){
 const [hero,setHero]=useState(hand?.hero||''),[villain,setVillain]=useState(''),[board,setBoard]=useState(hand?.board||'');
 const [result,setResult]=useState<OddsResult|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function run(e:React.FormEvent){e.preventDefault();setBusy(true);setResult(null);setError('');try{setResult(await calculateOdds(hero,villain,board));}catch(err){setError((err as Error).message)}finally{setBusy(false)}}
 return <form className="post-form" onSubmit={run}>
  <p className="muted">Compare two known Hold’em hands at any street. Use the same card notation as hand discussions: Ah Qh, or Qs 9h 4c for a flop. {hand?'Your cards and board were copied from the discussion. Add the other player’s two cards.':''}</p>
  <div className="form-grid"><label className="field">Your cards<input value={hero} onChange={e=>setHero(e.target.value)} placeholder="Ah Qh" required maxLength={8}/></label><label className="field">Other hand<input value={villain} onChange={e=>setVillain(e.target.value)} placeholder="Ks Kd" required maxLength={8}/></label><label className="field full">Board (leave blank preflop)<input value={board} onChange={e=>setBoard(e.target.value)} placeholder="Qs 9h 4c 7h" maxLength={20}/></label></div>
  {error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Calculating…':'Calculate equity'}</button>
  {result&&<div className="odds-result" role="status"><div><span>Your hand</span><strong>{((result.hero+result.ties/2)*100).toFixed(1)}%</strong></div><div><span>Other hand</span><strong>{((result.villain+result.ties/2)*100).toFixed(1)}%</strong></div><div><span>Tie</span><strong>{(result.ties*100).toFixed(1)}%</strong></div><p>{result.exact?'Exact enumeration of all remaining runouts.':`Estimate from ${result.trials.toLocaleString()} random runouts; run again for a fresh sample.`} Equity includes half of tied pots. Tie frequency is shown separately.</p></div>}
  <p className="form-hint">For completed hands only. This compares two specific hands, not unknown opponent ranges or betting decisions.</p>
 </form>;
}
