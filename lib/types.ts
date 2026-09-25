export type Group = {id:string;name:string;description:string;kind:'Friends & family'|'Study group'|'Backers';owner:string;code?:string;members:number};
export type Hand = {game:string;stakes:string;position:string;stack:string;hero:string;board:string;pot:string;action:string;question:string;result?:string;revealed:boolean};
export type Tournament = {event:string;chips:number;bigBlind:number;remaining:number;status:'Playing'|'On break'|'Bagged'|'Cashed'|'Out'};
export type Comment = {id:string;name:string;body:string;created:string};
export type Post = {id:string;groupId:string;userId:string;name:string;kind:'update'|'hand';body:string;created:string;hand?:Hand;tournament?:Tournament;likes:number;liked:boolean;comments:Comment[];votes:{Fold:number;Call:number;Raise:number};myVote?:'Fold'|'Call'|'Raise'};
export type User = {id:string;name:string};
