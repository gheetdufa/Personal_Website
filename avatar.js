import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
import {textLabel} from './labels.js';

export function createAvatar(parent){
  const {group,box,ball,cyl}=createPrimitives(parent),root=group(0,0,0);root.name='dheer-avatar';
  const skin='#9b6243',hair='#211b1b',hoodie='#303238',sweats='#a3a7ad';
  function oval(r,color,x,y,z,sx,sy,sz,p=root){const m=ball(r,color,x,y,z,p);m.scale.set(sx,sy,sz);return m;}
  box(.42,.36,.29,hoodie,0,.73,0,root);oval(.22,hoodie,0,.69,0,1,1,.71);
  box(.41,.075,.31,'#25282d',0,.52,0,root);
  // Hood, cuffs, pouch and drawstrings give the outfit a sweatshirt silhouette.
  oval(.18,'#25282c',0,.91,-.07,1.09,.55,.78);
  box(.26,.09,.016,'#3d4047',0,.62,.155,root);
  for(const side of [-1,1]){cyl(.008,.008,.10,'#e4dfd5',side*.065,.88,.164,root,6);ball(.01,'#bbb6b2',side*.065,.83,.164,root,6);}
  const shell=textLabel(root,'STARTUP\nSHELL',.30,.14,{fontSize:90});shell.position.set(0,.755,.163);
  cyl(.075,.079,.085,skin,0,.975,0,root,12);
  oval(.213,skin,0,1.145,0,.90,1,.91);
  for(const side of [-1,1]){
    oval(.045,skin,side*.183,1.14,0,.6,.95,.65);
    oval(.022,'#201b1b',side*.068,1.16,.176,.80,.94,.43);
    const brow=box(.060,.015,.013,hair,side*.065,1.20,.175,root);brow.rotation.z=side*.10;
  }
  oval(.032,'#b17a54',0,1.104,.187,.8,.75,.85);
  box(.065,.012,.01,'#5f3b32',0,1.065,.172,root);
  oval(.214,hair,0,1.245,-.025,.98,.66,.91);
  // Overlapping, swept locks keep the hair wavy instead of a flat cap.
  for(let i=0;i<11;i++){
    const a=i*2.399,r=.08+(i%3)*.025;
    const lock=oval(.074,i%3?'#292120':'#382a26',Math.sin(a)*r,1.31+(i%2)*.018,Math.cos(a)*r,.93,.56,1.20);
    lock.rotation.set(.1,a,-.20);
  }
  for(let i=0;i<4;i++){const lock=oval(.063,hair,-.125+i*.075,1.268-i*.007,.124,.91,.54,1.01);lock.rotation.z=-.35;}
  const arms=[],legs=[],shins=[];
  for(const side of [-1,1]){
    const arm=group(side*.245,.89,0,root);oval(.09,hoodie,0,-.13,0,.89,1.85,.90,arm);box(.13,.045,.14,'#25282d',0,-.27,0,arm);ball(.066,skin,0,-.33,0,arm,12);arm.rotation.z=side*.09;arms.push(arm);
    const leg=group(side*.109,.50,0,root);leg.name=side<0?'left-thigh':'right-thigh';
    oval(.103,sweats,0,-.105,0,.97,1.35,1.06,leg);
    const shin=group(0,-.225,0,leg);shin.name=side<0?'left-shin':'right-shin';
    oval(.099,sweats,0,-.09,0,.96,1.20,1.04,shin);
    box(.159,.035,.19,'#90959b',0,-.192,0,shin);
    box(.18,.085,.28,'#e7e2d8',0,-.245,.038,shin);box(.184,.02,.287,'#817b74',0,-.29,.038,shin);
    if(side<0){
      const logo=new THREE.Group();logo.name='taco-bell-leg-logo';logo.position.set(0,-.07,.108);shin.add(logo);
      const badge=box(.12,.115,.008,'#6f3ca0',0,.025,0,logo);badge.rotation.z=-.10;
      const bell=new THREE.Shape();bell.moveTo(-.040,-.010);bell.quadraticCurveTo(-.028,.006,-.026,.029);bell.quadraticCurveTo(-.020,.060,0,.060);bell.quadraticCurveTo(.024,.057,.027,.030);bell.quadraticCurveTo(.028,.011,.042,-.003);bell.closePath();
      const emblem=new THREE.Mesh(new THREE.ShapeGeometry(bell),new THREE.MeshBasicMaterial({color:'#f4eefb',toneMapped:false}));emblem.position.z=.006;emblem.rotation.z=-.18;logo.add(emblem);
      const clapper=ball(.013,'#f4eefb',.007,-.016,.008,logo,12);clapper.scale.z=.25;
      const label=textLabel(logo,'TACO BELL',.135,.027,{fontSize:63,color:'#4a295f'});label.position.set(0,-.048,.01);
    }
    legs.push(leg);shins.push(shin);
  }
  const torso=group(0,.50,0,root);torso.name='avatar-torso';
  for(const child of [...root.children])if(child!==torso&&!legs.includes(child)){child.position.y-=.50;torso.add(child);}
  const treat=group(0,-.345,.025,arms[1]);treat.name='dog-treat-in-hand';treat.visible=false;
  box(.09,.026,.035,'#c9975b',0,0,0,treat);
  for(const x of [-.05,.05])for(const z of [-.017,.017])ball(.022,'#dab17a',x,0,z,treat,12);
  const exerciseArms=group(0,0,0,root);exerciseArms.name='pull-up-arms';exerciseArms.visible=false;
  const exerciseLimbs=[-1,1].map(side=>({side,upper:cyl(.077,.074,1,hoodie,0,0,0,exerciseArms,12),forearm:cyl(.058,.058,1,skin,0,0,0,exerciseArms,12),hand:ball(.062,skin,0,0,0,exerciseArms,12)}));
  const up=new THREE.Vector3(0,1,0);
  function segment(mesh,a,b){const direction=new THREE.Vector3().subVectors(b,a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(up,direction.normalize());}
  let phase=0;
  return {root,legs,shins,update(dt,walking,angle,reduced,seated,interaction=null){
    const seat=typeof seated==='number'?THREE.MathUtils.clamp(seated,0,1):(seated?1:0);
    const target=interaction?interaction.angle:seat>0?Math.PI:angle;
    if(reduced)root.rotation.y=target;
    else root.rotation.y+=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y))*(interaction?.kind==='bed'?1-Math.exp(-dt*5):Math.min(1,dt*13));
    if(walking)phase+=dt*11;
    const swing=walking&&!reduced?Math.sin(phase)*.5:0;
    for(let i=0;i<2;i++){arms[i].rotation.x=THREE.MathUtils.lerp(i===0?swing:-swing,-.68,seat);legs[i].rotation.x=THREE.MathUtils.lerp(i===0?-swing:swing,-Math.PI/2,seat);shins[i].rotation.x=seat*Math.PI/2;}
    const bend=interaction?.amount||0;
    arms[0].rotation.z=-.09;arms[1].rotation.z=THREE.MathUtils.lerp(.09,-.55,bend);
    torso.rotation.x=bend*(seat>.5?.28:.69);torso.rotation.z=0;
    if(bend>0){
      const stroke=!reduced&&interaction.kind==='pet'?Math.sin(interaction.elapsed*9)*.12:0;
      arms[1].rotation.x=THREE.MathUtils.lerp(arms[1].rotation.x,-1.30+stroke,bend);
      arms[0].rotation.x=THREE.MathUtils.lerp(arms[0].rotation.x,-.35,bend);
      if(seat<.5)for(let i=0;i<2;i++){legs[i].rotation.x=-.70*bend;shins[i].rotation.x=1.40*bend;}
    }
    if(interaction?.kind==='bed'){
      const {crouch,flight,landing,pull}=interaction.pose,air=Math.sin(flight*Math.PI);
      for(let i=0;i<2;i++){
        legs[i].rotation.x=THREE.MathUtils.lerp(-.65*crouch,-Math.PI/2,seat);
        shins[i].rotation.x=THREE.MathUtils.lerp(1.30*crouch,-.18,seat);
        arms[i].rotation.x=THREE.MathUtils.lerp(.28*crouch-.60*seat-.22*air,-1.10,pull);
        arms[i].rotation.z=(i===0?-1:1)*THREE.MathUtils.lerp(.09,.27,pull);
      }
      torso.rotation.x=.16*crouch-.08*air+.12*landing+.10*pull;
    }
    exerciseArms.visible=interaction?.kind==='pullup';
    for(const arm of arms)arm.visible=!exerciseArms.visible;
    if(exerciseArms.visible){
      const {reach,pull,barY,barZ}=interaction.pose;
      for(const limb of exerciseLimbs){
        const side=limb.side,shoulder=new THREE.Vector3(side*.245,.89,0),restHand=new THREE.Vector3(side*.275,.56,0),grip=new THREE.Vector3(side*.42,barY,barZ);
        const hand=restHand.clone().lerp(grip,reach),elbow=shoulder.clone().lerp(hand,.5);elbow.x+=side*(.05+.16*pull)*reach;elbow.z-=.055*reach;
        segment(limb.upper,shoulder,elbow);segment(limb.forearm,elbow,hand);limb.hand.position.copy(hand);
      }
      for(let i=0;i<2;i++){legs[i].rotation.x=.12*reach;shins[i].rotation.x=-.42*reach;}
    }
    if(interaction?.kind==='desk'){
      const typing=!reduced&&interaction.elapsed>0?Math.sin(interaction.elapsed*25)*.08:0;
      arms[0].rotation.x=-1.72+typing;arms[1].rotation.x=-1.65-typing;
      arms[0].rotation.z=-.28;arms[1].rotation.z=.20;
    }
    treat.visible=Boolean(interaction?.kind==='treat'&&interaction.elapsed<1.65);
    root.position.y=walking&&!reduced?Math.abs(Math.sin(phase))*.029:(seat<.5?-.11*bend:0);
  }};
}
