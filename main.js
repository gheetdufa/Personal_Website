import {installBedUI} from './bed-ui.js';
import {installIntroUI} from './room-intro.js';
import {ROOM_BLUE} from './room-time.js';
import {installProfileUI} from './profile-ui.js';
import {installDeskUI} from './desk-ui.js';
import {installRoomPanels} from './room-panels.js';
import {createWorld} from './world.js';
import {installGalleryUI} from './gallery-ui.js';
import {ROOMS,doorDestination,interactionDistance} from './rooms.js';
import {findPath,moveWithCollisions} from './navigation.js';
const container=document.querySelector('#scene');
const dialog=document.querySelector('#detail');
const detailBody=document.querySelector('#detail-body');
const interact=document.querySelector('#interact');
const giveTreat=document.querySelector('#give-treat');
let hotspots=[];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let roomPanels,deskUI,bedUI,profileUI,introUI;
const hasPanel=()=>dialog.open||Boolean(profileUI?.open)||Boolean(introUI?.busy)||Boolean(roomPanels?.open)||Boolean(deskUI?.busy)||Boolean(bedUI?.busy)||Boolean(world?.interactingWithZuko)||Boolean(world?.pullup.busy);
const contents={
 help:{tag:'A LITTLE FIELD GUIDE',title:'Take a look around.',body:'There’s no rush. This little room is yours to explore.',items:[['Walk around','Use WASD or the arrow keys. You can also click or tap an open spot on the floor.'],['Discover something','Hover over a small marker to see its label. Click or tap it to walk over, or press E when you’re close to an object.'],['The wall gallery','Walk to the paintings until their frames glow, then press E. Scroll, swipe, or use the arrow keys to browse. Escape returns the canvas to the wall.'],['Through the door','Click the marker above the doorway or walk into it. The door in the living room brings you back.'],['Make yourself at home','Click the computer to pull up a chair. Click a desktop icon on the right monitor to launch its project window, with a short description, image, and project link. Close the window or press Escape to return to the desktop; press Escape again to leave the chair. Click the bed to hop up and pull out my personal dashboard on a tablet. Escape returns you to the room. In the living room, click the bookshelf to zoom in, then pick a book to open its article. Escape returns a book to the shelf, then returns you to the room. Pet Zuko with E, or give him a treat with T when nearby. Sit on the couch and he’ll join you. Try the pull-up bar for a set; E or Escape finishes early. Click the Switch or TV to turn it on. Each click changes the game on its screen. Press E or a movement key to stand up.'],['Stay a while','The clock uses your local time, and evening lighting turns on automatically from 7 PM to 7 AM. The moon button lets you change it until the next scheduled switch. Reset returns you to an open spot in the current room.']],note:'On a phone, use the arrow buttons to move. Press Escape or tap outside a panel to close it.'}
};
let world;
let currentRoom='bedroom';
let keys=new Set(),path=[],pending=null,nearby=null,angle=0,toastTimer;
let roomTransition=null;
let selectedArtwork=0;
const transitionCover=document.querySelector('#room-transition');
function toast(message){
  const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2600);
}
function clearMovement(){
  keys.clear();path=[];pending=null;
  document.querySelectorAll('[data-direction]').forEach(b=>b.classList.remove('pressed'));
  if(world)world.marker.visible=false;
}
function openPanel(id){
  if(roomTransition||world?.gallery.busy||hasPanel())return;
  const data=contents[id];if(!data)return;
  document.querySelector('#detail-label').textContent=data.tag;
  detailBody.innerHTML=`<h2 id="detail-title">${data.title}</h2><p>${data.body}</p>${data.items.map(([title,text],i)=>`<div class="panel-item"><span class="item-index">0${i+1}</span><div><h3>${title}</h3><p>${text}</p></div></div>`).join('')}<p class="panel-note">${data.note}</p>`;
  clearMovement();interact.hidden=true;dialog.showModal();
}
function closePanel(){dialog.close();container.focus({preventScroll:true});}
document.querySelector('#help-button').onclick=()=>openPanel('help');
document.querySelector('#close-detail').onclick=closePanel;
document.querySelector('#return-to-room').onclick=closePanel;
dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePanel();});
dialog.addEventListener('close',()=>{keys.clear();container.focus({preventScroll:true});});
profileUI=installProfileUI({canOpen:()=>!hasPanel()&&!roomTransition&&!world?.gallery.busy,onEnter:clearMovement,onExit:clearMovement});
try{
  world=createWorld(container);document.querySelector('#loading').hidden=true;
}catch(error){
  console.error(error);document.querySelector('#loading').hidden=true;document.querySelector('#webgl-error').hidden=false;
  document.body.classList.remove('intro-playing','intro-loading');
  document.querySelector('#hotspots').hidden=true;document.querySelector('#touch-controls').hidden=true;
}
if(world){
  introUI=installIntroUI(world,{reduced,onEnter(){clearMovement();container.inert=true;document.querySelector('.header').inert=true;document.querySelector('.profile-dock').inert=true;},onExit(){container.inert=false;document.querySelector('.header').inert=false;document.querySelector('.profile-dock').inert=false;container.focus({preventScroll:true});}});
  deskUI=installDeskUI(world,{onEnter(){clearMovement();nearby=null;interact.hidden=true;document.body.classList.add('using-desk');document.querySelector('#experience').inert=true;document.querySelector('.header').inert=true;},onExit(){clearMovement();document.body.classList.remove('using-desk');document.querySelector('#experience').inert=false;document.querySelector('.header').inert=false;container.focus({preventScroll:true});}});
  bedUI=installBedUI(world,{onEnter(){clearMovement();nearby=null;interact.hidden=true;document.body.classList.add('using-bed');document.querySelector('#experience').inert=true;document.querySelector('.header').inert=true;},onExit(){clearMovement();document.body.classList.remove('using-bed');document.querySelector('#experience').inert=false;document.querySelector('.header').inert=false;container.focus({preventScroll:true});}});
  roomPanels=installRoomPanels({world,onEnter(){clearMovement();nearby=null;interact.hidden=true;document.body.classList.add('using-library');document.querySelector('#experience').inert=true;document.querySelector('.header').inert=true;},onExit(){clearMovement();document.body.classList.remove('using-library');document.querySelector('#experience').inert=false;document.querySelector('.header').inert=false;container.focus({preventScroll:true});}});
  const galleryUI=installGalleryUI(world,{onEnter(){clearMovement();nearby=null;interact.hidden=true;},onExit(){clearMovement();container.focus({preventScroll:true});}});
  function walkTo(target,id=null){
    if(roomTransition||hasPanel()||world.gallery.busy)return false;
    if(id==='projects'&&interactionDistance(ROOMS.bedroom.stations.projects,world.player.position)<1){activateStation(id);return true;}
    world.stand();
    const route=findPath(world.player.position,target,ROOMS[currentRoom].obstacles);
    if(!route.length){toast('Pick an open spot on the floor.');return false;}
    path=route;pending=id;world.marker.position.set(target.x,.086,target.z);world.marker.visible=true;
    container.focus({preventScroll:true});return true;
  }
  function updateRoomUI(){
    const room=ROOMS[currentRoom];
    const parent=document.querySelector('#hotspots');parent.replaceChildren();
    for(const [id,station] of Object.entries(room.stations)){
      if(station.hideHotspot)continue;
      const button=document.createElement('button');button.className='hotspot'+(station.type==='door'?' door-hotspot':station.type==='gallery'?' gallery-hotspot':'');
      button.dataset.spot=id;button.setAttribute('aria-label',station.label);
      const dot=document.createElement('span');dot.className='spot-dot';dot.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.className='spot-label';label.textContent=station.shortLabel;
      button.append(dot,label);
      button.onclick=()=>{if(station.type==='gallery')selectedArtwork=world.gallery.items.findIndex(item=>item.group===station.galleryGroup);walkTo(station.position,id);};parent.append(button);
    }
    hotspots=[...parent.querySelectorAll('.hotspot')];
    document.querySelector('.room-badge').textContent='ROOM 0'+room.number;
    document.querySelector('.caption-number').textContent=room.number;
    document.querySelector('.room-caption strong').textContent=room.title;
    document.querySelector('.room-caption div>span').textContent=room.caption;
    container.setAttribute('aria-label',room.title+'. Use arrow keys or WASD to walk, E to interact, or walk into the connecting doorway to change rooms.');
    document.body.dataset.room=currentRoom;
    document.querySelector('meta[name=theme-color]').content=ROOM_BLUE;
  }
  function beginRoomChange(destination){
    if(roomTransition||world.gallery.busy||!ROOMS[destination]||destination===currentRoom)return;
    clearMovement();nearby=null;interact.hidden=true;
    roomTransition={destination,elapsed:0,switched:false};
    document.body.classList.add('changing-room');
    document.querySelector('#room-announcement').textContent='Entering '+ROOMS[destination].title.toLowerCase()+'.';
  }
  function advanceRoomChange(dt){
    if(!roomTransition)return;
    roomTransition.elapsed+=dt;
    const duration=reduced?.06:.72;
    const progress=Math.min(1,roomTransition.elapsed/duration);
    transitionCover.style.opacity=String(progress<.5?progress*2:(1-progress)*2);
    if(progress>=.5&&!roomTransition.switched){
      currentRoom=roomTransition.destination;world.setRoom(currentRoom);angle=0;
      clearMovement();updateRoomUI();roomTransition.switched=true;
    }
    if(progress>=1){roomTransition=null;document.body.classList.remove('changing-room');transitionCover.style.opacity='0';container.focus({preventScroll:true});}
  }
  function activateStation(id){
    if(id==='finish-set'){world.pullup.finish();return;}
    if(world.gallery.busy||hasPanel()||roomTransition)return;
    if(id==='stand'){world.stand();clearMovement();angle=Math.PI;return;}
    if(id==='zuko'||id==='treat'){
      if(!world.zuko)return;
      if(!world.interactZuko(id==='treat'?'treat':'pet')){toast('Walk up to Zuko to say hello.');return;}
      clearMovement();document.querySelector('#room-announcement').textContent=id==='treat'?'A little treat for Zuko.':'Giving Zuko some scritches.';return;
    }
    if(id==='switch'){const game=world.tv?.cycle(reduced);if(game)document.querySelector('#room-announcement').textContent='Now on TV: '+game.title+'. Click again for the next game.';return;}
    const station=ROOMS[currentRoom].stations[id];if(!station)return;
    if(station.type==='gallery'){
      const item=world.gallery.items[selectedArtwork];
      galleryUI.open(item?.group===station.galleryGroup?selectedArtwork:world.gallery.items.findIndex(art=>art.group===station.galleryGroup));
    }else if(station.type==='door')walkTo(station.position,id);
    else if(id==='projects')deskUI.launch();
    else if(id==='about')bedUI.launch();
    else if(id==='library')roomPanels.show(id);
    else if(id==='pullup'){clearMovement();world.stand();world.exercise();}
    else if(station.type==='seat'){clearMovement();world.sit();angle=Math.PI;toast('Comfy. Press E or move to stand up.');}
    else if(station.type==='cheer'){clearMovement();world.cheer();toast('Forza Ferrari! 🏎️  Go Ferrari!');}
    else openPanel(id);
  }
  updateRoomUI();
  container.addEventListener('pointerdown',event=>{
    if(event.button!==0||roomTransition||world.gallery.busy||hasPanel())return;
    const object=world.pickInteraction(event.clientX,event.clientY);
    if(object==='switch'){activateStation('switch');return;}
    if(object==='zuko'){activateStation('zuko');return;}
    if(object&&ROOMS[currentRoom].stations[object]){walkTo(ROOMS[currentRoom].stations[object].position,object);return;}
    const artwork=world.pickArtwork(event.clientX,event.clientY);
    if(artwork!==null){const id=world.gallery.items[artwork].group==='small'?'prints':'gallery';selectedArtwork=artwork;walkTo(ROOMS.bedroom.stations[id].position,id);return;}
    const point=world.floorPoint(event.clientX,event.clientY);
    if(point&&Math.abs(point.x)<3.8&&Math.abs(point.z)<3.8)walkTo(point);
    container.focus({preventScroll:true});
  });
  window.addEventListener('keydown',event=>{
    if(world.pullup.busy){if(['Escape','e','E'].includes(event.key)){event.preventDefault();world.pullup.finish();}return;}
    if(hasPanel()||roomTransition||world.gallery.busy)return;
    const k=event.key.toLowerCase();
    if(k==='t'){event.preventDefault();if(!event.repeat)activateStation('treat');return;}
    if(world.seated&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','escape'].includes(k)){
      event.preventDefault();if(event.repeat)return;world.stand();clearMovement();angle=Math.PI;if(k==='e'||k==='escape')return;
    }
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e'].includes(k)){
      event.preventDefault();
      if(k==='e'){if(nearby&&!event.repeat)activateStation(nearby);return;}
      keys.add(k);path=[];pending=null;world.marker.visible=false;
    }
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
  const touchMapping={up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'};
  document.querySelectorAll('[data-direction]').forEach(button=>{
    const key=touchMapping[button.dataset.direction];
    button.addEventListener('pointerdown',event=>{
      event.preventDefault();if(roomTransition||world.gallery.busy||hasPanel())return;
      world.stand();
      button.setPointerCapture(event.pointerId);keys.add(key);path=[];pending=null;world.marker.visible=false;button.classList.add('pressed');
    });
    const release=()=>{keys.delete(key);button.classList.remove('pressed');};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  giveTreat.onclick=()=>activateStation('treat');
  interact.onclick=()=>{if(world.pullup.busy){activateStation('finish-set');return;}if(world.seated)activateStation('stand');else if(nearby)activateStation(nearby);};
  document.querySelector('#reset').onclick=()=>{
    if(roomTransition||world.gallery.busy||hasPanel())return;
    world.stand();const start=ROOMS[currentRoom].spawn;world.player.position.set(start.x,.06,start.z);clearMovement();angle=0;toast('Back to '+ROOMS[currentRoom].title.toLowerCase()+'.');
  };
  function updateLightingUI(evening){
    document.body.classList.toggle('evening',evening);
    const b=document.querySelector('#lighting');b.setAttribute('aria-pressed',String(evening));b.setAttribute('aria-label',evening?'Switch to daylight':'Switch to evening light');
  }
  document.querySelector('#lighting').onclick=()=>{
    if(roomTransition||world.gallery.busy||hasPanel())return;
    updateLightingUI(world.toggleLight());
  };
  let lastLocalMinute='';
  function syncLocalTime(){const date=new Date(),minute=`${Math.floor(date.getTime()/60000)}:${date.getTimezoneOffset()}`;if(minute!==lastLocalMinute){lastLocalMinute=minute;updateLightingUI(world.setTime(date));}}
  syncLocalTime();
  window.addEventListener('resize',()=>world.resize());
  let last=performance.now();
  function frame(now){
    requestAnimationFrame(frame);const frameDt=Math.max(0,(now-last)/1000),dt=Math.min(frameDt,.045);last=now;if(document.hidden)return;
    syncLocalTime();
    advanceRoomChange(dt);
    let dx=0,dz=0;
    const room=ROOMS[currentRoom],pos=world.player.position;
    if(!hasPanel()&&!roomTransition&&!world.gallery.busy&&!world.seated){
      const horizontal=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      const vertical=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      if(horizontal||vertical){
        dx=horizontal*.759+vertical*.651;dz=-horizontal*.651+vertical*.759;
        const n=Math.hypot(dx,dz);dx=dx/n*2.3*dt;dz=dz/n*2.3*dt;
      }else if(path.length){
        const target=path[0],dist=Math.hypot(target.x-pos.x,target.z-pos.z);
        if(dist<.04){
          path.shift();
          if(!path.length){world.marker.visible=false;const id=pending;pending=null;if(id){if(room.stations[id]?.type==='door')beginRoomChange(room.stations[id].destination);else if(room.stations[id]?.type!=='gallery')activateStation(id);}}
        }else{const step=Math.min(2.5*dt,dist);dx=(target.x-pos.x)/dist*step;dz=(target.z-pos.z)/dist*step;}
      }
    }
    const next=world.seated||world.desk.busy||world.bed.busy||world.library.busy||world.pullup.busy||world.interactingWithZuko?pos:moveWithCollisions(pos,dx,dz,room.obstacles);
    const moving=Math.hypot(next.x-pos.x,next.z-pos.z)>.0001;
    if(moving)angle=Math.atan2(next.x-pos.x,next.z-pos.z);pos.x=next.x;pos.z=next.z;
    const destination=doorDestination(currentRoom,pos);
    if(destination&&!hasPanel()&&!roomTransition&&!world.gallery.busy&&!world.seated)beginRoomChange(destination);
    nearby=null;let nearest=1.0;
    for(const [id,s] of Object.entries(room.stations)){const d=interactionDistance(s,pos);if(d<nearest){nearby=id;nearest=d;}}
    if(world.zuko&&!world.zuko.jumping&&Math.hypot(pos.x-world.zuko.root.position.x,pos.z-world.zuko.root.position.z)<Math.min(nearest,.95))nearby='zuko';
    if(world.seated)nearby='stand';
    const nearbyStation=nearby==='stand'?{shortLabel:'Stand up',label:'Stand up from the couch'}:nearby==='zuko'?{shortLabel:'Pet Zuko',label:'Pet Zuko the dog'}:room.stations[nearby];
    world.gallery.setNearby(!hasPanel()&&!roomTransition&&!world.gallery.busy&&room.stations[nearby]?.type==='gallery'?room.stations[nearby].galleryGroup:null);
    interact.hidden=!nearby||hasPanel()||Boolean(roomTransition)||world.gallery.busy;
    giveTreat.hidden=!world.zuko||world.zuko.jumping||hasPanel()||Boolean(roomTransition)||world.gallery.busy||Math.hypot(pos.x-world.zuko.root.position.x,pos.z-world.zuko.root.position.z)>1.15;
    if(nearbyStation){interact.querySelector('span').textContent=nearbyStation.shortLabel;interact.setAttribute('aria-label',nearbyStation.label);}
    if(world.pullup.busy){interact.hidden=false;interact.querySelector('span').textContent='Finish set';interact.setAttribute('aria-label','Finish pull-ups and return to the floor');}
    for(const b of hotspots){
      const p=world.project(room.stations[b.dataset.spot].anchor),width=Math.max(b.offsetWidth,b.querySelector('.spot-label').offsetWidth);
      const x=Math.max(width/2+8,Math.min(innerWidth-width/2-8,p.x));
      b.style.transform=`translate(${x}px,${p.y}px) translate(-50%,-50%)`;
      const hidden=hasPanel()||Boolean(roomTransition)||world.gallery.busy;
      b.style.opacity=hidden?'0':'1';b.inert=hidden;b.classList.toggle('active',b.dataset.spot===nearby);
    }
    world.render(dt,moving,angle,reduced,frameDt);
    galleryUI.update();deskUI.update(frameDt,reduced);bedUI.update();roomPanels.update();introUI.update();
  }
  requestAnimationFrame(frame);
  introUI.play();
}
