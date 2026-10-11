import {createHash} from 'node:crypto';
import {passwordEmailConfigured,type PasswordEmail} from './password-email';
export async function sendAccountEmail(data:PasswordEmail,kind:'verify'|'change'){
 if(!passwordEmailConfigured())throw new Error('Account email is not configured.');
 const url=new URL(data.url),base=new URL(process.env.BETTER_AUTH_URL!);
 if(url.origin!==base.origin||!url.pathname.startsWith('/api/auth/')||url.username||url.password)throw new Error('Invalid account destination.');
 const subject=kind==='verify'?'Verify your Rail Social email':'Approve your Rail Social email change';
 const text=`${subject}\n\nOpen this link to continue:\n${url.href}\n\nThis link expires in one hour. If you did not request this, ignore it.\n\nRail Social`;
 const body=JSON.stringify({from:process.env.RAILSOCIAL_EMAIL_FROM!.trim(),to:[data.user.email],subject,text});
 for(let attempt=0;attempt<2;attempt++){
  try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY!.trim(),'Content-Type':'application/json','Idempotency-Key':'rail-account/'+createHash('sha256').update(kind+data.token).digest('hex')},body,signal:AbortSignal.timeout(8000)});if(r.ok)return;if(r.status<500&&r.status!==429)throw new Error('Account email could not be delivered.');}catch(e){if(attempt===1)throw e}
 }
 throw new Error('Account email could not be delivered.');
}
