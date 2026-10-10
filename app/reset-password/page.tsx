import type {Metadata} from 'next';
import PasswordRecoveryForm from '../password-recovery-form';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Choose a new password · Rail Social',referrer:'no-referrer',robots:{index:false,follow:false}};
export default function ResetPasswordPage(){return <PasswordRecoveryForm mode="reset" available/>;}
