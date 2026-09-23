import {canvasContext} from './canvas-context.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../world.js';
import {Texture,Vector3,Mesh,PlaneGeometry,MeshBasicMaterial} from '../vendor/three.module.js';
import {createGalleryWheel} from '../wall-gallery.js';
import {PHOTO_SOURCES,PAINTINGS} from '../painting-photos.js';

globalThis.devicePixelRatio=1;
globalThis.document={createElement(){return {getContext:canvasContext};}};
class Renderer{constructor(){this.domElement={};this.shadowMap={autoUpdate:true};this.autoClear=true;}setPixelRatio(){}setSize(){}clearDepth(){}render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();}}
function build(width=1440,height=900,renderer=new Renderer()){return createWorld({clientWidth:width,clientHeight:height,appendChild(){},getBoundingClientRect(){return {left:0,top:0,width,height};}},()=>renderer,new Texture(),Object.fromEntries(Object.keys(PHOTO_SOURCES).map(id=>[id,new Texture()])));}
function settle(world,frames=240){for(let i=0;i<frames;i++)world.render(1/60,false,0,false);}
function assertRestored(world){for(const item of world.gallery.items){assert.deepEqual(item.frame.position.toArray(),item.restPosition.toArray());assert.deepEqual(item.frame.scale.toArray(),item.restScale.toArray());assert.equal(item.art.material,item.restMaterial);}}

test('Approaching highlights the matching wall without starting the gallery',()=>{
  const world=build();assert.equal(world.gallery.items.length,21);
  world.gallery.setNearby('main');world.render(.016,false,0,true);
  assert.equal(world.gallery.busy,false);
  for(const item of world.gallery.items)assert.equal(item.halo.visible,item.group==='main');
  world.gallery.setNearby(null);world.render(.016,false,0,true);
  assert.ok(world.gallery.items.every(item=>!item.halo.visible));
});
test('The wanted poster and emblem stay on the wall without highlighting, lifting or entering the gallery',()=>{
  const world=build(),decorations=['wanted','map'].map(key=>world.scene.getObjectByName('wall-frame-'+key));
  assert.ok(decorations.every(Boolean));
  const positions=decorations.map(frame=>frame.position.clone());
  assert.deepEqual(new Set(world.gallery.items.map(item=>item.key)),new Set(Object.keys(PAINTINGS)));
  world.gallery.setNearby('main');settle(world);
  for(const frame of decorations){assert.equal(frame.userData.galleryIndex,undefined);assert.equal(frame.getObjectByName('artwork-highlight'),undefined);}
  for(let index=0;index<world.gallery.items.length;index++){
    world.gallery.open(index);world.render(.016,false,0,true);
    decorations.forEach((frame,i)=>assert.deepEqual(frame.position.toArray(),positions[i].toArray()));
  }
});
test('The actual wall canvas pulls forward while the camera zooms in',()=>{
  const world=build(),gallery=world.gallery,item=gallery.items[0],frame=item.frame,visitor=world.player.position.clone(),initialHeight=world.camera.top-world.camera.bottom;
  assert.equal(gallery.open(0),true);settle(world);
  assert.equal(gallery.state.mode,'open');assert.equal(item.frame,frame);
  assert.ok(item.frame.position.x-item.restPosition.x>3.0);
  assert.ok(item.frame.scale.x>1);assert.ok(world.camera.top-world.camera.bottom<initialHeight*.5);
  assert.deepEqual(world.player.position.toArray(),visitor.toArray());
  gallery.close();settle(world);assert.equal(gallery.busy,false);assertRestored(world);
  assert.equal(world.camera.near,.1);
  assert.deepEqual(world.camera.position.toArray(),[12,12.5,14]);
  assert.ok(Math.abs(world.camera.top-world.camera.bottom-initialHeight)<.000001);
});
test('Scrolling across walls returns previous frames and stops at the first and last artwork',()=>{
  const world=build(),gallery=world.gallery;gallery.open(0);settle(world);
  assert.equal(gallery.step(-1),false);
  for(let i=0;i<40;i++)gallery.step(1);settle(world);
  assert.equal(gallery.state.index,20);assert.equal(gallery.step(1),false);
  assert.equal(gallery.items[0].lift,0);
  const last=gallery.items[20];assert.ok(last.frame.position.z-last.restPosition.z>3.0);
  gallery.close();settle(world);assertRestored(world);
});
test('Closing during the camera move restores every frame, and reopening does not create new frames',()=>{
  const world=build(),gallery=world.gallery,count=world.scene.children.length;
  for(let i=0;i<4;i++){gallery.open(i);settle(world,9);gallery.close();assert.equal(gallery.open(2),false);settle(world);assertRestored(world);}
  assert.equal(world.scene.children.length,count);assert.equal(gallery.state.mode,'closed');
});
test('Foreground objects cannot cover the active canvas during scrolling, reversals or closing',()=>{
  class RecordingRenderer extends Renderer{
    constructor(){super();this.events=[];}
    clearDepth(){this.events.push({type:'clear-depth'});}
    render(scene,camera){
      super.render(scene,camera);const meshes=[];
      scene.traverseVisible(object=>{if(object.isMesh&&object.layers.test(camera.layers))meshes.push(object);});
      this.events.push({type:'render',meshes,autoClear:this.autoClear,background:scene.background});
    }
  }
  const renderer=new RecordingRenderer(),world=build(390,844,renderer);
  // Both opaque furniture and transparent surfaces sit directly in front of the camera.
  for(const transparent of [false,true]){
    const obstruction=new Mesh(new PlaneGeometry(100,100),new MeshBasicMaterial({transparent,opacity:transparent?.5:1}));
    obstruction.name='foreground-obstruction';obstruction.position.z=-.25;world.camera.add(obstruction);
  }
  world.scene.add(world.camera);
  function check(){
    renderer.events=[];world.render(1/60,false,0,false);
    const item=world.gallery.items[world.gallery.state.index],passes=renderer.events.filter(event=>event.type==='render');
    if(world.gallery.busy){
      assert.equal(passes.length,2,'The active canvas must be composited after the room');
      assert.ok(passes[0].meshes.some(mesh=>mesh.name==='foreground-obstruction'));
      assert.ok(!passes[0].meshes.includes(item.art));
      assert.equal(renderer.events[1].type,'clear-depth','Room depth cannot hide the canvas');
      assert.ok(passes[1].meshes.includes(item.art));
      const canvasMeshes=new Set();item.frame.traverse(object=>{if(object.isMesh)canvasMeshes.add(object);});
      assert.ok(passes[1].meshes.every(mesh=>canvasMeshes.has(mesh)),'Furniture and returning canvases stay behind the current canvas');
      assert.equal(passes[1].autoClear,false);assert.equal(passes[1].background,null);
    }else{
      assert.equal(passes.length,1);assert.equal(passes[0].meshes.includes(item.art),world.activeRoom==='bedroom');
      assert.ok(world.gallery.items.every(art=>art.frame.layers.mask===1));
    }
    assert.equal(world.camera.layers.mask,1);assert.equal(renderer.autoClear,true);assert.equal(renderer.shadowMap.autoUpdate,true);
    assert.ok(world.scene.background?.isColor);
  }
  check();world.gallery.open(0);
  for(const direction of [1,-1])for(let i=0;i<world.gallery.items.length;i++){
    for(let frame=0;frame<12;frame++)check();world.gallery.step(direction);
  }
  world.gallery.close();for(let frame=0;frame<240;frame++)check();assertRestored(world);
  world.gallery.open(20);world.render(.016,false,0,true);check();
  world.setRoom('living');check();world.setRoom('bedroom');check();
});
test('Changing rooms resets the gallery and reduced motion finishes without a long transition',()=>{
  const world=build();world.gallery.open(13);world.render(.016,false,0,true);assert.equal(world.gallery.state.mode,'open');
  world.setRoom('living');assert.equal(world.gallery.busy,false);assertRestored(world);
  world.setRoom('bedroom');world.gallery.open(0);world.render(.016,false,0,true);world.gallery.close();world.render(.016,false,0,true);assert.equal(world.gallery.busy,false);assertRestored(world);
});
test('Portrait and landscape canvases fit between the controls on desktop and mobile',()=>{
  for(const [width,height] of [[1440,900],[1024,768],[390,844],[375,667]]){
    const world=build(width,height);
    for(const index of world.gallery.items.keys()){
      world.gallery.open(index);settle(world);
      const item=world.gallery.items[index];
      for(const x of [-1,1])for(const y of [-1,1]){
        const point=item.frame.localToWorld(new Vector3(x*(item.width+.065)/2,y*(item.height+.065)/2,.05));const p=world.project(point);
        assert.ok(p.x>=18&&p.x<=width-18&&p.y>=95&&p.y<=height-135,JSON.stringify({width,height,index,p}));
        const depth=point.clone().project(world.camera).z;assert.ok(depth>=-1&&depth<=1,'The whole painting stays within the camera view');
      }
      assert.equal(world.camera.near,.1,'The room keeps its normal clipping plane during the close-up');
    }
    world.gallery.close();settle(world);assertRestored(world);
  }
});
test('Mouse wheels and small trackpad deltas advance deliberately without skipping through the collection',()=>{
  const wheel=createGalleryWheel();assert.equal(wheel.consume(15,0),0);assert.equal(wheel.consume(15,20),0);assert.equal(wheel.consume(15,40),1);
  assert.equal(wheel.consume(250,50),0);assert.equal(wheel.consume(150,180),0);assert.equal(wheel.consume(-80,500),-1);
  wheel.reset();assert.equal(wheel.consume(300,0),1);assert.equal(wheel.consume(NaN,1000),0);
});
