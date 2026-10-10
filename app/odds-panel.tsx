'use client';
import {useEffect,useRef,useState} from 'react';
import {Plus,Share2,Trash2} from 'lucide-react';
import {calculateMultiwayOdds,type MultiwayOddsResult} from '@/lib/odds';
import {EQUITY_POSITIONS} from '@/lib/equity-seats';
import type {Group,Hand} from '@/lib/types';
import {createEquityShareDraft,type EquityShareDraft} from '@/lib/equity-share';
import EquityShareComposer from './equity-share-composer';
import CardPicker from './card-picker';
import EquityTable,{EquityCards,type EquityPlayer} from './equity-table';
import './odds-panel.css';

export default function OddsPanel({hand,groups,activeGroupId,userId}:{hand?:Hand|null;groups:Group[];activeGroupId:string;userId:string}){
 const [shareDraft,setShareDraft]=useState<EquityShareDraft|null>(null);
 const [players,setPlayers]=useState<EquityPlayer[]>(()=>[{id:'hero',cards:hand?.hero||'',position:hand?.position||''},{id:'opponent-1',cards:'',position:''}]);
 const [board,setBoard]=useState(hand?.board||''),[active,setActive]=useState('hero');
 const [result,setResult]=useState<MultiwayOddsResult|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0);
 const nextOpponent=useRef(2),calculation=useRef<AbortController|null>(null),editorHeading=useRef<HTMLHeadingElement>(null),focusEditor=useRef(false);
 useEffect(()=>()=>calculation.current?.abort(),[]);
 useEffect(()=>{if(focusEditor.current){editorHeading.current?.focus({preventScroll:true});editorHeading.current?.scrollIntoView({block:'nearest',behavior:'smooth'});focusEditor.current=false}},[active]);
 const activeIndex=players.findIndex(player=>player.id===active),player=players[activeIndex];
 const playerName=activeIndex===0?'Your hand':`Opponent ${activeIndex}`;
 function clearResult(){setResult(null);setError('')}
 function selectEditor(id:string){
  if(id===active){editorHeading.current?.focus({preventScroll:true});editorHeading.current?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
  focusEditor.current=true;setActive(id);
 }
 function changePlayer(patch:Partial<EquityPlayer>){clearResult();setPlayers(previous=>previous.map(item=>item.id===active?{...item,...patch}:item))}
 function addOpponent(){if(players.length>=5)return;const id=`opponent-${nextOpponent.current++}`;clearResult();setPlayers(previous=>[...previous,{id,cards:'',position:''}]);selectEditor(id)}
 function removeOpponent(){if(active==='hero'||active==='board'||players.length<=2)return;clearResult();setPlayers(previous=>previous.filter(item=>item.id!==active));selectEditor('hero')}
 async function run(e:React.FormEvent){
  e.preventDefault();if(busy)return;const controller=new AbortController();calculation.current=controller;setBusy(true);setProgress(0);clearResult();
  try{setResult(await calculateMultiwayOdds(players.map(item=>item.cards),board,{signal:controller.signal,onProgress:setProgress}))}
  catch(err){if(!controller.signal.aborted)setError((err as Error).message)}
  finally{if(calculation.current===controller){calculation.current=null;setBusy(false)}}
 }
 if(shareDraft)return <EquityShareComposer draft={shareDraft} groups={groups} activeGroupId={activeGroupId} userId={userId} onBack={()=>setShareDraft(null)}/>;
 return <form className="post-form equity-calculator" onSubmit={run}>
  <div className="equity-intro"><p>Review a hand with up to four opponents. Tap a seat to choose cards and position, or tap the board. Seats follow position clockwise.</p>{hand&&<p className="form-hint">Your cards, position and board were copied from the discussion.</p>}</div>
  <div className="equity-toolbar"><span>{players.length} players · {players.length-1} of 4 opponents</span><button type="button" className="outline" disabled={busy||players.length===5} onClick={addOpponent}><Plus size={16} aria-hidden="true"/>Add opponent</button></div>
  <EquityTable players={players} board={board} active={active} result={result} disabled={busy} onSelect={selectEditor}/>
  <section className="equity-editor" aria-labelledby="equity-editor-title">
   <div className="equity-editor-heading"><h3 id="equity-editor-title" ref={editorHeading} tabIndex={-1}>{active==='board'?'Community cards':playerName}</h3>{active!=='hero'&&active!=='board'&&players.length>2&&<button type="button" className="equity-remove" disabled={busy} onClick={removeOpponent}><Trash2 size={15} aria-hidden="true"/>Remove opponent</button>}</div>
   {active==='board'?<CardPicker key="board" label="Board" value={board} onChange={value=>{clearResult();setBoard(value)}} maxCards={5} unavailable={players.map(item=>item.cards).join(' ')} hint="Leave blank preflop. Choose 3 cards for the flop, 4 for the turn, or 5 for the river." disabled={busy}/>:player&&<>
    <label className="field equity-position">Position (optional)<select aria-label={`${playerName} position`} value={player.position} disabled={busy} onChange={e=>changePlayer({position:e.target.value})}><option value="">Not specified</option>{player.position&&!EQUITY_POSITIONS.some(item=>item.value===player.position)&&<option value={player.position}>{player.position}</option>}{EQUITY_POSITIONS.map(position=><option key={position.value} value={position.value}>{position.label} ({position.value})</option>)}</select></label>
    <CardPicker key={player.id} label={`${playerName} cards`} value={player.cards} onChange={cards=>changePlayer({cards})} maxCards={2} unavailable={[board,...players.filter(item=>item.id!==active).map(item=>item.cards)].join(' ')} disabled={busy}/>
   </>}
  </section>
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="equity-calculate"><button className="primary" disabled={busy}>{busy?`Calculating… ${Math.round(progress*100)}%`:'Calculate equity'}</button>{busy&&<button type="button" className="outline" onClick={()=>calculation.current?.abort()}>Cancel</button>}</div>
  <button type="button" className="outline" disabled={busy} onClick={()=>{try{setError('');setShareDraft(createEquityShareDraft(players,board,result,hand))}catch(err){setError((err as Error).message)}}}><Share2 size={16}/>Share hand</button>
  {result&&<section className="equity-results" aria-label="Equity results">
   <p role="status" className="equity-result-status">{result.exact?`Exact equity · ${result.trials.toLocaleString()} ${result.trials===1?'runout':'runouts'}`:`Estimated equity · ${result.trials.toLocaleString()} sampled runouts`}</p>
   <table><caption>Hands and equities</caption><thead><tr><th scope="col">Player</th><th scope="col">Position</th><th scope="col">Hand</th><th scope="col">Equity</th></tr></thead><tbody>{players.map((item,index)=><tr key={item.id}><th scope="row">{index===0?'You':`Opponent ${index}`}</th><td>{item.position||'—'}</td><td><EquityCards value={item.cards} count={2}/></td><td><strong>{(result.players[index].equity*100).toFixed(1)}%</strong></td></tr>)}</tbody></table>
   <p className="form-hint">Equity includes each player’s share of tied pots. Percentages are rounded. {result.exact?'Every possible remaining board is included.':'Preflop is an estimate; running it again may give slightly different results.'}</p>
  </section>}
  <p className="form-hint">For completed hands. Uses known cards and a shared pot; positions are labels and don’t change card equity. Betting ranges and side pots aren’t included.</p>
 </form>;
}
