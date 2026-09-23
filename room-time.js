import * as THREE from './vendor/three.module.js';

export const ROOM_BLUE='#014a69';
export const isNightTime=date=>date.getHours()<7||date.getHours()>=19;
export const clockText=date=>`${date.getHours()%12||12}:${String(date.getMinutes()).padStart(2,'0')}`;

// Manual lighting lasts until the next local dawn or evening.
export function createLocalLighting(date=new Date()){
  const period=date=>{const day=new Date(date);if(date.getHours()<7)day.setDate(day.getDate()-1);return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${isNightTime(date)?'night':'day'}`;};
  let currentPeriod=period(date),evening=isNightTime(date);
  return {
    update(date){const next=period(date);if(next!==currentPeriod){evening=isNightTime(date);currentPeriod=next;}return evening;},
    toggle(){evening=!evening;return evening;},
    get evening(){return evening;},
  };
}

export function createClockDisplay(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.38,.15),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));screen.name='bedside-clock-display';
  let displayed='';
  function update(date){
    const next=clockText(date);if(next===displayed)return;
    displayed=next;ctx.fillStyle='#161f24';ctx.fillRect(0,0,512,192);
    ctx.fillStyle='#b6e3ed';ctx.font='600 135px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(next,256,103);
    texture.needsUpdate=true;screen.userData.time=next;
  }
  update(new Date());return {screen,update};
}
