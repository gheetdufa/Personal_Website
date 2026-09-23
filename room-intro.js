import * as THREE from './vendor/three.module.js';
import {createIntroWordmark,introStatus,INTRO_TIMING} from './intro-wordmark.js';

export const INTRO_DURATION=INTRO_TIMING.duration;
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};

export function createRoomIntro({scene,room,player,ground,camera}){
  let active=false,elapsed=0,pieces=[],formation=null,saved=null,wordmark=null,wordPlane=null;
  const bootColor=new THREE.Color('#060b10');
  const swarm=new THREE.Group();swarm.name='dheer-room-intro';
  const right=new THREE.Vector3(),up=new THREE.Vector3(),toward=new THREE.Vector3(),center=new THREE.Vector3();
  const size=new THREE.Vector3();
  function finish(){
    if(!active)return;
    room.visible=saved.room;player.visible=saved.player;ground.visible=saved.ground;
    player.position.copy(saved.playerPosition);player.scale.copy(saved.playerScale);
    if(saved.background&&scene.background?.isColor)scene.background.copy(saved.background);
    if(wordPlane){scene.remove(wordPlane);wordPlane.geometry.dispose();wordPlane.material.dispose();wordPlane=null;}
    wordmark?.dispose();wordmark=null;
    scene.remove(swarm);swarm.clear();pieces=[];active=false;elapsed=INTRO_DURATION;
    // Geometry and materials belong to the room. Never dispose shared assets.
  }
  function start(layout,opening=null){
    if(active||!layout.points.length)return false;
    formation=layout;elapsed=0;pieces=[];swarm.visible=true;
    saved={room:room.visible,player:player.visible,playerPosition:player.position.clone(),playerScale:player.scale.clone(),ground:ground.visible,background:scene.background?.isColor?scene.background.clone():null};
    wordmark=opening;
    if(wordmark){
      wordPlane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:wordmark.texture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));
      wordPlane.name='dheer-boot-wordmark';wordPlane.renderOrder=100;scene.add(wordPlane);
    }
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    room.traverseVisible(object=>{
      if(!object.isMesh)return;
      object.geometry.computeBoundingBox();const bounds=object.geometry.boundingBox;
      if(!bounds||bounds.isEmpty())return;
      const localCenter=bounds.getCenter(new THREE.Vector3());
      const mesh=new THREE.Mesh(object.geometry,object.material);
      mesh.position.copy(localCenter).negate();mesh.renderOrder=object.renderOrder;
      const pivot=new THREE.Group();pivot.add(mesh);swarm.add(pivot);
      const endPosition=localCenter.clone().applyMatrix4(object.matrixWorld),endRotation=new THREE.Quaternion(),endScale=new THREE.Vector3();
      object.matrixWorld.decompose(new THREE.Vector3(),endRotation,endScale);
      bounds.getSize(size);
      pieces.push({pivot,endPosition,endRotation,endScale,extent:Math.max(size.x*endScale.x,size.y*endScale.y,size.z*endScale.z,.001)});
    });
    // Deterministic shuffle spreads walls, books, plush parts and artwork evenly
    // through all five letters instead of clustering objects in source order.
    let seed=965;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const ordered=[...formation.points];
    for(let i=ordered.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];}
    pieces.forEach((p,i)=>{
      p.point=ordered[i%ordered.length];p.depth=(random()-.5)*.15;
      p.delay=random()*.30;p.arc=(random()-.5)*.7;
      p.spin=new THREE.Quaternion().setFromEuler(new THREE.Euler((random()-.5)*.7,(random()-.5)*1.4,(random()-.5)*.6));
    });
    room.visible=false;player.visible=false;ground.visible=false;
    scene.add(swarm);active=true;update(0);return true;
  }
  function update(dt,reduced=false){
    if(!active)return;
    elapsed+=Math.max(0,dt);if(reduced||elapsed>=INTRO_DURATION){finish();return;}
    if(elapsed>=INTRO_TIMING.arrival){
      // Reveal the completed room dimly, bring up its lamps, then land the visitor.
      room.visible=saved.room;ground.visible=saved.ground;swarm.visible=false;
      if(wordPlane)wordPlane.visible=false;
      const time=elapsed-INTRO_TIMING.arrival-.18,drop=THREE.MathUtils.clamp(time/.46,0,1);
      player.visible=saved.player&&time>=0;
      player.position.copy(saved.playerPosition);player.position.y+=.68*(1-drop*drop);
      const grow=smooth(time/.16),settle=THREE.MathUtils.clamp((time-.46)/.40,0,1),squash=Math.sin(settle*Math.PI)*.13;
      player.scale.copy(saved.playerScale).multiply(new THREE.Vector3(grow*(1+squash*.5),grow*(1-squash),grow*(1+squash*.5)));
      return;
    }
    camera.updateMatrixWorld(true);
    right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);toward.setFromMatrixColumn(camera.matrixWorld,2);
    // Unprojection includes current viewport offsets and stays centered on resize.
    center.set(0,.03,0).unproject(camera);
    const width=Math.min((camera.right-camera.left)*.82,(camera.top-camera.bottom)*.54*formation.aspect);
    const height=width/formation.aspect,diameter=width*.018;
    const morph=smooth((elapsed-INTRO_TIMING.morph)/INTRO_TIMING.morphDuration);
    if(wordPlane){
      wordmark.update(elapsed);wordPlane.position.copy(center).addScaledVector(toward,1);wordPlane.quaternion.copy(camera.quaternion);wordPlane.scale.set(width,height,1);wordPlane.material.opacity=1-morph;wordPlane.visible=morph<1;
    }
    if(saved.background&&scene.background?.isColor)scene.background.copy(bootColor).lerp(saved.background,morph);
    for(const p of pieces){
      const t=smooth((elapsed-INTRO_TIMING.assemble-p.delay)/INTRO_TIMING.assembleDuration);
      const materialize=smooth((elapsed-INTRO_TIMING.morph-p.delay*.30)/(INTRO_TIMING.morphDuration-.09));
      p.pivot.visible=materialize>0;
      p.pivot.position.copy(center).addScaledVector(right,p.point.x*width).addScaledVector(up,p.point.y*height).addScaledVector(toward,p.depth);
      p.pivot.position.lerp(p.endPosition,t).addScaledVector(up,Math.sin(t*Math.PI)*p.arc);
      p.pivot.quaternion.copy(camera.quaternion).multiply(p.spin).slerp(p.endRotation,t);
      p.pivot.scale.copy(p.endScale).multiplyScalar(diameter/p.extent*materialize).lerp(p.endScale,t);
    }
  }
  return {start,update,finish,get busy(){return active;},get elapsed(){return elapsed;},get progress(){return elapsed/INTRO_DURATION;},get pieceCount(){return pieces.length;},get lightLevel(){
    if(!active)return 1;
    if(elapsed<INTRO_TIMING.arrival)return 1-.77*smooth((elapsed-INTRO_TIMING.assemble)/INTRO_TIMING.assembleDuration);
    return .23+.77*smooth((elapsed-INTRO_TIMING.arrival)/1.12);
  }};
}

export function installIntroUI(world,{reduced=false,onEnter=()=>{},onExit=()=>{}}={}){
  const overlay=document.querySelector('#room-intro'),skip=document.querySelector('#skip-intro');
  let pending=false,entered=false,token=0;
  function finish(){
    token++;pending=false;world.intro.finish();overlay.hidden=true;
    document.body.classList.remove('intro-playing','intro-loading');
    if(entered){entered=false;onExit();}
  }
  async function play(){
    if(pending||world.intro.busy)return;
    if(reduced){finish();return;}
    const attempt=++token;pending=true;entered=true;onEnter();
    document.body.classList.add('intro-playing');overlay.hidden=false;skip.focus({preventScroll:true});
    try{
      // Fonts never hold the room hostage if a request fails.
      await Promise.race([document.fonts.load('italic 360px "Instrument Serif"'),new Promise(resolve=>setTimeout(resolve,900))]);
      if(attempt!==token)return;
      const wordmark=createIntroWordmark();pending=false;
      document.body.classList.remove('intro-loading');
      if(!world.intro.start(wordmark.layout,wordmark)){wordmark.dispose();finish();}
    }catch{finish();}
  }
  skip.addEventListener('click',finish);
  window.addEventListener('keydown',event=>{if((pending||world.intro.busy)&&event.key==='Escape'){event.preventDefault();finish();}});
  return {play,finish,get busy(){return pending||world.intro.busy;},update(){
    if(world.intro.busy){
      overlay.style.setProperty('--intro-label-opacity',String(1-smooth((world.intro.elapsed-INTRO_TIMING.assemble)/.45)));
      const label=overlay.querySelector('.intro-signature');if(label)label.textContent=introStatus(world.intro.elapsed);
    }
    else if(entered&&!pending)finish();
  }};
}
