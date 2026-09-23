import {addPullupBar} from './pullup.js';
import {createSwitchConsole} from './switch-console.js';
import {createTelevision} from './television.js';
import {createZuko} from './zuko.js';
import {createReadingBooks} from './bookshelf.js';
import {textLabel} from './labels.js';
import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
import {createDoor} from './door.js';

export function createLivingRoom(){
  const root=new THREE.Group();root.name='living-room';
  const {box,cyl,ball,group,rod,material}=createPrimitives(root);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  box(7.95,.3,7.95,'#a3856c',0,-.23,0);
  box(7.77,.1,7.77,'#c89b71',0,-.065,0);
  // Peach walls and an opening for the connecting door.
  box(.18,4.3,7.86,'#c99a7d',-3.9,2.08,0);
  box(5.91,4.3,.18,'#dbbd91',-.985,2.08,-3.9);
  box(.62,4.3,.18,'#dbbd91',3.63,2.08,-3.9);
  box(1.36,1.40,.18,'#dbbd91',2.65,3.54,-3.9);
  box(.075,.14,7.69,'#b4815e',-3.77,.07,0);
  box(5.87,.14,.075,'#bb936c',-.98,.07,-3.77);
  box(.57,.14,.075,'#bb936c',3.60,.07,-3.77);
  box(.23,.07,7.95,'#c5a384',-3.9,4.255,0);
  box(7.95,.07,.23,'#d7bd98',0,4.255,-3.9);
  const door=createDoor(root,'01');
  // Two bright windows with pleated terracotta and linen curtains.
  function windowAt(z){const w=group(-3.765,2.55,z);w.rotation.y=Math.PI/2;
    box(1.57,1.79,.09,'#825539',0,0,0,w);
    box(1.38,1.60,.025,'#e9d3ae',0,0,.06,w,{emissive:'#ffe3b2',emissiveIntensity:.6}).castShadow=false;
    for(const x of [-.7,0,.7])box(.055,1.66,.065,'#7e5036',x,0,.09,w);
    box(1.44,.055,.065,'#7e5036',0,0,.09,w);
    box(1.73,.09,.32,'#c59c72',0,-.9,.02,w);
    const rail=cyl(.035,.035,2.07,'#765239',0,1.0,.18,w,10);rail.rotation.z=Math.PI/2;
    for(const side of [-1,1])for(let j=0;j<4;j++){const x=side*(.69+j*.065);cyl(.07,.055,1.79,j===0?'#ffebc2':j%2?'#b96541':'#cf7b50',x,.02,.17+(j%2)*.025,w,8);}
  }
  windowAt(1.88);windowAt(-1.71);
  for(let i=0;i<7;i++){box(.14,.88,.27,'#dfc8a3',-3.63,.53,1.47+i*.13);cyl(.065,.065,.82,'#e7d1ac',-3.46,.52,1.47+i*.13,root,8);}
  // Dark wood media cabinet and broad, quiet TV screen.
  const console=group(-3.12,0,-.08);console.rotation.y=Math.PI/2;
  box(3.14,.89,.94,'#6b493c',0,.53,0,console);box(3.24,.075,1.04,'#956c51',0,1.015,0,console);
  for(const x of [-1.06,0,1.06]){box(.98,.75,.04,'#775242',x,.53,.49,console);box(.065,.032,.04,'#b49b79',x,.87,.524,console);}
  for(const x of [-1.33,1.33])for(const z of [-.3,.3])box(.09,.16,.1,'#533c2f',x,.10,z,console);
  const tvFrame=box(2.64,1.58,.12,'#292b26',.16,1.93,-.12,console);tvFrame.userData.interaction='switch';
  const tv=createTelevision(console);
  box(1.27,.12,.2,'#292c27',.16,1.14,.05,console);
  for(const x of [-.69,1.02])rod(V(x,1.05,.08),V(x-.10,1.25,-.11),.027,'#282a26',console);
  box(.29,.04,.12,'#c6b596',.37,1.08,.32,console).rotation.y=.2;
  const nintendo=createSwitchConsole(console);

  // Olive rug with the angular cream pattern from the reference.
  box(4.55,.035,3.77,'#7d8667',.16,.024,.45);
  function stripe(x1,z1,x2,z2){const dx=x2-x1,dz=z2-z1;const s=box(.065,.009,Math.hypot(dx,dz),'#e1debf',(x1+x2)/2,.049,(z1+z2)/2);s.rotation.y=Math.atan2(dx,dz);}
  for(const shift of [0,.76,1.52]){stripe(-1.94+shift,-1.36,-1.59+shift,1.99);stripe(-1.59+shift,1.99,2.26,.24-shift*.4);}
  stripe(-1.86,-1.13,2.29,-.41);stripe(-.65,-1.37,1.1,2.25);
  // Two-tier coffee table, books, mug, remote and a little plant.
  const table=group(.085,0,-.1);
  box(2.25,.095,1.46,'#a1714c',0,.80,0,table);box(2.15,.075,1.37,'#c28c61',0,.863,0,table);
  box(2.07,.065,1.29,'#a57b52',0,.22,0,table);
  for(const x of [-1.02,1.02])for(const z of [-.62,.62])box(.105,.81,.105,'#986842',x,.415,z,table);
  const book=box(.43,.045,.34,'#956a83',-.55,.93,.27,table);book.rotation.y=-.2;
  box(.31,.018,.22,'#e2c9a7',.03,.92,.3,table).rotation.y=.12;
  box(.27,.025,.09,'#62594a',.36,.92,.04,table).rotation.y=.2;
  for(let i=0;i<3;i++)box(.41,.06,.31,['#7d9272','#d5c4a0','#b87e62'][i],-.67,.285+i*.06,.12,table);
  for(let i=0;i<4;i++)box(.075,.31,.38,['#b7bf92','#c48b69','#cfbb87','#788e79'][i],.58+i*.087,.405,-.06,table);
  cyl(.07,.062,.16,'#dbcfb1',-.12,.975,-.39,table,12);cyl(.055,.055,.008,'#5c3c2a',-.12,1.06,-.39,table,12);
  function bamboo(x,z,scale=1,parent=root,y=0){const p=group(x,y,z,parent);p.scale.setScalar(scale);cyl(.26,.18,.44,'#ac6b53',0,.22,0,p,9);cyl(.22,.22,.018,'#66503a',0,.45,0,p,10);
    for(let i=0;i<7;i++){const a=i*2.399,tip=V(Math.sin(a)*.28,1.38+(i%3)*.27,Math.cos(a)*.24);rod(V(Math.sin(a)*.07,.44,Math.cos(a)*.07),tip,.012,'#857d47',p);for(let j=0;j<5;j++){const angle=a+j*1.1;const leaf=ball(.18,j%2?'#627746':'#809153',tip.x+Math.sin(angle)*.17,tip.y-.42+j*.13,tip.z+Math.cos(angle)*.17,p,6);leaf.scale.set(.2,.09,1.2);leaf.rotation.set(.3,angle,-.4);}}
    return p;}
  bamboo(-3.08,2.69,1.13);bamboo(.64,-.35,.4,table,.91);
  // Upholstered sofa, individual cushions and a folded throw.
  const sofa=group(.615,0,2.845);sofa.name='living-sofa';sofa.userData.interaction='couch';
  for(const x of [-1.38,1.38])for(const z of [-.43,.43])box(.12,.23,.12,'#75573e',x,.13,z,sofa);
  box(3.33,.36,1.29,'#626059',0,.43,0,sofa);
  box(3.18,.85,.23,'#68675e',0,.91,.53,sofa);
  for(const x of [-1.54,1.54]){box(.25,.61,1.28,'#797366',x,.73,0,sofa);box(.27,.07,1.29,'#89816f',x,1.065,0,sofa);}
  for(const x of [-.96,0,.96]){box(.89,.20,.91,'#a29b82',x,.72,-.05,sofa);const cushion=box(.87,.57,.21,'#aaa48c',x,1.05,.30,sofa);cushion.rotation.x=.12;}
  const pillow=box(.44,.41,.19,'#d8c8a1',-1.1,1.0,.03,sofa);pillow.rotation.set(.12,.2,-.18);
  box(.56,.035,.70,'#a7b18a',.86,.834,-.11,sofa);box(.56,.42,.035,'#a0aa82',.86,.63,-.56,sofa);
  for(let i=0;i<7;i++)box(.012,.05,.018,'#d8dab7',.61+i*.08,.39,-.59,sofa);
  // Side table and warm table lamp.
  const side=group(-1.55,0,2.89);box(.69,.66,.75,'#8b6547',0,.34,0,side);box(.75,.075,.8,'#bc9462',0,.71,0,side);
  const lamps=[];
  function lamp(x,y,z,scale=1,parent=root){const g=group(x,y,z,parent);g.scale.setScalar(scale);cyl(.13,.16,.05,'#af8759',0,.025,0,g);const base=ball(.16,'#c59166',0,.2,0,g);base.scale.set(.75,1.2,.75);cyl(.026,.026,.3,'#a48a58',0,.4,0,g);cyl(.25,.28,.34,'#d7d3a2',0,.60,0,g,16,{emissive:'#f3bb65',emissiveIntensity:.12});const light=new THREE.PointLight('#ffd08b',1,3,2);light.position.set(0,.63,0);g.add(light);lamps.push(light);}
  lamp(-1.55,.76,2.90,.88);lamp(-3.02,1.06,1.19,.67);
  // Tall bookcase in the corner, with cabinet doors below.
  const bookcase=group(-2.67,0,-3.21);bookcase.name='research-bookshelf';bookcase.userData.interaction='library';
  box(1.94,3.20,.10,'#b37e59',0,1.62,-.37,bookcase);
  for(const x of [-.93,.93])box(.10,3.26,.84,'#bb845b',x,1.65,0,bookcase);
  for(const y of [.08,.91,1.65,2.38,3.24])box(1.88,.095,.88,'#ce9568',0,y,0,bookcase);
  for(const x of [-.45,.45]){box(.85,.75,.065,'#bd865d',x,.49,.425,bookcase);box(.28,.045,.07,'#e3b086',x,.66,.48,bookcase);}
  const readingBooks=createReadingBooks(bookcase);
  // Fireplace: mantel, dark recess, warm logs and a small animated flame.
  const fire=group(.58,0,-3.44);fire.name="living-fireplace";
  box(1.93,.10,.85,'#9c7953',0,.07,.03,fire);box(1.71,1.39,.11,'#453b2e',0,.81,-.22,fire);
  for(const x of [-.79,.79])box(.26,1.49,.51,'#ae8050',x,.83,0,fire);
  box(1.96,.17,.65,'#c2995e',0,1.61,.04,fire);box(1.84,.21,.51,'#b78b55',0,1.42,0,fire);
  box(1.18,.07,.44,'#514538',0,.2,.12,fire);
  for(let i=0;i<4;i++){const log=cyl(.08,.08,.86,'#a65f37',0,.30+(i%2)*.11,-.04+(i%3)*.12,fire,8);log.rotation.z=Math.PI/2;log.rotation.y=i%2?.12:-.12;}
  const flames=[];
  for(let i=0;i<5;i++){const flame=new THREE.Mesh(new THREE.ConeGeometry(.10,.32+(i%2)*.1,5),new THREE.MeshBasicMaterial({color:i%2?'#ffd28b':'#df8346',transparent:true,opacity:.85,depthWrite:false}));flame.position.set(-.3+i*.15,.53,-.01+(i%2)*.04);fire.add(flame);flames.push(flame);}
  const firelight=new THREE.PointLight('#ff9d54',2.3,4,2);firelight.position.set(.58,.70,-3.05);root.add(firelight);
  for(const x of [-.7,.7]){const v=ball(.1,'#bd8f83',x,1.87,.06,fire);v.scale.set(.8,1.15,.8);for(let i=0;i<3;i++)rod(V(x,1.91,.06),V(x+(i-1)*.035,2.13,.06),.006,'#6f7550',fire);}
  box(.19,.26,.055,'#d1c8ad',0,1.83,.05,fire);box(.14,.19,.015,'#f0e5cc',0,1.84,.086,fire);
  // Geometric framed prints, a clock, and the fireplace reading lamp.
  function print(x,y,z,w,h,orientation=0){const p=group(x,y,z);p.rotation.y=orientation;box(w,h,.065,'#8a5c3d',0,0,0,p);box(w-.10,h-.10,.015,'#c7d4bc',0,0,.044,p);box(w-.13,h*.27,.018,'#86a6a0',0,-h*.22,.057,p);box(w*.25,h*.4,.018,'#e7c88e',-w*.24,.08,.06,p);const circle=cyl(Math.min(w,h)*.17,Math.min(w,h)*.17,.016,'#bd7952',w*.19,h*.10,.07,p,20);circle.rotation.x=Math.PI/2;box(w*.60,.035,.019,'#f4e8c5',0,-h*.09,.075,p);return p;}
  print(.53,2.93,-3.775,1.86,1.0);print(-3.76,3.39,.04,1.65,.68,Math.PI/2);
  const clock=group(-.91,2.99,-3.78);const clockFace=cyl(.26,.26,.065,'#e5d5ae',0,0,0,clock,12);clockFace.rotation.x=Math.PI/2;const clockRim=new THREE.Mesh(new THREE.TorusGeometry(.26,.02,6,12),material('#806a4f'));clockRim.position.z=.035;clock.add(clockRim);rod(V(0,0,.05),V(-.045,.17,.05),.009,'#6e6652',clock);rod(V(0,0,.05),V(.07,-.07,.05),.009,'#6e6652',clock);
  const floorLamp=group(1.38,0,-3.16);cyl(.15,.18,.045,'#816346',0,.04,0,floorLamp);cyl(.018,.018,2.22,'#967747',0,1.12,0,floorLamp);cyl(.19,.33,.49,'#e5d0ac',0,2.24,0,floorLamp,8,{emissive:'#efb968',emissiveIntensity:.10});
  const readingLight=new THREE.PointLight('#ffd297',.5,4,2);readingLight.position.set(1.38,2.18,-3.0);root.add(readingLight);
  const pullupBar=addPullupBar(root);
  const zuko=createZuko(root);
  let time=0;
  return {root,door,zuko,tv,pullupBar,readingBooks,update(dt,night,reduced,player,seated=false){tv.update(dt,reduced);nintendo.setPower(tv.state!=='off');zuko.setCouch(seated);zuko.update(dt,player,reduced);time+=dt;const pulse=reduced?1:1+Math.sin(time*7)*.1+Math.sin(time*11)*.04;firelight.intensity=(1.6+night*2)*pulse;flames.forEach((f,i)=>{f.scale.y=reduced?1:1+Math.sin(time*6+i*2)*.14;});for(const l of lamps)l.intensity=.6+night*3;readingLight.intensity=.5+night*3;}};
}
