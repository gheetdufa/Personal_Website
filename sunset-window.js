import * as THREE from './vendor/three.module.js';
// A small geometric landscape lives inside the window frame, behind its blinds.
export function addSunsetWindow(parent){
  const root=new THREE.Group();root.name='low-poly-sunset';root.position.z=.062;parent.add(root);
  const sky=new THREE.PlaneGeometry(3.03,2.02),colors=[];
  for(let i=0;i<sky.attributes.position.count;i++){const y=sky.attributes.position.getY(i),c=new THREE.Color(y>0?'#665087':'#ffbd70');colors.push(c.r,c.g,c.b);}
  sky.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));root.add(new THREE.Mesh(sky,new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false})));
  const sun=new THREE.Mesh(new THREE.CircleGeometry(.29,16),new THREE.MeshBasicMaterial({color:'#ffe5a3',toneMapped:false}));sun.position.set(-.60,-.21,.006);sun.name='sunset-sun';root.add(sun);
  function ridge(points,color,z){const shape=new THREE.Shape();shape.moveTo(-1.515,-1.01);points.forEach(([x,y])=>shape.lineTo(x,y));shape.lineTo(1.515,-1.01);shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color,toneMapped:false}));mesh.position.z=z;root.add(mesh);}
  ridge([[-1.515,-.52],[-1.23,-.27],[-.92,-.46],[-.50,-.56],[.10,-.30],[.41,-.13],[.79,-.41],[1.08,-.30],[1.515,-.51]],'#8c608e',.012);
  ridge([[-1.515,-.80],[-1.1,-.63],[-.75,-.75],[-.23,-.46],[.27,-.59],[.70,-.44],[1.1,-.69],[1.515,-.52]],'#514d76',.019);
  ridge([[-1.515,-.90],[-.98,-.78],[-.43,-.91],[.16,-.77],[.79,-.92],[1.19,-.71],[1.515,-.84]],'#343e60',.027);
  for(const [x,h] of [[-1.35,.25],[-1.12,.33],[.88,.25],[1.21,.41],[1.40,.29]]){
    const tree=new THREE.Mesh(new THREE.ConeGeometry(h*.26,h,4),new THREE.MeshBasicMaterial({color:'#27394a',toneMapped:false}));tree.position.set(x,-.91+h/2,.048);tree.scale.z=.15;root.add(tree);
  }
  return root;
}
