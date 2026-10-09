'use client';
import {useState} from 'react';
import {calculateOdds,type OddsResult} from '@/lib/odds';
import type {Hand} from '@/lib/types';
import CardPicker from './card-picker';

export default function OddsPanel({hand}:{hand?:Hand|null}){
 const [hero,setHero]=useState(hand?.hero||''),[villain,setVillain]=useState(''),[board,setBoard]=useState(hand?.board||'');
 const [result,setResult]=useState<OddsResult|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 function changeCards(setValue:(value:string)=>void,value:string){setValue(value);setResult(null);setError('')}
 async function run(e:React.FormEvent){e.preventDefault();setBusy(true);setResult(null);setError('');try{setResult(await calculateOdds(hero,villain,board));}catch(err){setError((err as Error).message)}finally{setBusy(false)}}
 return <form className="post-form" onSubmit={run}>
  <p className="muted">Compare two known Hold’em hands at any street. Tap a suit, then a value to choose each card. {hand?'Your cards and board were copied from the discussion. Add the other player’s two cards.':''}</p>
  <CardPicker label="Your cards" value={hero} onChange={value=>changeCards(setHero,value)} maxCards={2} unavailable={`${villain} ${board}`} disabled={busy}/>
  <CardPicker label="Other hand" value={villain} onChange={value=>changeCards(setVillain,value)} maxCards={2} unavailable={`${hero} ${board}`} disabled={busy}/>
  <CardPicker label="Board" value={board} onChange={value=>changeCards(setBoard,value)} maxCards={5} unavailable={`${hero} ${villain}`} hint="Leave blank preflop. Choose 3 cards for the flop, 4 for the turn, or 5 for the river." disabled={busy}/>
  {error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Calculating…':'Calculate equity'}</button>
  {result&&<div className="odds-result" role="status"><div><span>Your hand</span><strong>{((result.hero+result.ties/2)*100).toFixed(1)}%</strong></div><div><span>Other hand</span><strong>{((result.villain+result.ties/2)*100).toFixed(1)}%</strong></div><div><span>Tie</span><strong>{(result.ties*100).toFixed(1)}%</strong></div><p>{result.exact?'Exact enumeration of all remaining runouts.':`Estimate from ${result.trials.toLocaleString()} random runouts; run again for a fresh sample.`} Equity includes half of tied pots. Tie frequency is shown separately.</p></div>}
  <p className="form-hint">For completed hands only. This compares two specific hands, not unknown opponent ranges or betting decisions.</p>
 </form>;
}
