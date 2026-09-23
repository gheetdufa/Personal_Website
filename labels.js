import * as THREE from './vendor/three.module.js';

// Canvas is used only for lettering on physical objects, not to generate artwork.
export function textLabel(parent,text,width,height,{color='#fff7df',background=null,fontSize=44}={}){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.max(64,Math.round(512*height/width));
  const ctx=canvas.getContext('2d');
  if(background){ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);}
  ctx.fillStyle=color;ctx.font=`700 ${fontSize}px system-ui, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  const lines=text.split('\n');lines.forEach((line,i)=>ctx.fillText(line,256,canvas.height/2+(i-(lines.length-1)/2)*fontSize*1.18,480));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:!background,depthWrite:false,toneMapped:false}));
  parent.add(mesh);return mesh;
}
