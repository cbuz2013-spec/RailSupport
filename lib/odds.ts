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
export async function calculateOdds(heroText:string,villainText:string,boardText:string):Promise<OddsResult>{
 const hero=parseCards(heroText),villain=parseCards(villainText),board=parseCards(boardText);
 if(hero.length!==2||villain.length!==2||![0,3,4,5].includes(board.length))throw Error('Enter two cards for each player and 0, 3, 4, or 5 board cards.');
 const known=[...hero,...villain,...board];if(new Set(known).size!==known.length)throw Error('A card cannot appear twice.');
 const deck=[...RANKS].flatMap(r=>[...SUITS].map(s=>r+s)).filter(c=>!known.includes(c));
 const missing=5-board.length,exact=missing<=1,trials=exact?(missing?deck.length:1):(missing===2?12000:24000);
 let wins=0,losses=0,ties=0;
 for(let i=0;i<trials;i++){
  let draw:string[]=[];
  if(exact){if(missing)draw=[deck[i]];}
  else {const used=new Set<number>();while(draw.length<missing){const n=Math.floor(Math.random()*deck.length);if(!used.has(n)){used.add(n);draw.push(deck[n]);}}}
  const complete=[...board,...draw],result=compare(handScore([...hero,...complete]),handScore([...villain,...complete]));
  if(result>0)wins++;else if(result<0)losses++;else ties++;
  if(i%300===299)await new Promise<void>(resolve=>setTimeout(resolve,0));
 }
 return {hero:wins/trials,villain:losses/trials,ties:ties/trials,trials,exact};
}
