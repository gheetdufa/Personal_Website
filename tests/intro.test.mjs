import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createRoomIntro,INTRO_DURATION,installIntroUI} from '../room-intro.js';
import {letterState,introStatus,INTRO_TIMING} from '../intro-wordmark.js';
import {Window} from 'happy-dom';

function setup(){
  const scene=new THREE.Scene(),room=new THREE.Group(),player=new THREE.Group(),ground=new THREE.Group();scene.add(room,player,ground);
  const nested=new THREE.Group();nested.position.set(-2,1,.5);nested.rotation.y=.6;nested.scale.set(1,.8,1);room.add(nested);
  const a=new THREE.Mesh(new THREE.BoxGeometry(.5,1,.2),new THREE.MeshBasicMaterial());a.position.set(.1,2,0);nested.add(a);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.2),a.material);b.position.set(1,.5,2);room.add(b);
  const hidden=new THREE.Mesh(a.geometry,a.material);hidden.visible=false;room.add(hidden);
  const camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,100);camera.position.set(12,12.5,14);camera.lookAt(0,1.45,0);camera.updateMatrixWorld();scene.updateMatrixWorld(true);
  const snapshots=[a,b,hidden].map(o=>({object:o,matrix:o.matrixWorld.clone(),visible:o.visible}));
  const intro=createRoomIntro({scene,room,player,ground,camera}),layout={aspect:3,points:[{x:-.45,y:.4},{x:.45,y:-.4}]};
  return {scene,room,player,ground,camera,intro,layout,snapshots};
}
test('Actual room pieces form the word, travel continuously, then restore without changing original assets',()=>{
  for(const hz of [30,60,120]){
    const s=setup();assert.equal(s.intro.start(s.layout),true);assert.equal(s.intro.start(s.layout),false);assert.equal(s.intro.pieceCount,2);
    assert.equal(s.room.visible,false);assert.equal(s.player.visible,false);
    const swarm=s.scene.getObjectByName('dheer-room-intro');
    assert.equal(swarm.children[0].children[0].geometry,s.snapshots[0].object.geometry);
    const start=swarm.children.map(p=>p.position.clone());
    s.intro.update(4.1);swarm.children.forEach((p,i)=>assert.ok(p.position.distanceTo(start[i])>.05,'Pieces travel toward the room'));
    for(let i=0;i<hz*INTRO_DURATION;i++)s.intro.update(1/hz);
    assert.equal(s.intro.busy,false);assert.equal(s.scene.getObjectByName('dheer-room-intro'),undefined);
    assert.ok(s.room.visible&&s.player.visible&&s.ground.visible);s.scene.updateMatrixWorld(true);
    for(const v of s.snapshots){assert.deepEqual(v.object.matrixWorld,v.matrix);assert.equal(v.object.visible,v.visible);}
  }
});
test('The original scramble locks d, h, e, e, r in order before the type becomes room pieces',()=>{
  assert.equal(introStatus(-.01),'decoding…');assert.ok(letterState(-.01,0).char);
  assert.equal(Array.from({length:5},(_,i)=>letterState(0,i).locked).filter(Boolean).length,0);
  for(let i=0;i<5;i++){
    const time=.48+i*.21+.001;
    assert.equal(Array.from({length:5},(_,j)=>letterState(time,j).locked).filter(Boolean).length,i+1);
    assert.equal(letterState(time,i).char,'dheer'[i]);
  }
  assert.notEqual(letterState(.10,0).char,letterState(.18,0).char);
  assert.equal(introStatus(.55),'decoding…');assert.equal(introStatus(.75),'hashing…');
  assert.equal(Array.from({length:5},(_,i)=>letterState(INTRO_TIMING.morph,i).char).join(''),'dheer');
  assert.ok(INTRO_TIMING.assemble>INTRO_TIMING.morph+INTRO_TIMING.morphDuration,'Readable 3D name has a short hold before populating');
});
test('Typography converts into aligned 3D pieces, then assembly begins; every phase can be skipped safely',()=>{
  for(const stopAt of [.25,2.5,4.2]){
    const s=setup();s.scene.background=new THREE.Color('#30313b');let disposed=false;
    const opening={texture:new THREE.Texture(),update(){},dispose(){disposed=true;}};
    s.intro.start(s.layout,opening);
    const word=s.scene.getObjectByName('dheer-boot-wordmark'),pieces=s.scene.getObjectByName('dheer-room-intro').children;
    assert.equal(word.material.opacity,1);assert.ok(pieces.every(p=>!p.visible));
    const start=pieces.map(p=>p.position.clone());
    s.intro.update(stopAt);
    if(stopAt===2.5){assert.ok(word.material.opacity>0&&word.material.opacity<1);assert.ok(pieces.every(p=>p.visible));pieces.forEach((p,i)=>assert.deepEqual(p.position,start[i]));}
    if(stopAt===4.2){assert.equal(word.visible,false);assert.ok(pieces.some((p,i)=>p.position.distanceTo(start[i])>.1));}
    s.intro.finish();assert.equal(disposed,true);assert.equal(s.scene.getObjectByName('dheer-boot-wordmark'),undefined);assert.equal(s.scene.background.getHexString(),'30313b');
    assert.ok(s.room.visible&&s.player.visible&&s.ground.visible);
  }
});
test('Room lights rise smoothly and the visitor lands before control returns; skipping restores all transforms',()=>{
  for(const stopAt of [5.56,5.9,6.27,6.6,7]){
    const s=setup();s.player.position.set(.3,.06,2.3);const rest=s.player.position.clone(),scale=s.player.scale.clone();
    s.intro.start(s.layout);s.intro.update(INTRO_TIMING.arrival);
    assert.equal(s.room.visible,true);assert.equal(s.player.visible,false);assert.equal(s.intro.lightLevel,.23);
    let previous=s.intro.lightLevel;
    for(let t=INTRO_TIMING.arrival;t<stopAt;t+=.01){s.intro.update(.01);assert.ok(s.intro.lightLevel>=previous-1e-10);previous=s.intro.lightLevel;assert.ok(s.player.position.y>=rest.y);}
    if(stopAt===5.9){assert.equal(s.player.visible,true);assert.ok(s.player.position.y>rest.y+.4);}
    s.intro.finish();assert.deepEqual(s.player.position,rest);assert.deepEqual(s.player.scale,scale);assert.equal(s.intro.lightLevel,1);
  }
});
test('Skip, reduced motion and resizing leave a complete interactive room',()=>{
  for(const reduced of [false,true]){
    const s=setup();s.intro.start(s.layout);s.intro.update(.2);
    s.camera.left=-5;s.camera.right=5;s.camera.top=11;s.camera.bottom=-11;s.camera.updateProjectionMatrix();s.intro.update(0);
    s.scene.getObjectByName('dheer-room-intro').children.forEach(p=>{const v=p.position.clone().project(s.camera);assert.ok(Math.abs(v.x)<1&&Math.abs(v.y)<1);});
    if(reduced)s.intro.update(0,true);else s.intro.finish();
    assert.equal(s.intro.busy,false);assert.ok(s.room.visible&&s.player.visible&&s.ground.visible);
    assert.equal(s.intro.start(s.layout),true);s.intro.finish();assert.equal(s.scene.children.length,3);
  }
});
test('Skipping while the font loads cannot start an intro afterward; reduced motion never assembles pieces',async()=>{
  const window=new Window();globalThis.window=window;globalThis.document=window.document;
  document.body.innerHTML='<div id="room-intro" hidden><button id="skip-intro">Skip intro</button></div>';
  let resolveFont,starts=0,enters=0,exits=0;
  Object.defineProperty(document,'fonts',{value:{load:()=>new Promise(resolve=>{resolveFont=resolve;})},configurable:true});
  const world={intro:{busy:false,start(){starts++;return true;},finish(){this.busy=false;}}};
  const ui=installIntroUI(world,{onEnter(){enters++;},onExit(){exits++;}}),run=ui.play();
  assert.equal(ui.busy,true);document.querySelector('#skip-intro').click();resolveFont([]);await run;
  assert.equal(starts,0);assert.equal(ui.busy,false);assert.equal(enters,1);assert.equal(exits,1);assert.equal(document.querySelector('#room-intro').hidden,true);
  const reduced=installIntroUI(world,{reduced:true});await reduced.play();assert.equal(starts,0);assert.equal(reduced.busy,false);
  await window.happyDOM.close();
});
