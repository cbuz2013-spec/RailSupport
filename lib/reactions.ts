export const REACTIONS=[
 {id:'heart',label:'Heart',emoji:'♥'},
 {id:'nice_hand',label:'Nice hand',emoji:''},
 {id:'donkey',label:'Donkey',emoji:'🫏'},
 {id:'fish',label:'Fish',emoji:'🐟'},
 {id:'shark',label:'Shark',emoji:'🦈'},
 {id:'so_sick',label:'So sick',emoji:'🤢'},
] as const;
export type Reaction=typeof REACTIONS[number]['id'];
export const reactionValues=['heart','nice_hand','donkey','fish','shark','so_sick'] as const;
export type ReactionCounts=Partial<Record<Reaction,number>>;
