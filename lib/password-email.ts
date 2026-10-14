import {createHash} from 'node:crypto';

export const RESET_EXPIRY_SECONDS = 30 * 60;
export const passwordEmailConfigured = () => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RAILSOCIAL_EMAIL_FROM?.trim());
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));

export type PasswordEmail = {user: {email: string; name: string}; url: string; token: string};

export function resetEmailContent({user, url}: PasswordEmail) {
  const link = new URL(url);
  const origin = new URL(process.env.BETTER_AUTH_URL!).origin;
  if (link.origin !== origin || !link.pathname.startsWith('/api/auth/reset-password/') || link.username || link.password) {
    throw new Error('Invalid password reset destination.');
  }
  const name = user.name.trim().slice(0,100) || 'there';
  return {
    subject: 'Reset your Rail Social password',
    text: `Hi ${name},\n\nUse this link to choose a new Rail Social password:\n${link.href}\n\nThis link expires in 30 minutes and can be used once. If you did not request it, ignore this email. Your password stays the same until you choose a new one.\n\nRail Social`,
    html: `<div style="background:#101310;padding:32px 16px;font-family:Arial,sans-serif;color:#f1f1e9"><div style="max-width:520px;margin:auto;background:#191d19;border:1px solid #3d4437;border-radius:16px;padding:32px"><p style="color:#e0c795;font-size:24px;font-weight:bold">Rail Social</p><h1 style="font-size:26px">A fresh start at the table.</h1><p>Hi ${escapeHtml(name)},</p><p>Choose a new password to get back to your people.</p><p style="margin:28px 0"><a href="${escapeHtml(link.href)}" style="display:inline-block;background:#e0c795;color:#101310;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p><p>This link expires in 30 minutes and can be used once.</p><p style="color:#b8bcae">If you did not request a reset, ignore this email. Your password stays the same until you choose a new one.</p><p style="font-size:12px;overflow-wrap:anywhere">Button not working? Copy this link:<br><a style="color:#e0c795" href="${escapeHtml(link.href)}">${escapeHtml(link.href)}</a></p></div></div>`,
  };
}

export async function sendPasswordResetEmail(data: PasswordEmail): Promise<void> {
  if (!passwordEmailConfigured()) throw new Error('Password email is not configured.');
  const content = resetEmailContent(data);
  // The token is hashed in the delivery key and never written to application logs.
  const idempotency = 'rail-reset/' + createHash('sha256').update(data.token).digest('hex');
  const body = JSON.stringify({from: process.env.RAILSOCIAL_EMAIL_FROM!.trim(), to: [data.user.email], ...content});
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method:'POST', headers:{Authorization: 'Bearer ' + process.env.RESEND_API_KEY!.trim(), 'Content-Type':'application/json', 'Idempotency-Key':idempotency},
        body, signal:AbortSignal.timeout(8000),
      });
    } catch {
      if (attempt === 0) continue;
      throw new Error('Password email provider could not be reached.');
    }
    if (response.ok) return;
    // Do not include provider bodies: they can contain addresses or submitted content.
    if (attempt === 0 && (response.status === 429 || response.status >= 500)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    throw new Error(`Password email provider rejected delivery (HTTP ${response.status}).`);
  }
}
