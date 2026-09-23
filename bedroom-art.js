import * as THREE from './vendor/three.module.js';
// UV regions from the user's supplied room image. The original artwork stays intact.
export const REFERENCE_SIZE={width:1402,height:1122};
export const ART={
  lake:[[95,303],[137,283],[137,333],[96,354]],
  knight:[[161,253],[204,231],[206,284],[163,307]],
  coast:[[226,221],[275,196],[277,249],[227,275]],
  orange:[[312,191],[357,168],[359,218],[313,242]],
  wanted:[[395,187],[461,153],[465,286],[396,323]],
  snow:[[137,361],[202,330],[205,386],[137,419]],
  portrait:[[231,302],[276,278],[278,336],[232,362]],
  blue:[[313,273],[364,246],[367,298],[315,327]],
  sunset:[[148,450],[201,423],[204,487],[149,514]],
  mountain:[[227,399],[283,369],[286,428],[228,459]],
  forest:[[313,366],[366,339],[368,395],[315,425]],
  flowers:[[135,544],[192,515],[196,570],[138,602]],
  waterfall:[[229,498],[281,470],[285,531],[231,561]],
  night:[[324,450],[370,425],[374,482],[326,510]],
  moon:[[1172,340],[1211,361],[1211,412],[1173,391]],
  purple:[[1233,373],[1266,391],[1265,440],[1233,421]],
  yellow:[[1292,413],[1325,431],[1323,482],[1291,462]],
  map:[[1168,440],[1209,461],[1211,505],[1169,484]],
  screenLeft:[[864,510],[1020,553],[1020,642],[864,596]],
  screenRight:[[1045,568],[1165,623],[1168,707],[1046,654]],
  window:[[794,260],[1040,382],[1039,433],[794,322]],
};
export function loadBedroomReference(){return new THREE.TextureLoader().load(new URL('./assets/bedroom-reference.png',import.meta.url).href);}
export function artworkPlane(texture,key,width,height,emissive=false){
  const corners=ART[key];if(!corners)throw Error('Unknown reference artwork: '+key);
  return projectedArtworkPlane(texture,key,width,height,corners.map(([x,y])=>[x/REFERENCE_SIZE.width,y/REFERENCE_SIZE.height]),emissive);
}

// Map a rectangle into the photographed canvas with perspective correction.
export function artworkProjection(corners){
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=corners;
  const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
  const determinant=dx1*dy2-dx2*dy1;
  if(Math.abs(determinant)<1e-10)throw Error('Artwork corners must enclose an area');
  const g=(dx3*dy2-dx2*dy3)/determinant,h=(dx1*dy3-dx3*dy1)/determinant;
  return (u,v)=>{
    const denominator=g*u+h*v+1;
    return [((x1-x0+g*x1)*u+(x3-x0+h*x3)*v+x0)/denominator,((y1-y0+g*y1)*u+(y3-y0+h*y3)*v+y0)/denominator];
  };
}

export function projectedArtworkPlane(texture,key,width,height,corners,emissive=false){
  const geometry=new THREE.PlaneGeometry(width,height,24,24),uv=geometry.getAttribute('uv'),project=artworkProjection(corners);
  for(let i=0;i<uv.count;i++){
    const [x,y]=project(uv.getX(i),1-uv.getY(i));uv.setXY(i,x,1-y);
  }
  uv.needsUpdate=true;
  const material=emissive?new THREE.MeshBasicMaterial({map:texture,toneMapped:false}):new THREE.MeshStandardMaterial({map:texture,roughness:1});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='reference-art-'+key;return mesh;
}
