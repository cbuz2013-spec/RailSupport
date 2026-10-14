export const REACTIONS=[
 {id:'heart',label:'Heart',emoji:'♥'},
 {id:'nice_hand',label:'Nice hand',emoji:''},
 {id:'donkey',label:'Donkey',emoji:'🫏'},
 {id:'fish',label:'Fish',emoji:'🐟'},
 {id:'shark',label:'Shark',emoji:'🦈'},
 {id:'so_sick',label:'So sick',emoji:'🤢'},
 {id:'all_in',label:'All In',emoji:''},
 {id:'muck_that',label:'Muck That',emoji:''},
 {id:'slow_roll',label:'Slow Roll',emoji:''},
 {id:'chip_shuffle',label:'Chip Shuffling',emoji:''},
 {id:'tank',label:'Tank',emoji:''},
] as const;
export type Reaction=typeof REACTIONS[number]['id'];
export const reactionValues=['heart','nice_hand','donkey','fish','shark','so_sick','all_in','muck_that','slow_roll','chip_shuffle','tank'] as const;
export type ReactionCounts=Partial<Record<Reaction,number>>;
