export const RANKS='23456789TJQKA';
export const SUITS='shdc';
export function parseCards(value:string):string[]{
 const cards=value.trim()?value.trim().split(/\s+/):[];
 if(!cards.every(c=>/^[2-9TJQKA][shdc]$/i.test(c)))throw Error('Use cards like Ah Qh. Write ten as T, not 10.');
 return cards.map(c=>c[0].toUpperCase()+c[1].toLowerCase());
}
function five(cards:string[]):number[]{
 const ranks=cards.map(c=>RANKS.indexOf(c[0])+2),suits=cards.map(c=>c[1]);
 const count=new Map<number,number>();ranks.forEach(r=>count.set(r,(count.get(r)||0)+1));
 const ordered=[...count].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 const unique=[...new Set(ranks)].sort((a,b)=>b-a);if(unique.includes(14))unique.push(1);
 let straight=0;for(let i=0;i<=unique.length-5;i++)if(unique[i]-unique[i+4]===4){straight=unique[i];break;}
 const flush=suits.every(s=>s===suits[0]);
 if(flush&&straight)return [8,straight];
 if(ordered[0][1]===4)return [7,ordered[0][0],ordered[1][0]];
 if(ordered[0][1]===3&&ordered[1][1]===2)return [6,ordered[0][0],ordered[1][0]];
 if(flush)return [5,...ranks.sort((a,b)=>b-a)];
 if(straight)return [4,straight];
 if(ordered[0][1]===3)return [3,ordered[0][0],...ordered.slice(1).map(e=>e[0]).sort((a,b)=>b-a)];
 if(ordered[0][1]===2&&ordered[1][1]===2)return [2,Math.max(ordered[0][0],ordered[1][0]),Math.min(ordered[0][0],ordered[1][0]),ordered[2][0]];
 if(ordered[0][1]===2)return [1,ordered[0][0],...ordered.slice(1).map(e=>e[0]).sort((a,b)=>b-a)];
 return [0,...ranks.sort((a,b)=>b-a)];
}
function compare(a:number[],b:number[]):number{for(let i=0;i<Math.max(a.length,b.length);i++)if((a[i]||0)!==(b[i]||0))return (a[i]||0)-(b[i]||0);return 0;}
export function handScore(cards:string[]):number[]{
 let best:number[]=[];
 for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){
  const score=five([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(compare(score,best)>0)best=score;
 }
 return best;
}
export type OddsResult={hero:number;villain:number;ties:number;trials:number;exact:boolean};
export type PlayerEquity={equity:number;win:number;tie:number};
export type MultiwayOddsResult={players:PlayerEquity[];trials:number;exact:boolean};
type CalculationOptions={signal?:AbortSignal;onProgress?:(fraction:number)=>void};

// Direct seven-card evaluation avoids 21 five-card combinations per player/runout.
// handScore remains an independent enumeration reference for regression checks.
function sevenScore(cards:string[]):number{
 const counts=new Uint8Array(15),suitCounts=new Uint8Array(4),suitMasks=[0,0,0,0];let mask=0;
 for(const card of cards){const rank=RANKS.indexOf(card[0])+2,suit=SUITS.indexOf(card[1]);counts[rank]++;suitCounts[suit]++;suitMasks[suit]|=1<<rank;mask|=1<<rank;}
 const encode=(kind:number,values:number[])=>{let score=kind;for(let i=0;i<5;i++)score=score*15+(values[i]||0);return score;};
 const straight=(ranks:number)=>{if(ranks&(1<<14))ranks|=1<<1;for(let high=14;high>=5;high--)if(((ranks>>(high-4))&31)===31)return high;return 0;};
 const ranks:number[]=[],pairs:number[]=[],trips:number[]=[];let quad=0,flush=-1;
 for(let rank=14;rank>=2;rank--)if(counts[rank]){ranks.push(rank);if(counts[rank]>=2)pairs.push(rank);if(counts[rank]>=3)trips.push(rank);if(counts[rank]===4)quad=rank;}
 for(let suit=0;suit<4;suit++)if(suitCounts[suit]>=5){flush=suit;const high=straight(suitMasks[suit]);if(high)return encode(8,[high]);}
 if(quad)return encode(7,[quad,ranks.find(rank=>rank!==quad)!]);
 if(trips.length){const pair=pairs.find(rank=>rank!==trips[0]);if(pair)return encode(6,[trips[0],pair]);}
 if(flush>=0)return encode(5,ranks.filter(rank=>suitMasks[flush]&(1<<rank)).slice(0,5));
 const high=straight(mask);if(high)return encode(4,[high]);
 if(trips.length)return encode(3,[trips[0],...ranks.filter(rank=>rank!==trips[0]).slice(0,2)]);
 if(pairs.length>=2)return encode(2,[pairs[0],pairs[1],ranks.find(rank=>rank!==pairs[0]&&rank!==pairs[1])!]);
 if(pairs.length)return encode(1,[pairs[0],...ranks.filter(rank=>rank!==pairs[0]).slice(0,3)]);
 return encode(0,ranks.slice(0,5));
}

export async function calculateMultiwayOdds(handTexts:string[],boardText:string,options:CalculationOptions={}):Promise<MultiwayOddsResult>{
 if(handTexts.length<2||handTexts.length>5)throw Error('Compare your hand with 1 to 4 opponents.');
 const hands=handTexts.map(parseCards),board=parseCards(boardText);
 const incomplete=hands.findIndex(hand=>hand.length!==2);
 if(incomplete>=0)throw Error(`Choose two cards for ${incomplete===0?'your hand':`Opponent ${incomplete}`}.`);
 if(![0,3,4,5].includes(board.length))throw Error('Choose 0, 3, 4, or 5 board cards.');
 const known=[...hands.flat(),...board];if(new Set(known).size!==known.length)throw Error('A card cannot appear twice.');
 const deck=[...RANKS].flatMap(r=>[...SUITS].map(s=>r+s)).filter(c=>!known.includes(c));
 const missing=5-board.length,exact=missing<=2;
 const trials=exact?(missing===2?deck.length*(deck.length-1)/2:missing===1?deck.length:1):24000;
 const shares=hands.map(()=>0),wins=hands.map(()=>0),ties=hands.map(()=>0);
 let first=0,second=1;
 const checkCancelled=()=>{if(options.signal?.aborted)throw new DOMException('Calculation cancelled.','AbortError');};
 checkCancelled();options.onProgress?.(0);
 for(let i=0;i<trials;i++){
  const draw:string[]=[];
  if(exact){
   if(missing===1)draw.push(deck[i]);
   else if(missing===2){draw.push(deck[first],deck[second]);second++;if(second===deck.length){first++;second=first+1;}}
  }
  else {const used=new Set<number>();while(draw.length<missing){const n=Math.floor(Math.random()*deck.length);if(!used.has(n)){used.add(n);draw.push(deck[n]);}}}
  const complete=[...board,...draw],scores=hands.map(hand=>sevenScore([...hand,...complete])),best=Math.max(...scores);
  const winners=scores.map((score,index)=>score===best?index:-1).filter(index=>index>=0);
  for(const winner of winners){shares[winner]+=1/winners.length;if(winners.length===1)wins[winner]++;else ties[winner]++;}
  if(i%250===249){options.onProgress?.((i+1)/trials);await new Promise<void>(resolve=>setTimeout(resolve,0));checkCancelled();}
 }
 checkCancelled();options.onProgress?.(1);
 return {players:hands.map((_,index)=>({equity:shares[index]/trials,win:wins[index]/trials,tie:ties[index]/trials})),trials,exact};
}

export async function calculateOdds(heroText:string,villainText:string,boardText:string):Promise<OddsResult>{
 const result=await calculateMultiwayOdds([heroText,villainText],boardText);
 return {hero:result.players[0].win,villain:result.players[1].win,ties:result.players[0].tie,trials:result.trials,exact:result.exact};
}
