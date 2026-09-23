import * as THREE from './vendor/three.module.js';

// Preserve the five character pools and lock timings from Personal_Website/intro.js.
export const LETTER_STEPS=[
  {char:'d',mode:'decode',status:'decoding…',pool:'abcdefghjkmnpqstuvwxyz!@#$%&*?0123456789'},
  {char:'h',mode:'hash',status:'hashing…',pool:'0123456789abcdef'},
  {char:'e',mode:'encode',status:'encoding…',pool:'01'},
  {char:'e',mode:'echo',status:'echoing…',pool:'eE3€é'},
  {char:'r',mode:'render',status:'rendering…',pool:'Rr®/|\\_'},
];
export const INTRO_TIMING={morph:2.12,morphDuration:.8,assemble:3.18,assembleDuration:2.05,arrival:5.55,duration:6.9};
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>1-Math.pow(1-clamp(t),3);
export function letterState(time,index){
  time=Math.max(0,time);
  const step=LETTER_STEPS[index],lockAt=.48+index*.21,age=time-lockAt,locked=age>=0;
  const t=clamp(age/.4),back=1+3.2*Math.pow(t-1,3)+2.2*Math.pow(t-1,2);
  return {...step,locked,age,char:locked?step.char:step.pool[(Math.floor(time/.034)*(index*2+7)+index*13)%step.pool.length],scale:locked?1+.6*(1-back):1,opacity:ease((time-index*.05)/.3),rise:locked?0:20*(1-ease((time-index*.05)/.3)),blur:locked?8*(1-ease(age/.4)):0};
}
export function introStatus(time){
  time=Math.max(0,time);
  if(time>=1.32)return 'Dheer Guda';
  const locked=Math.floor((time-.48)/.21);
  return LETTER_STEPS[locked<0?Math.floor(time/.09)%5:locked].status;
}

export function createIntroWordmark(){
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=500;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const font='italic 320px "Instrument Serif", Georgia, serif';
  const cell=320*.62,blue='#57b3dc',bone='#e9eef2';
  function draw(time,settled=false){
    context.clearRect(0,0,1200,500);context.save();context.translate(600,250);
    const pulse=settled?0:Math.sin(Math.PI*clamp((time-1.32)/.72));context.scale(1+.06*pulse,1+.06*pulse);
    for(let i=0;i<5;i++){
      const state=letterState(time,i),{age,locked}=state;
      context.save();context.translate((i-2)*cell,settled?0:state.rise);context.textAlign='center';context.textBaseline='alphabetic';context.font=font;
      if(!settled&&locked&&age<.55){
        context.save();const q=clamp(age/.55);context.scale(1+1.6*ease(q),1+1.6*ease(q));context.globalAlpha=(1-q)*.42;context.fillStyle=blue;context.fillText(state.char,0,100);context.restore();
      }
      if(!settled&&state.mode==='echo'&&locked&&age<.56){
        const echo=Math.sin(Math.PI*clamp(age/.56));context.fillStyle=blue;
        context.globalAlpha=echo*.20;context.shadowBlur=22;context.shadowColor=blue;context.fillText('e',-30,100);context.globalAlpha=echo*.40;context.fillText('e',-15,100);context.shadowBlur=0;
      }
      context.save();const scale=settled?1:state.scale;context.scale(scale,scale);context.globalAlpha=settled?1:state.opacity*(locked?1:.45);
      context.filter=!settled&&state.blur>.05?`blur(${state.blur}px)`:'none';
      context.fillStyle=!settled&&((state.mode==='decode'&&locked&&age<.25)||pulse>.5)?blue:bone;
      context.fillText(settled?LETTER_STEPS[i].char:state.char,0,100);context.restore();
      if(!settled&&locked&&age<.6){
        context.globalAlpha=Math.sin(Math.PI*clamp(age/.6));context.fillStyle=blue;context.font='18px ui-monospace, monospace';
        if(state.mode==='hash')context.fillText('7f3a9c2b',0,155);
        if(state.mode==='encode')context.fillText('01100101',0,-160);
        if(state.mode==='render')context.fillRect(-75,117,150*ease(age/.3),3);
      }
      context.restore();
    }
    context.restore();
  }
  // Use the exact same font, letter spacing, baseline and canvas bounds for
  // the mesh targets. There is no jump or re-layout when type becomes objects.
  draw(2.12,true);
  const pixels=context.getImageData(0,0,1200,500).data,points=[];
  for(let y=0;y<500;y+=3)for(let x=0;x<1200;x+=3)if(pixels[(y*1200+x)*4+3]>150)points.push({x:x/1200-.5,y:.5-y/500});
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  draw(0);let last=-1;
  return {texture,layout:{aspect:1200/500,points},update(time){
    const frame=Math.floor(Math.min(time,INTRO_TIMING.morph)*60);if(frame===last)return;
    last=frame;draw(Math.min(time,INTRO_TIMING.morph),time>=INTRO_TIMING.morph);texture.needsUpdate=true;
  },dispose(){texture.dispose();}};
}
