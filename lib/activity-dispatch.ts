import {after} from 'next/server';
import {db} from './db';
import {flushActivity} from './notifications';
export function scheduleActivity(){after(async()=>{try{await flushActivity(db())}catch{console.error('Activity delivery deferred; queued events will retry.')}})}
