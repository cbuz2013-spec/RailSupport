'use client';
import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {recoveryReturnTo} from '@/lib/password-recovery';

export default function PasswordRecoveryForm({mode, available}:{mode:'request'|'reset'; available:boolean}) {
  const [token,setToken]=useState(''), [returnTo,setReturnTo]=useState('/'), [loaded,setLoaded]=useState(false);
  const [invalid,setInvalid]=useState(false), [busy,setBusy]=useState(false), [sent,setSent]=useState(false), [done,setDone]=useState(false), [error,setError]=useState('');
  const initialized=useRef(false);
  useEffect(()=>{
    if(initialized.current)return;initialized.current=true;
    const query=new URLSearchParams(window.location.search);
    setReturnTo(recoveryReturnTo(query.get('returnTo')));
    if(mode==='reset') {
      const value=query.get('token')||'';
      setToken(value);setInvalid(!value || value.length>256 || query.has('error'));
      // Remove the reset credential from the address bar/history while the form is open.
      query.delete('token');query.delete('error');
      history.replaceState(null,'',location.pathname+(query.size?'?'+query.toString():''));
    }
    setLoaded(true);
  },[mode]);
  const forgotHref='/forgot-password?returnTo='+encodeURIComponent(returnTo);
  const signInHref=returnTo+(returnTo.includes('?')?'&':'?')+'auth=signin';
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;setError('');
    const form=event.currentTarget, fields=new FormData(form);
    if(mode==='reset' && fields.get('password')!==fields.get('confirmPassword')) {setError('Your passwords do not match. Please enter them again.');return;}
    setBusy(true);
    try {
      const callback=new URL('/reset-password',location.origin);callback.searchParams.set('returnTo',returnTo);
      const response=await fetch('/api/auth/'+(mode==='request'?'request-password-reset':'reset-password'),{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(mode==='request'?{email:String(fields.get('email')||'').trim(),redirectTo:callback.href}:{token,newPassword:String(fields.get('password')||'')}),
      });
      if(!response.ok) {
        const result=await response.json().catch(()=>({}));
        if(response.status===429)throw Error('Too many attempts. Please wait a minute and try again.');
        if(mode==='reset' && result.code==='INVALID_TOKEN'){setInvalid(true);return;}
        throw Error(mode==='request'?'We could not request a reset right now. Please try again shortly.':'We could not reset your password. Please try again or request a new link.');
      }
      form.reset();
      if(mode==='request')setSent(true);else{setToken('');setDone(true);}
    } catch(caught) {setError(caught instanceof Error?caught.message:'Something went wrong. Please try again.');}
    finally {setBusy(false);}
  }
  return <div className="app-shell"><div className="stage-background" aria-hidden="true"/><main className="recovery-shell"><section className="panel recovery-card">
    <Image className="login-logo" src="/railsocial-logo.png" alt="Rail Social" width={250} height={82} priority/>
    <span className="eyebrow">YOUR SEAT IS WAITING</span>
    <h1>{done?'Password updated':sent?'Check your inbox':mode==='request'?'Forgot your password?':'Choose a new password'}</h1>
    {!loaded?<p role="status" className="muted">Loading…</p>:done?<><p role="status">Your password has been changed and your old sessions have been signed out.</p><a className="primary" href={signInHref}>Sign in with your new password</a></>:sent?<><p role="status">If an account matches that email, a reset link will arrive shortly. Check your spam folder too.</p><p className="muted">The link is valid for 30 minutes. If it does not arrive, wait a minute before trying again.</p><button className="outline" onClick={()=>{setSent(false);setError('');}}>Try another email or resend</button><a className="text-link" href={signInHref}>Back to sign in</a></>:mode==='reset'&&invalid?<><p role="alert" className="error">This reset link is missing, expired, or has already been used.</p><a className="primary" href={forgotHref}>Request a new reset link</a><a className="text-link" href={signInHref}>Back to sign in</a></>:!available&&mode==='request'?<><p role="status">Password recovery is temporarily unavailable. Please try again shortly.</p><a className="text-link" href={signInHref}>Back to sign in</a></>:<>
      <p className="muted">{mode==='request'?'Enter the email you use for Rail Social. We’ll send you a link to get back to your people.':'Use 8–128 characters. After saving, sign in again with your new password.'}</p>
      <form className="post-form" onSubmit={submit}>
        {mode==='request'?<label className="field">Email<input name="email" type="email" autoComplete="email" maxLength={254} required disabled={busy}/></label>:<><label className="field">New password<input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required disabled={busy}/></label><label className="field">Confirm new password<input name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required disabled={busy}/></label></>}
        {error&&<p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy?'Please wait…':mode==='request'?'Send reset link':'Save new password'}</button>
      </form><a className="text-link" href={signInHref}>Back to sign in</a>
    </>}
  </section></main></div>;
}
