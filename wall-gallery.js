import * as THREE from './vendor/three.module.js';

export const GALLERY_LAYER=1;

// The frames keep their real wall positions; viewing one animates that same object.
export function createWallGallery(items,camera,getRoomView){
  let active=false,mode='closed',index=0,amount=0,nearbyGroup=null,time=0;
  const up=new THREE.Vector3(0,1,0),normalPosition=new THREE.Vector3(12,12.5,14),normalTarget=new THREE.Vector3(0,1.45,0);
  const matrix=new THREE.Matrix4(),roomNear=camera.near;
  const normalRotation=new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(normalPosition,normalTarget,up));
  const records=items.map((item,i)=>{
    const shape=new THREE.Shape(),w=item.width+.16,h=item.height+.16,innerW=w-.045,innerH=h-.045;
    shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();
    const hole=new THREE.Path();hole.moveTo(-innerW/2,-innerH/2);hole.lineTo(-innerW/2,innerH/2);hole.lineTo(innerW/2,innerH/2);hole.lineTo(innerW/2,-innerH/2);hole.closePath();shape.holes.push(hole);
    const halo=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:'#ffe3a2',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
    halo.position.z=.065;halo.visible=false;halo.name='artwork-highlight';item.frame.add(halo);
    item.frame.userData.galleryIndex=i;
    const art=item.frame.getObjectByName('reference-art-'+item.key);
    const layers=[];item.frame.traverse(object=>layers.push({object,mask:object.layers.mask}));
    return {...item,layers,overlay:false,restPosition:item.frame.position.clone(),restRotation:item.frame.quaternion.clone(),restScale:item.frame.scale.clone(),halo,lift:0,glow:0,art,restMaterial:art.material,viewMaterial:new THREE.MeshBasicMaterial({map:art.material.map,toneMapped:false})};
  });
  function setOverlay(item,enabled){
    if(item.overlay===enabled)return;item.overlay=enabled;
    for(const {object,mask} of item.layers)object.layers.mask=enabled?1<<GALLERY_LAYER:mask;
  }
  function floatingPosition(item){const normal=new THREE.Vector3(0,0,1).applyQuaternion(item.restRotation);const target=item.restPosition.clone().addScaledVector(normal,3.10);target.y=2.65;return target;}
  function restoreRoomCamera(){const view=getRoomView();camera.near=roomNear;camera.position.copy(normalPosition);camera.quaternion.copy(normalRotation);camera.left=-view.width/2;camera.right=view.width/2;camera.top=view.height/2;camera.bottom=-view.height/2;camera.setViewOffset(view.pixelWidth,view.pixelHeight,view.offsetX,view.offsetY,view.pixelWidth,view.pixelHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();}
  function reset(){
    active=false;mode='closed';amount=0;nearbyGroup=null;
    for(const item of records){setOverlay(item,false);item.lift=0;item.glow=0;item.frame.position.copy(item.restPosition);item.frame.quaternion.copy(item.restRotation);item.frame.scale.copy(item.restScale);item.art.material=item.restMaterial;item.halo.visible=false;item.halo.material.opacity=0;}
    restoreRoomCamera();
  }
  function open(next=0){if(!Number.isInteger(next)||next<0||next>=records.length||mode==='closing')return false;index=next;active=true;mode='opening';nearbyGroup=null;return true;}
  function step(direction){if(!active||!Number.isFinite(direction)||direction===0)return false;const next=THREE.MathUtils.clamp(index+Math.sign(direction),0,records.length-1);if(next===index)return false;index=next;return true;}
  function close(){if(!active)return false;active=false;mode='closing';return true;}
  function update(dt,reduced=false){
    time+=dt;amount=reduced?(active?1:0):THREE.MathUtils.damp(amount,active?1:0,5.6,dt);
    for(let i=0;i<records.length;i++){
      const item=records[i],selected=active&&index===i;
      // Keep the complete selected frame above the room, including during entry and return.
      setOverlay(item,mode!=='closed'&&index===i);
      const liftGoal=selected&&amount>.32?1:0;
      item.lift=reduced?liftGoal:THREE.MathUtils.damp(item.lift,liftGoal,7.5,dt);
      if(item.lift<.001&&!selected)item.lift=0;
      const scale=2.35/Math.max(item.width,item.height);
      item.frame.position.lerpVectors(item.restPosition,floatingPosition(item),item.lift);
      item.frame.scale.copy(item.restScale).multiplyScalar(THREE.MathUtils.lerp(1,scale,item.lift));
      item.art.material=item.lift>.001?item.viewMaterial:item.restMaterial;
      const highlight=mode==='closed'&&nearbyGroup===item.group?1:selected?.22:0;
      item.glow=reduced?highlight:THREE.MathUtils.damp(item.glow,highlight,9,dt);
      item.halo.visible=item.glow>.005;item.halo.material.opacity=item.glow*(reduced?.85:.76+Math.sin(time*3)*.10);
    }
    if(mode!=='closed'){
      const item=records[index],target=floatingPosition(item),normal=new THREE.Vector3(0,0,1).applyQuaternion(item.restRotation);
      const focus=target.clone().addScaledVector(normal,6);focus.y+=.08;
      const focusRotation=new THREE.Quaternion().setFromRotationMatrix(matrix.lookAt(focus,target,up));
      const desiredPosition=normalPosition.clone().lerp(focus,amount),desiredRotation=normalRotation.clone().slerp(focusRotation,amount);
      camera.position.lerp(desiredPosition,reduced?1:1-Math.exp(-9*dt));camera.quaternion.slerp(desiredRotation,reduced?1:1-Math.exp(-9*dt));
      const view=getRoomView(),focusHeight=Math.max(4.4,3.15/view.aspect),height=THREE.MathUtils.lerp(view.height,focusHeight,amount),width=height*view.aspect;
      camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;
      camera.setViewOffset(view.pixelWidth,view.pixelHeight,view.offsetX*(1-amount),view.offsetY*(1-amount),view.pixelWidth,view.pixelHeight);
      camera.updateProjectionMatrix();camera.updateMatrixWorld();
      if(active&&amount>.999&&records[index].lift>.999)mode='open';
      if(!active&&amount<.001&&records.every(item=>item.lift<.001))reset();
    }
  }
  function renderOverlay(renderer,scene){
    if(mode==='closed')return;
    const mask=camera.layers.mask,background=scene.background,autoClear=renderer.autoClear,shadowUpdate=renderer.shadowMap.autoUpdate;
    try{
      // Preserve the room's color while discarding its depth before drawing the active canvas.
      renderer.autoClear=false;renderer.shadowMap.autoUpdate=false;scene.background=null;
      camera.layers.set(GALLERY_LAYER);renderer.clearDepth();renderer.render(scene,camera);
    }finally{
      camera.layers.mask=mask;scene.background=background;renderer.autoClear=autoClear;renderer.shadowMap.autoUpdate=shadowUpdate;
    }
  }
  return {items:records,open,step,close,reset,update,renderOverlay,setNearby(group){nearbyGroup=group;},get busy(){return mode!=='closed';},get isOpen(){return active;},get progress(){return amount;},get state(){return {mode,index,count:records.length,title:'Canvas '+String(index+1).padStart(2,'0'),key:records[index]?.key,group:records[index]?.group};}};
}

// One deliberate step per wheel gesture interval, including high-resolution trackpads.
export function createGalleryWheel(){
  let total=0,lastStep=-Infinity,lastEvent=-Infinity,direction=0;
  return {reset(){total=0;lastStep=-Infinity;lastEvent=-Infinity;direction=0;},consume(delta,now){
    if(!Number.isFinite(delta)||!Number.isFinite(now)||delta===0)return 0;
    const nextDirection=Math.sign(delta);
    if(now-lastEvent>180||nextDirection!==direction)total=0;
    lastEvent=now;direction=nextDirection;
    if(now-lastStep<440){total=0;return 0;}
    total+=delta;if(Math.abs(total)<45)return 0;
    total=0;lastStep=now;return nextDirection;
  }};
}
