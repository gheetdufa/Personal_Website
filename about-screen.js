import {ABOUT} from './about-content.js';
import {createScreenCanvas,hitButton} from './screen-canvas.js';
const names={'Uptime':'Education','Host':'Based in','Kernel':'What I do','Currently':'Building now','Focus':'What matters','Experience':'Experience','Hobbies.Software':'In my spare time','Hobbies.Hardware':'Hands-on interests','Languages.Programming':'Programming','Languages.Computer':'Web & data','Languages.Real':'Languages','IDE':'Daily tools','OS':'Operating systems','Email.Personal':'Email','LinkedIn':'LinkedIn','GitHub':'GitHub'};
export const CONTACT_FIELDS=ABOUT.fields.map(f=>({...f,label:names[f.label]}));
const pages=[{id:'me',label:'Me',title:'Hey, I’m Dheer.',subtitle:'A little about me',keys:['Kernel','Uptime','Host','Hobbies.Software','Hobbies.Hardware','Languages.Real']},{id:'now',label:'Now',title:'What I’m building.',subtitle:'Work & direction',keys:['Currently','Focus','Experience']},{id:'tools',label:'Toolkit',title:'Inside my toolkit.',subtitle:'What I build with',keys:['Languages.Programming','Languages.Computer','IDE','OS']},{id:'links',label:'Links',title:'Let’s connect.',subtitle:'Find me elsewhere',keys:['Email.Personal','LinkedIn','GitHub']}];
export function createAboutScreen({onLink=()=>{}}={}){
  const s=createScreenCanvas(1200,800);let page=0,offset=0,maxOffset=0,compact=false,buttons=[];
  function button(x,y,w,h,label,action,active=false){s.rect(x,y,w,h,active?'#b8f3ce':'#263d44',20);s.text(label,x+30,y+h*.67,46,active?'#12322e':'#edf5ee','sans-serif');if(action.link){if(y+h>220&&y<670)buttons.push({x,y:Math.max(220,y),w,h:Math.min(670,y+h)-Math.max(220,y),action});}else buttons.push({x,y,w,h,action});}
  function draw(){
    buttons=[];const p=pages[page];s.rect(0,0,1200,800,'#122a31');s.text('dheer’s little world',44,48,30,'#a8c8c2','sans-serif');s.text(String(page+1).padStart(2,'0')+' / 04',998,48,28,'#a8c8c2');
    s.text(p.title,44,132,70,'#f5f2df','sans-serif');s.text(p.subtitle,47,188,36,'#a8c8c2','sans-serif');
    s.ctx.save();s.ctx.beginPath();s.ctx.rect(40,220,1120,450);s.ctx.clip();let y=226-offset;
    for(const key of p.keys){const field=ABOUT.fields.find(f=>f.label===key),size=compact?62:58,line=76;
      s.ctx.font=`${size}px sans-serif`;let lines=1,lineText='';for(const word of field.value.split(/\s+/)){const next=lineText?lineText+' '+word:word;if(lineText&&s.ctx.measureText(next).width>1000){lines++;lineText=word;}else lineText=next;}
      const h=78+lines*line;s.rect(44,y,1080,h,'#eef0e1',20);s.text(names[key],73,y+43,34,'#536b62','sans-serif');s.wrap(field.value,73,y+107,1000,size,line,'#183b36');
      if(field.links.length&&y+h>220&&y<670)buttons.push({x:44,y:Math.max(220,y),w:1080,h:Math.min(670,y+h)-Math.max(220,y),action:{link:field.links[0].href}});
      y+=h+18;
    }
    if(p.id==='links'){button(44,y,1080,88,'dheerguda.com ↗',{link:ABOUT.source});y+=106;}
    maxOffset=Math.max(0,y+offset-656);s.ctx.restore();
    // Fixed bottom dock makes each part of the profile one tap away.
    s.rect(0,689,1200,111,'#122a31');pages.forEach((p,i)=>button(40+i*288,712,264,70,p.label,{page:i},i===page));
    if(maxOffset){s.rect(1150,230,6,426,'#365550',3);s.rect(1150,230+(offset/maxOffset)*362,6,64,'#b8f3ce',3);}s.finish();
  }
  draw();return {texture:s.texture,setCompact(value){if(value!==compact){compact=value;offset=0;draw();}},reset(){page=0;offset=0;draw();},selectPage(index){page=Math.max(0,Math.min(3,index));offset=0;draw();},scroll(delta){offset=Math.max(0,Math.min(maxOffset,offset+delta));draw();},click(hit){const b=hitButton(buttons,hit.u*1200,hit.v*800);if(!b)return;if(b.action.page!==undefined){page=b.action.page;offset=0;draw();}else onLink(b.action.link);},get page(){return pages[page].id;},get scrollOffset(){return offset;}};
}
