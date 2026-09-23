import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {installRoomPanels} from '../room-panels.js';
import {READING_LIST} from '../reading-list.js';

function setup(){
  const window=new Window();globalThis.window=window;globalThis.document=window.document;
  let entered=0,exited=0;
  const library={busy:false,ready:false,selected:null,bookReady:false,state:{current:null},open(){this.busy=true;return true;},select(i){this.selected=i;this.state.current=i;this.bookReady=i!==null;return true;},close(){this.ready=false;this.selected=null;},reset(){this.busy=false;},hover(){}};
  const world={library,activeRoom:'living',bookSurfaces(){return READING_LIST.map((b,i)=>[{x:i*50,y:100},{x:i*50+45,y:160}]);}};
  const panels=installRoomPanels({world,onEnter(){entered++;},onExit(){exited++;}});
  return {window,world,panels,get entered(){return entered;},get exited(){return exited;},dialog:document.querySelector('#reading-room')};
}
test('The hand-picked bookshelf waits for the camera, then offers one physical book per source',async()=>{
  const s=setup();assert.equal(s.panels.show('library'),true);assert.equal(s.entered,1);assert.equal(s.panels.open,true);s.panels.update();assert.equal(s.dialog.open,false);
  s.world.library.ready=true;s.panels.update();assert.equal(s.dialog.open,true);assert.match(s.dialog.textContent,/Hand-picked by me/);
  const covers=[...s.dialog.querySelectorAll('.shelf-book')];assert.equal(covers.length,READING_LIST.length);assert.equal(s.dialog.querySelector('.fresh-research'),null);
  for(let i=0;i<covers.length;i++){
    assert.equal(covers[i].getAttribute('aria-label'),READING_LIST[i].title);covers[i].click();
    assert.equal(s.world.library.selected,i);assert.equal(s.dialog.querySelector('.reading-source').href,READING_LIST[i].url);
    assert.equal(s.dialog.querySelector('.reading-accessible h3').textContent,READING_LIST[i].title);
    s.dialog.querySelector('.shelf-back').click();s.panels.update();assert.equal(s.world.library.selected,null);assert.equal(document.activeElement,covers[i]);
  }
  s.dialog.querySelector('.leave-library').click();assert.equal(s.dialog.open,false);assert.equal(s.panels.open,true,'Movement stays locked until camera returns');
  s.world.library.busy=false;s.panels.update();assert.equal(s.exited,1);s.panels.update();assert.equal(s.exited,1);s.panels.dispose();await s.window.happyDOM.close();
});
test('Keyboard navigation, book cycling, and Escape preserve the shelf and restore focus',async()=>{
  const s=setup();s.panels.show('library');s.world.library.ready=true;s.panels.update();
  const key=value=>s.window.dispatchEvent(new s.window.KeyboardEvent('keydown',{key:value,cancelable:true}));
  key('ArrowRight');assert.equal(document.activeElement.getAttribute('aria-label'),READING_LIST[0].title);document.activeElement.click();
  key('ArrowLeft');assert.equal(s.world.library.selected,6);key('ArrowRight');assert.equal(s.world.library.selected,0);
  s.world.library.bookReady=false;s.panels.update();assert.equal(s.dialog.querySelector('.reading-source').getAttribute('aria-disabled'),'true');
  key('Escape');assert.equal(s.world.library.selected,null);assert.equal(s.dialog.open,true);assert.equal(document.activeElement.getAttribute('aria-label'),READING_LIST[0].title);
  key('Escape');assert.equal(s.dialog.open,false);s.panels.dispose();assert.equal(s.exited,1);await s.window.happyDOM.close();
});
