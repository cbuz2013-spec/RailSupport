import type {Post} from './types';

export const SOLVER_ORIGIN = 'https://spot-solver-v20-1.vercel.app';
export const SOLVER_URL = SOLVER_ORIGIN + '/';
export type ImportState = 'pending' | 'imported' | 'rejected' | 'timeout';
export type SolverHand = Record<'game'|'hero'|'board'|'position'|'stakes'|'stack'|'pot'|'action'|'question'|'context',string>;
export function solverHand(post:Post):SolverHand {
 const h=post.hand;
 return {game:h?.game??'',hero:h?.hero??'',board:h?.board??'',position:h?.position??'',stakes:h?.stakes??'',stack:h?.stack??'',pot:h?.pot??'',action:h?.action??'',question:h?.question??'',context:post.body??''};
}

export function connectSpotSolver(frame:HTMLIFrameElement,onStatus:(state:ImportState,message:string)=>void){
 let ready=false, destroyed=false, attempts=0;
 let timer:ReturnType<typeof setInterval>|undefined;
 let pending:{type:string;version:number;requestId:string;hand:SolverHand}|null=null;
 let latest:SolverHand|null=null;
 const stop=()=>{if(timer!==undefined)clearInterval(timer);timer=undefined;};
 const post=(data:unknown)=>frame.contentWindow?.postMessage(data,SOLVER_ORIGIN);
 function tick(){
  if(destroyed||!pending)return;
  if(++attempts>20){stop();pending=null;onStatus('timeout','Import was not confirmed. Retry when Spot Solver is ready.');return;}
  post(ready?pending:{type:'railsupport:hello',version:1});
 }
 function begin(hand:SolverHand){
  if(destroyed)return;
  stop();latest={...hand};
  pending={type:'railsupport:import-hand',version:1,requestId:crypto.randomUUID(),hand:{game:hand.game,hero:hand.hero,board:hand.board,position:hand.position,stakes:hand.stakes,stack:hand.stack,pot:hand.pot,action:hand.action,question:hand.question,context:hand.context}};
  attempts=0;onStatus('pending','Sending this hand to Spot Solver…');timer=setInterval(tick,500);tick();
 }
 function message(event:MessageEvent){
  if(destroyed||event.origin!==SOLVER_ORIGIN||event.source!==frame.contentWindow)return;
  const d=event.data;if(!d||typeof d!=='object'||d.version!==1)return;
  if(d.type==='spotsolver:ready'){ready=true;if(pending)post(pending);return;}
  if(!pending||d.requestId!==pending.requestId)return;
  if(d.type!=='spotsolver:hand-imported'&&d.type!=='spotsolver:hand-rejected')return;
  stop();pending=null;
  if(d.type==='spotsolver:hand-imported')onStatus('imported','Cards and notes imported for review. Enter amounts and ranges before analyzing.');
  else onStatus('rejected',typeof d.message==='string'?d.message.slice(0,500):'Spot Solver rejected this hand. Check the cards and position.');
 }
 function loaded(){ready=false;if(latest)begin(latest);else post({type:'railsupport:hello',version:1});}
 window.addEventListener('message',message);frame.addEventListener('load',loaded);
 post({type:'railsupport:hello',version:1});
 return {importHand:begin,destroy(){destroyed=true;stop();pending=null;latest=null;window.removeEventListener('message',message);frame.removeEventListener('load',loaded);}};
}
