import {addSunsetWindow} from './sunset-window.js';
import {createClockDisplay} from './room-time.js';
import {addRacingSim} from './racing-sim.js';
import {momTestCover,createPlushBounce} from './bed-details.js';
import {addBedPlushies} from './bed-plushies.js';
import {createPlush} from './plushies.js';
import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
import {createDoor} from './door.js';
import {BEDROOM_DOOR} from './rooms.js';
import {loadBedroomReference,artworkPlane} from './bedroom-art.js';
import {PAINTINGS,loadPaintingTextures,paintingPlane,paintingSize} from './painting-photos.js';

export function createBedroom(reference=loadBedroomReference(),paintingTextures=loadPaintingTextures()){
  const root=new THREE.Group();root.name='bedroom';
  const artworks=[],monitors=[];
  reference.colorSpace=THREE.SRGBColorSpace;
  const {box,ball,cyl,group,rod,material}=createPrimitives(root);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  function oval(r,color,x,y,z,sx,sy,sz,parent=root){const m=ball(r,color,x,y,z,parent,20);m.scale.set(sx,sy,sz);return m;}
  function textTexture(text,color='#e9e0c5',bg='#20252a',w=256,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.font='600 '+Math.round(h*.52)+'px sans-serif';ctx.textAlign='center';ctx.fillText(text,w/2,h*.7);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  function label(text,w,h,x,y,z,parent=root,color,bg){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:textTexture(text,color,bg)}));m.position.set(x,y,z);parent.add(m);return m;}
  // Textured carpet and warm cream walls replace the first room's floor and gray paint.
  let seed=7123;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  const noise=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const n=100+Math.floor(random()*120);noise.set([n,n,n,255],i*4);}
  const fibers=new THREE.DataTexture(noise,128,128);fibers.wrapS=fibers.wrapT=THREE.RepeatWrapping;fibers.repeat.set(16,16);fibers.needsUpdate=true;
  box(7.95,.30,7.95,'#716258',0,-.23,0);
  const carpet=box(7.77,.09,7.77,'#b49776',0,-.055,0);carpet.name='carpet';carpet.material=material('#b49776',{bumpMap:fibers,bumpScale:.038,roughness:1});
  box(.18,4.3,7.86,'#cfb591',-3.9,2.08,0);box(7.86,4.3,.18,'#bea88c',0,2.08,-3.9);
  box(.07,.16,7.72,'#cdbfa9',-3.765,.08,0);box(7.72,.16,.07,'#cdbfa9',0,.08,-3.765);
  box(.23,.07,7.95,'#b6a591',-3.9,4.255,0);box(7.95,.07,.23,'#b6a591',0,4.255,-3.9);
  // The connecting door sits on the cutaway edge, leaving the two reference walls intact.
  const door=createDoor(root,'02',BEDROOM_DOOR);door.frame.name='bedroom-exit';
  // Only uploaded paintings join the gallery. The poster and emblem remain wall decorations.
  function framed(key,w,h,x,y,z,rotation=0,frame='#e7dfcd'){
    const size=paintingSize(key,w,h);w=size.width;h=size.height;
    const g=group(x,y,z);g.rotation.y=rotation;g.name='wall-frame-'+key;
    box(w+.065,h+.065,.028,frame,0,0,0,g);
    const art=PAINTINGS[key]?paintingPlane(paintingTextures,key,w,h):artworkPlane(reference,key,w,h);art.position.z=.018;g.add(art);
    if(PAINTINGS[key])artworks.push({frame:g,key,width:w,height:h,group:rotation===0?'small':'main'});
    return g;
  }
  const gallery=[
    ['lake',.48,.57,2.89,3.18],['knight',.5,.60,2.18,3.28],['coast',.56,.62,1.43,3.4],['orange',.49,.53,.60,3.59],
    ['snow',.70,.56,2.60,2.49],['portrait',.54,.63,1.70,2.65],['blue',.62,.59,.69,2.91],
    ['sunset',.58,.67,2.68,1.66],['mountain',.70,.70,1.70,1.80],['forest',.62,.68,.69,2.15],
    ['flowers',.67,.66,2.90,.91],['waterfall',.65,.72,1.72,1.00],['night',.60,.68,.63,1.32],
    ['mother',.43,.43,3.53,2.58],['father',.43,.43,3.53,1.83],
  ];
  for(const [key,w,h,z,y] of gallery)framed(key,w,h,-3.775,y,z,Math.PI/2,key==='orange'?'#25211e':'#e2d8c6');
  framed('wanted',.76,1.32,-3.775,3.03,-.58,Math.PI/2,'#ac865c');
  cyl(.12,.12,.065,'#a99c8a',-3.73,2.55,-1.30).rotation.z=Math.PI/2;
  box(.13,.23,.025,'#b0976e',-3.75,.68,3.36).rotation.y=Math.PI/2;
  // A made bed with aligned pillows, a smooth teal cover and a folded top edge.
  const bed=group(-2.1,0,.60);bed.name='teal-bed';bed.userData.interaction='about';
  box(2.52,.49,4.04,'#4a3d32',0,.29,0,bed);box(2.50,.25,3.99,'#788082',0,.62,0,bed);
  box(2.55,.045,4.02,'#315461',0,.768,0,bed).name='teal-fitted-sheet';
  box(2.55,.76,.12,'#564538',0,.58,-1.94,bed);
  for(const x of [-.61,.61])oval(.45,'#adb0a6',x,.93,-1.48,1.20,.34,.74,bed);
  function bedspread(depth,centerZ,height,color,name){
    const geometry=new THREE.PlaneGeometry(2.84,depth,48,32);geometry.rotateX(-Math.PI/2);
    const positions=geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),z=positions.getZ(i)+centerZ;
      const side=THREE.MathUtils.smoothstep(Math.abs(x),1.28,1.42);
      const foot=THREE.MathUtils.smoothstep(z,2.01,2.10);
      positions.setXYZ(i,x,height-.35*side-.18*foot,z);
    }
    geometry.computeVertexNormals();
    const cover=new THREE.Mesh(geometry,material(color,{side:THREE.DoubleSide,roughness:1,bumpMap:fibers,bumpScale:.004}));
    cover.name=name;cover.castShadow=true;cover.receiveShadow=true;bed.add(cover);
  }
  bedspread(3.30,.45,.895,'#284f59','smooth-teal-cover');
  bedspread(.32,-1.03,.93,'#3c6370','folded-cover-edge');
  // Oversized cream-and-brown cow plush, with horns, ears, pink muzzle and little hooves.
  const cow=group(.55,1.39,-1.22,bed);cow.rotation.y=.26;cow.scale.setScalar(.86);cow.name='cow-plush';
  oval(.60,'#c9b39b',0,0,0,1.14,.96,.91,cow);
  oval(.46,'#ebd9b9',.04,-.12,.38,.98,1.0,.32,cow);
  for(const [x,y,z,s] of [[-.45,.26,.19,.18],[.35,.39,.14,.17],[-.19,.48,.08,.16],[.53,.02,-.10,.15],[-.37,-.28,.31,.13]])oval(s,'#89735d',x,y,z,1.2,.8,.47,cow);
  oval(.19,'#dfa080',0,.23,.53,1.08,.64,.35,cow);
  for(const x of [-.071,.071])oval(.018,'#8c6652',x,.24,.596,.55,1,.4,cow);
  for(const x of [-.24,.24])oval(.038,'#2c2923',x,.32,.455,1,.83,.5,cow);
  for(const side of [-1,1]){
    const horn=cyl(.023,.069,.19,'#8f795a',side*.35,.57,-.005,cow,10);horn.rotation.z=-side*.44;
    const ear=oval(.13,'#9b8062',side*.57,.27,0,1.35,.52,.71,cow);ear.rotation.z=side*.22;
    oval(.12,'#957852',side*.43,-.46,.1,1.1,.6,.9,cow);
  }
  const bedPlushies=addBedPlushies(bed);
  const plushBounce=createPlushBounce([cow,...Object.values(bedPlushies)]);
  // Phone, controller and tiny orange ball resting on the blanket.
  const phone=box(.19,.026,.34,'#252a2a',-.17,.911,1.09,bed);phone.rotation.y=-.15;
  box(.15,.005,.24,'#202e32',-.17,.927,1.09,bed).rotation.y=-.15;
  const gamepad=group(.82,.984,-.92,bed);gamepad.rotation.y=.3;oval(.14,'#525553',0,0,0,1.7,.37,.92,gamepad);
  for(const x of [-.18,.18])oval(.09,'#515351',x,-.007,.04,.9,.5,1.1,gamepad);
  for(const x of [-.1,.08])cyl(.034,.034,.018,'#252a28',x,.055,0,gamepad,12);
  for(let i=0;i<4;i++)ball(.013,['#ba8059','#628270','#827497','#b1a670'][i],.15+(i%2)*.032,.06,-.07+Math.floor(i/2)*.031,gamepad,8);
  ball(.068,'#bd601d',.31,.963,1.54,bed,16);
  // The shelf sits away from the painted wall, with the clock above the book.
  const bedside=group(-2.80,0,3.12);bedside.name='bedside-table';
  box(.87,.09,.77,'#554335',0,.93,0,bedside);
  for(const x of [-.40,.40])box(.075,.85,.75,'#463a30',x,.49,0,bedside);
  box(.84,.075,.72,'#4c3b2d',0,.11,0,bedside);box(.82,.74,.045,'#332c25',0,.52,-.33,bedside);
  for(let i=0;i<6;i++)box(.065,.45+(i%2)*.10,.43,['#b03f38','#cfb481','#bd7752','#e1d1ad','#78675b','#c7a765'][i],-.30+i*.08,.39,.025,bedside);
  const book=group(.13,.48,.41,bedside);book.name='the-mom-test';book.rotation.y=.38;book.rotation.x=-.08;
  box(.45,.65,.045,'#ac3345',0,0,0,book);box(.42,.62,.042,'#ead8be',0,0,-.012,book);
  const bookcover=new THREE.Mesh(new THREE.PlaneGeometry(.44,.64),new THREE.MeshBasicMaterial({map:momTestCover(),toneMapped:false}));bookcover.name='mom-test-cover';bookcover.position.z=.025;book.add(bookcover);
  const clock=group(.13,1.08,.05,bedside);clock.name='bedside-clock';box(.44,.23,.15,'#252729',0,0,0,clock);
  const clockDisplay=createClockDisplay();clockDisplay.screen.position.z=.081;clock.add(clockDisplay.screen);
  // A slender stand brings the warm orb over to the doorway.
  const lamp=group(2.65,0,3.21);lamp.name='doorway-lamp';
  cyl(.21,.23,.055,'#544a3d',0,.03,0,lamp,24);cyl(.028,.028,1.12,'#a78b5c',0,.61,0,lamp,16);
  cyl(.12,.15,.09,'#a78b5c',0,1.19,0,lamp,16);cyl(.055,.065,.10,'#624f36',0,1.26,0,lamp,16);
  const orb=ball(.19,'#ffe5a0',0,1.45,0,lamp,24);orb.name='doorway-lamp-globe';orb.material=new THREE.MeshStandardMaterial({color:'#ffdf83',emissive:'#ffd25b',emissiveIntensity:2,roughness:.5});
  const bedsideLight=new THREE.PointLight('#ffbf59',6,4.6,2);bedsideLight.position.set(0,1.48,0);lamp.add(bedsideLight);
  const backLamp=group(-1.73,0,-3.43);backLamp.name='racecar-reading-lamp';
  cyl(.19,.21,.055,'#5c5143',0,.035,0,backLamp,24);cyl(.026,.026,1.17,'#ae9368',0,.63,0,backLamp,16);
  cyl(.22,.31,.31,'#e4c991',0,1.35,0,backLamp,16,{emissive:'#ffdba0',emissiveIntensity:.5});
  const backLight=new THREE.PointLight('#ffd7a0',3,5.8,2);backLight.position.set(0,1.31,.13);backLamp.add(backLight);
  function plant(x,y,z,scale=1,parent=root,trail=false){const p=group(x,y,z,parent);p.scale.setScalar(scale);box(.23,.21,.23,'#aca887',0,.1,0,p);for(let i=0;i<12;i++){const a=i*2.4,r=.08+(i%3)*.04;const leaf=oval(.11,i%2?'#677942':'#819043',Math.sin(a)*r,.20+(i%4)*.05,Math.cos(a)*r,.45,1.25,.3,p);leaf.rotation.z=Math.cos(a)*.5;}if(trail)for(let i=0;i<15;i++){const yy=.04-i*.065;rod(V(-.06,yy,.04),V(-.1,yy-.09,.06),.008,'#657141',p);oval(.072,'#788346',-.09+Math.sin(i)*.09,yy,.1,.7,1,.35,p);}return p;}
  plant(-.35,1.01,.04,.8,bedside,true);
  // Rope-hung plush shelves. Each toy has its own 3D silhouette.
  function toy(type,x,y,z,scale=1,parent=root){
    const plush=createPlush(type,parent);plush.position.set(x,y,z);plush.scale.setScalar(scale);return plush;
  }
  const plushLayout=[
    {y:3.05,toys:[['green',-.05,.055,-.11,1.05,-.13],['yellow',-.43,.045,.075,.90,-.08],['yellow',-.14,.09,.035,.65,.15],['pink',.42,.045,.045,1.08,-.12],['mini',.07,.045,.19,.92,.08]]},
    {y:1.98,toys:[['straw-hat',.04,.06,-.095,.98,.06],['blue',-.43,.07,-.055,.87,.1],['boba',-.41,.04,.175,.92,-.08],['pink',-.035,.043,.19,.54,.18],['panda',.40,.04,.07,1.06,-.18]]},
  ];
  for(const [index,layout] of plushLayout.entries()){
    const shelf=group(-3.57,layout.y,-2.56);shelf.rotation.y=Math.PI/2;shelf.name='decorative-plush-shelf-'+index;
    box(1.43,.065,.59,'#b99372',0,0,0,shelf);
    for(const x of [-.66,.66]){rod(V(0,.96,-.22),V(x,.04,.25),.009,'#d9c7aa',shelf);rod(V(0,.96,-.22),V(x,.04,-.25),.009,'#d9c7aa',shelf);}
    const hook=new THREE.Mesh(new THREE.TorusGeometry(.032,.008,6,16),material('#b39e84'));hook.position.set(0,.98,-.24);shelf.add(hook);
    for(const [type,x,y,z,size,angle] of layout.toys){const plush=toy(type,x,y,z,size,shelf);plush.rotation.y=angle;}
  }
  // Formula-style model cars, including the red centerpiece and vertical collection board.
  function car(color,x,y,z,scale=1,parent=root){const c=group(x,y,z,parent);c.scale.setScalar(scale);
    box(.72,.16,.34,color,-.12,.13,0,c);box(.65,.095,.13,color,.47,.13,0,c);
    box(.11,.065,.76,color,.79,.055,0,c);box(.16,.09,.76,color,-.69,.30,0,c);
    for(const zz of [-.24,.24])box(.08,.20,.04,'#202323',-.68,.18,zz,c);
    oval(.14,'#222927',-.18,.23,0,1.3,.65,.78,c);box(.19,.11,.13,color,-.41,.28,0,c);
    for(const xx of [-.51,.51])for(const zz of [-.34,.34]){const wheel=cyl(.153,.153,.145,'#252727',xx,.13,zz,c,16);wheel.rotation.x=Math.PI/2;const hub=cyl(.085,.085,.152,'#77756b',xx,.13,zz,c,12);hub.rotation.x=Math.PI/2;}
    for(const zz of [-.19,.19])box(.41,.025,.017,'#d5ae43',-.06,.21,zz,c);
    return c;
  }
  const rack=group(-2.71,2.27,-3.735);rack.name='model-car-rack';rack.userData.interaction='ferrari-rack';box(.84,3.72,.10,'#252628',0,0,0,rack);
  for(let i=0;i<30;i++)for(const x of [-.415,.415])box(.034,.065,.017,i%2?'#e2d5be':'#bb3b33',x,-1.8+i*.123,.061,rack);
  for(let row=0;row<5;row++)for(let col=0;col<2;col++){
    const x=-.20+col*.4,y=1.48-row*.70;box(.31,.57,.018,'#484744',x,y,.07,rack);
    const c=car(['#bb322c','#df7b2b','#daae32','#47738c','#447b4a'][(row+col)%5],x,y,.13,.29,rack);c.name='wall-car-'+row+'-'+col;
    // Local +X is the nose, +Y the roof: point them up and out from the wall.
    c.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0,1,0),V(0,0,1),V(1,0,0)));
  }
  const model=car('#bf2f2b',-.67,1.26,-3.38,1.08);model.rotation.z=-.10;model.name='red-formula-model';model.userData.interaction='ferrari';
  // Window, half-lowered venetian blinds and a display ledge full of small collectibles.
  const window=group(-.20,2.97,-3.755);window.name='window-display';
  box(3.26,2.27,.10,'#d2c0a3',0,0,0,window);
  addSunsetWindow(window);
  for(const x of [-1.58,1.58])box(.11,2.18,.13,'#decead',x,0,.08,window);
  box(3.2,.08,.12,'#bdb8ad',0,1.09,.11,window);
  for(let i=0;i<15;i++){const slat=box(3.10,.052,.17,'#aaa9a6',0,1.02-i*.068,.15,window);slat.rotation.x=.17;}
  for(const x of [-1.06,1.08])box(.013,1.13,.012,'#ddd4c4',x,.48,.25,window);
  box(3.36,.115,.57,'#44433b',0,-1.12,.16,window);
  const sill=group(0,-1.06,.16,window);
  toy('green',-.94,0,.015,1.06,sill);toy('green',.34,0,.06,.89,sill);toy('panda',1.15,0,.17,.42,sill);
  // Seated teal-clothed figure.
  const figure=group(-.65,0,.05,sill);oval(.095,'#4a5441',0,.44,0,.86,1.06,.86,figure);box(.15,.20,.13,'#327b7d',0,.27,0,figure);
  for(const x of [-.06,.06]){rod(V(x,.22,.01),V(x,.1,.16),.025,'#426369',figure);rod(V(x,.1,.16),V(x,-.015,.14),.023,'#b69768',figure);}
  const note=group(-.25,.28,-.04,sill);note.rotation.y=-.1;box(.35,.46,.045,'#c4d0c5',0,0,0,note);label('NOTE',.29,.11,0,.11,.027,note,'#556881','#d7e0d5');
  const pumpkin=oval(.14,'#d47829',-.35,.15,.24,1.0,.89,.85,sill);for(const x of [-.39,-.30])oval(.021,'#4a3928',x,.19,.35,.8,1,.4,sill);cyl(.022,.023,.07,'#6d7150',-.35,.30,.24,sill,8);
  function house(x,z,size,color){const h=group(x,0,z,sill);h.scale.setScalar(size);box(.26,.29,.23,color,0,.17,0,h);box(.33,.055,.30,'#76513c',0,.34,0,h);const roof=cyl(.04,.23,.18,'#855039',0,.43,0,h,4);roof.rotation.y=Math.PI/4;for(const xx of [-.07,.07])box(.065,.075,.015,'#dfbe68',xx,.23,.123,h);box(.06,.12,.015,'#564c3e',0,.11,.123,h);return h;}
  house(.14,.21,.73,'#5b7990');house(.76,.13,1.20,'#7e5940');house(1.21,.015,.70,'#b09566');
  const flowers=group(1.44,0,.20,sill);cyl(.10,.073,.15,'#8b6d60',0,.08,0,flowers,8);
  for(let i=0;i<8;i++){const a=i*2.4;rod(V(0,.14,0),V(Math.sin(a)*.1,.26+(i%3)*.035,Math.cos(a)*.08),.006,'#5b7844',flowers);for(let j=0;j<5;j++)ball(.025,'#e6bdc7',Math.sin(a)*.1+Math.sin(j*1.26)*.027,.28+(i%3)*.035,Math.cos(a)*.08+Math.cos(j*1.26)*.027,flowers,8);}
  const sunflower=group(.69,.45,-.13,sill);for(let i=0;i<10;i++){const a=i*Math.PI/5;const petal=oval(.055,'#e3b637',Math.sin(a)*.10,Math.cos(a)*.10,0,.5,1,.4,sunflower);petal.rotation.z=-a;}ball(.06,'#755237',0,0,.014,sunflower,12);rod(V(0,-.04,0),V(0,-.45,0),.014,'#7b8b48',sunflower);
  // The green forest waterfall matches the wanted poster's height, at its original aspect ratio.
  for(const sign of [-1,1])rod(V(1.65+sign*.18,2.72,-3.75),V(1.65-sign*.18,3.64,-3.75),.021,'#825037');
  framed('moon',1.056,1.32,2.45,3.14,-3.765);
  framed('purple',.43,.43,3.43,3.10,-3.765);framed('yellow',.43,.43,3.43,2.53,-3.765);
  framed('map',.43,.46,1.82,2.13,-3.765,0,'#a58354');
  framed('samurai',.43,.43,2.38,2.13,-3.765,0,'#25211e');
  framed('deer',.43,.43,2.90,2.13,-3.765,0,'#25211e');
  framed('dog',.43,.55,3.43,3.76,-3.765);
  // Black desk with two screens, orange keyboard, desk mat, bottle, headphones and plant.
  const desk=group(1.60,0,-1.70);desk.name='dual-monitor-desk';desk.userData.interaction='projects';
  box(3.13,.095,1.12,'#343735',0,1.17,0,desk);box(3.11,.025,1.10,'#575953',0,1.23,0,desk);
  for(const x of [-1.42,1.42])for(const z of [-.43,.43])box(.075,1.14,.075,'#2d302d',x,.59,z,desk);
  box(3.03,.09,.08,'#35372f',0,.95,-.43,desk);
  const mat=box(2.85,.009,.88,'#6b7173',-.05,1.25,.03,desk);mat.material=material('#737a7b',{bumpMap:fibers,bumpScale:.018,roughness:.9});
  for(const [x,key,rotation] of [[-.70,'screenLeft',.1],[.69,'screenRight',-.20]]){
    const mon=group(x,1.25,-.27,desk);mon.rotation.y=rotation;
    box(.36,.033,.29,'#282e2b',0,.02,.025,mon);box(.06,.23,.07,'#292e2c',0,.15,0,mon);
    box(1.31,.88,.065,'#232b2b',0,.63,0,mon);
    const screen=artworkPlane(reference,key,1.225,.785,true);screen.position.set(0,.65,.037);mon.add(screen);monitors.push(screen);
  }
  const keyboard=group(.46,1.283,.25,desk);keyboard.rotation.y=-.03;
  box(.89,.055,.32,'#282b2a',0,0,0,keyboard);
  for(let row=0;row<4;row++)for(let col=0;col<14;col++)box(.045,.025,.05,(col+row)%5?'#c16337':'#aa6e44',-.405+col*.061,.036,-.112+row*.071,keyboard);
  box(.29,.016,.045,'#d67b42',-.045,.053,.10,keyboard);
  const mouse=oval(.095,'#282e2c',1.15,1.29,.27,.67,.38,1,desk);mouse.rotation.y=-.18;
  const bottle=group(-.39,1.267,.25,desk);bottle.name='desk-water-bottle';cyl(.08,.079,.43,'#287481',0,.23,0,bottle,20);cyl(.075,.075,.028,'#82a5a4',0,.46,0,bottle,20);cyl(.031,.029,.065,'#2c6872',0,.50,0,bottle,12);label('8',.075,.14,0,.2,.083,bottle,'#d7dfd1','#287481');
  const deskPlant=plant(-1.02,1.27,.08,.86,desk);deskPlant.name='desk-plant';
  const headphones=group(1.03,1.34,.39,desk);headphones.name='desk-headphones';headphones.rotation.x=-.4;const band=new THREE.Mesh(new THREE.TorusGeometry(.17,.026,8,24,Math.PI*1.5),material('#292d2a'));band.rotation.z=-.78;headphones.add(band);
  for(const x of [-.16,.16]){const ear=cyl(.089,.089,.063,'#232b28',x,0,0,headphones,16);ear.rotation.z=Math.PI/2;const trim=cyl(.061,.061,.067,'#957c4b',x,0,0,headphones,16);trim.rotation.z=Math.PI/2;}
  bottle.position.set(-1.26,1.267,.40);
  const racing=addRacingSim(desk);
  // Gaming chair with the tall back, red piping and caster base.
  const chair=group(1.44,0,.29);chair.name='gaming-chair';chair.userData.interaction='projects';chair.rotation.y=Math.PI+.13;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod(V(0,.17,0),V(Math.sin(a)*.46,.12,Math.cos(a)*.46),.03,'#282a28',chair);const wheel=cyl(.075,.075,.068,'#292b29',Math.sin(a)*.46,.09,Math.cos(a)*.46,chair,12);wheel.rotation.z=Math.PI/2;}
  cyl(.05,.055,.48,'#535853',0,.41,0,chair,12);box(.70,.16,.69,'#303430',0,.72,0,chair);
  box(.64,.83,.15,'#323631',0,1.09,-.31,chair);box(.48,.32,.15,'#363932',0,1.65,-.31,chair);
  for(const side of [-1,1]){box(.09,.69,.17,'#41413a',side*.31,1.18,-.26,chair).rotation.z=-side*.14;box(.021,.69,.023,'#9c604b',side*.348,1.20,-.166,chair);box(.041,.33,.044,'#292d29',side*.43,.86,.02,chair);box(.14,.065,.48,'#30332c',side*.43,1.055,.03,chair);}
  // PC tower, blue fans, honeycomb grille and the little green toy on top.
  const pcShelf=group(3.4,0,-1.54);pcShelf.name='pc-and-shelves';
  box(.74,.09,1.37,'#292c27',0,1.19,0,pcShelf);box(.73,.08,1.37,'#2e3029',0,.07,0,pcShelf);
  for(const x of [-.33,.33])box(.075,1.10,1.34,'#292c27',x,.63,0,pcShelf);box(.66,.07,1.30,'#3d3b2e',0,.60,0,pcShelf);
  for(let i=0;i<7;i++)box(.061,.32,.46,['#b23836','#cc9c62','#d9be8d','#637874'][i%4],-.25+i*.073,.84,.36,pcShelf);
  box(.64,1.26,.85,'#202725',0,1.86,-.16,pcShelf);box(.55,1.16,.025,'#14232b',0,1.86,.281,pcShelf);
  for(const y of [1.48,1.86,2.24]){const fan=new THREE.Mesh(new THREE.TorusGeometry(.137,.025,8,24),new THREE.MeshStandardMaterial({color:'#4b94c2',emissive:'#258dd7',emissiveIntensity:1.1}));fan.position.set(0,y,.306);pcShelf.add(fan);ball(.04,'#5a8ca2',0,y,.31,pcShelf,12);for(let i=0;i<6;i++){const blade=box(.085,.029,.011,'#3273a1',Math.sin(i*Math.PI/3)*.062,y+Math.cos(i*Math.PI/3)*.062,.31,pcShelf);blade.rotation.z=-i*Math.PI/3;}}
  for(let row=0;row<8;row++)for(let col=0;col<4;col++){const hex=new THREE.Mesh(new THREE.RingGeometry(.056,.063,6),material('#1d2f35'));hex.position.set(-.196+col*.126+(row%2)*.02,1.38+row*.132,.329);pcShelf.add(hex);}
  const turtle=toy('green',.02,2.49,-.18,.75,pcShelf);turtle.rotation.y=.5;oval(.13,'#b39b54',.02,2.67,-.21,1.35,.70,1,pcShelf);
  box(.13,.05,.12,'#c49092',-.2,2.54,.16,pcShelf);
  const pcLight=new THREE.PointLight('#3f8ed3',2.1,3.0,2);pcLight.position.set(3.26,1.95,-.87);root.add(pcLight);
  cyl(.22,.17,.56,'#4b4535',3.28,.3,-.4,root,6);cyl(.185,.185,.012,'#292b26',3.28,.586,-.4,root,6);
  const floorBottle=group(-.62,0,.85);cyl(.084,.086,.41,'#337a7d',0,.21,0,floorBottle,16);cyl(.055,.056,.065,'#2b6565',0,.45,0,floorBottle,12);label('8',.077,.15,0,.23,.088,floorBottle,'#e0dfc8','#337a7d');
  const screenLight=new THREE.PointLight('#71b9e9',1.2,3.0,2);screenLight.position.set(1.58,2,-1.5);root.add(screenLight);
  return {root,door,artworks,chair,monitors,clockDisplay,deskProps:[bottle,deskPlant,headphones,racing.wheel],bed,bedPlushies,plushBounce,update(dt,night,reduced){plushBounce.update(dt,reduced);bedsideLight.intensity=4+night*3;backLight.intensity=3+night*4;pcLight.intensity=2.1+night*1.3;screenLight.intensity=1.2+night*.6;}};
}
