import * as THREE from './vendor/three.module.js';
export function createScreenCanvas(width=1000,height=640){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const text=(value,x,y,size=26,color='#d7e7dc',font='monospace')=>{ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.fillText(value,x,y);};
  function rect(x,y,w,h,color,r=0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function wrap(value,x,y,maxWidth,size=26,lineHeight=36,color='#c3cec9'){
    ctx.font=`${size}px sans-serif`;let line='';
    for(const word of value.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>maxWidth){text(line,x,y,size,color,'sans-serif');y+=lineHeight;line=word;}else line=next;}
    if(line){text(line,x,y,size,color,'sans-serif');y+=lineHeight;}return y;
  }
  return {canvas,ctx,texture,width,height,text,rect,wrap,finish(){texture.needsUpdate=true;}};
}
export function screenHit(raycaster,camera,element,meshes,x,y){
  const rect=element.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),camera);
  for(const mesh of meshes)mesh.updateWorldMatrix(true,false);
  const hit=raycaster.intersectObjects(meshes,false)[0];return hit?{index:meshes.indexOf(hit.object),u:hit.uv.x,v:1-hit.uv.y}:null;
}
export const hitButton=(buttons,x,y)=>buttons.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
