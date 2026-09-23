import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
import {DOOR} from './rooms.js';
export function createDoor(root,number,door=DOOR){
  const {box,ball,group}=createPrimitives(root);
  const frame=group(door.x,0,door.z);frame.rotation.y=door.rotation;
  // A recess beyond the wall makes the opening read as a passage, not a flat picture.
  box(1.35,2.82,.12,'#3b382f',0,1.41,-.2,frame);
  box(1.35,.055,.42,'#aa8a61',0,.035,.05,frame);
  for(const x of [-.72,.72])box(.13,2.96,.23,'#dfcfab',x,1.48,.05,frame);
  box(1.57,.16,.23,'#e5d4af',0,2.96,.05,frame);
  const hinge=group(-.64,0,.09,frame);
  box(1.27,2.77,.1,'#95714e',.635,1.41,0,hinge);
  for(const y of [.70,1.99]){box(.98,.95,.035,'#815f41',.635,y,.06,hinge);box(.83,.80,.025,'#a78158',.635,y,.08,hinge);}
  box(.07,.17,.035,'#bba06a',1.10,1.28,.095,hinge);
  ball(.046,'#d9bb77',1.10,1.29,.15,hinge,10);
  for(const y of [.38,2.42])box(.055,.12,.09,'#a48c57',.015,y,.04,hinge);
  const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#d6c599';ctx.fillRect(0,0,128,64);ctx.fillStyle='#524632';ctx.font='500 32px sans-serif';ctx.textAlign='center';ctx.fillText(number,64,44);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.35,.175),new THREE.MeshBasicMaterial({map:texture}));plaque.position.set(0,3.19,.075);frame.add(plaque);
  let opening=0;
  return {frame,update(dt,position,reduced){const near=Math.hypot(position.x-door.x,position.z-door.z)<1.65;opening=reduced?(near?1:0):THREE.MathUtils.damp(opening,near?1:0,6,dt);hinge.rotation.y=-opening*1.38;}};
}
