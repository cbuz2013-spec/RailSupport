import type {BetterAuthOptions} from 'better-auth';
import {passwordEmailConfigured, RESET_EXPIRY_SECONDS, sendPasswordResetEmail} from './password-email';

export function authOptions(database: BetterAuthOptions['database']): BetterAuthOptions {
  if (!process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) throw new Error('Account setup is incomplete');
  return {
    appName:'Rail Social', database, secret:process.env.BETTER_AUTH_SECRET, baseURL:process.env.BETTER_AUTH_URL,
    emailAndPassword:{enabled:true, minPasswordLength:8, maxPasswordLength:128,
      resetPasswordTokenExpiresIn:RESET_EXPIRY_SECONDS, revokeSessionsOnPasswordReset:true,
      ...(passwordEmailConfigured() ? {sendResetPassword:sendPasswordResetEmail} : {}),
    },
    rateLimit:{enabled:true, storage:'database', window:60, max:30, customRules:{
      '/request-password-reset':{window:60, max:3}, '/reset-password':{window:60, max:5},
    }},
    session:{expiresIn:60*60*24*7}, advanced:{useSecureCookies:process.env.NODE_ENV==='production'},
  };
}
