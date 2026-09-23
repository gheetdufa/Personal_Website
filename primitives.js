import * as THREE from './vendor/three.module.js';
export function createPrimitives(root){
  const mats=new Map();
  function material(color,opts={}){const key=color+JSON.stringify(opts);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.8,...opts}));return mats.get(key);}
  function box(w,h,d,color,x=0,y=0,z=0,parent=root,opts={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color,opts));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cyl(rt,rb,h,color,x,y,z,parent=root,segments=12,opts={}){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material(color,opts));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function ball(r,color,x,y,z,parent=root,s=16){const m=new THREE.Mesh(new THREE.SphereGeometry(r,s,12),material(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  function group(x,y,z,parent=root){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
  function rod(a,b,r,color,parent=root){const vec=new THREE.Vector3().subVectors(b,a);const m=cyl(r,r,vec.length(),color,0,0,0,parent,8);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());return m;}
  return {material,box,cyl,ball,group,rod};
}
