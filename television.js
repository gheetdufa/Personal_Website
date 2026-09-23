import * as THREE from './vendor/three.module.js';

export const TV_GAMES=[
  {id:'elden-ring',title:'Elden Ring',image:'./assets/games/elden-ring.jpg',aspect:1280/720,color:'#c9ad71',logo:'./assets/games/elden-ring-logo.png',logoAspect:612/93},
  {id:'halo',title:'Halo Infinite',image:'./assets/games/halo.jpg',aspect:616/353,color:'#a2c8c2',logo:'./assets/games/halo-logo.png',logoAspect:512/143},
  {id:'hollow-knight',title:'Hollow Knight',image:'./assets/games/hollow-knight.jpg',aspect:616/353,color:'#85b4ef',logo:'./assets/games/hollow-knight-logo.png',logoAspect:800/317},
  {id:'expedition-33',title:'Clair Obscur: Expedition 33',image:'./assets/games/expedition-33.jpg',aspect:1200/630,color:'#d4bd94',logo:'./assets/games/expedition-33-logo.png',logoAspect:1200/657},
  {id:'smash',title:'Super Smash Bros. Ultimate',color:'#ced9ed',images:['./assets/switch/smash-ultimate.jpg','./assets/switch/smash-fighters.jpg'],logo:'./assets/switch/smash-logo.png',logoAspect:1194/648},
  {id:'tears-of-the-kingdom',title:'The Legend of Zelda: Tears of the Kingdom',color:'#8be8c1',background:'#103c37',logo:'./assets/games/zelda-totk-logo.png',logoAspect:1060/757},
];
export const TV_FLICKER_SECONDS=.58;
export function createTelevision(parent,loadTexture=url=>new THREE.TextureLoader().load(url)){
  const root=new THREE.Group();root.position.set(.16,1.96,-.034);root.name='living-tv-screen';root.userData.interaction='switch';parent.add(root);
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(2.48,1.40),new THREE.MeshBasicMaterial({color:'#1b2224',toneMapped:false}));root.add(surface);
  const screens=new Map();let index=-1,state='off',elapsed=0;
  function panel(parent,w,h,x=0,y=0,z=0,image=null,transparent=false){
    const material=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false,transparent});
    if(image){const texture=loadTexture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;material.map=texture;}
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function ensureGame(){
    if(screens.has(index))return;
    const game=TV_GAMES[index],screen=new THREE.Group();screen.name='tv-game-'+game.id;screen.position.z=.004;root.add(screen);
    panel(screen,2.48,1.4,0,0,-.001).material.color.set(game.background||'#07101a');
    if(game.image){const h=Math.min(1.4,2.48/game.aspect);panel(screen,h*game.aspect,h,0,0,0,game.image);}
    else if(game.images){
      panel(screen,1.24,1.4,-.62,0,0,game.images[0]);panel(screen,1.24,1.4,.62,0,0,game.images[1]);
    }
    // Keep artwork as atmosphere; the official wordmark is the screen's focus.
    if(game.image||game.images){const shade=panel(screen,2.48,1.4,0,0,.003,null,true);shade.material.color.set(game.id==='smash'?'#ffffff':'#030811');shade.material.opacity=game.id==='smash'?.92:.88;}
    const logoHeight=Math.min(1.25,2.30/game.logoAspect),logo=panel(screen,logoHeight*game.logoAspect,logoHeight,0,.015,.009,game.logo,true);logo.name='tv-title-'+game.id;
    screens.set(index,screen);
  }
  const veil=new THREE.Mesh(new THREE.PlaneGeometry(2.48,1.4),new THREE.MeshBasicMaterial({color:'#060c12',transparent:true,opacity:0,depthWrite:false,toneMapped:false}));veil.position.z=.02;root.add(veil);
  const scan=new THREE.Mesh(new THREE.PlaneGeometry(2.48,.026),new THREE.MeshBasicMaterial({color:'#b7c5d0',transparent:true,opacity:.11,depthWrite:false,toneMapped:false}));scan.position.z=.022;root.add(scan);scan.visible=false;
  const glow=new THREE.PointLight('#a9c4e8',0,4,2);glow.position.set(.35,1.82,.70);parent.add(glow);
  function cycle(reduced=false){index=(index+1)%TV_GAMES.length;ensureGame();if(state!=='tuning')elapsed=0;state='tuning';update(0,reduced);return TV_GAMES[index];}
  function update(dt,reduced=false){
    if(state==='tuning'){elapsed+=dt;if(reduced||elapsed>=TV_FLICKER_SECONDS)state='on';}
    for(const [i,screen] of screens)screen.visible=i===index;
    const progress=Math.min(1,elapsed/TV_FLICKER_SECONDS);
    veil.material.opacity=state==='tuning'?Math.max(0,.74*(1-progress)+.18*Math.sin(progress*Math.PI*3)):0;
    scan.visible=state==='tuning'&&!reduced;scan.position.y=.66-progress*1.32;
    surface.material.color.set(state==='off'?'#1b2224':'#05090d');
    if(index>=0)glow.color.set(TV_GAMES[index].color);
    glow.intensity=state==='off'?0:1.1*(1-veil.material.opacity);
  }
  return {root,cycle,update,get state(){return state;},get game(){return TV_GAMES[index]??null;},get index(){return index;}};
}
