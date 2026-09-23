import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';

export function createSwitchConsole(parent){
  const {group,box,cyl,material}=createPrimitives(parent),root=group(.32,1.27,.36);
  root.name='nintendo-switch';root.userData.interaction='switch';root.scale.setScalar(1.14);
  const ink='#24282b';
  box(.55,.32,.044,ink,0,.018,0,root);box(.50,.268,.006,'#122027',0,.02,.026,root,{roughness:.23});
  for(const side of [-1,1]){
    const joy=group(side*.32,.018,0,root),color=side<0?'#08b9dd':'#f0444e';joy.name=side<0?'blue-joycon':'red-joycon';
    box(.097,.22,.055,color,0,0,0,joy);
    for(const y of [-.11,.11]){const cap=cyl(.048,.048,.055,color,0,y,0,joy,20);cap.rotation.x=Math.PI/2;}
    const stick=cyl(.021,.026,.015,ink,0,side<0?.068:-.049,.040,joy,16);stick.rotation.x=Math.PI/2;
    for(let i=0;i<4;i++){const a=i*Math.PI/2,b=cyl(.009,.009,.009,ink,Math.cos(a)*.022,(side<0?-.045:.075)+Math.sin(a)*.024,.039,joy,12);b.rotation.x=Math.PI/2;}
    box(.018,.005,.005,ink,0,.135,.033,joy);if(side>0)box(.005,.018,.005,ink,0,.135,.033,joy);
    box(.013,.012,.005,ink,0,-.10,.033,joy);
  }
  const dock=group(0,-.015,.085,root);dock.name='switch-dock';
  box(.55,.27,.13,'#282c30',0,0,0,dock,{roughness:.48});box(.515,.014,.073,'#14191e',0,.137,-.026,dock);
  // The small split controller symbol is embossed on the matte black dock.
  for(const side of [-1,1]){
    const outline=new THREE.Mesh(new THREE.TorusGeometry(.030,.003,6,20),material('#777e80'));outline.scale.y=1.42;outline.position.set(side*.034,.01,.067);dock.add(outline);
    const dot=cyl(.009,.009,.002,'#8f9798',side*.034,side<0?.026:-.008,.069,dock,12);dot.rotation.x=Math.PI/2;
  }
  const indicator=box(.012,.012,.002,'#34443c',-.235,-.108,.069,dock,{emissive:'#8bdf92',emissiveIntensity:0});indicator.name='switch-power-indicator';
  return {root,setPower(on){indicator.material.emissiveIntensity=on?1.8:0;}};
}
