export function zonedInput(value:string,timeZone:string){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
 const get=(key:string)=>p.find(v=>v.type===key)?.value;
 return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
export function zonedToInstant(value:string,timeZone:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Choose a valid game time.');
 const guess=Date.parse(value+'Z');if(!Number.isFinite(guess))throw Error('Choose a valid game time.');
 const matches:string[]=[];
 for(let minutes=-840;minutes<=840;minutes+=15){const iso=new Date(guess+minutes*60000).toISOString();if(zonedInput(iso,timeZone)===value)matches.push(iso);}
 if(matches.length!==1)throw Error(matches.length?'This time happens twice during the clock change. Choose an unambiguous time or set the league time zone to UTC.':'This local time does not exist. Check the date and daylight-saving clock change.');
 return matches[0];
}
