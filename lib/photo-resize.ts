export async function resizePhoto(file:File){
 if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)||file.size>12_000_000)throw Error('Choose a JPG, PNG, WebP, or HEIC photo under 12 MB.');
 let bitmap:ImageBitmap;try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'})}catch{throw Error('This browser cannot read that photo. Try a JPG or PNG version, then select it again.')}
 const canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
 canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');
 if(!ctx){bitmap.close();throw Error('Photo processing is unavailable.')};ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 for(const quality of [.78,.64,.48,.32]){const value=canvas.toDataURL('image/jpeg',quality);if(value.length<=400000)return value}throw Error('Choose a smaller photo.');
}
