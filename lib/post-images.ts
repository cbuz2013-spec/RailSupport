export function decodePostImages(images:string[]=[]){
 if(images.length>3)throw Error('Add up to three photos per post.');
 return images.map(value=>{
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if(!match)throw Error('Use JPEG, PNG, or WebP photos.');
  const data=Buffer.from(match[2],'base64');
  if(!data.length||data.length>300000||data.toString('base64')!==match[2])throw Error('Each photo must be under 300 KB after resizing.');
  const mime=match[1];
  const jpeg=data.length>3&&data[0]===0xff&&data[1]===0xd8&&data[2]===0xff;
  const png=data.length>8&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp=data.length>12&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
  if(!(mime==='image/jpeg'&&jpeg||mime==='image/png'&&png||mime==='image/webp'&&webp))throw Error('This photo could not be verified.');
  return {mime,data};
 });
}
