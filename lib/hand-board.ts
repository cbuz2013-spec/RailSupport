import type {Hand} from './types';

export type BoardStreet='flop'|'turn'|'river';
export type ReviewBoard=Record<BoardStreet,string>;
const cards=(value:string)=>value.trim().split(/\s+/).filter(Boolean).map(card=>card[0].toUpperCase()+card.slice(1).toLowerCase());

export function reviewBoard(hand:Hand):ReviewBoard{
 if(hand.review?.boardByStreet)return hand.review.boardByStreet;
 const board=cards(hand.board);
 return {flop:board.slice(0,3).join(' '),turn:board[3]||'',river:board[4]||''};
}
export function knownBoardCards(hand:Hand){
 const board=reviewBoard(hand);
 return cards([board.flop,board.turn,board.river].join(' '));
}
// Preserve missing street slots; never move a known turn/river into the flop.
export function streetBoardSlots(hand:Hand,street:'preflop'|BoardStreet):string[]{
 if(street==='preflop')return [];
 const board=reviewBoard(hand),flop=cards(board.flop);
 const slots=Array.from({length:3},(_,i)=>flop[i]||'');
 if(street!=='flop')slots.push(cards(board.turn)[0]||'');
 if(street==='river')slots.push(cards(board.river)[0]||'');
 return slots;
}
// Keep the legacy board safe for calculators that accept only contiguous cards.
export function contiguousBoard(board:ReviewBoard){
 const flop=cards(board.flop),turn=cards(board.turn),river=cards(board.river);
 return [...flop,...(flop.length===3?turn:[]),...(flop.length===3&&turn.length===1?river:[])].join(' ');
}
export function hasBoardGaps(hand:Hand){
 return knownBoardCards(hand).length!==cards(contiguousBoard(reviewBoard(hand))).length;
}
