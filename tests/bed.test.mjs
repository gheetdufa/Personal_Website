import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,OrthographicCamera,Box3,Vector3} from '../vendor/three.module.js';
import {Window} from 'happy-dom';
import {createBedExperience,BED_DURATION} from '../bed-experience.js';
import {installBedUI} from '../bed-ui.js';
import {ABOUT} from '../about-content.js';
import {CONTACT_FIELDS,createAboutScreen} from '../about-screen.js';
import {canvasContext} from './canvas-context.mjs';
function setup(){
  const parent=new Group(),player=new Group(),camera=new OrthographicCamera(-8,8,6,-6,.1,100);player.position.set(-.2,.06,1.3);camera.position.set(12,12.5,14);camera.lookAt(0,1.45,0);
  const view={pixelWidth:1440,pixelHeight:900,aspect:1.6,width:20.8,height:13,offsetX:-151,offsetY:-22};
  return {parent,player,camera,view,bed:createBedExperience({parent,player,camera,getRoomView:()=>view})};
}
test('About Me anticipates the jump, lands softly, then lifts a handheld tablet before the camera moves closer',()=>{
  const {bed,player,camera}=setup(),start=player.position.clone(),cameraStart=camera.position.clone();
  assert.equal(bed.open(),true);assert.equal(bed.open(),false);
  bed.update(.20);assert.equal(bed.state.phase,'crouching');assert.ok(player.position.y<start.y);assert.equal(player.position.x,start.x);assert.equal(bed.seatAmount,0);
  bed.update(.38);assert.equal(bed.state.phase,'jumping');assert.ok(player.position.y>.7);assert.equal(bed.display.visible,false);assert.deepEqual(camera.position,cameraStart);
  bed.update(.50);assert.equal(bed.state.phase,'settling');assert.ok(player.position.y<.60&&player.position.y>.52);
  bed.update(.62);assert.equal(bed.state.phase,'pulling-display');assert.equal(bed.display.visible,true);assert.deepEqual(camera.position,cameraStart);
  bed.update(2);assert.equal(bed.ready,true);assert.ok(camera.position.distanceTo(cameraStart)>1);
  bed.close();bed.update(BED_DURATION+1);assert.equal(bed.busy,false);assert.equal(bed.display.visible,false);assert.deepEqual(player.position,start);assert.deepEqual(camera.position,cameraStart);
});
test('Interrupted bed entries, reduced motion, resize, and reset all restore the visitor and camera',()=>{
  const {bed,player,camera,view}=setup(),start=player.position.clone();
  for(const time of [.2,.7,1.5,2.7,BED_DURATION]){bed.open();bed.update(time);bed.close();bed.update(BED_DURATION+1);assert.equal(bed.busy,false);assert.equal(bed.display.visible,false);assert.deepEqual(player.position,start);}
  bed.open();bed.update(0,true);assert.equal(bed.ready,true);Object.assign(view,{pixelWidth:390,pixelHeight:844,aspect:390/844});bed.update(.01,true);
  assert.ok(Math.abs((camera.right-camera.left)/(camera.top-camera.bottom)-view.aspect)<1e-8);
  bed.reset();assert.equal(bed.busy,false);assert.equal(bed.display.visible,false);assert.deepEqual(player.position,start);
});
test('Jump has a distinct launch and impact, is frame-rate independent, and keeps the tablet handheld size',()=>{
  const sample=t=>{const {bed,player}=setup();bed.open();bed.update(t);return player.position.clone();};
  const earlyRise=sample(.25).y-sample(.23).y,lateRise=sample(.55).y-sample(.53).y;
  assert.ok(earlyRise>lateRise*2,'Takeoff is fast, then gravity slows ascent');
  assert.ok(sample(.88).y>sample(.93).y,'The visitor falls into the landing');
  for(const t of [.22,.94,1.25,1.50,2.20,2.25])assert.ok(sample(t+.0001).distanceTo(sample(t-.0001))<.002,'No position discontinuity');
  for(const hz of [30,60,144]){
    const {bed,player}=setup();bed.open();let last=player.position.clone();
    for(let i=0;i<hz*BED_DURATION;i++){bed.update(1/hz);assert.ok(player.position.distanceTo(last)<5/hz,'No position snap during a frame');last.copy(player.position);}
    assert.ok(player.position.distanceTo(sample(BED_DURATION))<1e-7);
    const body=bed.display.getObjectByName('tablet-body'),size=new Box3().setFromBufferAttribute(body.geometry.attributes.position).getSize(new Vector3());
    assert.ok(size.x<.60&&size.y<.42&&size.z<.025,'Tablet stays roughly shoulder-width, with a thin case');
    assert.equal(bed.screen.geometry.parameters.width,.51);assert.equal(bed.display.scale.x,1,'Readability comes from the camera, not growing the tablet');
  }
});
test('Contact card preserves the profile, removes ASCII, scrolls in place, and supports phone controls',async()=>{
  const window=new Window({width:390,height:844});globalThis.window=window;globalThis.document=window.document;window.HTMLCanvasElement.prototype.getContext=()=>canvasContext();
  const state=setup();let exited=0;const world={...state,activeRoom:'bedroom',pickBedScreen:()=>({u:.5,v:.5})};
  const ui=installBedUI(world,{onEnter(){},onExit(){exited++;}}),dialog=document.querySelector('#bed-view');
  assert.equal(ABOUT.source,'https://dheerguda.com/');assert.equal(ABOUT.fields.length,16);assert.equal(ABOUT.ascii,undefined);
  assert.deepEqual([...dialog.querySelectorAll('dt')].map(el=>el.textContent),CONTACT_FIELDS.map(f=>f.label));
  ui.launch();ui.update();assert.equal(dialog.open,false);state.bed.update(0,true);ui.update();assert.equal(dialog.open,true);assert.ok(state.bed.screen.material.map.isCanvasTexture);
  dialog.querySelector('.bed-down').click();assert.ok(ui.screen.scrollOffset>0);
  assert.equal(dialog.querySelector('[data-mode="portrait"]'),null);
  assert.deepEqual(CONTACT_FIELDS.map(f=>f.value).sort(),ABOUT.fields.map(f=>f.value).sort());
  let leaked=0;window.addEventListener('keydown',()=>leaked++);window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',cancelable:true}));
  assert.equal(dialog.open,false);assert.equal(leaked,0);state.bed.update(0,true);ui.update();assert.equal(exited,1);
  ui.dispose();await window.happyDOM.close();
});
test('Tablet tabs open profile destinations and the fixed header cannot activate scrolled links',()=>{
  globalThis.document={createElement(){return {getContext:canvasContext};}};
  const links=[],screen=createAboutScreen({onLink:link=>links.push(link)});
  screen.click({u:.87,v:.93});assert.equal(screen.page,'links');screen.click({u:.5,v:.37});screen.scroll(1e5);screen.click({u:.5,v:.75});
  assert.deepEqual(links,['mailto:gudadheer@gmail.com','https://dheerguda.com/']);
  screen.scroll(1e5);const end=screen.scrollOffset;screen.scroll(200);assert.equal(screen.scrollOffset,end);
  screen.click({u:.5,v:.02});assert.equal(links.length,2);screen.scroll(-1e5);assert.equal(screen.scrollOffset,0);
});
