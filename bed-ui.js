import {createAboutScreen} from './about-screen.js';
import {CONTACT_FIELDS} from './about-screen.js';
export function installBedUI(world,{onEnter,onExit}){
  const dialog=document.createElement('dialog');dialog.id='bed-view';dialog.setAttribute('aria-label','Dheer’s personal dashboard on the tablet');
  dialog.innerHTML='<div class="bed-controls"><div class="bed-actions"><button class="bed-up" aria-label="Scroll profile up">↑</button><button class="bed-down" aria-label="Scroll profile down">↓</button><button class="leave-bed">Back to the room <kbd>Esc</kbd></button></div></div><div class="visually-hidden bed-accessible"><h2>About Dheer</h2><dl></dl></div>';
  document.body.append(dialog);let entered=false,wasBusy=false,drag=null;
  const screen=createAboutScreen({onLink(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click();}});world.bed.screen.material.map=screen.texture;world.bed.screen.material.color.set('#ffffff');world.bed.screen.material.needsUpdate=true;
  for(const field of CONTACT_FIELDS){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=field.label;dd.textContent=field.value;for(const link of field.links){const a=document.createElement('a');a.href=link.href;a.textContent=link.label;a.target='_blank';a.rel='noopener noreferrer';dd.append(' ',a);}dialog.querySelector('dl').append(dt,dd);}
  dialog.querySelector('.bed-up').onclick=()=>screen.scroll(-280);dialog.querySelector('.bed-down').onclick=()=>screen.scroll(280);
  function close(){if(dialog.open)dialog.close();world.bed.close();}
  dialog.querySelector('.leave-bed').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('wheel',e=>{if(e.target===dialog){e.preventDefault();screen.scroll(e.deltaY*(e.deltaMode===1?16:1));}},{passive:false});
  dialog.addEventListener('pointerdown',e=>{if(e.target===dialog)drag={x:e.clientX,y:e.clientY,lastY:e.clientY,moved:false};});
  dialog.addEventListener('pointermove',e=>{if(drag&&e.pointerType==='touch'){if(Math.abs(e.clientY-drag.y)>5)drag.moved=true;if(drag.moved)screen.scroll((drag.lastY-e.clientY)*2);drag.lastY=e.clientY;}});
  dialog.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8){const hit=world.pickBedScreen(e.clientX,e.clientY);if(hit)screen.click(hit);}drag=null;});dialog.addEventListener('pointercancel',()=>drag=null);
  const keydown=e=>{if(!world.bed.busy)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}else if(dialog.open&&['ArrowDown','ArrowUp','PageDown','PageUp'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();screen.scroll(e.key==='ArrowUp'||e.key==='PageUp'?-280:280);}};window.addEventListener('keydown',keydown);
  return {get busy(){return world.bed.busy;},get screen(){return screen;},launch(){if(world.activeRoom!=='bedroom'||!world.bed.open())return false;onEnter();entered=false;wasBusy=true;screen.reset();screen.setCompact(window.innerWidth<760);return true;},update(){
    if(!world.bed.busy){if(dialog.open)dialog.close();if(wasBusy){wasBusy=false;onExit();}return;}
    screen.setCompact(window.innerWidth<760);if(world.bed.ready&&!entered){entered=true;dialog.showModal();dialog.querySelector('.leave-bed').focus();}
  },close,dispose(){window.removeEventListener('keydown',keydown);dialog.remove();}};
}
