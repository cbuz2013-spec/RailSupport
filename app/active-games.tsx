'use client';
import {useEffect,useRef,useState} from 'react';
import {Building2,Flag,Lock,RefreshCw,Users} from 'lucide-react';
import type {ActiveGame,ActiveGamesData,GameFilter} from '@/lib/active-games';
import PostTimestamp from './post-timestamp';
import './active-games.css';

export function GameCard({game}:{game:ActiveGame}){
 const t=game.tournament;
 return <article className="panel active-game-card"><header><span className="eyebrow">{game.source==='room'?<Building2 size={16}/>:<Flag size={16}/>} {game.source==='room'?'ROOM GAME':game.kind==='cash'?'CASH GAME':'TOURNAMENT'}</span><span className="status">{game.active?'In Progress':'Finished'}</span></header>
 <h2>{game.private?`${game.playerName}’s ${game.kind==='cash'?'cash game':'tournament'}`:game.name||`${game.playerName}’s ${game.kind==='cash'?'cash game':'tournament'}`}</h2>
 <p className="muted">{game.source==='room'?game.roomName:game.private?(game.followingPlayer?'Following this player':'From a rail you joined'):game.playerName+' · '+game.railName}</p>
 {game.private?<p className="game-private"><Lock size={15}/> Updates and chat are invite-only.</p>:t&&<div className="game-counts">{t.chips!==undefined&&<span><b>{t.chips.toLocaleString()}</b> chips</span>}{t.bigBlind!==undefined&&<span><b>{t.bigBlind.toLocaleString()}</b> big blind</span>}{t.remaining!==undefined&&<span><b>{t.remaining.toLocaleString()}{t.started!==undefined?' out of '+t.started.toLocaleString():''}</b> players</span>}{t.stage&&<span>{t.stage}</span>}</div>}
 <div className="game-time">{game.active?'Started':'Finished'} <PostTimestamp created={!game.active&&game.finishedAt?game.finishedAt:game.created}/></div>
 <a className="primary" href={game.href}>{game.source==='room'?'Open room':game.private?'View player':'Open rail'}</a></article>;
}
export default function ActiveGames(){
 const [filter,setFilter]=useState<GameFilter>('all'),[data,setData]=useState<ActiveGamesData|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[more,setMore]=useState(false),[revision,setRevision]=useState(0);
 const generation=useRef(0),pending=useRef(false),loadedExtra=useRef(false),dataRef=useRef(data);dataRef.current=data;
 const [selectedGame]=useState(()=>typeof location==='undefined'?'':new URLSearchParams(location.search).get('game')||'');
 useEffect(()=>{
  const n=++generation.current,controller=new AbortController();let running=false;
  loadedExtra.current=false;setData(null);setLoading(true);setError('');
  async function load(){if(running||document.hidden)return;running=true;
   try{const r=await fetch('/api/games?'+new URLSearchParams({filter,game:selectedGame}),{signal:controller.signal});const next=await r.json();if(!r.ok)throw Error(next.error);if(n===generation.current){setData(next);setError('')}}catch(e){if(!controller.signal.aborted&&n===generation.current)setError((e as Error).message)}finally{running=false;if(n===generation.current)setLoading(false)}
  }
  void load();const timer=setInterval(()=>{if(!pending.current&&!loadedExtra.current)void load()},20000);const onVisible=()=>{if(!document.hidden&&!pending.current&&!loadedExtra.current)void load()};window.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible)};
 },[filter,revision,selectedGame]);
 async function loadMore(){const page=dataRef.current;if(page?.nextOffset==null||pending.current)return;pending.current=true;setMore(true);const n=generation.current;
  try{const r=await fetch('/api/games?'+new URLSearchParams({filter,game:selectedGame,offset:String(page.nextOffset)}));const next=await r.json();if(!r.ok)throw Error(next.error);if(n===generation.current){loadedExtra.current=true;setData(old=>old?{games:[...old.games,...next.games.filter((g:ActiveGame)=>!old.games.some(item=>item.id===g.id))],selected:old.selected||next.selected,nextOffset:next.nextOffset}:next)}}catch(e){if(n===generation.current)setError((e as Error).message)}finally{pending.current=false;setMore(false)}
 }
 return <section className="active-games-page" aria-label="Active Games"><div className="page-title"><div><span className="eyebrow"><Users size={14}/> YOUR POKER CIRCLE</span><h1>Active Games</h1><p>Live games from players, rooms, and rails you follow or have joined.</p></div><button className="outline" aria-label="Refresh active games" onClick={()=>setRevision(v=>v+1)}><RefreshCw size={18}/> Refresh</button></div>
 <div className="game-filters" role="group" aria-label="Filter active games">{([['all','All games'],['players','Players'],['rooms','Rooms'],['rails','Rails']] as const).map(([value,label])=><button className={'outline '+(filter===value?'selected':'')} type="button" aria-pressed={filter===value} key={value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
 {error&&<p className="error" role="alert">{error}</p>}{loading?<p className="panel empty" role="status">Loading active games…</p>:<>{selectedGame&&!data?.selected&&<p className="muted">This game is no longer available to you.</p>}{data?.selected&&!data.selected.active&&<><p className="form-hint">This tournament has finished.</p><GameCard game={data.selected}/></>}
 {data?.games.length?<div className="active-games-grid">{data.games.map(game=><GameCard key={game.source+game.id} game={game}/>)}</div>:!error&&<div className="panel empty"><Flag size={30}/><h2>No active games right now.</h2><p>Follow players and rooms, or join a rail. Their active games will appear here.</p><a className="outline" href="/?view=people">Find players</a><a className="outline" href="/?view=rooms">Find rooms</a></div>}
 {data?.nextOffset!=null&&<button className="outline" disabled={more} onClick={()=>void loadMore()}>{more?'Loading…':'More games'}</button>}</>}
 <p className="form-hint">Tournament starts and finishes appear in Notifications. Enable device notifications there for alerts while you’re away.</p></section>;
}
