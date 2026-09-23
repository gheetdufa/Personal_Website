import {createBookshelfExperience} from './bookshelf.js';
import {createRoomIntro} from './room-intro.js';
import {ROOM_BLUE,createLocalLighting} from './room-time.js';
import {createPullupExperience} from './pullup.js';
import {createBedExperience} from './bed-experience.js';
import {screenHit} from './screen-canvas.js';
import {createDeskExperience,monitorSurface} from './desk-experience.js';
import * as THREE from './vendor/three.module.js';

import {createPrimitives} from './primitives.js';
import {createBedroom} from './bedroom.js';
import {createLivingRoom} from './living-room.js';
import {ROOMS,COUCH_SEAT,COUCH_EXIT} from './rooms.js';
import {moveWithCollisions} from './navigation.js';
import {createAvatar} from './avatar.js';
import {createWallGallery,GALLERY_LAYER} from './wall-gallery.js';
export {obstacles,stations} from './rooms.js';

export function createWorld(container,createRenderer=options=>new THREE.WebGLRenderer(options),referenceTexture,paintingTextures){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(ROOM_BLUE);
  const renderer=createRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.24;
  container.appendChild(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-8,8,6,-6,.1,100);
  const look=new THREE.Vector3(0,1.45,0);
  camera.position.set(12,12.5,14);camera.lookAt(look);
  const bedroom=createBedroom(referenceTexture,paintingTextures);scene.add(bedroom.root);
  const {material,box,cyl,ball,group,rod}=createPrimitives(scene);
  const hemi=new THREE.HemisphereLight('#f6f6ea','#787f71',2.2);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#ffedcf',4.1);sun.position.set(-1,10,-5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:30});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
  const fill=new THREE.DirectionalLight('#e5f1ff',1.1);fill.position.set(8,5,8);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#475046',opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-.43;ground.receiveShadow=true;scene.add(ground);
  const living=createLivingRoom();scene.add(living.root);living.root.visible=false;
  let activeRoom='bedroom';
  // The same visitor is shared between the two rooms.
  const player=group(ROOMS.bedroom.spawn.x,.06,ROOMS.bedroom.spawn.z,scene);
  const visitor=createAvatar(player),avatar=visitor.root;
  const pullup=createPullupExperience(player);
  let seated=false,cheerTime=0,dogAction=null;
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.36,32),new THREE.MeshBasicMaterial({color:'#434d40',transparent:true,opacity:.13,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;player.add(shadow);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.12,.17,32),new THREE.MeshBasicMaterial({color:'#fff9d9',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.087;marker.visible=false;scene.add(marker);
  const raycaster=new THREE.Raycaster();const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.085);
  const lighting=createLocalLighting();let transition=lighting.evening?1:0;
  function roomView(){const w=container.clientWidth,h=container.clientHeight,aspect=w/h,width=w<700?11.6:Math.max(15.0,aspect*13.0);return {pixelWidth:w,pixelHeight:h,aspect,width,height:width/aspect,offsetX:0,offsetY:w<700?-h*.016:-h*.025};}
  const desk=createDeskExperience({chair:bedroom.chair,player,camera,getRoomView:roomView,props:bedroom.deskProps});
  const bed=createBedExperience({parent:bedroom.root,player,camera,getRoomView:roomView,onLand:()=>bedroom.plushBounce.trigger()});
  const library=createBookshelfExperience({books:living.readingBooks,player,camera,getRoomView:roomView});
  const gallery=createWallGallery(bedroom.artworks,camera,roomView);
  const intro=createRoomIntro({scene,room:bedroom.root,player,ground,camera});
  const roomLights=[],glowMaterials=new Map();
  scene.traverse(object=>{if(object.isLight)roomLights.push(object);if(object.isMesh)for(const m of [object.material].flat())if(m.emissiveIntensity>0)glowMaterials.set(m,m.emissiveIntensity);});
  scene.traverse(object=>{if(object.isLight)object.layers.enable(GALLERY_LAYER);});
  function resize(){const v=roomView();renderer.setSize(v.pixelWidth,v.pixelHeight);camera.left=-v.width/2;camera.right=v.width/2;camera.top=v.height/2;camera.bottom=-v.height/2;camera.setViewOffset(v.pixelWidth,v.pixelHeight,v.offsetX,v.offsetY,v.pixelWidth,v.pixelHeight);camera.updateProjectionMatrix();}
  function project(p){const v=new THREE.Vector3(p.x,p.y,p.z).project(camera);return {x:(v.x*.5+.5)*container.clientWidth,y:(-.5*v.y+.5)*container.clientHeight};}
  function floorPoint(clientX,clientY){const r=container.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2(((clientX-r.left)/r.width)*2-1,-((clientY-r.top)/r.height)*2+1),camera);return raycaster.ray.intersectPlane(floorPlane,new THREE.Vector3());}
  function render(dt,walking,angle,reduced,introDt=dt){
    const isBedroom=activeRoom==='bedroom',current=isBedroom?bedroom:living;
    transition=THREE.MathUtils.damp(transition,lighting.evening?1:0,3,dt);
    current.door.update(dt,player.position,reduced);current.update(dt,transition,reduced,player.position,seated);
    sun.color.set(isBedroom?'#ffd497':'#ffd6a3');
    scene.background.set(ROOM_BLUE);
    hemi.intensity=(isBedroom?1.45:2.2)-transition*(isBedroom?.77:1.45);
    sun.intensity=(isBedroom?2.6:4.1)-transition*(isBedroom?2.3:3.85);
    fill.intensity=(isBedroom?.70:1.1)-transition*.40;
    renderer.toneMappingExposure=(isBedroom?1.08:1.24)-transition*.12;
    desk.update(dt,reduced);bed.update(dt,reduced);pullup.update(dt,reduced);library.update(dt,reduced);
    let interaction=null;
    if(dogAction){
      dogAction.elapsed+=dt;
      const duration=reduced?1.8:2.8,t=dogAction.elapsed;
      if(t>=duration)dogAction=null;
      else{
        if(!seated&&t<.5){
          const dog=living.zuko.root.position,dx=dog.x-player.position.x,dz=dog.z-player.position.z,d=Math.hypot(dx,dz);
          if(d>.67){const step=Math.min(dt*.85,d-.67),next=moveWithCollisions(player.position,dx/d*step,dz/d*step,ROOMS.living.obstacles);player.position.x=next.x;player.position.z=next.z;}
        }
        const ramp=Math.min(1,t/.5,(duration-t)/.5),amount=reduced?1:ramp*ramp*(3-2*ramp);
        interaction={...dogAction,amount};
      }
    }
    visitor.update(dt,walking,bed.busy?0:desk.busy?Math.PI:angle,reduced,bed.busy?bed.seatAmount:desk.busy?desk.seatAmount:seated,interaction||(pullup.busy?{kind:'pullup',angle:0,pose:pullup.pose}:bed.busy?{kind:'bed',angle:0,elapsed:bed.state.elapsed,pose:bed.pose}:desk.ready?{kind:'desk',angle:Math.PI,elapsed:desk.activity}:null));
    if(cheerTime>0){cheerTime=Math.max(0,cheerTime-dt);if(!reduced)avatar.position.y+=Math.abs(Math.sin(cheerTime*7))*.14;}
    gallery.update(dt,reduced);
    if(activeRoom==='bedroom'&&gallery.busy){const dim=1-gallery.progress*.35;hemi.intensity*=dim;sun.intensity*=dim;fill.intensity*=dim;}
    intro.update(introDt,reduced);
    for(const light of roomLights)light.intensity*=intro.lightLevel;
    for(const [material,intensity] of glowMaterials)material.emissiveIntensity=intensity*intro.lightLevel;
    renderer.render(scene,camera);
    gallery.renderOverlay(renderer,scene);
  }
  function setRoom(id){
    if(!ROOMS[id])throw Error('Unknown room');
    intro.finish();
    desk.reset();bed.reset();pullup.reset();library.reset();bedroom.plushBounce.reset();gallery.reset();seated=false;cheerTime=0;dogAction=null;living.zuko.setCouch(false);
    activeRoom=id;bedroom.root.visible=id==='bedroom';living.root.visible=id==='living';
    const spawn=ROOMS[id].arrival;player.position.set(spawn.x,.06,spawn.z);avatar.rotation.y=0;marker.visible=false;
  }
  function pickArtwork(clientX,clientY){
    if(activeRoom!=='bedroom'||gallery.busy)return null;
    const r=container.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);
    const hit=raycaster.intersectObjects(bedroom.artworks.map(item=>item.frame),true)[0];
    if(!hit)return null;let object=hit.object;while(object&&object.userData.galleryIndex===undefined)object=object.parent;
    return object?.userData.galleryIndex??null;
  }
  function pickInteraction(clientX,clientY){
    if(gallery.busy)return null;
    const r=container.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);
    scene.updateMatrixWorld();
    const hit=raycaster.intersectObject(activeRoom==='bedroom'?bedroom.root:living.root,true).find(hit=>{for(let object=hit.object;object;object=object.parent)if(!object.visible)return false;return true;});
    let object=hit?.object;while(object&&!object.userData.interaction)object=object.parent;
    return object?.userData.interaction??null;
  }
  function sit(){if(activeRoom!=='living')return false;seated=true;player.position.set(COUCH_SEAT.x,COUCH_SEAT.y,COUCH_SEAT.z);avatar.rotation.y=Math.PI;marker.visible=false;return true;}
  function stand(){dogAction=null;if(!seated)return false;seated=false;living.zuko.setCouch(false);player.position.set(COUCH_EXIT.x,COUCH_EXIT.y,COUCH_EXIT.z);return true;}
  function interactZuko(kind='pet'){
    if(activeRoom!=='living'||dogAction||gallery.busy||desk.busy||!['pet','treat'].includes(kind))return false;
    const dog=living.zuko.root.position;
    if(Math.hypot(dog.x-player.position.x,dog.z-player.position.z)>1.15||living.zuko.jumping)return false;
    if(!living.zuko.pet(kind,player.position))return false;
    dogAction={kind,elapsed:0,angle:Math.atan2(dog.x-player.position.x,dog.z-player.position.z)};
    marker.visible=false;return true;
  }
  resize();
  return {library,bookSurfaces(){return living.readingBooks.map(({cover})=>{cover.updateWorldMatrix(true,false);return [[-.231,-.295],[.231,-.295],[.231,.295],[-.231,.295]].map(([x,y])=>project(cover.localToWorld(new THREE.Vector3(x,y,.001))));});},pickBook(x,y){return library.ready?screenHit(raycaster,camera,container,living.readingBooks.map(b=>b.cover),x,y)?.index??null:null;},pullup,exercise(){if(activeRoom!=='living'||pullup.busy||seated||dogAction)return false;return pullup.open();},bed,pickBedScreen(x,y){return bed.ready?screenHit(raycaster,camera,container,[bed.screen],x,y):null;},monitors:bedroom.monitors,pickMonitor(x,y){return desk.ready?screenHit(raycaster,camera,container,bedroom.monitors,x,y):null;},interactZuko,get interactingWithZuko(){return Boolean(dogAction);},desk,monitorSurfaces(){return bedroom.monitors.map(screen=>monitorSurface(screen,project));},gallery,pickArtwork,pickInteraction,scene,renderer,camera,player,marker,resize,project,floorPoint,render,setRoom,sit,stand,
    intro,get tv(){return activeRoom==='living'?living.tv:null;},get seated(){return seated;},get zuko(){return activeRoom==='living'?living.zuko:null;},
    cheer(){cheerTime=2.3;},get activeRoom(){return activeRoom;},toggleLight(){return lighting.toggle();},
    setTime(date){bedroom.clockDisplay.update(date);return lighting.update(date);}};
}
