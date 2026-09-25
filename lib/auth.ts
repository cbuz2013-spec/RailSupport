import {betterAuth} from 'better-auth';
import {db} from './db';
function createAuth(){
 if(!process.env.BETTER_AUTH_SECRET||!process.env.BETTER_AUTH_URL)throw new Error('Account setup is incomplete');
 return betterAuth({appName:'RailSupport',database:db(),secret:process.env.BETTER_AUTH_SECRET,baseURL:process.env.BETTER_AUTH_URL,emailAndPassword:{enabled:true,minPasswordLength:8},rateLimit:{enabled:true,storage:'database',window:60,max:30},session:{expiresIn:60*60*24*7},advanced:{useSecureCookies:process.env.NODE_ENV==='production'}});
}
let instance:ReturnType<typeof createAuth>|undefined;
export function auth(){return instance??=createAuth();}
