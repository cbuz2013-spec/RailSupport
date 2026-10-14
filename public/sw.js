/* Push only: do not cache private pages, images, credentials, or API responses. */
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{}}catch{}
 const path=typeof data.url==='string'&&data.url.startsWith('/?')&&!data.url.startsWith('//')?data.url:'/?view=notifications';
 event.waitUntil(self.registration.showNotification('Rail Social',{
  body:typeof data.body==='string'?data.body.slice(0,200):'New activity on Rail Social.',
  icon:'/icon-512.png',badge:'/icon-192.png',tag:typeof data.tag==='string'?data.tag:undefined,
  data:{url:path},renotify:false
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL(event.notification.data?.url||'/?view=notifications',self.location.origin);
 if(url.origin!==self.location.origin)return;
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){if(new URL(client.url).origin===url.origin){await client.navigate(url.href);return client.focus()}}
  return self.clients.openWindow(url.href);
 })());
});
