import * as THREE from './vendor/three.module.js';
import {createPrimitives} from './primitives.js';
import {createScreenCanvas} from './screen-canvas.js';
import {READING_LIST} from './reading-list.js';

const W=.48,H=.61,D=.075;
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};

function pageTexture(book,kind){
  const s=createScreenCanvas(768,1024),{ctx,rect,text,wrap}=s;
  rect(0,0,768,1024,kind==='cover'?book.color:'#f5eedc');
  const ink=kind==='cover'?'#fff6e1':'#292e31',muted=kind==='cover'?'#f1e4c7':'#656758';
  rect(0,0,22,1024,kind==='cover'?'#00000024':'#d7ceba');
  if(kind==='cover'){
    text(book.category.toUpperCase(),58,88,30,muted,'sans-serif');
    rect(58,136,652,5,muted);
    ctx.font='110px sans-serif';
    const longest=Math.max(...book.spine.split(' ').map(word=>ctx.measureText(word).width));
    const size=Math.min(110,110*640/longest);
    const end=wrap(book.spine,58,300,640,size,size*1.2,ink);
    rect(58,Math.max(630,end+30),102,8,muted);
    wrap(book.author,58,820,644,38,50,muted);
    text(book.year,58,965,36,muted,'sans-serif');
  }else if(kind==='title'){
    text(book.category.toUpperCase(),58,90,32,muted,'sans-serif');
    rect(58,131,644,4,book.color);
    const end=wrap(book.title,58,235,642,61,77,ink);
    wrap(book.author,58,Math.max(690,end+55),642,48,62,muted);
    text(book.year,58,961,44,muted,'sans-serif');
  }else{
    text('THE IDEA',58,99,38,muted,'sans-serif');
    rect(58,140,105,6,book.color);
    wrap(book.description,58,260,642,69,92,ink);
    text('HAND-PICKED BY ME',58,961,30,muted,'sans-serif');
  }
  s.finish();return s.texture;
}

// Each paper is a real, individually bound book, with a hinged front cover.
export function createReadingBooks(bookcase){
  const {box,group}=createPrimitives(bookcase);
  const positions=[[-.49,2.765],[.22,2.765],[-.59,2.035],[0,2.035],[.59,2.035],[-.43,1.295],[.30,1.295]];
  return READING_LIST.map((book,index)=>{
    const [x,y]=positions[index],root=group(x,y,.22);root.name='reading-book-'+index;root.userData.bookIndex=index;
    box(W,H,.014,book.color,0,0,-D/2,root);
    box(W-.016,H-.021,D,'#e4dbc6',0,0,0,root);
    box(.016,H,D+.014,book.color,-W/2,0,0,root);
    for(const line of [-.019,0,.019])box(W-.02,.002,.001,'#c3b59a',0,-H/2+.007,D/2+line,root).rotation.x=Math.PI/2;
    function surface(texture,x,z,parent,back=false){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(W-.018,H-.020),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));mesh.position.set(x,0,z);if(back)mesh.rotation.y=Math.PI;parent.add(mesh);return mesh;}
    const right=surface(pageTexture(book,'summary'),0,D/2+.001,root);
    const hinge=group(-W/2,0,D/2+.013,root);
    box(W,H,.012,book.color,W/2,0,0,hinge);
    const cover=surface(pageTexture(book,'cover'),W/2,.0065,hinge);
    const left=surface(pageTexture(book,'title'),W/2,-.0065,hinge,true);
    return {root,hinge,cover,left,right,book,rest:root.position.clone()};
  });
}

export function createBookshelfExperience({books,player,camera,getRoomView}){
  let mode='closed',elapsed=0,snapshot=null,current=null,desired=null,bookTime=0,hovered=null;
  const duration=1.05,bookDuration=1.25;
  function restoreCamera(){
    if(!snapshot)return;
    camera.position.copy(snapshot.position);camera.quaternion.copy(snapshot.rotation);player.visible=snapshot.playerVisible;
    const v=getRoomView();camera.left=-v.width/2;camera.right=v.width/2;camera.top=v.height/2;camera.bottom=-v.height/2;
    camera.setViewOffset(v.pixelWidth,v.pixelHeight,v.offsetX,v.offsetY,v.pixelWidth,v.pixelHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function restoreBooks(){for(const item of books){item.root.position.copy(item.rest);item.root.scale.setScalar(1);item.hinge.rotation.y=0;}}
  function open(){if(mode!=='closed')return false;snapshot={position:camera.position.clone(),rotation:camera.quaternion.clone(),playerVisible:player.visible};mode='entering';elapsed=0;current=desired=null;bookTime=0;hovered=null;return true;}
  function select(index){if(mode!=='open'||(index!==null&&(!Number.isInteger(index)||!books[index])))return false;desired=index;hovered=null;return true;}
  function close(){if(mode==='closed'||mode==='closing')return false;mode='closing';desired=null;hovered=null;return true;}
  function reset(){if(mode!=='closed')restoreCamera();restoreBooks();mode='closed';elapsed=bookTime=0;current=desired=hovered=null;}
  function update(dt,reduced=false){
    if(mode==='closed')return;
    if(mode==='entering')elapsed=reduced?duration:Math.min(duration,elapsed+dt);
    if(mode==='closing'&&current===null)elapsed=reduced?0:Math.max(0,elapsed-dt);
    if(current!==desired){bookTime=reduced?0:Math.max(0,bookTime-dt*1.8);if(bookTime===0)current=desired;}
    if(current!==null&&current===desired)bookTime=reduced?bookDuration:Math.min(bookDuration,bookTime+dt);
    const lift=smooth(bookTime/.68),unfold=smooth((bookTime-.68)/.57);
    for(const [index,item] of books.entries()){
      if(index===current){
        // Pull clear of the shelf before swinging the cover toward the viewer.
        const target=item.root.parent.worldToLocal(new THREE.Vector3(-2.67+W*.8,2.40,-2.55));
        item.root.position.lerpVectors(item.rest,target,lift);item.root.scale.setScalar(1+lift*.6);item.hinge.rotation.y=-Math.PI*unfold;
      }else{
        const z=item.rest.z+(hovered===index&&current===null?.045:0);
        item.root.position.x=item.rest.x;item.root.position.y=item.rest.y;item.root.position.z=reduced?z:THREE.MathUtils.damp(item.root.position.z,z,14,dt);item.root.scale.setScalar(1);item.hinge.rotation.y=0;
      }
    }
    const v=getRoomView(),zoom=smooth(elapsed/duration);
    // At the shelf this becomes a first-person view; restore the visitor on exit.
    player.visible=zoom<.75&&snapshot.playerVisible;
    const focus=new THREE.Vector3(-2.67,THREE.MathUtils.lerp(1.91,2.4,lift),THREE.MathUtils.lerp(-2.63,-1.60,lift));
    const available=Math.max(.3,1-180/v.pixelHeight);
    const shelfHeight=Math.max(3.8,2.40/v.aspect,2.45/available),bookHeight=Math.max(1.48,1.76/v.aspect,1.08/available);
    const height=THREE.MathUtils.lerp(v.height,THREE.MathUtils.lerp(shelfHeight,bookHeight,lift),zoom),width=height*v.aspect;
    camera.position.lerpVectors(snapshot.position,focus,zoom);camera.quaternion.copy(snapshot.rotation).slerp(new THREE.Quaternion(),zoom);
    camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;
    camera.setViewOffset(v.pixelWidth,v.pixelHeight,v.offsetX*(1-zoom),v.offsetY*(1-zoom),v.pixelWidth,v.pixelHeight);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    if(mode==='entering'&&elapsed===duration)mode='open';
    if(mode==='closing'&&elapsed===0){restoreBooks();restoreCamera();mode='closed';}
  }
  return {books,open,close,reset,select,update,hover(index){hovered=index;},get busy(){return mode!=='closed';},get ready(){return mode==='open';},get selected(){return desired;},get bookReady(){return mode==='open'&&current!==null&&current===desired&&bookTime===bookDuration;},get state(){return {mode,current,desired,bookTime};}};
}
