import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalLighting,isNightTime,clockText} from '../room-time.js';
const at=(hour,minute=0,day=21)=>new Date(2026,8,day,hour,minute);
test('The clock and day/night boundaries use the visitor’s local wall time',()=>{
  assert.equal(clockText(at(0,5)),'12:05');assert.equal(clockText(at(12,9)),'12:09');assert.equal(clockText(at(23,59)),'11:59');
  for(const [h,m,night] of [[0,0,true],[6,59,true],[7,0,false],[18,59,false],[19,0,true],[23,59,true]])assert.equal(isNightTime(at(h,m)),night);
});
test('Lighting updates across dawn and dusk, retains manual choices within a period, and catches up after a sleeping tab',()=>{
  const lighting=createLocalLighting(at(18,59));assert.equal(lighting.evening,false);assert.equal(lighting.update(at(19)),true);
  assert.equal(lighting.toggle(),false);assert.equal(lighting.update(at(21)),false);assert.equal(lighting.update(at(0,10,22)),false);
  assert.equal(lighting.update(at(7,0,22)),false);assert.equal(lighting.toggle(),true);assert.equal(lighting.update(at(8,0,22)),true);
  assert.equal(lighting.update(at(8,0,23)),false);assert.equal(lighting.update(at(23,0,24)),true);
});
