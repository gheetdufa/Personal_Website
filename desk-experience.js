import * as THREE from './vendor/three.module.js';

export const DESK_DURATION=3.15;
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
export function createDeskExperience({chair,player,camera,getRoomView,props=[]}){
  const rest=chair.position.clone(),restRotation=chair.rotation.y;
  const propRest=props.map(p=>p.position.clone()),propAside=[new THREE.Vector3(1.46,1.267,.46),new THREE.Vector3(-1.47,1.27,.46),new THREE.Vector3(1.33,1.34,-.44),new THREE.Vector3(-1.05,1.275,.58)];
  const out=rest.clone();out.z=.79;
  const tucked=rest.clone();tucked.z=-1.00;tucked.x=1.88;
  let mode='closed',elapsed=0,seatAmount=0,snapshot=null,monitor='library',pan=1.60,activity=0;
  function restore(){
    if(snapshot){player.position.copy(snapshot.player);camera.position.copy(snapshot.camera);camera.quaternion.copy(snapshot.rotation);}
    chair.position.copy(rest);chair.rotation.y=restRotation;seatAmount=0;props.forEach((p,i)=>p.position.copy(propRest[i]));
    const v=getRoomView();camera.left=-v.width/2;camera.right=v.width/2;camera.top=v.height/2;camera.bottom=-v.height/2;camera.setViewOffset(v.pixelWidth,v.pixelHeight,v.offsetX,v.offsetY,v.pixelWidth,v.pixelHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function open(){
    if(mode!=='closed')return false;
    pan=1.60;activity=0;snapshot={player:player.position.clone(),camera:camera.position.clone(),rotation:camera.quaternion.clone()};mode='entering';elapsed=0;return true;
  }
  function close(){if(mode==='closed'||mode==='closing')return false;mode='closing';return true;}
  function reset(){if(mode!=='closed')restore();mode='closed';elapsed=0;}
  function update(dt,reduced=false){
    if(mode==='closed')return;
    if(mode!=='open')elapsed=reduced?(mode==='closing'?0:DESK_DURATION):THREE.MathUtils.clamp(elapsed+(mode==='closing'?-dt:dt),0,DESK_DURATION);
    const pull=smooth(elapsed/.65),sit=smooth((elapsed-.65)/.75),tuck=smooth((elapsed-1.40)/.70),zoom=smooth((elapsed-2.10)/1.05);
    chair.position.lerpVectors(rest,out,pull).lerp(tucked,tuck);chair.rotation.y=THREE.MathUtils.lerp(restRotation,Math.PI,pull);
    const seat=chair.position.clone();seat.y=.30;player.position.lerpVectors(snapshot.player,seat,sit);seatAmount=sit;
    props.forEach((p,i)=>p.position.lerpVectors(propRest[i],propAside[i],smooth((elapsed-1.40)/.70)));
    const v=getRoomView();activity=Math.max(0,activity-dt);
    const desired=monitor==='library'?2.29:.90;pan=reduced?desired:THREE.MathUtils.damp(pan,desired,7,dt);
    const focus=new THREE.Vector3(pan,2.04,-1.40),target=new THREE.Vector3(pan,1.90,-1.93),matrix=new THREE.Matrix4();
    const rotation=new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(focus,target,new THREE.Vector3(0,1,0)));
    camera.position.lerpVectors(snapshot.camera,focus,zoom);camera.quaternion.copy(snapshot.rotation).slerp(rotation,zoom);
    const height=THREE.MathUtils.lerp(v.height,Math.max(v.pixelHeight<500?1.45:1.04,1.36/v.aspect),zoom),width=height*v.aspect;
    camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.setViewOffset(v.pixelWidth,v.pixelHeight,v.offsetX*(1-zoom),v.offsetY*(1-zoom),v.pixelWidth,v.pixelHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    if(mode==='closing'&&elapsed===0){restore();mode='closed';}
    else if(elapsed===DESK_DURATION)mode='open';
  }
  return {open,close,reset,update,focusMonitor(value){monitor=value;},interact(){activity=.7;},get activity(){return activity;},get busy(){return mode!=='closed';},get ready(){return mode==='open';},get seatAmount(){return seatAmount;},get state(){return {mode,elapsed,phase:mode==='closed'?'closed':elapsed<.65?'pulling-chair':elapsed<1.40?'sitting':elapsed<2.10?'rolling-in':'monitors'};}};
}

// Project the physical monitor corners for framing and geometry checks.
export function monitorSurface(screen,project,width=720,height=720*.785/1.225){
  screen.updateWorldMatrix(true,false);
  const point=(x,y)=>project(screen.localToWorld(new THREE.Vector3(x,y,.003)));
  const tl=point(-.6125,.3925),tr=point(.6125,.3925),bl=point(-.6125,-.3925);
  return {width,height,matrix:[(tr.x-tl.x)/width,(tr.y-tl.y)/width,(bl.x-tl.x)/height,(bl.y-tl.y)/height,tl.x,tl.y]};
}
