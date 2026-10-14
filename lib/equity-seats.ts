export const EQUITY_POSITIONS = [
 {value:'SB',label:'Small blind'},
 {value:'BB',label:'Big blind'},
 {value:'UTG',label:'Under the gun'},
 {value:'MP',label:'Middle position'},
 {value:'LJ',label:'Low jack'},
 {value:'HJ',label:'High jack'},
 {value:'CO',label:'Cutoff'},
 {value:'BTN',label:'Button'},
];

function positionOrder(position:string):number {
 // Older hand discussions can still prefill UTG+1.
 if(position==='UTG+1')return 2.5;
 const index=EQUITY_POSITIONS.findIndex(item=>item.value===position);
 return index<0?EQUITY_POSITIONS.length:index;
}

export function equitySeats<T extends {position:string}>(players:T[]) {
 const ordered=players.map((player,index)=>({player,index})).sort((a,b)=>positionOrder(a.player.position)-positionOrder(b.player.position)||a.index-b.index);
 const hero=ordered.findIndex(item=>item.index===0);
 // Rotate the clockwise order so your seat stays at the bottom. Original
 // indices continue to identify each player's hand and calculation result.
 const clockwise=[...ordered.slice(hero),...ordered.slice(0,hero)];
 const slots=players.length===5?[0,3,1,2,4]:players.length===4?[0,3,1,2]:[0,1,2];
 return clockwise.map((item,index)=>({...item,slot:slots[index]}));
}
