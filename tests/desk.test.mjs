import {canvasContext} from './canvas-context.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Window} from 'happy-dom';
import {Group,OrthographicCamera,Mesh,PlaneGeometry,MeshBasicMaterial} from '../vendor/three.module.js';
import {createDeskExperience} from '../desk-experience.js';
import {installDeskUI} from '../desk-ui.js';
import {PROJECTS} from '../projects.js';
import {DESKTOP_ICONS,PROJECT_SUMMARIES,LAUNCH_DURATION} from '../project-screens.js';

function setup(){
  const chair=new Group(),player=new Group(),camera=new OrthographicCamera(-8,8,6,-6,.1,100);
  chair.position.set(1.44,0,.29);chair.rotation.y=Math.PI+.13;player.position.set(2.3,.06,-.54);
  camera.position.set(12,12.5,14);camera.lookAt(0,1.45,0);
  const view={pixelWidth:1440,pixelHeight:900,width:20.8,height:13,aspect:1.6,offsetX:-151.2,offsetY:-22.5};
  const desk=createDeskExperience({chair,player,camera,getRoomView:()=>view});
  return {chair,player,camera,desk,view};
}
test('The chair pulls out before sitting and rolling in, then the camera moves to the monitors',()=>{
  const {chair,player,camera,desk}=setup(),start=player.position.clone(),cameraStart=camera.position.clone();
  assert.equal(desk.open(),true);assert.equal(desk.open(),false);
  desk.update(.4);assert.ok(chair.position.z>.29);assert.deepEqual(player.position,start);assert.equal(desk.seatAmount,0);
  desk.update(.6);assert.equal(desk.state.phase,'sitting');assert.ok(desk.seatAmount>0&&desk.seatAmount<1);assert.deepEqual(camera.position,cameraStart);
  desk.update(.75);assert.equal(desk.state.phase,'rolling-in');assert.equal(desk.seatAmount,1);assert.equal(player.position.z,chair.position.z);assert.deepEqual(camera.position,cameraStart);
  desk.update(.75);assert.equal(desk.state.phase,'monitors');assert.ok(camera.position.distanceTo(cameraStart)>1);assert.equal(desk.ready,false);
  desk.update(1);assert.equal(desk.ready,true);assert.ok(Math.abs(chair.position.z+1.00)<1e-9);assert.ok(Math.abs(player.position.y-.30)<1e-9);
  assert.ok(camera.position.z<chair.position.z-.3,'The camera passes ahead of the seated visitor for an unobstructed view');
  assert.ok(camera.top-camera.bottom<3);
  desk.close();assert.equal(desk.busy,true);desk.update(.4);assert.equal(desk.seatAmount,1,'Pull the camera back before standing');
  desk.update(4);assert.equal(desk.busy,false);assert.equal(desk.seatAmount,0);assert.deepEqual(player.position,start);assert.deepEqual(camera.position,cameraStart);assert.equal(chair.position.z,.29);
});
test('Interrupted entries restore the avatar and chair; reduced motion, resize and reset remain safe',()=>{
  const {desk,chair,player,camera,view}=setup(),start=player.position.clone();
  for(const time of [.25,1,1.8,2.6,4]){
    desk.open();desk.update(time);desk.close();assert.equal(desk.open(),false);desk.update(5);
    assert.equal(desk.busy,false);assert.deepEqual(player.position,start);assert.equal(chair.position.z,.29);
  }
  desk.open();desk.update(0,true);assert.equal(desk.ready,true);
  view.pixelWidth=390;view.pixelHeight=844;view.aspect=390/844;view.width=11.6;view.height=11.6/view.aspect;view.offsetX=0;view.offsetY=-844*.016;
  desk.update(.016);assert.ok(Math.abs((camera.right-camera.left)/(camera.top-camera.bottom)-view.aspect)<1e-9);
  desk.close();desk.update(0,true);assert.equal(desk.busy,false);assert.equal(camera.top-camera.bottom,view.height);
  desk.open();desk.update(1);desk.reset();assert.equal(desk.busy,false);assert.deepEqual(player.position,start);
});

function setupUI(){
  const window=new Window({width:1440,height:900});globalThis.window=window;globalThis.document=window.document;
  window.HTMLCanvasElement.prototype.getContext=()=>canvasContext();
  const state=setup();let entered=0,exited=0;
  const monitors=[0,1].map(()=>new Mesh(new PlaneGeometry(1.225,.785),new MeshBasicMaterial()));
  const world={...state,monitors,activeRoom:'bedroom',pickMonitor:(x,y)=>({index:x>=500?1:0,u:(x%500)/500,v:y/320})};
  const ui=installDeskUI(world,{onEnter(){entered++;},onExit(){exited++;}});
  return {...state,world,window,ui,dialog:document.querySelector('#desk-view'),counts:()=>({entered,exited})};
}
test('The monitor starts as a desktop; every icon launches one concise project with its real image and destination',async()=>{
  const {window,world,ui,desk,dialog,counts}=setupUI(),original=world.monitors.map(m=>m.material);
  assert.equal(ui.launch(),true);assert.equal(ui.launch(),false);ui.update();assert.equal(dialog.open,false);
  desk.update(2);ui.update();assert.equal(dialog.open,false);desk.update(2);ui.update();assert.equal(dialog.open,true);
  assert.equal(ui.screens.phase,'desktop');assert.ok(world.monitors.every(m=>m.material.map.isCanvasTexture));
  assert.equal(dialog.querySelector('.desk-screen'),null,'The desktop lives on the monitor, not an HTML replacement');
  for(const [i,[id,p]] of Object.entries(PROJECTS).entries()){
    const item=DESKTOP_ICONS[i];assert.equal(ui.screens.pointer({index:1,u:(item.x+90)/1000,v:(item.y+80)/640},true),true);
    assert.equal(ui.screens.project,p);assert.equal(ui.screens.phase,'launching');ui.update(LAUNCH_DURATION/2);assert.equal(ui.screens.phase,'launching');
    ui.update(LAUNCH_DURATION/2);assert.equal(ui.screens.phase,'open');
    assert.equal(dialog.querySelector('[data-project="'+id+'"]').getAttribute('aria-pressed'),'true');
    assert.equal(dialog.querySelector('.desk-project-document h3').textContent,p.title);
    assert.equal(dialog.querySelector('.desk-project-document p').textContent,PROJECT_SUMMARIES[id]);
    const link=p.links.find(l=>l.href.includes('github.com'))||p.links[0];
    assert.equal(dialog.querySelector('.desk-project-document a').href,link.href);assert.ok(existsSync(new URL('../'+p.img,import.meta.url)));
    assert.equal(ui.screens.pointer({index:1,u:.939,v:.081},true),true);assert.equal(ui.screens.phase,'desktop');
  }
  dialog.querySelector('.leave-desk').click();desk.update(4);ui.update();assert.equal(ui.busy,false);assert.equal(counts().exited,1);
  world.monitors.forEach((m,i)=>assert.equal(m.material,original[i]));ui.dispose();await window.happyDOM.close();
});
test('The project opens on the same monitor on phones; Escape returns to the desktop before leaving the chair',async()=>{
  const {window,world,desk,ui,dialog,view,camera}=setupUI();window.happyDOM.setWindowSize({width:390,height:844});
  Object.assign(view,{pixelWidth:390,pixelHeight:844,aspect:390/844});
  world.activeRoom='living';assert.equal(ui.launch(),false);world.activeRoom='bedroom';
  ui.launch();desk.update(.5);ui.close();desk.update(2);ui.update();assert.equal(ui.busy,false);
  ui.launch();desk.update(0,true);ui.update();assert.equal(dialog.classList.contains('compact'),true);assert.equal(dialog.dataset.display,'desktop');
  const position=camera.position.clone();ui.screens.select(5);ui.update(0,true);
  assert.equal(ui.screens.phase,'open');assert.equal(ui.screens.project,PROJECTS.rant);desk.update(0,true);assert.deepEqual(camera.position,position);
  let leaked=0;window.addEventListener('keydown',()=>leaked++);
  window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',cancelable:true}));assert.equal(dialog.open,true);assert.equal(ui.screens.phase,'desktop');assert.equal(leaked,0);
  window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',cancelable:true}));assert.equal(dialog.open,false);
  desk.update(0,true);ui.update();assert.equal(ui.busy,false);ui.dispose();await window.happyDOM.close();
});
test('Launching can be cancelled or changed quickly, and reopening always starts on the desktop',async()=>{
  const {window,ui,desk,dialog}=setupUI();ui.launch();desk.update(0,true);ui.update();
  for(const index of [7,2,4]){ui.screens.select(index);ui.update(.05);}
  assert.equal(ui.screens.selected,4);ui.update(1);assert.equal(ui.screens.phase,'open');
  dialog.querySelector('.desk-home').click();assert.equal(ui.screens.phase,'desktop');
  ui.screens.select(3);ui.close();desk.update(0,true);ui.update();assert.equal(ui.screens.awake,false);
  ui.launch();desk.update(0,true);ui.update();assert.equal(ui.screens.phase,'desktop');
  ui.dispose();await window.happyDOM.close();
});
