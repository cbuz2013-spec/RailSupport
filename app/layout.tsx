import type {Metadata,Viewport} from 'next';
import './globals.css';
import './themes.css';
import ThemeToggle from './theme-toggle';
export const metadata:Metadata={title:'Rail Social · Your people. Your poker.',description:'Private poker groups for hand discussions and tournament updates.',icons:{icon:'/favicon.svg',apple:'/icon-192.png'},robots:{index:false,follow:false},appleWebApp:{capable:true,title:'Rail Social'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f6f3eb',colorScheme:'light dark'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('rail-social-theme-v1')==='dark'?'dark':'light'}catch{}"}}/></head><body><ThemeToggle/>{children}</body></html>}
