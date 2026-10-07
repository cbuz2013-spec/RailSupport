export async function communityRequest<T>(params:Record<string,string>={},action?:Record<string,unknown>,signal?:AbortSignal):Promise<T>{
 const response=await fetch('/api/community?'+new URLSearchParams(params),action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)}:{signal,cache:'no-store'});
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not complete this request. Please retry.');return data;
}
export type Person={id:string;name:string;bio:string;following:boolean;followsYou:boolean};
export type Invitation={id:string;sender:string;name:string;kind:'room'|'rail'};
export type PeopleData={people:Person[];invitations:Invitation[];nextOffset:number|null};
