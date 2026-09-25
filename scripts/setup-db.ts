import {loadEnvConfig} from '@next/env';
import {readFile} from 'node:fs/promises';
loadEnvConfig(process.cwd());
async function main(){
 const {auth}=await import('../lib/auth');
 const {getMigrations}=await import('better-auth/db/migration');
 const {db}=await import('../lib/db');
 const migrations=await getMigrations(auth().options);
 await migrations.runMigrations();
 const sql=await readFile(new URL('./schema.sql',import.meta.url),'utf8');
 await db().query(sql);await db().end();console.log('RailSupport account and application schema ready.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
