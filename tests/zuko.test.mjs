import test from 'node:test';
import assert from 'node:assert/strict';
import {Group} from '../vendor/three.module.js';
import {createZuko,ZUKO_ACTIVITIES} from '../zuko.js';
import {ROOMS} from '../rooms.js';
import {isWalkable} from '../navigation.js';
globalThis.document={createElement(){return {getContext(){return {fillRect(){},fillText(){}};}};}};
function seeded(value){return ()=>((value=(value*1664525+1013904223)>>>0)/4294967296);}
test('Zuko completes every routine without crossing furniture or leaving the living room',()=>{
  for(const seed of [1,27,305]){
    const dog=createZuko(new Group(),seeded(seed)),seen=new Set();let previous={...dog.state.position};
    for(let i=0;i<5200;i++){
      dog.update(.04,null,false);const state=dog.state;seen.add(state.activity);
      assert.ok(isWalkable(state.position.x,state.position.z,ROOMS.living.obstacles),JSON.stringify(state));
      assert.ok(Math.hypot(state.position.x-previous.x,state.position.z-previous.z)<=.04,'No teleporting between routines');previous=state.position;
    }
    for(const activity of ZUKO_ACTIVITIES)assert.ok(seen.has(activity.id),'Missing routine '+activity.id);
  }
});
test('Petting interrupts a walk, reduced motion holds position, and roaming resumes afterward',()=>{
  const dog=createZuko(new Group(),seeded(5));
  for(let i=0;i<100;i++)dog.update(.04,null,false);
  dog.pet();const position=dog.state.position;
  for(let i=0;i<70;i++)dog.update(.04,null,false);
  assert.equal(dog.state.activity,'pet');assert.deepEqual(dog.state.position,position);
  for(let i=0;i<100;i++)dog.update(.04,null,true);
  assert.deepEqual(dog.state.position,position);
  for(let i=0;i<70;i++)dog.update(.04,null,false);
  assert.notDeepEqual(dog.state.position,position);
});
test('Zuko pauses at the visitor and can continue when the path is clear',()=>{
  const dog=createZuko(new Group(),seeded(8));
  for(let i=0;i<35;i++)dog.update(.04,null,false);
  const position=dog.state.position;
  for(let i=0;i<20;i++)dog.update(.04,position,false);
  assert.deepEqual(dog.state.position,position);
  for(let i=0;i<50;i++)dog.update(.04,null,false);
  assert.notDeepEqual(dog.state.position,position);
});
test('Zuko walks over, jumps onto the couch, accepts treats, and hops down to roam again',()=>{
  const dog=createZuko(new Group(),seeded(15)),player={x:.615,z:2.24};dog.setCouch(true);
  const seen=new Set();let landed=false;
  for(let i=0;i<1600;i++){
    dog.update(.04,player,false);seen.add(dog.state.activity);
    if(dog.state.activity==='couch'){landed=true;break;}
    if(!dog.jumping)assert.ok(isWalkable(dog.root.position.x,dog.root.position.z,ROOMS.living.obstacles));
  }
  assert.ok(landed);assert.ok(seen.has('walking'));assert.ok(seen.has('jumping'));
  assert.equal(dog.root.position.y,.83);assert.ok(Math.abs(dog.root.position.x-player.x)>.7);
  dog.pet('treat',player);dog.update(1,player);assert.equal(dog.state.activity,'treat');
  dog.update(3,player);assert.equal(dog.state.activity,'couch');
  dog.setCouch(false);assert.equal(dog.jumping,true);
  for(let i=0;i<20;i++)dog.update(.04,player);
  assert.equal(dog.root.position.y,0);assert.ok(isWalkable(dog.root.position.x,dog.root.position.z,ROOMS.living.obstacles));
  for(let i=0;i<100;i++)dog.update(.04,null);assert.notEqual(dog.state.activity,'couch');
});
test('Interrupted couch jumps and reduced motion leave Zuko in a valid position',()=>{
  const dog=createZuko(new Group(),seeded(9));dog.setCouch(true);dog.update(.04,null,true);
  assert.equal(dog.state.activity,'couch');dog.setCouch(false);dog.update(.2,null);
  dog.setCouch(true);dog.update(.8,null);assert.equal(dog.state.activity,'couch');assert.equal(dog.root.position.y,.83);
  dog.setCouch(false);dog.update(.04,null,true);assert.equal(dog.root.position.y,0);assert.equal(dog.jumping,false);
});
