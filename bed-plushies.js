import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';

export function addBedPlushies(bed){
  const {group,ball,box,cyl,rod,material}=createPrimitives(bed),V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const oval=(p,r,c,x,y,z,sx=1,sy=1,sz=1)=>{const m=ball(r,c,x,y,z,p,28);m.scale.set(sx,sy,sz);return m;};
  const dino=group(-.52,.94,-1.28);dino.name='bed-triceratops';dino.rotation.y=.10;
  oval(dino,.34,'#8fbb45',0,.35,0,1.13,1.15,.83);
  oval(dino,.27,'#efdfb6',0,.32,.245,1.05,1.11,.20);
  const green='#9bc946',frill='#537b3d';
  oval(dino,.37,frill,0,.83,-.10,1.22,1.05,.40);
  for(let i=0;i<11;i++){const a=i/10*Math.PI;oval(dino,.10,frill,Math.cos(a)*.40,.77+Math.sin(a)*.38,-.10,.75,1.15,.60);}
  oval(dino,.34,green,0,.79,.03,1.15,.84,.85);
  oval(dino,.19,'#acd459',0,.65,.277,1.2,.66,.56);
  for(const side of [-1,1]){
    oval(dino,.028,'#222820',side*.128,.81,.304,.85,1.13,.40);
    const horn=new THREE.Mesh(new THREE.ConeGeometry(.055,.20,16),material('#efe2b9'));horn.position.set(side*.20,1.03,.17);horn.rotation.x=.38;horn.rotation.z=-side*.18;dino.add(horn);
    const arm=oval(dino,.105,green,side*.35,.51,.07,1.15,.75,.77);arm.rotation.z=-side*.36;
    oval(dino,.12,green,side*.21,.055,.12,1,.55,1.15);
    oval(dino,.012,'#719441',side*.065,.638,.384,.65,1,.40);
  }
  const noseHorn=new THREE.Mesh(new THREE.ConeGeometry(.045,.14,16),material('#eddfad'));noseHorn.position.set(0,.71,.373);noseHorn.rotation.x=.73;dino.add(noseHorn);
  const helmet=group(-1.01,.945,-.59);helmet.name='bed-halo-helmet';helmet.rotation.y=.12;
  oval(helmet,.28,'#405337',0,.265,0,1.02,.96,.84);
  oval(helmet,.225,'#242c24',0,.276,.146,1.17,.66,.40);
  oval(helmet,.210,'#d88a24',0,.29,.19,1.18,.62,.31);
  oval(helmet,.18,'#edaa36',.03,.32,.234,1.05,.39,.09);
  for(const side of [-1,1]){
    const cheek=box(.105,.13,.045,'#73825a',side*.178,.13,.182,helmet);cheek.rotation.z=side*.28;
    box(.025,.13,.018,'#aab380',side*.068,.465,.075,helmet).rotation.x=-.5;
    box(.019,.16,.012,'#5f6b49',side*.12,.284,.266,helmet).rotation.z=side*.2;
  }
  box(.15,.07,.05,'#222b29',0,.118,.243,helmet);box(.073,.033,.009,'#798172',0,.123,.272,helmet);
  const deer=group(-.17,.96,-.43);deer.name='bed-antler-plush';deer.rotation.y=.08;
  oval(deer,.24,'#e8ddc1',0,.22,0,1.20,1.04,.82);
  oval(deer,.218,'#f2e8d0',0,.28,.085,1.15,1,.77);
  oval(deer,.093,'#bc9765',0,.20,.257,1.21,.77,.29);
  for(const side of [-1,1]){
    oval(deer,.061,'#ede0c2',side*.216,.355,.025,1,.65,.68);
    rod(V(side*.135,.41,0),V(side*.16,.61,.015),.024,'#a57a45',deer);
    rod(V(side*.153,.51,.011),V(side*.245,.58,.013),.02,'#a57a45',deer);
    rod(V(side*.15,.48,.011),V(side*.092,.55,.013),.018,'#a57a45',deer);
    const eye=new THREE.Mesh(new THREE.TorusGeometry(.033,.008,6,14,Math.PI),material('#b78d58'));eye.position.set(side*.099,.321,.239);deer.add(eye);
  }
  return {dino,helmet,deer};
}
