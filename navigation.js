export const RADIUS=.23;
export const BOUNDS=3.48;
export function isWalkable(x,z,obstacles){if(Math.abs(x)>BOUNDS||Math.abs(z)>BOUNDS)return false;return !obstacles.some(o=>x>o.minX-RADIUS&&x<o.maxX+RADIUS&&z>o.minZ-RADIUS&&z<o.maxZ+RADIUS);}
export function moveWithCollisions(position,dx,dz,obstacles){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));let {x,z}=position;for(let i=0;i<steps;i++){if(isWalkable(x+dx/steps,z,obstacles))x+=dx/steps;if(isWalkable(x,z+dz/steps,obstacles))z+=dz/steps;}return {x,z};}
const STEP=.19,COUNT=37;
function point(i,j){return{x:(i-18)*STEP,z:(j-18)*STEP};}
function index(x){return Math.max(0,Math.min(COUNT-1,Math.round(x/STEP)+18));}
function clearLine(a,b,obstacles){
  if(!isWalkable(a.x,a.z,obstacles)||!isWalkable(b.x,b.z,obstacles))return false;
  // Intersect the complete segment with expanded furniture bounds. Sampling can miss a narrow corner.
  for(const obstacle of obstacles){
    let near=0,far=1,intersects=true;
    for(const [axis,min,max] of [['x',obstacle.minX-RADIUS,obstacle.maxX+RADIUS],['z',obstacle.minZ-RADIUS,obstacle.maxZ+RADIUS]]){
      const delta=b[axis]-a[axis];
      if(Math.abs(delta)<1e-10){if(a[axis]<=min||a[axis]>=max){intersects=false;break;}continue;}
      let t1=(min-a[axis])/delta,t2=(max-a[axis])/delta;
      if(t1>t2)[t1,t2]=[t2,t1];near=Math.max(near,t1);far=Math.min(far,t2);
      if(near>=far){intersects=false;break;}
    }
    if(intersects&&far>0&&near<1)return false;
  }
  return true;
}
export function findPath(start,target,obstacles){if(!isWalkable(target.x,target.z,obstacles))return [];if(clearLine(start,target,obstacles))return [target];let si=index(start.x),sj=index(start.z);const originI=si,originJ=sj;let startDist=Infinity;for(let i=Math.max(0,originI-2);i<=Math.min(COUNT-1,originI+2);i++)for(let j=Math.max(0,originJ-2);j<=Math.min(COUNT-1,originJ+2);j++){const p=point(i,j);const d=Math.hypot(p.x-start.x,p.z-start.z);if(d<startDist&&clearLine(start,p,obstacles)){startDist=d;si=i;sj=j;}}
if(!Number.isFinite(startDist))return [];
const startKey=si+','+sj,open=[{i:si,j:sj,g:0,f:0}],costs=new Map([[startKey,0]]),parents=new Map(),closed=new Set();let end=null;
while(open.length){open.sort((a,b)=>a.f-b.f);const current=open.shift();const key=current.i+','+current.j;if(closed.has(key))continue;closed.add(key);const p=point(current.i,current.j);if(Math.hypot(p.x-target.x,p.z-target.z)<STEP*1.8&&clearLine(p,target,obstacles)){end=key;break;}for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const i=current.i+di,j=current.j+dj;if(i<0||i>=COUNT||j<0||j>=COUNT)continue;const next=point(i,j);if(!clearLine(p,next,obstacles))continue;const k=i+','+j,g=current.g+Math.hypot(di,dj);if(g>=(costs.get(k)??Infinity))continue;costs.set(k,g);parents.set(k,key);open.push({i,j,g,f:g+Math.hypot(next.x-target.x,next.z-target.z)/STEP});}}
if(end===null)return [];const path=[target];while(end!==startKey){const [i,j]=end.split(',').map(Number);path.unshift(point(i,j));end=parents.get(end);}path.unshift(point(si,sj));const smooth=[];let current=start;for(let i=0;i<path.length;i++){let furthest=i;while(furthest+1<path.length&&clearLine(current,path[furthest+1],obstacles))furthest++;smooth.push(path[furthest]);current=path[furthest];i=furthest;}return smooth;}
