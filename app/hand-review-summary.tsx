import HandStreetFrames from './hand-street-frames';
import type {Hand} from '@/lib/types';
import {reviewDetails,reviewPlayers} from '@/lib/hand-review';
import {EquityCards} from './equity-table';
import './hand-review.css';
import './odds-panel.css';

export default function HandReviewSummary({hand,equityOnly=false}:{hand:Hand;equityOnly?:boolean}){
 if(!equityOnly)return <HandStreetFrames hand={hand}/>;
 if(!hand.review)return null;
 const review=reviewDetails(hand),players=reviewPlayers(hand),equity=review.equity;
 const details=[review.format==='cash'?'Cash game':review.format==='tournament'?'Tournament':'',review.blinds&&`Blinds: ${review.blinds}`,review.format==='tournament'&&review.ante&&`Ante: ${review.ante}`,review.format==='tournament'&&review.event,review.format==='tournament'&&review.level&&`Level: ${review.level}`,review.format==='tournament'&&review.remaining&&`Players remaining: ${review.remaining}`].filter(Boolean);
 return <section className="review-summary" aria-label={equityOnly?'Equity results':'Hand review details'}>
  {!equityOnly&&details.length>0&&<p className="review-info">{details.join(' · ')}</p>}
  <div className="review-table-wrap"><table><caption>{equityOnly?'Hands and equities':'Players and known cards'}</caption><thead><tr><th scope="col">Player</th><th scope="col">Position</th>{!equityOnly&&<th scope="col">Stack</th>}<th scope="col">Cards</th>{equity&&<th scope="col">Equity</th>}</tr></thead><tbody>{players.map((player,index)=><tr key={player.id}><th scope="row">{index===0?'You':`Opponent ${index}`}</th><td>{player.position||'—'}</td>{!equityOnly&&<td>{player.stack||'—'}</td>}<td>{player.cards?<EquityCards value={player.cards} count={2}/>:<span className="form-hint">Unknown</span>}</td>{equity&&<td>{(equity.players[index].equity*100).toFixed(1)}%</td>}</tr>)}</tbody></table></div>
  {!equityOnly&&<p className="form-hint">Board: {hand.board||'Not entered'}{hand.pot?` · Pot: ${hand.pot}`:''}</p>}
  {equity&&<p className="form-hint" role="status">{equity.exact?'Exact':'Estimated'} equity · {equity.trials.toLocaleString()} {equity.exact?'runouts':'sampled runouts'}. Includes shares of tied pots.</p>}
 </section>;
}
