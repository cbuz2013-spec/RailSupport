'use client';
import {useEffect,useState} from 'react';
import type {PostScope} from '@/lib/activity';
import type {Reaction,ReactionCounts} from '@/lib/reactions';
import {activityRequest,activityChanged} from './activity-client';
import ReactionButton from './reaction-button';
export default function StreetReactions({scope,postId,street}:{scope:PostScope;postId:string;street:string}){
 const [state,setState]=useState<{reactions:ReactionCounts;myReaction:Reaction|null;canReact:boolean}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();activityRequest<typeof state>(undefined,{streetState:'1',scope,postId,street},c.signal).then(setState).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[scope,postId,street]);
 return <><ReactionButton value={state?.myReaction} counts={state?.reactions} context={{scope,postId,street}} disabled={busy||!state?.canReact} onChange={async reaction=>{setBusy(true);setError('');try{await activityRequest({action:'reactStreet',scope,postId,street,reaction});setState(await activityRequest(undefined,{streetState:'1',scope,postId,street}));activityChanged();return true}catch(e){setError((e as Error).message);return false}finally{setBusy(false)}}}/>{error&&<p role="alert" className="error">{error}</p>}</>;
}
