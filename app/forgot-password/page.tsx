import type {Metadata} from 'next';
import {configured} from '@/lib/db';
import {passwordEmailConfigured} from '@/lib/password-email';
import PasswordRecoveryForm from '../password-recovery-form';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Reset your password · Rail Social',referrer:'no-referrer',robots:{index:false,follow:false}};
export default function ForgotPasswordPage(){return <PasswordRecoveryForm mode="request" available={configured()&&passwordEmailConfigured()}/>;}
