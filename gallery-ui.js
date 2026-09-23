import {createGalleryWheel} from './wall-gallery.js';

export function installGalleryUI(world,{onEnter,onExit}){
  const panel=document.querySelector('#gallery-panel'),closeButton=document.querySelector('#gallery-close');
  const previous=document.querySelector('#gallery-previous'),next=document.querySelector('#gallery-next');
  const title=document.querySelector('#gallery-title');
  const wheel=createGalleryWheel();let touch=null,lastIndex=-1;
  function refresh(){
    const state=world.gallery.state;
    if(lastIndex!==state.index){title.textContent='Artwork '+(state.index+1)+' of '+state.count;lastIndex=state.index;}
    previous.disabled=!world.gallery.isOpen||state.index===0;next.disabled=!world.gallery.isOpen||state.index===state.count-1;
  }
  function step(direction){if(world.gallery.step(direction))refresh();}
  function close(){if(!world.gallery.close())return;wheel.reset();panel.classList.add('returning');refresh();}
  function open(index){
    if(world.activeRoom!=='bedroom'||!world.gallery.open(index))return false;
    onEnter();lastIndex=-1;wheel.reset();panel.classList.remove('returning');document.body.classList.add('gallery-open');
    refresh();if(!panel.open)panel.showModal();closeButton.focus({preventScroll:true});return true;
  }
  previous.onclick=()=>step(-1);next.onclick=()=>step(1);closeButton.onclick=close;
  panel.addEventListener('cancel',event=>{event.preventDefault();close();});
  panel.addEventListener('keydown',event=>{
    if(['ArrowRight','ArrowDown','PageDown','ArrowLeft','ArrowUp','PageUp'].includes(event.key)){
      event.preventDefault();if(!event.repeat)step(['ArrowRight','ArrowDown','PageDown'].includes(event.key)?1:-1);
    }
  });
  panel.addEventListener('wheel',event=>{
    if(event.ctrlKey||event.metaKey)return;
    event.preventDefault();const factor=event.deltaMode===1?18:event.deltaMode===2?innerHeight:1;
    const delta=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*factor;
    const direction=wheel.consume(delta,performance.now());if(direction)step(direction);
  },{passive:false});
  panel.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'||event.target.closest('button'))return;
    touch={id:event.pointerId,x:event.clientX,y:event.clientY};panel.setPointerCapture(event.pointerId);
  });
  panel.addEventListener('pointerup',event=>{
    if(!touch||touch.id!==event.pointerId)return;
    const dx=event.clientX-touch.x,dy=event.clientY-touch.y;touch=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<45)return;
    step(Math.abs(dx)>Math.abs(dy)?-Math.sign(dx):-Math.sign(dy));
  });
  panel.addEventListener('pointercancel',()=>{touch=null;});
  return {open,close,update(){
    if(!panel.open)return;
    refresh();if(!world.gallery.busy){panel.close();document.body.classList.remove('gallery-open');onExit();}
  }};
}
