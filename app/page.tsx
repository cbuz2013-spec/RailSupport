import RailApp from './rail-app';
import {configured} from '@/lib/db';
export const dynamic='force-dynamic';
export default function Page(){return <RailApp ready={configured()}/>}
