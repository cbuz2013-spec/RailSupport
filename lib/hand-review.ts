import type {Hand,HandReview} from './types';
import {streetActionText} from './hand-actions';

export const REVIEW_STEPS=['Game type','Event details','Current situation','Players','Board','Flop action','Turn action','River action','Context & photos','Review & share'] as const;
export const STREETS=['preflop','flop','turn','river'] as const;
export function reviewDetails(hand:Hand):HandReview {
 return hand.review||{format:'',blinds:'',ante:'',event:'',level:'',remaining:'',opponents:[{cards:'',position:'',stack:''}],actionMode:'notes',notes:hand.action,streets:{preflop:'',flop:'',turn:'',river:''}};
}
export function reviewPlayers(hand:Hand){
 return [{id:'hero',cards:hand.hero,position:hand.position,stack:hand.stack,stackUnit:hand.review?.stackUnit},...reviewDetails(hand).opponents.map((player,index)=>({...player,id:`opponent-${index+1}`}))];
}
export function reviewAction(review:HandReview){
 return review.actionMode==='notes'?review.notes:STREETS.filter(street=>streetActionText(review,street).trim()).map(street=>`${street[0].toUpperCase()+street.slice(1)}: ${streetActionText(review,street).trim()}`).join('\n\n');
}
export function withReview(hand:Hand,patch:Partial<HandReview>,clearEquity=false):Hand {
 const review={...reviewDetails(hand),...patch};
 if(clearEquity){delete review.equity;delete review.streetEquities;}
 return {...hand,review,action:reviewAction(review)};
}
export function equityUnavailable(hand:Hand):string {
 const hands=reviewPlayers(hand).map(player=>player.cards.trim().split(/\s+/).filter(Boolean));
 if(hands.some(cards=>cards.length!==2))return 'To calculate equity, choose two cards for yourself and each opponent. Unknown hands can stay blank—skip equity and continue your review.';
 const board=hand.board.trim().split(/\s+/).filter(Boolean);
 if(![0,3,4,5].includes(board.length))return 'For equity, use no board or a complete flop, turn or river. You can keep a partial board and skip this step.';
 return '';
}
