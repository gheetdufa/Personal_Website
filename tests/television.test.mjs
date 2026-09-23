import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Texture} from '../vendor/three.module.js';
import {createTelevision,TV_FLICKER_SECONDS,TV_GAMES} from '../television.js';
import {createSwitchConsole} from '../switch-console.js';
import {existsSync} from 'node:fs';
function setup(){const loaded=[],room=new Group(),tv=createTelevision(room,url=>{loaded.push(url);return new Texture();});return {room,tv,loaded};}
test('TV cycles all six favorites including Tears of the Kingdom and reuses its images on repeat visits',()=>{
  const {room,tv,loaded}=setup();assert.equal(tv.state,'off');assert.equal(loaded.length,0);
  assert.deepEqual(TV_GAMES.map(game=>game.id),['elden-ring','halo','hollow-knight','expedition-33','smash','tears-of-the-kingdom']);
  for(let turn=0;turn<TV_GAMES.length*2+1;turn++){
    const game=tv.cycle();assert.equal(game,TV_GAMES[turn%TV_GAMES.length]);assert.equal(tv.state,'tuning');
    tv.update(TV_FLICKER_SECONDS);assert.equal(tv.state,'on');
    const visible=tv.root.children.filter(child=>child.name.startsWith('tv-game-')&&child.visible);
    assert.equal(visible.length,1);assert.equal(visible[0].name,'tv-game-'+game.id);
    assert.ok(room.children.some(child=>child.isPointLight&&child.intensity>0));
  }
  const assets=TV_GAMES.flatMap(game=>[game.logo,...(game.images||[]),...(game.image?[game.image]:[])]);
  assert.equal(loaded.length,assets.length);assert.equal(new Set(loaded).size,assets.length);
  for(const asset of assets)assert.ok(existsSync(new URL('../'+asset,import.meta.url)));
});
test('Every TV game has a large uncropped title logo in front of its background',()=>{
  const {tv}=setup();
  for(const game of TV_GAMES){
    tv.cycle(true);const title=tv.root.getObjectByName('tv-title-'+game.id),{width,height}=title.geometry.parameters;
    assert.ok(width>=1.7&&width<=2.31&&height<=1.25);assert.ok(Math.abs(width/height-game.logoAspect)<1e-9);
    assert.equal(title.material.toneMapped,false);assert.equal(title.material.map.colorSpace,'srgb');
    assert.ok(title.position.z>.003,'Title stays above the background and contrast layer');
  }
});
test('Rapid clicks advance every time without extending flicker, and reduced motion switches instantly',()=>{
  const {tv}=setup();tv.cycle();tv.update(.3);tv.cycle();tv.cycle();tv.update(.3);
  assert.equal(tv.index,2);assert.equal(tv.state,'on');
  tv.cycle(true);assert.equal(tv.index,3);assert.equal(tv.state,'on');
});
test('Switch has a black dock, blue and red Joy-Cons, and a power indicator',()=>{
  const {root,setPower}=createSwitchConsole(new Group());
  for(const name of ['switch-dock','blue-joycon','red-joycon'])assert.ok(root.getObjectByName(name));
  assert.equal(root.userData.interaction,'switch');
  const light=root.getObjectByName('switch-power-indicator').material;
  setPower(true);assert.ok(light.emissiveIntensity>0);setPower(false);assert.equal(light.emissiveIntensity,0);
});
