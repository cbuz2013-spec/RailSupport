import {prepareAccountDeletion} from './account-deletion';
import {betterAuth} from 'better-auth';
import {db} from './db';
import {after} from 'next/server';
import {authOptions} from './auth-options';
function createAuth(){
 const options=authOptions(db());
 return betterAuth({...options,user:{...options.user,deleteUser:{enabled:true,beforeDelete:async user=>prepareAccountDeletion(db(),user.id)}},emailVerification:{...options.emailVerification,afterEmailVerification:async user=>{await db().query('DELETE FROM "session" WHERE "userId"=$1',[user.id])}},advanced:{...options.advanced,backgroundTasks:{handler:promise=>{
   // Keep delivery alive on Vercel without making the HTTP response disclose account existence.
   const delivery=promise.catch(()=>console.error('Rail Social password email delivery failed. Check Resend delivery logs.'));
   after(async()=>{await delivery;});
 }}}});
}
let instance:ReturnType<typeof createAuth>|undefined;
export function auth(){return instance??=createAuth();}
