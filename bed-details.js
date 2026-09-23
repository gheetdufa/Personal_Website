import * as THREE from './vendor/three.module.js';
export function momTestCover(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;const c=canvas.getContext('2d');
  c.fillStyle='#c94051';c.fillRect(0,0,512,768);c.fillStyle='#fff9e9';c.textAlign='center';
  for(const [word,y,size] of [['THE',155,100],['MOM',320,142],['TEST',478,132]]){c.font=`900 ${size}px sans-serif`;c.fillText(word,256,y);}
  c.fillRect(75,535,362,8);c.font='600 34px sans-serif';c.fillText('ROB FITZPATRICK',256,665);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}
export function createPlushBounce(plushies){
  const rest=plushies.map(mesh=>({mesh,position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone()}));let elapsed=3;
  function restore(){for(const p of rest){p.mesh.position.copy(p.position);p.mesh.rotation.copy(p.rotation);p.mesh.scale.copy(p.scale);}}
  return {trigger(){elapsed=0;},update(dt,reduced=false){elapsed+=dt;if(reduced||elapsed>2){restore();return;}
    rest.forEach((p,i)=>{const t=Math.max(0,elapsed-i*.025),decay=Math.exp(-t*2.8),hop=Math.abs(Math.sin(t*11));
      p.mesh.position.copy(p.position);p.mesh.position.y+=hop*decay*(i===0?.13:.22);
      p.mesh.rotation.copy(p.rotation);p.mesh.rotation.z+=Math.sin(t*9+i*.7)*decay*.065;
      const squash=Math.cos(t*22)*decay*.035;p.mesh.scale.copy(p.scale).multiply(new THREE.Vector3(1+squash,1-squash,1+squash));
    });},reset(){elapsed=3;restore();},get active(){return elapsed<2;}};
}
