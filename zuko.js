import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
import {findPath,moveWithCollisions} from './navigation.js';
import {ROOMS} from './rooms.js';
import {textLabel} from './labels.js';

export const ZUKO_ACTIVITIES=[
  {id:'play',label:'Playing with his ball',x:-1.75,z:.96,angle:0,duration:4},
  {id:'drink',label:'Having a little drink',x:2.85,z:2.33,angle:0,duration:4},
  {id:'sniff',label:'Investigating the bookshelf',x:-2.15,z:-2.38,angle:Math.PI,duration:3},
  {id:'nap',label:'Resting by the couch',x:1.83,z:1.12,angle:Math.PI/2,duration:6},
];

export function createZuko(parent,random=Math.random){
  const {group,ball,cyl,box,material}=createPrimitives(parent);
  const root=group(1.85,0,-1.52);root.name='zuko';root.userData.interaction='zuko';
  const model=group(0,0,0,root);model.scale.setScalar(.83);
  const ginger='#c88645',cream='#f1dfbd',dark='#382c2a';
  function oval(r,color,x,y,z,sx=1,sy=1,sz=1,p=model){const m=ball(r,color,x,y,z,p);m.scale.set(sx,sy,sz);return m;}
  oval(.25,ginger,0,.41,0,.89,.88,1.46);
  oval(.21,cream,0,.42,.22,1.05,1.18,.84);
  // A dense ruff and furry cheeks borrow the Pomeranian silhouette.
  for(let i=0;i<10;i++){const a=i*Math.PI/5;oval(.09,i%3?cream:'#e6c99d',Math.cos(a)*.175,.46+Math.sin(a)*.19,.225,.95,1.1,.85);}
  const head=group(0,.66,.31,model);
  oval(.216,ginger,0,0,0,1.04,.96,.91,head);
  for(const s of [-1,1]){
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.105,.24,3),material(ginger));ear.position.set(s*.134,.185,-.025);ear.rotation.set(-.12,Math.PI/2,-s*.19);ear.castShadow=true;head.add(ear);
    const inner=new THREE.Mesh(new THREE.ConeGeometry(.062,.147,3),material('#b57566'));inner.position.set(s*.134,.198,.014);inner.rotation.copy(ear.rotation);head.add(inner);
    oval(.105,cream,s*.12,-.065,.118,1.03,.87,.74,head);
    oval(.023,dark,s*.087,.016,.181,.95,1.1,.55,head);
    oval(.008,'#fff4da',s*.087-.005,.022,.192,.6,.9,.5,head);
    oval(.035,'#e5c18c',s*.086,.064,.177,1.02,.45,.30,head);
  }
  oval(.086,cream,0,-.07,.191,1,.66,1.18,head);oval(.038,dark,0,-.05,.271,1,.66,.51,head);
  oval(.026,'#d18b83',0,-.116,.226,.66,1.03,.30,head);
  const collar=cyl(.147,.15,.054,'#923e3b',0,.542,.27,model,18);collar.rotation.x=.14;
  const tag=oval(.044,'#d5b66f',0,.48,.388,1,1,.22);tag.name='zuko-name-tag';
  const name=textLabel(model,'ZUKO',.16,.054,{color:'#4b3529',background:'#d5b66f',fontSize:104});name.position.set(0,.474,.401);
  const legs=[];
  for(const z of [-.21,.22])for(const s of [-1,1]){
    const leg=group(s*.15,.38,z,model);oval(.075,ginger,0,-.105,0,.85,1.47,.89,leg);oval(.073,cream,0,-.265,.036,.9,.60,1.26,leg);legs.push(leg);
  }
  const tail=group(0,.57,-.30,model);
  const curl=new THREE.Mesh(new THREE.TorusGeometry(.143,.07,8,20,Math.PI*1.72),material(ginger));curl.rotation.y=Math.PI/2;curl.position.y=.065;tail.add(curl);
  oval(.086,cream,0,.142,-.098,.82,.94,1.05,tail);
  const bowl=group(2.85,.02,2.73);bowl.name='zuko-water-bowl';
  cyl(.18,.21,.12,'#667e7b',0,.06,0,bowl,24);cyl(.149,.149,.012,'#91bab9',0,.124,0,bowl,24,{metalness:.25,roughness:.22});
  const bowlLabel=textLabel(bowl,'ZUKO',.22,.068,{fontSize:108});bowlLabel.position.set(0,.065,.199);
  const tennis=ball(.10,'#d3bc59',-1.75,.105,1.31);tennis.name='zuko-ball';
  const seam=new THREE.Mesh(new THREE.TorusGeometry(.099,.005,4,24),material('#f5e5ae'));tennis.add(seam);seam.rotation.x=.8;
  const obstacles=ROOMS.living.obstacles;
  let route=[],activity='idle',description='Taking in the room',timer=1,time=0,phase=0,angle=0,target=null,blocked=0;
  let queue=[],couchRequested=false,jump=null;
  const couchSpot=new THREE.Vector3(1.52,.83,2.58),couchApproach=new THREE.Vector3(1.55,0,1.70);
  function startJump(destination,id){route=[];jump={start:root.position.clone(),end:destination.clone(),elapsed:0,id};activity='jumping';description=id==='couch'?'Joining you on the couch':'Hopping down';}
  function setCouch(value){
    if(couchRequested===value)return;couchRequested=value;
    if(value){if(root.position.y>.05){startJump(couchSpot,'couch');return;}jump=null;target={...couchApproach,id:'couch-approach',label:'Coming to sit with you',duration:0,angle:Math.PI};route=findPath(root.position,couchApproach,obstacles);activity='walking';description=target.label;blocked=0;}
    else if(root.position.y>.05||jump){startJump(couchApproach,'idle');}
    else if(target?.id==='couch-approach'){route=[];target=null;activity='idle';timer=.5;}
  }
  function chooseActivity(){
    if(!queue.length){queue=ZUKO_ACTIVITIES.map((_,i)=>i);for(let i=queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}}
    target=ZUKO_ACTIVITIES[queue.shift()];route=findPath(root.position,target,obstacles);
    activity='walking';description='On a little adventure';blocked=0;
  }
  function pet(kind='pet',player=null){if(jump)return false;route=[];activity=kind;description=kind==='treat'?'Enjoying a little treat':'Happy to see you';timer=3.2;if(player)angle=Math.atan2(player.x-root.position.x,player.z-root.position.z);return true;}
  function update(dt,player,reduced=false){
    time+=dt;let walking=false;
    if(reduced&&couchRequested&&activity!=='pet'&&activity!=='treat'){root.position.copy(couchSpot);route=[];jump=null;activity='couch';angle=Math.PI;description='Keeping you company';}
    if(jump){
      jump.elapsed+=dt;const t=reduced?1:Math.min(1,jump.elapsed/.68),ease=t*t*(3-2*t);
      root.position.lerpVectors(jump.start,jump.end,ease);root.position.y+=(reduced?0:Math.sin(t*Math.PI)*.34);angle=Math.PI;
      if(t===1){root.position.copy(jump.end);activity=jump.id;description=activity==='couch'?'Keeping you company':'Taking in the room';timer=1;jump=null;}
    }else if(activity==='couch'){
      angle=Math.PI;
    }else if(!reduced&&route.length){
      const point=route[0],d=Math.hypot(point.x-root.position.x,point.z-root.position.z);
      if(d<.03){route.shift();if(!route.length){if(target.id==='couch-approach')startJump(couchSpot,'couch');else{activity=target.id;description=target.label;timer=target.duration;angle=target.angle;}}}
      else{
        const speed=.95,step=Math.min(speed*dt,d);
        const next=moveWithCollisions(root.position,(point.x-root.position.x)/d*step,(point.z-root.position.z)/d*step,obstacles);
        const distanceToPlayer=player?Math.hypot(next.x-player.x,next.z-player.z):Infinity;
        if(distanceToPlayer>.49){angle=Math.atan2(next.x-root.position.x,next.z-root.position.z);root.position.x=next.x;root.position.z=next.z;walking=true;blocked=0;}
        else if((blocked+=dt)>2){route=[];activity='idle';description='Waiting for you';timer=1.5;}
      }
    }else if(!reduced||activity==='pet'||activity==='treat'){timer-=dt;if(timer<=0){if(couchRequested){if(root.position.y>.5){activity='couch';description='Keeping you company';}else{target={...couchApproach,id:'couch-approach'};route=findPath(root.position,couchApproach,obstacles);activity='walking';}}else chooseActivity();}}
    const diff=Math.atan2(Math.sin(angle-root.rotation.y),Math.cos(angle-root.rotation.y));root.rotation.y+=diff*Math.min(1,dt*7);
    if(walking)phase+=dt*13;
    for(let i=0;i<legs.length;i++)legs[i].rotation.x=walking?Math.sin(phase+(i===0||i===3?0:Math.PI))*.40:activity==='nap'?.82:activity==='jumping'?.7:activity==='couch'?.35:0;
    model.position.y=activity==='nap'?-.14:walking?Math.abs(Math.sin(phase))*.021:0;
    const sniffing=activity==='sniff'||activity==='drink'||activity==='play';
    head.rotation.x=sniffing?.43+(reduced?0:Math.sin(time*5)*.09):activity==='pet'?-.16:activity==='treat'?.10+(reduced?0:Math.sin(time*9)*.07):0;
    head.rotation.z=(activity==='pet'||activity==='treat')&&!reduced?Math.sin(time*2)*.10:0;
    tail.rotation.z=reduced?0:Math.sin(time*(activity==='pet'||activity==='treat'?17:7))*(activity==='pet'||activity==='treat'?.37:.12);
    const playing=activity==='play'&&!reduced;
    tennis.position.z=1.31+(playing?Math.max(0,Math.sin(time*2.3))*.20:0);tennis.position.y=.105+(playing?Math.max(0,Math.sin(time*4.6))*.035:0);tennis.rotation.x=playing?time*2:0;
  }
  return {root,pet,setCouch,update,get jumping(){return Boolean(jump);},get state(){return {activity,description,position:{x:root.position.x,z:root.position.z},target:target?.id};}};
}
