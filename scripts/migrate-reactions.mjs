import {readFile} from 'node:fs/promises';
import pg from 'pg';

// Explicit one-off release switch. Ordinary local and Vercel builds never migrate.
const community=process.env.RAILSOCIAL_RUN_COMMUNITY_MIGRATION==='true';
if(!community&&process.env.RAILSOCIAL_RUN_REACTION_MIGRATION!=='true')process.exit(0);
if(process.env.VERCEL_ENV!=='production'||process.env.BETTER_AUTH_URL?.replace(/\/$/,'')!=='https://railsupport.vercel.app')throw Error('Reaction migration requires the Rail Social production environment.');
if(!process.env.DATABASE_URL)throw Error('Production database is not configured.');
const connection=new URL(process.env.DATABASE_URL);
// Neon schema changes use the direct endpoint for the same configured database.
if(connection.hostname.endsWith('.neon.tech'))connection.hostname=connection.hostname.replace(/-pooler(?=\.)/,'');
const client=new pg.Client({connectionString:connection.toString(),connectionTimeoutMillis:15000});
try{
 await client.connect();
 await client.query('BEGIN');
 await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
 await client.query(await readFile(new URL('./reactions-2.4.sql',import.meta.url),'utf8'));
 if(community)await client.query(await readFile(new URL('./community-2.5.sql',import.meta.url),'utf8'));
 const check=await client.query("SELECT count(*)::int AS count FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('rail_likes','rail_room_likes','rail_table_likes','rail_comment_likes') AND column_name='reaction' AND is_nullable='NO'");
 if(check.rows[0].count!==4)throw Error('Reaction schema validation failed.');
 await client.query('SELECT reaction FROM rail_activity_reactions LIMIT 0');
 if(community)await client.query('SELECT street,reaction FROM rail_street_reactions LIMIT 0');
 await client.query('COMMIT');
 console.log('Rail Social additive migration completed and verified.');
}catch(error){
 await client.query('ROLLBACK').catch(()=>{});
 console.error('Reaction migration failed; transaction rolled back.',error?.code||error?.name||'Unknown error');process.exitCode=1;
}finally{await client.end();}
