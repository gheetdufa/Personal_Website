import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Texture} from '../vendor/three.module.js';
import {ART,REFERENCE_SIZE,artworkPlane,artworkProjection} from '../bedroom-art.js';
import {PHOTO_SOURCES,PAINTINGS,paintingPlane,paintingSize} from '../painting-photos.js';
test('Every poster and screen references a valid part of the supplied image',()=>{
  const png=readFileSync(new URL('../assets/bedroom-reference.png',import.meta.url));
  assert.equal(png.readUInt32BE(16),REFERENCE_SIZE.width);assert.equal(png.readUInt32BE(20),REFERENCE_SIZE.height);
  for(const [key,corners] of Object.entries(ART)){
    assert.equal(corners.length,4);assert.ok(corners.every(([x,y])=>x>=0&&x<=REFERENCE_SIZE.width&&y>=0&&y<=REFERENCE_SIZE.height));
    const plane=artworkPlane(new Texture(),key,1,1),uv=plane.geometry.getAttribute('uv');
    for(let i=0;i<uv.count;i++)assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);
  }
});
test('Uploaded canvases have valid photo assets, upright corners and undistorted frame proportions',()=>{
  const textures=Object.fromEntries(Object.keys(PHOTO_SOURCES).map(id=>[id,new Texture()]));
  for(const source of Object.values(PHOTO_SOURCES)){
    const bytes=readFileSync(new URL('../assets/paintings/'+source.file,import.meta.url));
    if(source.file.endsWith('.jpg')){assert.equal(bytes.readUInt16BE(0),0xffd8);assert.equal(bytes.readUInt16BE(bytes.length-2),0xffd9);}
    else{assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
  }
  for(const [key,painting] of Object.entries(PAINTINGS)){
    assert.ok(PHOTO_SOURCES[painting.source]);
    const {width,height}=paintingSize(key,.7,.7);assert.ok(Math.abs(width/height-painting.aspect)<1e-10);
    const plane=paintingPlane(textures,key,width,height),uv=plane.geometry.getAttribute('uv');
    assert.equal(plane.material.map,textures[painting.source]);
    for(let i=0;i<uv.count;i++)assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);
    const projection=artworkProjection(painting.corners);
    for(const [i,[u,v]] of [[0,[0,0]],[1,[1,0]],[2,[1,1]],[3,[0,1]]]){
      const point=projection(u,v);assert.ok(Math.hypot(point[0]-painting.corners[i][0],point[1]-painting.corners[i][1])<1e-10);
    }
    const a=projection(0,.5),b=projection(1,.5),middle=projection(.5,.5);
    assert.ok(Math.abs((b[0]-a[0])*(middle[1]-a[1])-(b[1]-a[1])*(middle[0]-a[0]))<1e-10);
  }
});
