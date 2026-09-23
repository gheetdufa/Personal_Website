import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS,DOOR,doorDestination} from '../rooms.js';
import {findPath,isWalkable,moveWithCollisions} from '../navigation.js';
function followPath(room,start,target){
  const route=findPath(start,target,room.obstacles);assert.ok(route.length,'A route to the door must exist');
  let position={...start};
  for(const waypoint of route){let frames=0;while(Math.hypot(waypoint.x-position.x,waypoint.z-position.z)>.025){
    assert.ok(++frames<600,'Walking must not get stuck on furniture');
    const distance=Math.hypot(waypoint.x-position.x,waypoint.z-position.z),step=Math.min(.04,distance);
    position=moveWithCollisions(position,(waypoint.x-position.x)/distance*step,(waypoint.z-position.z)/distance*step,room.obstacles);
    assert.ok(isWalkable(position.x,position.z,room.obstacles));
  }}return position;
}
for(const [id,room] of Object.entries(ROOMS)){
  test(id+': room entry and reset are open and outside the return trigger',()=>{
    for(const start of [room.spawn,room.arrival]){assert.ok(isWalkable(start.x,start.z,room.obstacles));assert.equal(doorDestination(id,start),null);}
  });
  test(id+': the doorway can be reached from every interaction and arrival',()=>{
    for(const start of [room.spawn,room.arrival,...Object.values(room.stations).map(s=>s.position)]){
      const end=followPath(room,start,room.stations.door.position);assert.equal(doorDestination(id,end),room.stations.door.destination);
    }
  });
  test(id+': every interaction remains accessible after arriving through the door',()=>{
    for(const station of Object.values(room.stations))followPath(room,room.arrival,station.position);
  });
}
test('The same doorway supports a round trip without immediately bouncing back',()=>{
  let id='bedroom',position=ROOMS.bedroom.spawn;
  for(let i=0;i<4;i++){
    position=followPath(ROOMS[id],position,ROOMS[id].stations.door.position);
    id=doorDestination(id,position);assert.ok(id);position=ROOMS[id].arrival;
    assert.equal(doorDestination(id,position),null);
  }
  assert.equal(id,'bedroom');
});
test('Touching other walls does not change rooms',()=>{
  for(const id of Object.keys(ROOMS))for(const position of [{x:0,z:-3.4},{x:3.48,z:0},{x:DOOR.x,z:3.4},{x:DOOR.x,z:-2.8}])assert.equal(doorDestination(id,position),null);
});
test('Living room sofa, coffee table and TV are solid',()=>{
  const room=ROOMS.living;
  for(const point of [{x:.5,z:2.5},{x:0,z:0},{x:-3.1,z:0}]){assert.equal(isWalkable(point.x,point.z,room.obstacles),false);assert.deepEqual(findPath(room.spawn,point,room.obstacles),[]);}
});
test('The computer is available throughout the desk area without swallowing bed or door interactions',async()=>{
  const {interactionDistance}=await import('../rooms.js');const station=ROOMS.bedroom.stations.projects;
  for(const p of [{x:0,z:.5},{x:1.2,z:1.3},{x:2.5,z:.7},{x:2.5,z:-.65}]){assert.ok(isWalkable(p.x,p.z,ROOMS.bedroom.obstacles));assert.ok(interactionDistance(station,p)<1);}
  for(const id of ['about','door','gallery']){const other=ROOMS.bedroom.stations[id];assert.ok(interactionDistance(other,other.position)<interactionDistance(station,other.position));}
});
