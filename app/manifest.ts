import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{return {
 id:'/',name:'Rail Social',short_name:'Rail Social',description:'Your people. Your poker.',
 start_url:'/',scope:'/',display:'standalone',background_color:'#f6f3eb',theme_color:'#f6f3eb',
 icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'}]
}}
