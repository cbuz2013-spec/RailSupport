import type {Pool} from 'pg';
import {APIError} from 'better-auth/api';
// Friendly preflight only. The database trigger atomically enforces and cleans up.
export async function prepareAccountDeletion(pool:Pool,uid:string){
 if((await pool.query('SELECT id FROM rail_groups WHERE owner=$1 UNION ALL SELECT id FROM rail_rooms WHERE owner_id=$1',[uid])).rows.length)throw new APIError('BAD_REQUEST',{message:'Transfer ownership of your private groups and rooms before deleting your account.'});
}
