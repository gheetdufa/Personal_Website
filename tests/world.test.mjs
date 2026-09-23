import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../world.js';
import {Texture,Vector3,Raycaster,Vector2,Box3} from '../vendor/three.module.js';
import {ROOMS,COUCH_SEAT,COUCH_EXIT} from '../rooms.js';
import {PULLUP} from '../pullup.js';
import {isWalkable} from '../navigation.js';
import {PHOTO_SOURCES} from '../painting-photos.js';
import {createProjectScreens} from '../project-screens.js';
import {canvasContext} from './canvas-context.mjs';
// Exercise actual Three.js scene, transforms and picking without claiming GPU/browser QA.
globalThis.devicePixelRatio=1;
globalThis.document={createElement(){return {getContext:canvasContext};}};
class Renderer{constructor(){this.domElement={};this.shadowMap={};}setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();}}
function build(width=1440,height=900){return createWorld({clientWidth:width,clientHeight:height,appendChild(){},getBoundingClientRect(){return {left:0,top:0,width,height};}},()=>new Renderer(),new Texture(),Object.fromEntries(Object.keys(PHOTO_SOURCES).map(id=>[id,new Texture()])));}
test('The bookshelf zoom fits every cover and opens readable books without foreground occlusion',()=>{
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  for(const [width,height] of [[1440,900],[390,844],[844,390]]){
    const world=build(width,height);world.setRoom('living');const station=ROOMS.living.stations.library.position;
    world.player.position.set(station.x,.06,station.z);world.render(0,false,0,false);
    const start={position:world.camera.position.clone(),rotation:world.camera.quaternion.clone(),player:world.player.position.clone()};
    world.library.open();world.render(0,false,0,true);assert.equal(world.library.ready,true);
    for(const [index,points] of world.bookSurfaces().entries()){
      for(const p of points)assert.ok(p.x>0&&p.x<width&&p.y>70&&p.y<height-70,JSON.stringify({index,width,height,p}));
      const point=points.reduce((p,v)=>({x:p.x+v.x/4,y:p.y+v.y/4}),{x:0,y:0});assert.equal(world.pickBook(point.x,point.y),index);
    }
    for(const [index,item] of world.library.books.entries()){
      world.library.select(index);world.render(0,false,0,true);assert.equal(world.library.bookReady,true);
      for(const mesh of [item.left,item.right])for(const x of [-.20,0,.20])for(const y of [-.26,0,.26]){
        const point=world.project(mesh.localToWorld(new Vector3(x,y,.001)));
        assert.ok(point.x>0&&point.x<width&&point.y>70&&point.y<height-80,JSON.stringify({index,width,height,point}));
        const ray=new Raycaster();ray.setFromCamera(new Vector2(point.x/width*2-1,-(point.y/height*2-1)),world.camera);ray.near=world.camera.near;
        const hit=ray.intersectObject(world.scene,true).find(h=>visible(h.object));assert.equal(hit?.object,mesh,`Book ${index} is obscured at ${width}x${height}`);
      }
    }
    world.library.close();world.render(0,false,0,true);world.render(0,false,0,true);
    assert.equal(world.library.busy,false);assert.deepEqual(world.camera.position,start.position);assert.deepEqual(world.camera.quaternion.toArray(),start.rotation.toArray());assert.deepEqual(world.player.position,start.player);
    world.library.books.forEach(item=>{assert.deepEqual(item.root.position,item.rest);assert.equal(item.hinge.rotation.y,0);assert.deepEqual(item.root.scale.toArray(),[1,1,1]);});
  }
});
test('Interrupted bookshelf entry and book changes return every object and camera to rest',()=>{
  for(const hz of [30,60,120]){
    const world=build();world.setRoom('living');world.render(0,false,0,false);const position=world.camera.position.clone();
    world.library.open();world.render(.3,false,0,false);world.library.close();for(let i=0;i<hz;i++)world.render(1/hz,false,0,false);assert.equal(world.library.busy,false);
    world.library.open();for(let i=0;i<hz*2;i++)world.render(1/hz,false,0,false);
    world.library.select(2);for(let i=0;i<hz/2;i++)world.render(1/hz,false,0,false);
    world.library.select(4);world.render(.12,false,0,false);world.library.close();for(let i=0;i<hz*4;i++)world.render(1/hz,false,0,false);
    assert.equal(world.library.busy,false);assert.deepEqual(world.camera.position,position);world.library.books.forEach(item=>assert.deepEqual(item.root.position,item.rest));
    world.library.open();world.render(2,false,0,false);world.library.select(1);world.render(.4,false,0,false);world.setRoom('bedroom');assert.equal(world.library.busy,false);assert.deepEqual(world.camera.position,position);
  }
});
test('Computer, car collection, bookshelf and sofa can be clicked as physical objects',()=>{
  const world=build();world.render(.016,false,0,false);
  for(const [id,point] of [['projects',{x:2.29,y:1.90,z:-1.91}],['ferrari-rack',{x:-2.71,y:3.76,z:-3.64}]]){
    const screen=world.project(point);assert.equal(world.pickInteraction(screen.x,screen.y),id);
  }
  world.setRoom('living');world.render(.016,false,0,false);
  for(const [id,point] of [['library',{x:-2.67,y:2.83,z:-2.97}],['couch',{x:.615,y:1.1,z:3.065}]]){
    const screen=world.project(point);assert.equal(world.pickInteraction(screen.x,screen.y),id);
  }
  assert.ok(world.scene.getObjectByName('nintendo-switch'));
  const dock=world.scene.getObjectByName('switch-dock');
  const dockPoint=dock.localToWorld(new Vector3(0,0,.07)),switchScreen=world.project(dockPoint);
  assert.equal(world.pickInteraction(switchScreen.x,switchScreen.y),'switch');
  const tvPoint=world.scene.getObjectByName('living-tv-screen').localToWorld(new Vector3(0,.3,.01)),tvScreen=world.project(tvPoint);
  assert.equal(world.pickInteraction(tvScreen.x,tvScreen.y),'switch');
});
test('Sitting bends the avatar at the hips and knees, and standing restores a walkable position',()=>{
  const world=build();assert.equal(world.sit(),false);world.setRoom('living');
  for(let i=0;i<3;i++){
    assert.equal(world.sit(),true);world.render(.016,false,0,false);
    assert.equal(world.seated,true);assert.deepEqual(world.player.position.toArray(),[COUCH_SEAT.x,COUCH_SEAT.y,COUCH_SEAT.z]);
    assert.equal(world.player.getObjectByName('left-thigh').rotation.x,-Math.PI/2);assert.equal(world.player.getObjectByName('left-shin').rotation.x,Math.PI/2);
    world.stand();world.render(.016,false,0,false);assert.equal(world.seated,false);
    assert.deepEqual(world.player.position.toArray(),[COUCH_EXIT.x,COUCH_EXIT.y,COUCH_EXIT.z]);assert.ok(isWalkable(world.player.position.x,world.player.position.z,ROOMS.living.obstacles));
    assert.equal(world.player.getObjectByName('left-shin').rotation.x,0);
  }
  world.sit();world.setRoom('bedroom');assert.equal(world.seated,false);assert.equal(world.zuko,null);
});
test('Switching rooms preserves one visitor and hides the inactive scene',()=>{
  const world=build(),visitor=world.player,childCount=world.scene.children.length;
  for(const roomId of ['living','bedroom','living','bedroom']){
    world.setRoom(roomId);world.render(.016,false,0,false);
    assert.equal(world.activeRoom,roomId);assert.equal(world.player,visitor);
    assert.equal(world.scene.getObjectByName('bedroom').visible,roomId==='bedroom');
    assert.equal(world.scene.getObjectByName('living-room').visible,roomId==='living');
    assert.equal(visitor.parent,world.scene);assert.equal(world.scene.children.length,childCount);
    assert.equal(visitor.position.x,ROOMS[roomId].arrival.x);assert.equal(visitor.position.z,ROOMS[roomId].arrival.z);
  }
  assert.throws(()=>world.setRoom('missing'));assert.equal(world.activeRoom,'bedroom');
});
test('Both rooms render their scene state and pick the floor across desktop and phone sizes',()=>{
  for(const [width,height] of [[1440,900],[1024,768],[390,844],[375,667]]){
    const world=build(width,height);
    for(const roomId of ['bedroom','living']){
      world.setRoom(roomId);world.render(.016,true,1,false);world.toggleLight();world.render(.2,false,0,true);
      const original={x:2.3,y:.085,z:-1.9},screen=world.project(original),hit=world.floorPoint(screen.x,screen.y);
      assert.ok(Math.hypot(hit.x-original.x,hit.z-original.z)<.001);
      const points=[];for(const x of [-3.98,3.98])for(const z of [-3.98,3.98])for(const y of [-.4,4.3])if(y<0||x<0||z<0)points.push(world.project({x,y,z}));
      assert.ok(points.every(p=>p.x>=0&&p.x<=width&&p.y>=75&&p.y<=height-70),'Room must fit the viewport');
      const label=world.project(ROOMS[roomId].stations.door.anchor);assert.ok(label.x>0&&label.x<width&&label.y>75&&label.y<height-70);
    }
  }
});
test('Each focused physical monitor fits both desktop and phone views',()=>{
  for(const [width,height] of [[1440,900],[1024,768],[390,844],[844,390]]){
    const world=build(width,height),start=world.player.position.clone(),chair=world.scene.getObjectByName('gaming-chair');
    world.render(.016,false,0,false);world.desk.open();world.render(.016,false,0,true);
    assert.equal(world.desk.ready,true);assert.equal(world.player.getObjectByName('left-thigh').rotation.x,-Math.PI/2);
    assert.equal(world.player.getObjectByName('left-shin').rotation.x,Math.PI/2);
    assert.equal(world.player.position.z,chair.position.z);
    for(const [i] of world.monitors.entries()){
      {world.desk.focusMonitor(i?'library':'project');world.render(.016,false,0,true);}
      const surface=world.monitorSurfaces()[i];
      const [a,b,c,d,e,f]=surface.matrix;
      for(const x of [0,surface.width])for(const y of [0,surface.height]){
        const px=a*x+c*y+e,py=b*x+d*y+f;
        assert.ok(px>=0&&px<=width&&py>=0&&py<=height,JSON.stringify({width,height,px,py}));
      }
      assert.ok(a*d-b*c>0,'Screen text cannot be mirrored');
    }
    world.desk.close();world.render(.016,false,0,true);assert.deepEqual(world.player.position,start);
    assert.equal(world.player.getObjectByName('left-shin').rotation.x,0);assert.equal(chair.position.z,.29);
    world.desk.open();world.render(.016,false,0,true);world.setRoom('living');assert.equal(world.desk.busy,false);
    assert.equal(chair.position.z,.29);assert.deepEqual(world.camera.position.toArray(),[12,12.5,14]);
  }
});
test('The green forest waterfall matches the poster height without stretching or overlapping adjacent frames',()=>{
  const world=build(),green=world.gallery.items.find(item=>item.key==='moon'),blue=world.gallery.items.find(item=>item.key==='waterfall');
  const poster=world.scene.getObjectByName('wall-frame-wanted');
  assert.ok(Math.abs(green.height+.065-poster.children[0].geometry.parameters.height)<1e-9);
  assert.equal(green.width/green.height,.8);assert.equal(blue.height,.72);
  const frames=world.scene.getObjectByName('bedroom').children.filter(object=>object.name.startsWith('wall-frame-')&&object.rotation.y===0);
  for(let i=0;i<frames.length;i++)for(let j=i+1;j<frames.length;j++){
    const a=frames[i],b=frames[j],ga=a.children[0].geometry.parameters,gb=b.children[0].geometry.parameters;
    assert.ok(Math.abs(a.position.x-b.position.x)>(ga.width+gb.width)/2||Math.abs(a.position.y-b.position.y)>(ga.height+gb.height)/2,a.name+' overlaps '+b.name);
  }
});
test('Petting bends the visitor with moving hands; treats appear and disappear; leaving cancels the pose',()=>{
  const world=build();assert.equal(world.interactZuko(),false);world.setRoom('living');
  assert.equal(world.interactZuko(),false,'Cannot pet across the room');
  world.player.position.copy(world.zuko.root.position).add(new Vector3(0,.06,.82));
  assert.equal(world.interactZuko(),true);assert.equal(world.interactZuko('treat'),false);
  for(let i=0;i<25;i++)world.render(.04,false,0,false);
  assert.ok(world.player.getObjectByName('avatar-torso').rotation.x>.5);
  assert.ok(world.player.getObjectByName('left-shin').rotation.x>1);
  assert.equal(world.zuko.state.activity,'pet');
  for(let i=0;i<50;i++)world.render(.04,false,0,false);
  assert.equal(world.interactingWithZuko,false);assert.equal(world.player.getObjectByName('avatar-torso').rotation.x,0);
  assert.equal(world.interactZuko('treat'),true);world.render(.6,false,0,false);
  assert.equal(world.player.getObjectByName('dog-treat-in-hand').visible,true);
  world.render(1.1,false,0,false);assert.equal(world.player.getObjectByName('dog-treat-in-hand').visible,false);
  world.setRoom('bedroom');world.render(.04,false,0,false);assert.equal(world.interactingWithZuko,false);
  assert.equal(world.player.getObjectByName('avatar-torso').rotation.x,0);
});
test('Sitting invites Zuko alongside, treats preserve seating, and standing sends him down',()=>{
  const world=build();world.setRoom('living');world.sit();world.render(.04,false,0,true);
  assert.equal(world.zuko.state.activity,'couch');assert.equal(world.interactZuko('treat'),true);
  world.render(.5,false,0,false);assert.equal(world.seated,true);
  assert.equal(world.player.getObjectByName('left-thigh').rotation.x,-Math.PI/2);
  world.render(3,false,0,false);world.stand();world.render(.8,false,0,false);
  assert.equal(world.zuko.root.position.y,0);assert.equal(world.seated,false);
});
test('Plush shelves are decorative and have varied characters without interaction targets',()=>{
  const world=build();assert.equal(ROOMS.bedroom.stations.shelf,undefined);
  for(let i=0;i<2;i++){
    const shelf=world.scene.getObjectByName('decorative-plush-shelf-'+i);assert.ok(shelf);
    shelf.traverse(object=>assert.equal(object.userData.interaction,undefined));
  }
});
test('The bed and added plushies are physical About Me targets, with a safe standing return',()=>{
  const world=build(),start=world.player.position.clone();world.render(.016,false,0,false);
  for(const name of ['bed-triceratops','bed-halo-helmet','bed-antler-plush','cow-plush'])assert.ok(world.scene.getObjectByName(name));
  const bedPoint=world.project({x:-1.3,y:.92,z:2.1});assert.equal(world.pickInteraction(bedPoint.x,bedPoint.y),'about');
  world.bed.open();world.render(.016,false,0,true);assert.equal(world.bed.ready,true);assert.ok(world.bed.display.visible);
  assert.equal(world.player.getObjectByName('left-thigh').rotation.x,-Math.PI/2);
  world.bed.close();world.render(.016,false,0,true);assert.deepEqual(world.player.position,start);
  assert.ok(isWalkable(start.x,start.z,ROOMS.bedroom.obstacles));world.bed.open();world.render(.2,false,0,false);world.setRoom('living');assert.equal(world.bed.busy,false);assert.equal(world.bed.display.visible,false);
});
test('The physical display surfaces remain readable, in frame, and unobstructed by the visitor or room',()=>{
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  for(const [width,height] of [[1440,900],[390,844],[844,390]]){
    const world=build(width,height);
    for(const mode of ['desk','bed']){
      world[mode].open();world.render(.016,false,0,true);
      const screens=mode==='desk'?world.monitors:[world.bed.screen];
      for(const [i,mesh] of screens.entries()){
        if(mode==='desk'){world.desk.focusMonitor(i?'library':'project');world.render(.016,false,0,true);}
        const w=mesh.geometry.parameters.width*.47,h=mesh.geometry.parameters.height*.45;
        for(const x of [-w,-w*.75,-w*.5,-w*.25,0,w*.25,w*.5,w*.75,w])for(const y of [-h,-h*2/3,-h/3,0,h/3,h*2/3,h]){
          const point=world.project(mesh.localToWorld(new Vector3(x,y,.001)));
          assert.ok(point.x>=0&&point.x<=width&&point.y>=0&&point.y<=height-90,JSON.stringify({width,height,mode,point}));
          const ray=new Raycaster();ray.setFromCamera(new Vector2(point.x/width*2-1,-(point.y/height*2-1)),world.camera);
          const hit=ray.intersectObject(world.scene,true).find(h=>visible(h.object));assert.ok(hit?.object===mesh,`Foreground object covers ${mode} screen at ${width}x${height}, local ${x},${y}: ${hit?.object.name || hit?.object.parent?.name || hit?.object.type}`);
        }
      }
      world[mode].close();world.render(.016,false,0,true);
    }
  }
});
test('The bar fits between the bookshelf and fireplace, with the visitor and Zuko on the moved sofa',()=>{
  const world=build();world.setRoom('living');world.render(.016,false,0,false);
  const bounds=name=>new Box3().setFromObject(world.scene.getObjectByName(name));
  const bar=bounds('pull-up-bar'),shelf=bounds('research-bookshelf'),fire=bounds('living-fireplace'),sofa=bounds('living-sofa');
  assert.ok(bar.min.x>shelf.max.x&&bar.max.x<fire.min.x,'The whole bar frame fits in the gap');
  world.sit();world.render(.016,false,0,true);
  for(const point of [world.player.position,world.zuko.root.position])assert.ok(point.x>sofa.min.x&&point.x<sofa.max.x&&point.z>sofa.min.z&&point.z<sofa.max.z,'Both couch occupants remain on their cushions');
});
test('Desk accessories move aside while using the monitors and return to their exact positions on exit',()=>{
  const world=build(),props=['desk-water-bottle','desk-plant','desk-headphones','racing-yoke'].map(n=>world.scene.getObjectByName(n)),rest=props.map(p=>p.position.clone());
  world.desk.open();world.render(.016,false,0,true);
  props.forEach((p,i)=>assert.ok(p.position.distanceTo(rest[i])>.25));
  world.desk.close();world.render(.016,false,0,true);props.forEach((p,i)=>assert.deepEqual(p.position,rest[i]));
  world.desk.open();world.render(.016,false,0,true);world.setRoom('living');props.forEach((p,i)=>assert.deepEqual(p.position,rest[i]));
});
test('The doorway lamp is visible beside the door, the racing controls clear the screens, and the bedside clock is live',()=>{
  const world=build();world.setTime(new Date(2026,8,21,12,4));world.render(3,false,0,false);
  const clock=world.scene.getObjectByName('bedside-clock-display');assert.equal(clock.userData.time,'12:04');
  world.setTime(new Date(2026,8,21,19,9));world.render(3,false,0,false);assert.equal(clock.userData.time,'7:09');
  const lamp=world.scene.getObjectByName('doorway-lamp-globe'),point=world.project(lamp.getWorldPosition(new Vector3()));
  const ray=new Raycaster();ray.setFromCamera(new Vector2(point.x/1440*2-1,-(point.y/900*2-1)),world.camera);
  const first=ray.intersectObject(world.scene,true).find(hit=>{for(let p=hit.object;p;p=p.parent)if(!p.visible)return false;return true;});
  assert.equal(first?.object,lamp,'The door must not cover the orb');
  assert.ok(world.scene.getObjectByName('racecar-reading-lamp'));assert.ok(world.scene.getObjectByName('racing-yoke'));assert.ok(world.scene.getObjectByName('racing-pedals'));
  assert.ok(isWalkable(3.18,1.01,ROOMS.living.obstacles),'The removed plant no longer blocks the living room');
});
test('The bedroom window is a geometric sunset without a stretched image',()=>{
  const world=build(),sunset=world.scene.getObjectByName('low-poly-sunset');assert.ok(sunset);assert.ok(sunset.getObjectByName('sunset-sun'));
  let meshes=0;sunset.traverse(o=>{if(o.isMesh){meshes++;assert.equal(o.material.map,null);}});assert.ok(meshes>=6);
});
test('Real monitor ray hits use the complete interface UVs, select folders, and restore the original wallpaper',()=>{
  const world=build(),original=world.monitors.map(m=>m.geometry),screens=createProjectScreens(world.monitors);
  world.desk.open();screens.wake();world.render(.016,false,0,true);
  const mesh=world.monitors[1],u=.38,v=.62,point=world.project(mesh.localToWorld(new Vector3((u-.5)*1.225,(.5-v)*.785,.001)));
  const hit=world.pickMonitor(point.x,point.y);assert.equal(hit.index,1);assert.ok(Math.abs(hit.u-u)<.002&&Math.abs(hit.v-v)<.002);
  assert.equal(screens.pointer(hit,true),true);assert.equal(screens.project.title,'Rant.AI');
  screens.sleep();world.monitors.forEach((m,i)=>assert.ok(m.geometry===original[i]));
});
test('Landing bounces every bed plush once, then returns their original transforms',()=>{
  const world=build(),plushies=['cow-plush','bed-triceratops','bed-halo-helmet','bed-antler-plush'].map(n=>world.scene.getObjectByName(n));
  const rest=plushies.map(p=>({position:p.position.clone(),rotation:p.rotation.clone(),scale:p.scale.clone()}));
  world.bed.open();world.render(.90,false,0,false);
  plushies.forEach((p,i)=>assert.deepEqual(p.position,rest[i].position));
  world.render(.05,false,0,false);world.render(.18,false,0,false);
  plushies.forEach((p,i)=>assert.ok(p.position.y>rest[i].position.y+.02,p.name+' bounces on impact'));
  world.render(2.1,false,0,false);
  plushies.forEach((p,i)=>{assert.deepEqual(p.position,rest[i].position);assert.deepEqual(p.rotation.toArray(),rest[i].rotation.toArray());assert.deepEqual(p.scale,rest[i].scale);});
  world.bed.close();world.render(4,false,0,false);world.render(.1,false,0,false);
  plushies.forEach((p,i)=>assert.deepEqual(p.position,rest[i].position));
  world.bed.open();world.render(0,false,0,true);world.render(.18,false,0,true);
  plushies.forEach((p,i)=>assert.deepEqual(p.position,rest[i].position));
});
test('The pull-up bar is clickable and keeps both hands on the grips through three repetitions and safe exits',()=>{
  const world=build();assert.equal(world.exercise(),false);world.setRoom('living');world.render(.016,false,0,false);
  const bar=world.scene.getObjectByName('pull-up-bar'),point=world.project(bar.localToWorld(new Vector3(0,2.30,0)));
  assert.equal(world.pickInteraction(point.x,point.y),'pullup');
  const station=ROOMS.living.stations.pullup.position;world.player.position.set(station.x,.06,station.z);const start=world.player.position.clone();
  assert.ok(isWalkable(start.x,start.z,ROOMS.living.obstacles));assert.equal(world.exercise(),true);assert.equal(world.exercise(),false);
  let peaks=0,previous=.9,rising=true;
  for(let i=0;i<400;i++){
    world.render(1/60,false,0,false);
    if(world.pullup.state.mode==='exercising'){
      const y=world.player.position.y;if(rising&&y<previous-1e-7){peaks++;rising=false;}else if(y>previous+1e-7)rising=true;previous=y;
      const arms=world.player.getObjectByName('pull-up-arms');assert.equal(arms.visible,true);
      for(const index of [2,5]){const hand=arms.children[index].getWorldPosition(new Vector3());assert.ok(Math.abs(hand.y-2.30)<1e-6);assert.ok(Math.abs(hand.z-PULLUP.z)<.002);assert.ok(Math.abs(Math.abs(hand.x-PULLUP.x)-.42)<.002);}
    }
  }
  assert.equal(peaks,3);world.render(1,false,0,false);assert.equal(world.pullup.busy,false);assert.deepEqual(world.player.position,start);assert.equal(world.player.getObjectByName('pull-up-arms').visible,false);
  for(const t of [.15,1.5]){world.exercise();world.render(t,false,0,false);world.pullup.finish();world.render(.7,false,0,false);assert.deepEqual(world.player.position,start);assert.equal(world.pullup.busy,false);}
  world.exercise();world.render(.7,false,0,true);assert.ok(Math.abs(world.player.position.y-.9)<1e-9);world.render(1,false,0,true);assert.ok(Math.abs(world.player.position.y-.9)<1e-9);
  world.setRoom('bedroom');assert.equal(world.pullup.busy,false);
});
test('The head and torso clear the pull-up bar during every repetition and interrupted dismounts',()=>{
  for(const hz of [30,60,120])for(const stopAt of [Infinity,.35,1.50]){
    const world=build();world.setRoom('living');const station=ROOMS.living.stations.pullup.position;
    world.player.position.set(station.x,.06,station.z);world.player.getObjectByName('dheer-avatar').rotation.y=Math.PI;
    world.render(0,false,0,false);
    const bar=new Box3().setFromObject(world.scene.getObjectByName('pull-up-crossbar')).expandByScalar(.015);
    const bodyParts=world.player.getObjectByName('avatar-torso').children.filter(part=>part.isMesh),body=new Box3();
    world.exercise();let interrupted=false;
    for(let frame=0;frame<hz*7;frame++){
      if(!interrupted&&frame/hz>=stopAt){world.pullup.finish();interrupted=true;}
      world.render(1/hz,false,0,false);
      for(const part of bodyParts){body.setFromObject(part);assert.equal(body.intersectsBox(bar),false,`Head or torso hits bar at ${frame/hz}s (${hz}fps, stop ${stopAt})`);}
    }
    assert.equal(world.pullup.busy,false);assert.deepEqual(world.player.position.toArray(),[station.x,.06,station.z]);
  }
});
test('Bed entry keeps legs and the tablet above the mattress, including takeoff, pickup and exit',()=>{
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const world=build(),station=ROOMS.bedroom.stations.about.position;world.player.position.set(station.x,.06,station.z);world.player.getObjectByName('dheer-avatar').rotation.y=angle;world.bed.open();
  function check(){
    world.scene.updateMatrixWorld(true);
    for(const name of ['left-thigh','right-thigh'])world.player.getObjectByName(name).traverse(mesh=>{
      if(!mesh.isMesh)return;const position=mesh.geometry.attributes.position;
      for(let i=0;i<position.count;i++){const v=new Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
        if(v.x> -3.37&&v.x<-.835&&v.z>-1.40&&v.z<2.60)assert.ok(v.y>.896,`${name} intersects bed at ${world.bed.state.elapsed.toFixed(2)}: ${v.toArray()}`);
      }
    });
    if(world.bed.display.visible)world.bed.display.traverse(mesh=>{if(!mesh.isMesh)return;const position=mesh.geometry.attributes.position;for(let i=0;i<position.count;i++){const v=new Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);assert.ok(v.y>.94,'Tablet stays above bedding');}});
  }
  for(let i=0;i<105;i++){world.render(1/30,false,0,false);check();}world.bed.close();for(let i=0;i<105;i++){world.render(1/30,false,0,false);check();}
  }
});
