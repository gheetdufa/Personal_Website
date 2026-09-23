import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
export const BED_DURATION=3.50;
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(6*t-15)+10);};
const ramp=(t,start,end)=>ease((t-start)/(end-start));
const pulse=t=>Math.sin(Math.PI*t)**2;

// One continuous timeline drives travel, anticipation, landing, hands and camera.
export function bedPose(elapsed){
  const flight=THREE.MathUtils.clamp((elapsed-.22)/.72,0,1),travel=flight*flight*(3-2*flight);
  return {flight,travel,crouch:ramp(elapsed,0,.22)*(1-ramp(elapsed,.22,.40)),seat:ramp(elapsed,.26,.58),landing:pulse(ramp(elapsed,.94,1.25)),pull:ramp(elapsed,1.50,2.25),zoom:ramp(elapsed,2.20,BED_DURATION)};
}
function roundedShape(w,h,r){
  const x=-w/2,y=-h/2,s=new THREE.Shape();
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
export function createBedExperience({parent,player,camera,getRoomView,onLand=()=>{}}){
  const {group,box,cyl,material}=createPrimitives(parent),display=group(-1.40,1.08,.95);display.name='bed-tablet';display.visible=false;
  // A hand-held tablet: only a little wider than the visitor's shoulders.
  const bodyGeometry=new THREE.ExtrudeGeometry(roundedShape(.56,.39,.024),{depth:.018,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:3,curveSegments:10});bodyGeometry.translate(0,0,-.009);
  const body=new THREE.Mesh(bodyGeometry,material('#51575b',{roughness:.32,metalness:.55}));body.name='tablet-body';body.castShadow=true;display.add(body);
  const bezel=new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(.548,.378,.020),10),material('#111619'));bezel.position.z=.012;display.add(bezel);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.51,.34),new THREE.MeshBasicMaterial({color:'#183c33',toneMapped:false}));screen.position.z=.014;screen.name='bed-display-screen';display.add(screen);
  const lens=cyl(.0035,.0035,.001,'#263738',-.266,0,.014,display,12);lens.rotation.x=Math.PI/2;
  box(.07,.003,.001,'#9da4a3',0,-.181,.014,display);
  box(.052,.006,.012,'#777d81',.173,.197,0,display);
  const rest=new THREE.Vector3(-1.40,1.08,.95),held=new THREE.Vector3(-1.87,1.48,1.20),seat=new THREE.Vector3(-1.87,.55,.70);
  const flat=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,Math.PI,0)),raised=new THREE.Quaternion().setFromEuler(new THREE.Euler(1.50,Math.PI,0));
  let mode='closed',elapsed=0,snapshot=null,pose=bedPose(0);
  function restore(){
    if(snapshot){player.position.copy(snapshot.player);camera.position.copy(snapshot.camera);camera.quaternion.copy(snapshot.rotation);}
    const v=getRoomView();camera.left=-v.width/2;camera.right=v.width/2;camera.top=v.height/2;camera.bottom=-v.height/2;camera.setViewOffset(v.pixelWidth,v.pixelHeight,v.offsetX,v.offsetY,v.pixelWidth,v.pixelHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();display.visible=false;pose=bedPose(0);
  }
  function open(){if(mode!=='closed')return false;snapshot={player:player.position.clone(),camera:camera.position.clone(),rotation:camera.quaternion.clone()};elapsed=0;pose=bedPose(0);mode='entering';return true;}
  function close(){if(mode==='closed'||mode==='closing')return false;mode='closing';return true;}
  function reset(){if(mode!=='closed')restore();mode='closed';elapsed=0;}
  function update(dt,reduced=false){
    if(mode==='closed')return;
    const before=elapsed;
    if(mode!=='open')elapsed=reduced?(mode==='closing'?0:BED_DURATION):THREE.MathUtils.clamp(elapsed+(mode==='closing'?-dt:dt),0,BED_DURATION);
    if(mode==='entering'&&before<.94&&elapsed>=.94&&!reduced)onLand();
    pose=bedPose(elapsed);
    const {flight,travel,crouch,landing,pull,zoom}=pose;
    player.position.lerpVectors(snapshot.player,seat,travel);
    if(!reduced)player.position.y=elapsed<.22?snapshot.player.y-crouch*.055:THREE.MathUtils.lerp(snapshot.player.y-.055,seat.y,flight)+4*.60*flight*(1-flight)-landing*.025;
    display.visible=elapsed>1.50;display.position.lerpVectors(rest,held,pull);display.quaternion.copy(flat).slerp(raised,pull);
    // Move closer to the small physical device; never enlarge the tablet itself.
    const focus=held.clone().add(new THREE.Vector3(0,Math.sin(1.50)*1.4,-Math.cos(1.50)*1.4)),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(focus,held,new THREE.Vector3(0,1,0)));
    camera.position.lerpVectors(snapshot.camera,focus,zoom);camera.quaternion.copy(snapshot.rotation).slerp(rotation,zoom);
    const v=getRoomView(),readingHeight=Math.max(v.pixelHeight<500?.66:.46,.59/v.aspect);
    const height=Math.exp(THREE.MathUtils.lerp(Math.log(v.height),Math.log(readingHeight),zoom)),width=height*v.aspect;
    camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.setViewOffset(v.pixelWidth,v.pixelHeight,v.offsetX*(1-zoom),v.offsetY*(1-zoom),v.pixelWidth,v.pixelHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    if(mode==='closing'&&elapsed===0){restore();mode='closed';}else if(elapsed===BED_DURATION)mode='open';
  }
  return {open,close,reset,update,display,screen,get busy(){return mode!=='closed';},get ready(){return mode==='open';},get seatAmount(){return pose.seat;},get pose(){return pose;},get state(){return {mode,elapsed,phase:mode==='closed'?'closed':elapsed<.22?'crouching':elapsed<.94?'jumping':elapsed<1.50?'settling':elapsed<2.25?'pulling-display':'reading'};}};
}
