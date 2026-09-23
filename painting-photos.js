import * as THREE from './vendor/three.module.js';
import {projectedArtworkPlane} from './bedroom-art.js';

// Original still-image data, excluding appended motion clips. Regions show the painted canvas.
export const PHOTO_SOURCES={
  bear:{file:'bear-sunset.webp',width:2268,height:2268},
  easels:{file:'small-canvases.jpg',width:1440,height:1440},
  mountain:{file:'mountain-study.jpg',width:2268,height:4032},
  greenFalls:{file:'forest-waterfall.jpg',width:1440,height:1440},
  blueFalls:{file:'moonlit-waterfall.jpg',width:1460,height:1635},
  sunset:{file:'sunset-power-lines.jpg',width:2268,height:3767},
  snow:{file:'winter-river.jpg',width:2268,height:2268},
  yellow:{file:'golden-lake.jpg',width:2268,height:2268},
  beach:{file:'tropical-coast.jpg',width:2268,height:4032},
  forest:{file:'woodland-path.jpg',width:2268,height:4032},
  samurai:{file:'samurai-sunset.jpg',width:2268,height:4032},
  candle:{file:'rainy-candle.jpg',width:2268,height:4032},
  arch:{file:'starry-arch.jpg',width:2268,height:4032},
  table:{file:'table-collection.jpg',width:2268,height:4032},
  knight:{file:'hollow-knight.jpg',width:2268,height:4032},
  family:{file:'family-canvases.jpg',width:2268,height:4032},
  dog:{file:'dog-portrait.jpg',width:4000,height:2256},
  monochrome:{file:'monochrome-swordsman.jpg',width:4032,height:2268},
};
const region=(source,aspect,w,h,corners)=>({source,aspect,corners:corners.map(([x,y])=>[x/w,y/h])});
// Points run clockwise from the top-left corner, measured on the supplied photos.
export const PAINTINGS={
  lake:region('bear',.8,1600,1600,[[300,4],[1480,98],[1340,1570],[89,1482]]),
  coast:region('snow',.8,1600,1600,[[86,2],[1446,2],[1472,1596],[145,1596]]),
  orange:region('table',1,1152,2048,[[105,826],[329,751],[433,940],[210,1027]]),
  portrait:region('easels',1,1440,1440,[[59,451],[521,398],[623,853],[161,932]]),
  blue:region('candle',1,1152,2048,[[103,506],[1075,510],[1036,1496],[92,1450]]),
  sunset:region('sunset',1,1233,2048,[[169,417],[1117,416],[1156,1382],[164,1391]]),
  mountain:region('mountain',1.25,1152,2048,[[39,551],[1066,472],[1097,1250],[146,1353]]),
  forest:region('forest',.8,1152,2048,[[126,485],[969,420],[1020,1459],[227,1501]]),
  flowers:region('beach',1,1152,2048,[[103,454],[1087,413],[1094,1417],[121,1404]]),
  waterfall:region('blueFalls',.8,1460,1635,[[130,179],[1235,169],[1195,1520],[183,1515]]),
  night:region('arch',.8,1152,2048,[[134,428],[1028,433],[1038,1574],[122,1571]]),
  moon:region('greenFalls',.8,1440,1440,[[287,152],[1170,157],[1143,1260],[279,1249]]),
  purple:region('table',1,1152,2048,[[269,1077],[514,1040],[568,1258],[316,1319]]),
  yellow:region('yellow',1,1600,1600,[[201,256],[1254,258],[1260,1322],[198,1321]]),
  knight:region('knight',1,1152,2048,[[132,656],[912,624],[1089,1387],[113,1470]]),
  snow:region('monochrome',1.25,2048,1152,[[448,129],[1580,130],[1580,1035],[444,1036]]),
  samurai:region('samurai',1,1152,2048,[[106,615],[1001,619],[990,1498],[110,1504]]),
  deer:region('easels',1,1440,1440,[[782,374],[1249,317],[1295,787],[817,832]]),
  mother:region('family',1,1152,2048,[[80,889],[475,782],[580,1178],[166,1290]]),
  father:region('family',1,1152,2048,[[521,771],[918,657],[1051,1044],[632,1161]]),
  dog:region('dog',.8,2048,1155,[[598,132],[1330,125],[1354,1067],[600,1072]]),
};

export function paintingSize(key,width,height){
  const aspect=PAINTINGS[key]?.aspect;if(!aspect)return {width,height};
  return width/height>aspect?{width:height*aspect,height}:{width,height:width/aspect};
}

export function paintingPlane(textures,key,width,height){
  const painting=PAINTINGS[key];
  return projectedArtworkPlane(textures[painting.source],key,width,height,painting.corners);
}

export function loadPaintingTextures(){
  const loader=new THREE.ImageLoader();
  return Object.fromEntries(Object.entries(PHOTO_SOURCES).map(([id,source])=>{
    const texture=new THREE.Texture();texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    texture.userData.status='loading';
    loader.load(new URL('./assets/paintings/'+source.file,import.meta.url).href,image=>{
      // Limit GPU memory while retaining enough detail for the close-up gallery.
      const scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      texture.image=canvas;texture.needsUpdate=true;texture.userData.status='ready';
    },undefined,error=>{texture.userData.status='error';console.error('Painting could not load: '+source.file,error);});
    return [id,texture];
  }));
}
