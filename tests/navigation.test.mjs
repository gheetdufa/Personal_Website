import test from 'node:test';
import assert from 'node:assert/strict';
import {findPath,isWalkable,moveWithCollisions,BOUNDS} from '../navigation.js';
import {obstacles,stations,ROOMS} from '../rooms.js';
function assertRoute(start,path){assert.ok(path.length,'Route must exist');let prev=start;for(const next of path){const n=Math.max(1,Math.ceil(Math.hypot(next.x-prev.x,next.z-prev.z)/.02));for(let i=0;i<=n;i++){const t=i/n;assert.ok(isWalkable(prev.x+(next.x-prev.x)*t,prev.z+(next.z-prev.z)*t,obstacles),'Route cannot intersect furniture');}prev=next;}}
test('Bedroom destinations are reachable from home and each other',()=>{const starts=[ROOMS.bedroom.spawn,...Object.values(stations).map(s=>s.position)];for(const start of starts)for(const station of Object.values(stations)){const path=findPath(start,station.position,obstacles);assertRoute(start,path);assert.deepEqual(path.at(-1),station.position);}});
test('Furniture and room edges stop movement, including a long input frame',()=>{const inside=moveWithCollisions(ROOMS.bedroom.spawn,-10,0,obstacles);assert.ok(isWalkable(inside.x,inside.z,obstacles));assert.ok(inside.x>-2.1);const edge=moveWithCollisions(ROOMS.bedroom.spawn,20,20,obstacles);assert.ok(edge.x<=BOUNDS&&edge.z<=BOUNDS);assert.ok(isWalkable(edge.x,edge.z,obstacles));});
test('Clicking furniture or outside the room rejects the path',()=>{for(const target of [{x:-2.1,z:.4},{x:1.6,z:-1.7},{x:5,z:0}])assert.deepEqual(findPath(ROOMS.bedroom.spawn,target,obstacles),[]);});
test('Navigation can find a safe path across the open floor',()=>{let samples=0;for(let x=-3.2;x<3.4;x+=.8)for(let z=-1.2;z<3.4;z+=.6){if(!isWalkable(x,z,obstacles))continue;assertRoute(ROOMS.bedroom.spawn,findPath(ROOMS.bedroom.spawn,{x,z},obstacles));samples++;}assert.ok(samples>20);});
test('Diagonal movement slides safely along furniture',()=>{let position={x:.3,z:1.8};for(let i=0;i<100;i++){position=moveWithCollisions(position,-.03,-.03,obstacles);assert.ok(isWalkable(position.x,position.z,obstacles));}});

test("The collection shelves are reachable through the aisle beside the bed",()=>{assertRoute(ROOMS.bedroom.spawn,findPath(ROOMS.bedroom.spawn,{x:-2.50,z:-2.77},obstacles));});

test('Walking from the desk to the plush shelves does not cut the desk corner',()=>{
  const route=findPath(stations.projects.position,{x:-2.50,z:-2.77},obstacles);
  assertRoute(stations.projects.position,route);
  let prev=stations.projects.position;
  for(const next of route){const steps=Math.ceil(Math.hypot(next.x-prev.x,next.z-prev.z)/.001);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;assert.ok(isWalkable(prev.x+(next.x-prev.x)*t,prev.z+(next.z-prev.z)*t,obstacles));}prev=next;}
});
