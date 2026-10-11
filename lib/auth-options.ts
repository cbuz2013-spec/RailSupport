import {sendAccountEmail} from './account-email';
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
    emailVerification:{sendOnSignUp:passwordEmailConfigured(),autoSignInAfterVerification:false,expiresIn:3600,...(passwordEmailConfigured()?{sendVerificationEmail:(data)=>sendAccountEmail(data,'verify')}:{})},
    user:{changeEmail:{enabled:passwordEmailConfigured(),updateEmailWithoutVerification:false,sendChangeEmailConfirmation:(data)=>sendAccountEmail(data,'change')}},
    rateLimit:{enabled:true, storage:'database', window:60, max:30, customRules:{
      '/send-verification-email':{window:60,max:2},'/change-email':{window:60,max:2},'/change-password':{window:60,max:5},'/delete-user':{window:60,max:3},
      '/request-password-reset':{window:60, max:3}, '/reset-password':{window:60, max:5},
    }},
    session:{expiresIn:60*60*24*7}, advanced:{useSecureCookies:process.env.NODE_ENV==='production'},
  };
}
