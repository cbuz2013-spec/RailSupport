import {Pool} from 'pg';
let pool:Pool|undefined;
export const configured=()=>Boolean(process.env.DATABASE_URL&&process.env.BETTER_AUTH_SECRET&&process.env.BETTER_AUTH_URL&&process.env.RAILSUPPORT_READY==='true');
export function db(){if(!process.env.DATABASE_URL)throw new Error('Database is not configured');return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});}
