import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
export const PULLUP={x:-1.08,z:-3.12,height:2.30};
export function addPullupBar(parent){
  const {group,box,rod}=createPrimitives(parent),root=group(PULLUP.x,0,PULLUP.z);root.name='pull-up-bar';root.userData.interaction='pullup';
  const v=(x,y,z)=>new THREE.Vector3(x,y,z);
  for(const side of [-1,1]){box(.14,.08,.92,'#353c3e',side*.51,.05,0,root);box(.065,2.30,.065,'#434b4f',side*.51,1.19,0,root);rod(v(side*.51,.12,.36),v(side*.51,.60,0),.022,'#636c70',root);}
  const crossbar=rod(v(-.58,PULLUP.height,0),v(.58,PULLUP.height,0),.037,'#858e91',root);crossbar.name='pull-up-crossbar';
  for(const side of [-1,1])rod(v(side*.29,PULLUP.height,0),v(side*.54,PULLUP.height,0),.046,'#242b2d',root);
  return root;
}
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
export function createPullupExperience(player){
  let elapsed=0,mode='idle',start=null,exitStart=null,exitPose=null;
  let pose={reach:0,pull:0,barY:0,barZ:0};
  function reset(){if(start)player.position.copy(start);mode='idle';elapsed=0;pose={reach:0,pull:0,barY:0,barZ:0};}
  function finish(){if(mode==='idle'||mode==='leaving')return;mode='leaving';elapsed=0;exitStart=player.position.clone();exitPose={...pose};}
  function open(){if(mode!=='idle')return false;start=player.position.clone();elapsed=0;mode='reaching';return true;}
  function update(dt,reduced=false){
    if(mode==='idle')return;
    elapsed+=dt;
    if(mode==='leaving'){
      // Drop below the bar before crossing it, even when a rep is stopped at its peak.
      const drop=reduced?1:smooth(elapsed/.27),step=reduced?1:smooth((elapsed-.27)/.38);
      player.position.lerpVectors(exitStart,start,step);player.position.y=THREE.MathUtils.lerp(exitStart.y,start.y,drop);
      pose={reach:exitPose.reach*(1-drop),pull:exitPose.pull*(1-drop),barY:PULLUP.height-player.position.y,barZ:PULLUP.z-player.position.z};if(step===1)reset();return;
    }
    const reach=reduced?1:smooth(elapsed/.70),repTime=Math.max(0,elapsed-.70);
    const pull=elapsed<.70||repTime>=4.80?0:(1-Math.cos((repTime%1.60)/1.60*Math.PI*2))*.5;
    // The body rises behind the bar; the hands reach forward onto its fixed grips.
    const hang=new THREE.Vector3(PULLUP.x,.90,PULLUP.z-.34);player.position.lerpVectors(start,hang,reduced?1:smooth(elapsed/.50));player.position.y=THREE.MathUtils.lerp(start.y,hang.y,reach);
    if(!reduced)player.position.y+=.40*pull;
    pose={reach,pull:reduced?0:pull,barY:PULLUP.height-player.position.y,barZ:PULLUP.z-player.position.z};mode=reach===1?'exercising':'reaching';
    if(repTime>=4.80)finish();
  }
  return {open,finish,reset,update,get busy(){return mode!=='idle';},get pose(){return pose;},get state(){return {mode,elapsed};}};
}
