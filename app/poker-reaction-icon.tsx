import type {Reaction} from '@/lib/reactions';

function Stack({x,y,color='#62c991',height=3}:{x:number;y:number;color?:string;height?:number}){
 return <g>{Array.from({length:height},(_,i)=><g key={i} transform={`translate(${x} ${y-i*5})`}><path d="M-10 0v4c0 7 20 7 20 0V0" fill={color} stroke="#102e24" strokeWidth="2"/><ellipse rx="10" ry="4" fill={color} stroke="#102e24" strokeWidth="2"/><path d="M-7 4h2m10 0h2" stroke="#f7f6e7" strokeWidth="2"/></g>)}</g>;
}
function Card({x,y,angle=0,face=false}:{x:number;y:number;angle?:number;face?:boolean}){
 return <g transform={`translate(${x} ${y}) rotate(${angle})`}><rect x="-10" y="-15" width="20" height="30" rx="3" fill={face?'#fff7df':'#247655'} stroke="#e5c875" strokeWidth="2"/>{face?<path d="M0-7C-2-4-7-2-7 2c0 4 5 5 7 2-2 4-3 5-3 5h6S2 8 0 4c2 3 7 2 7-2 0-4-5-6-7-9Z" fill="#173b2e"/>:<path d="m0-9 5 9-5 9-5-9Z" fill="none" stroke="#b6e7c9" strokeWidth="2"/>}</g>;
}
function Clock({x,y}:{x:number;y:number}){
 return <g transform={`translate(${x} ${y})`}><circle r="11" fill="#fff4cf" stroke="#173b2e" strokeWidth="2"/><path d="M0-7v7l5 3" fill="none" stroke="#173b2e" strokeWidth="2.5" strokeLinecap="round"/></g>;
}
export default function PokerReactionIcon({value}:{value:Reaction}){
 return <svg className="poker-reaction-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
 {value==='all_in'&&<><ellipse cx="32" cy="49" rx="29" ry="11" fill="#163e2e" stroke="#e5c875" strokeWidth="2"/><Stack x={14} y={43} height={3}/><Stack x={33} y={47} height={5} color="#f0c66e"/><Stack x={50} y={43} height={3}/><path d="M23 5h18v9h9L32 28 14 14h9Z" fill="#fff4cf" stroke="#173b2e" strokeWidth="2"/></>}
 {value==='muck_that'&&<><path d="m5 46 35-7 19 12-34 9Z" fill="#183d2e" stroke="#e5c875" strokeWidth="2"/><Card x={20} y={25} angle={-24}/><Card x={38} y={25} angle={18}/><path d="M48 8q15 5 10 22l-6-5m6 5 5-5" fill="none" stroke="#e5c875" strokeWidth="4" strokeLinecap="round"/><path d="m19 49 23-5m-14 9 19-4" stroke="#89cda7" strokeWidth="2"/></>}
 {value==='slow_roll'&&<><Card x={18} y={35} angle={-12}/><Card x={38} y={36} angle={16} face/><Clock x={47} y={13}/><path d="M6 13q8-8 17-4l-3-5m3 5-6 1" fill="none" stroke="#e5c875" strokeWidth="3" strokeLinecap="round"/></>}
 {value==='chip_shuffle'&&<><Stack x={15} y={44} height={5}/><Stack x={49} y={44} height={5} color="#f0c66e"/><Stack x={30} y={49} height={2}/><Stack x={35} y={41} height={2} color="#f0c66e"/><path d="m20 11 7 6-7 6m24-12-7 6 7 6" fill="none" stroke="#fff4cf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></>}
 {value==='tank'&&<><path d="M3 59q0-22 23-23 22 1 24 23" fill="#276b50" stroke="#e5c875" strokeWidth="2"/><circle cx="25" cy="24" r="14" fill="#d6ac7e" stroke="#173b2e" strokeWidth="2"/><path d="M11 21Q9 3 26 6q16 2 13 17l-8-8-9 5Z" fill="#102e24"/><path d="m17 56 3-19 6-8 6 4-5 10 9 13" fill="#d6ac7e" stroke="#173b2e" strokeWidth="2"/><path d="M18 26h5m6 0h4" stroke="#173b2e" strokeWidth="2"/><Clock x={49} y={14}/><Card x={49} y={50} angle={15}/></>}
 </svg>;
}
