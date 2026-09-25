import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'RailSupport · Your people. Your poker.',description:'Private poker groups for hand discussions and tournament updates.',icons:{icon:'/favicon.svg'},robots:{index:false,follow:false},appleWebApp:{capable:true,title:'RailSupport'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#111310'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
