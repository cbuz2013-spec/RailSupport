import test from 'node:test';
import assert from 'node:assert/strict';
import {decodePostImages} from '../lib/post-images';

test('accepts resized JPEG data and rejects disguised image content',()=>{
 const jpeg=Buffer.from([0xff,0xd8,0xff,0xd9]);
 const decoded=decodePostImages(['data:image/jpeg;base64,'+jpeg.toString('base64')]);
 assert.equal(decoded[0].mime,'image/jpeg');
 assert.deepEqual(decoded[0].data,jpeg);
 assert.throws(()=>decodePostImages(['data:image/png;base64,'+jpeg.toString('base64')]),/could not be verified/);
 assert.throws(()=>decodePostImages(['data:image/svg+xml;base64,'+jpeg.toString('base64')]),/JPEG, PNG, or WebP/);
 assert.throws(()=>decodePostImages(Array(4).fill('data:image/jpeg;base64,'+jpeg.toString('base64'))),/up to three/);
});
