import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';

export function createPlush(type,parent){
  const {group,ball,cyl,box}=createPrimitives(parent),p=group(0,0,0);p.name='plush-'+type;
  const black='#29252b';
  function oval(r,color,x,y,z,sx=1,sy=1,sz=1){const m=ball(r,color,x,y,z,p,28);m.scale.set(sx,sy,sz);return m;}
  function face(y,z,gap=.055){for(const s of [-1,1]){oval(.027,black,s*gap,y,z,.8,1.1,.45);oval(.008,'#fff4e4',s*gap-.004,y+.01,z+.010,.65,.8,.45);}oval(.017,'#85525c',0,y-.055,z+.005,1,.58,.45);}
  if(type==='yellow'){
    oval(.165,'#efbb32',0,.19,0,1,1.06,.84);oval(.16,'#f2c63d',0,.385,.015,1.06,.86,.88);
    for(const s of [-1,1]){
      oval(.071,'#eab131',s*.11,.067,.065,1,.49,1.3);oval(.062,'#e9b330',s*.16,.20,.018,.58,1.1,.78);
      const ear=oval(.06,'#efc33c',s*.097,.562,0,.63,2,.5);ear.rotation.z=-s*.26;
      const tip=oval(.040,black,s*.12,.655,0,.67,.8,.65);tip.rotation.z=-s*.26;
      oval(.033,'#dd6b46',s*.125,.342,.11,1,.80,.3);
    }
    face(.401,.151,.057);oval(.017,black,0,.363,.166,.65,.45,.45);
    // Angular lightning tail and brown bands, visible around the side.
    const tail=group(.15,.24,-.105,p);for(const [x,y,w,h] of [[0,0,.11,.055],[.035,.075,.075,.15],[.085,.14,.13,.07]]){const seg=box(w,h,.035,'#e1a82b',x,y,0,tail);seg.rotation.z=-.3;}
    for(const y of [.17,.25])box(.14,.029,.018,'#a47638',0,y,-.13,p);
  }else if(type==='pink'){
    // Kirby: one round body, little arms, red feet, bright oval eyes.
    oval(.20,'#ec99b3',0,.245,0,1.07,1,.88);
    for(const s of [-1,1]){oval(.086,'#ed9ab7',s*.195,.235,.015,.85,.70,.75);oval(.090,'#c95578',s*.118,.069,.085,1.2,.49,1.13);oval(.022,'#55869a',s*.054,.29,.169,.67,1.7,.36);oval(.016,black,s*.054,.309,.176,.72,1.2,.4);oval(.008,'#ffffff',s*.054,.322,.181,.8,1,.5);oval(.035,'#dd718f',s*.13,.244,.146,1,.43,.35);}
    oval(.026,'#973d59',0,.22,.179,.7,.9,.35);
  }else if(type==='panda'){
    oval(.17,'#eee6d8',0,.177,0,1.13,.87,.95);oval(.19,'#f4ebda',0,.382,.015,1.13,.91,.98);
    for(const s of [-1,1]){oval(.060,black,s*.131,.51,0);oval(.069,black,s*.155,.22,.017,.60,1.1,.7);oval(.071,black,s*.095,.061,.072,1,.6,1.15);const patch=oval(.051,black,s*.069,.4,.145,.91,1.14,.27);patch.rotation.z=-s*.22;oval(.016,'#eee4d8',s*.069,.4,.159,.7,.87,.4);oval(.010,black,s*.070,.40,.165,.7,.8,.4);}
    oval(.053,'#f8edde',0,.345,.154,1,.6,.36);oval(.021,black,0,.357,.174,.9,.63,.5);
   }else if(type==='blue'){
    // Wide pink-lined ears, broad muzzle, and short seated limbs from the lower shelf.
    oval(.16,'#2b7191',0,.18,0,1.08,1.03,.86);oval(.118,'#90baca',0,.19,.12,.87,1.03,.33);
    oval(.18,'#377fa0',0,.38,.015,1.25,.83,.96);
    for(const s of [-1,1]){
      const ear=group(s*.18,.45,-.014,p);ear.rotation.z=-s*.86;
      const outer=ball(.095,'#3684a3',0,.10,0,ear,28);outer.scale.set(.77,1.88,.32);
      const inner=ball(.074,'#bf91ac',0,.115,.022,ear,24);inner.scale.set(.78,1.91,.18);
      oval(.047,'#173349',s*.089,.395,.165,.76,1.15,.34);oval(.01,'#e2f1eb',s*.09,.414,.18,.8,1,.4);
      oval(.083,'#276885',s*.12,.05,.10,1.15,.53,1.18);oval(.068,'#367e9c',s*.165,.20,.05,.60,1.1,.65);
    }
    oval(.07,'#22506f',0,.349,.191,1.1,.65,.65);oval(.067,'#76a5bb',0,.293,.157,1.15,.31,.53);
  }else if(type==='mini'){
    oval(.14,'#f6dfd9',0,.15,0,1.1,.90,.88);
    for(const s of [-1,1]){oval(.058,'#e19baa',s*.105,.258,-.012,.78,1,.60);oval(.043,'#e49aac',s*.113,.06,.052,1,.57,1);oval(.026,black,s*.05,.173,.116,.7,1.12,.43);oval(.029,'#e699a9',s*.094,.125,.102,1,.51,.3);}
    oval(.017,'#a96b7a',0,.12,.13,.9,.44,.40);
  }else if(type==='straw-hat'){
    oval(.15,'#ab5444',0,.18,0,.9,1,.81);oval(.167,'#e1b387',0,.38,.01,1,.92,.85);
    for(const s of [-1,1]){oval(.065,'#3e3432',s*.13,.4,-.02,.60,1.1,.85);oval(.065,'#e0b184',s*.13,.2,.01,.6,1.1,.65);oval(.064,'#4d565b',s*.087,.04,.075,1,.58,1.2);}
    face(.392,.153,.054);
    cyl(.239,.239,.036,'#d3a46a',0,.526,0,p,32);cyl(.141,.167,.106,'#d9b478',0,.589,0,p,32);cyl(.169,.17,.041,'#b34f3f',0,.552,0,p,32);
  }else if(type==='boba'){

    cyl(.143,.117,.32,'#c89561',0,.208,0,p,24);oval(.15,'#e5bc81',0,.369,0,1,.44,1);cyl(.015,.015,.20,'#836442',.038,.49,.018,p,10);
    face(.278,.139,.055);
    for(let i=0;i<12;i++){const a=(i%4-1.5)*.42;oval(.021,'#49382e',Math.sin(a)*.115,.10+Math.floor(i/4)*.037,Math.cos(a)*.127);}
    for(const s of [-1,1])oval(.05,'#b88256',s*.107,.045,.04,1,.51,1.13);
  }else{
    oval(.166,'#7f984f',0,.20,0,1,1.2,.9);oval(.156,'#8caa5a',0,.40,.015,1.1,.95,1);oval(.128,'#91ad60',0,.369,.13,1.09,.62,.90);
    oval(.114,'#d4d09a',0,.205,.129,.87,1.13,.40);
    for(const s of [-1,1]){oval(.062,'#819748',s*.12,.067,.057,1.1,.7,1.25);oval(.062,'#839c50',s*.16,.244,.02,.6,1.1,.7);oval(.027,black,s*.083,.447,.139,.6,.8,.47);oval(.01,'#475b35',s*.038,.403,.241,.7,.65,.4);}
    const tail=cyl(.018,.073,.25,'#758d48',0,.16,-.20,p,10);tail.rotation.x=-.7;
    for(let i=0;i<3;i++)oval(.04,'#c7b068',0,.49-i*.085,-.09-i*.01,.65,.8,1);
  }
  return p;
}
