'use client';
import PostTimestamp from './post-timestamp';

import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowUpRight, Building2, Check, Copy, MapPin, Plus, Search, Users} from 'lucide-react';
import type {Room, RoomAction, RoomDetail, RoomDirectory, RoomFields} from '@/lib/rooms-validation';
import './room-pages.css';
import {InviteMembers} from './people';
import RoomCommunity from './room-community';
import PostActivity from './post-activity';
import MentionInput from './mention-input';
import {activeMentions,type Mention} from './activity-client';
import RoomLeague from './room-league';

async function request<T>(query: string, action?: RoomAction, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/api/rooms' + query, action
    ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(action)}
    : {signal});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load rooms. Please retry.');
  return data;
}

function RoomForm({room, busy, onSave, onCancel}: {
  room?: Room; busy: boolean; onSave: (fields: RoomFields) => void; onCancel: () => void;
}) {
  return <form className="panel room-form post-form" onSubmit={event => {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    onSave(Object.fromEntries(['name','city','description','address','website'].map(key => [key, String(fields.get(key) || '')])) as RoomFields);
  }}>
    <h2>{room ? 'Edit room details' : 'Create a room page'}</h2>
    <p className="muted">Start with the essentials. Your page stays a draft until its owner publishes it.</p>
    <label className="field">Room name<input name="name" defaultValue={room?.name} minLength={2} maxLength={100} required autoFocus/></label>
    <label className="field">City and region<input name="city" defaultValue={room?.city} placeholder="Las Vegas, Nevada" minLength={2} maxLength={120} required/></label>
    <label className="field">About the room<textarea name="description" defaultValue={room?.description} placeholder="Tell players what makes your room their kind of place." rows={4} maxLength={2000}/></label>
    <label className="field">Street address <span className="muted">(optional)</span><input name="address" defaultValue={room?.address} maxLength={240}/></label>
    <label className="field">Room website <span className="muted">(optional)</span><input name="website" type="url" defaultValue={room?.website} placeholder="https://" maxLength={400}/></label>
    <div className="room-actions"><button className="primary" disabled={busy}>{busy?'Saving…':room?'Save details':'Create draft'}</button><button type="button" className="outline" disabled={busy} onClick={onCancel}>Cancel</button></div>
  </form>;
}

export default function RoomPages() {
  const [announcement,setAnnouncement]=useState(''),[mentions,setMentions]=useState<Mention[]>([]);
  const [roomId, setRoomId] = useState<string|null>(null);
  const [directory, setDirectory] = useState<RoomDirectory|null>(null);
  const [detail, setDetail] = useState<RoomDetail|null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [editor, setEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState('');
  const [inviting,setInviting]=useState(false);
  const [pendingJoin,setPendingJoin]=useState(false);
  const mutation = useRef(false);
  const generation = useRef(0);
  const room = detail?.room;
  const managing = !!room && room.role !== 'member';
  const owner = room?.role === 'owner';

  useEffect(() => {
    const sync = () => {setRoomId(new URLSearchParams(location.search).get('room'));setEditor(false);setConfirm('');setPendingJoin(new URLSearchParams(location.search).get('joinRoom')==='1');setInviting(false);};
    sync(); window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    generation.current++;
    setLoading(true); setError(''); setDetail(null); setDirectory(null);
    const path = roomId ? '?id='+encodeURIComponent(roomId)+'&focus='+encodeURIComponent(new URLSearchParams(location.search).get('post')||'') : '?'+new URLSearchParams({q:query,scope});
    request<RoomDetail & RoomDirectory>(path, undefined, controller.signal).then(data => {
      if(controller.signal.aborted)return;
      if(roomId)setDetail(data);else setDirectory(data);
    }).catch(e => {if(!controller.signal.aborted)setError(e.message);})
      .finally(() => {if(!controller.signal.aborted)setLoading(false);});
    return () => controller.abort();
  }, [roomId, query, scope, revision]);
  useEffect(() => {
    if(!notice)return;
    const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);
  },[notice]);

  function navigate(id: string|null) {
    const url=new URL(location.href);url.searchParams.delete('profile');url.searchParams.delete('invite');url.searchParams.delete('joinRoom');
    url.searchParams.set('view','rooms');if(id)url.searchParams.set('room',id);else url.searchParams.delete('room');
    history.pushState(null,'',url);setRoomId(id);setEditor(false);setConfirm('');setError('');setPendingJoin(false);setInviting(false);
  }
  async function act(action: RoomAction, message: string, onSaved?: () => void) {
    if(mutation.current)return;
    mutation.current=true;setBusy(true);setError('');
    try {
      const result=await request<{id?:string}>('',action);
      if(action.action==='follow'&&action.following){const url=new URL(location.href);url.searchParams.delete('joinRoom');history.replaceState(null,'',url);setPendingJoin(false);}
      onSaved?.();setNotice(message);setConfirm('');
      if(result.id)navigate(result.id);else setRevision(v=>v+1);
    } catch(e) {setError((e as Error).message);}
    finally {mutation.current=false;setBusy(false);}
  }
  async function more() {
    if(mutation.current)return;
    mutation.current=true;setBusy(true);setError('');const current=generation.current;
    try {
      if(roomId&&detail?.nextBefore){
        const data=await request<RoomDetail>('?'+new URLSearchParams({id:roomId,before:detail.nextBefore}));
        if(current===generation.current)setDetail(old=>old?{...data,announcements:[...old.announcements,...data.announcements]}:data);
      }else if(directory?.nextOffset!==null&&directory?.nextOffset!==undefined){
        const data=await request<RoomDirectory>('?'+new URLSearchParams({q:query,scope,offset:String(directory.nextOffset)}));
        if(current===generation.current)setDirectory(old=>old?{...data,rooms:[...old.rooms,...data.rooms]}:data);
      }
    }catch(e){if(current===generation.current)setError((e as Error).message);}
    finally{mutation.current=false;setBusy(false);}
  }

  return <section className="room-pages" aria-label="Room Pages">
    {roomId&&<button className="text-link" disabled={busy} onClick={()=>navigate(null)}><ArrowLeft size={16}/> All rooms</button>}
    <div className="page-title"><div><span className="eyebrow">YOUR NEXT SEAT AT THE TABLE</span><h1>{roomId?'Room page':'Find your room.'}</h1>{!roomId&&<p>Meet the hosts. Follow your favorites. Stay close to the action.</p>}</div>
      {!roomId&&directory?.canCreate&&!editor&&<button className="primary" onClick={()=>setEditor(true)}><Plus size={17}/> Create room</button>}
    </div>
    {error&&<div className="error" role="alert">{error} {!editor&&<button className="text-link" onClick={()=>setRevision(v=>v+1)}>Retry</button>}</div>}
    {notice&&<p className="room-notice" role="status">{notice}</p>}
    {loading?<div className="panel empty" role="status">Loading rooms…</div>:editor?<RoomForm key={room?.id||'new'} room={room} busy={busy} onCancel={()=>setEditor(false)} onSave={fields=>act(room?{action:'edit',roomId:room.id,...fields}:{action:'create',...fields},room?'Room details saved.':'Draft created. Review it before publishing.',()=>setEditor(false))}/>:room?<>
      {pendingJoin&&room.published&&<section className="panel community-section"><h2>{room.following?'You’re already following this room.':'You’re invited to '+room.name}</h2><p>Follow the room to post, comment, invite friends, and join its leagues.</p>{!room.following&&<button className="primary" disabled={busy} onClick={()=>act({action:'follow',roomId:room.id,following:true},'Welcome to '+room.name+'. You can now post and comment.')}>Join room</button>}</section>}
      <article className="panel room-hero">
        <div className="room-emblem" aria-hidden="true"><Building2 size={36}/></div>
        <div className="room-badges"><span className="room-tag">{room.published?'ROOM PAGE':'DRAFT · HOSTS ONLY'}</span>{managing&&<span className="room-tag">{owner?'OWNER':'HOST'}</span>}</div>
        <h2>{room.name}</h2><p className="room-location"><MapPin size={16}/>{room.city}</p>
        <p className="room-description">{room.description||'The hosts are getting this room ready. Follow along for updates.'}</p>
        {room.address&&<p className="muted">{room.address}</p>}
        <div className="room-actions">
          {room.published&&<button className={room.following?'outline':'primary'} disabled={busy} aria-pressed={room.following} onClick={()=>act({action:'follow',roomId:room.id,following:!room.following},room.following?'Room unfollowed.':'Room added to Following.')}>
            {room.following?<Check size={16}/>:<Plus size={16}/>} {room.following?'Following':'Follow room'}</button>}
          {room.website&&<a className="outline" href={room.website} target="_blank" rel="noopener noreferrer">Visit website <ArrowUpRight size={16}/></a>}
          {room.published&&<button className="outline" onClick={async()=>{try{const url=new URL('/',location.origin);url.searchParams.set('view','rooms');url.searchParams.set('room',room.id);url.searchParams.set('joinRoom','1');await navigator.clipboard.writeText(url.toString());setNotice('Invitation link copied. Recipients sign in and choose Join room.');}catch{setError('Could not copy. Copy the room URL from your address bar.');}}}><Copy size={16}/> Copy invite link</button>}
          {room.published&&(room.following||managing)&&<button className="outline" onClick={()=>setInviting(v=>!v)}>Invite members</button>}
        </div>
        <p className="room-caption"><Users size={14}/> {room.followers} {room.followers===1?'follower':'followers'} · Visible to signed-in Rail Social members</p>
      </article>

      {inviting&&room.published&&(room.following||managing)&&<div className="panel"><InviteMembers roomId={room.id}/></div>}
      <RoomCommunity key={'community:'+room.id} roomId={room.id} canPost={managing||room.following}/>
      <RoomLeague key={'league:'+room.id} roomId={room.id} managing={managing} canJoin={managing||room.following}/>
      {managing&&<section className="panel room-management" aria-label="Host controls"><div><span className="eyebrow">HOST DESK</span><h2>Make this room yours.</h2><p className="muted">{room.published?'Your room is in the directory.':'Review your room details and first update before publishing.'}</p></div>
        <div className="room-actions"><button className="outline" disabled={busy} onClick={()=>setEditor(true)}>Edit details</button>{owner&&<button className="outline" disabled={busy} onClick={()=>setConfirm('publish')}>{room.published?'Unpublish room':'Publish room'}</button>}</div>
        {confirm==='publish'&&<div className="room-confirm"><p>{room.published?'Hide this page and its announcements from members? Hosts keep access, and follows are preserved.':'Publish this page and its announcements for signed-in Rail Social members?'}</p><button className="primary" disabled={busy} onClick={()=>act({action:'publish',roomId:room.id,published:!room.published},room.published?'Room returned to draft.':'Room published.')}>Confirm {room.published?'unpublish':'publish'}</button><button className="outline" disabled={busy} onClick={()=>setConfirm('')}>Cancel</button></div>}
      </section>}

      <section className="panel room-hosts"><div className="room-heading"><h2>Your room hosts</h2><Users size={20}/></div><ul>{detail.hosts.map(person=><li key={person.id}><span className="room-host-initial" aria-hidden="true">{person.name.slice(0,1).toUpperCase()}</span><div><strong>{person.name}</strong><small>{person.role==='invited'?'Invitation pending':person.role==='owner'?'Room owner':'Room host'}</small></div>{owner&&person.role!=='owner'&&<button className="text-link" disabled={busy} onClick={()=>setConfirm('host:'+person.id)}>{person.role==='invited'?'Cancel invite':'Remove'}</button>}
        {confirm==='host:'+person.id&&<div className="room-confirm"><p>Remove {person.name} from this room’s host team?</p><button className="outline" disabled={busy} onClick={()=>act({action:'removeHost',roomId:room.id,userId:person.id},'Host access removed.')}>Confirm removal</button><button className="outline" disabled={busy} onClick={()=>setConfirm('')}>Keep host</button></div>}</li>)}</ul>
        {owner&&<form className="post-form" onSubmit={event=>{event.preventDefault();const form=event.currentTarget;act({action:'inviteHost',roomId:room.id,email:String(new FormData(form).get('email'))},'Invitation added to their Rooms page.',()=>form.reset());}}><label className="field">Invite a co-host by account email<input name="email" type="email" required maxLength={254} placeholder="host@example.com"/></label><p className="form-hint">They need a Rail Social account and must accept in Rooms. Hosts can edit details and manage announcements. Only you can publish or manage the host team.</p><button className="outline" disabled={busy}>Invite co-host</button></form>}
      </section>

      <section className="room-updates" aria-label="Room announcements"><div className="room-heading"><h2>From the room</h2><span className="eyebrow">HOST UPDATES</span></div>
        {managing&&<form className="panel post-form room-form" onSubmit={event=>{event.preventDefault();act({action:'announce',roomId:room.id,body:announcement,mentions:activeMentions(announcement,mentions)},'Announcement posted.',()=>{setAnnouncement('');setMentions([])});}}><MentionInput label="Post an announcement" value={announcement} onChange={setAnnouncement} mentions={mentions} onMentions={setMentions} context={{}} maxLength={3000}/><button className="primary" disabled={busy||!announcement.trim()}>Post announcement</button></form>}
        {detail.announcements.length===0?<div className="panel empty"><Building2 size={28}/><h3>The next update starts here.</h3><p>{managing?'Welcome your players with your first announcement.':'The hosts haven’t posted an update yet. Follow this room to find it easily later.'}</p></div>:detail.announcements.map(post=><article className="panel room-announcement" key={post.id}><div className="room-heading"><div><strong>{room.name}</strong><p className="room-caption">{post.name} · <PostTimestamp created={post.created} edited={post.edited}/></p></div></div><p className="room-description">{post.body}</p><PostActivity scope="announcement" postId={post.id} author={{id:post.userId,name:post.name}} body={post.body} postMentions={post.mentions} onChanged={()=>setRevision(v=>v+1)}/></article>)}
        {detail.nextBefore&&<button className="outline" disabled={busy} onClick={more}>Load earlier updates</button>}
      </section>
    </>:directory?<>
      {directory.invitations.map(invite=><section className="panel room-invitation" key={invite.id}><span className="eyebrow">YOU’VE BEEN INVITED TO HOST</span><h2>{invite.name}</h2><p className="muted">Help manage this room’s page and announcements.</p><div className="room-actions"><button className="primary" disabled={busy} onClick={()=>act({action:'acceptHost',roomId:invite.id},'Host invitation accepted.',()=>navigate(invite.id))}>Accept invitation</button><button className="outline" disabled={busy} onClick={()=>act({action:'declineHost',roomId:invite.id},'Invitation declined.')}>Decline</button></div></section>)}
      <div className="panel room-discovery"><form className="room-search" onSubmit={event=>{event.preventDefault();setQuery(search.trim());}}><label className="field">Search rooms<input value={search} onChange={event=>setSearch(event.target.value)} maxLength={120} placeholder="Room name or city"/></label><button className="outline" aria-label="Search rooms"><Search size={18}/></button></form><div className="room-filters" aria-label="Filter rooms">{[['all','All rooms'],['following','Following'],['hosting','My host desk']].map(([value,label])=><button key={value} className={scope===value?'selected':''} aria-pressed={scope===value} disabled={busy} onClick={()=>setScope(value)}>{label}</button>)}</div></div>
      {directory.rooms.length===0?<div className="panel empty"><Building2 size={34}/><h2>{query?'No matching rooms.':scope==='following'?'Your favorites belong here.':scope==='hosting'?'A seat at the host desk.':'The room network starts here.'}</h2><p>{query?'Try another room name or city.':scope==='following'?'Explore All rooms and follow a room to keep it close.':scope==='hosting'?'Room creation is available to approved hosts. Co-host invitations appear here when you receive one.':'Approved hosts can create and publish their first room pages.'}</p>{query&&<button className="outline" onClick={()=>{setSearch('');setQuery('');}}>Clear search</button>}</div>:<div className="room-grid">{directory.rooms.map(item=><button className="panel room-card" key={item.id} onClick={()=>navigate(item.id)}><div className="room-card-top"><span className="room-emblem"><Building2 size={27}/></span><ArrowUpRight size={20}/></div><span className="eyebrow">{item.published?'ROOM PAGE':'DRAFT'}</span><h2>{item.name}</h2><p className="room-location"><MapPin size={14}/>{item.city}</p><p className="room-card-description">{item.description||'Meet the hosts and catch up on the latest room news.'}</p><span className="room-card-bottom">{item.following?<><Check size={14}/> Following</>:`${item.followers} ${item.followers===1?'follower':'followers'}`}{item.role!=='member'&&<span>{item.role==='owner'?'Your room':'Hosting'}</span>}</span></button>)}</div>}
      {directory.nextOffset!==null&&<button className="outline" disabled={busy} onClick={more}>Load more rooms</button>}
      <p className="room-footnote">Room pages are shared with signed-in members. Private rails remain invite only.</p>
    </>:null}
  </section>;
}
