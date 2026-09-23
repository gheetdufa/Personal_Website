import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const root=resolve('.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf','.json':'application/json','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2'};
createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=pathname==='/'?'/index.html':pathname;
    const file=resolve(root,'.'+path);
    const publicPath=/^\/[^/]+\.(html|js|css)$/.test(path)||/^\/(assets|vendor)\//.test(path);
    if(!publicPath||path.split('/').some(part=>part.startsWith('.'))||!file.startsWith(root+sep)){
      res.writeHead(403).end();return;
    }
    if(!(await stat(file)).isFile()){res.writeHead(404).end('Not found');return;}
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-cache'});
    res.end(body);
  }catch{res.writeHead(404).end('Not found');}
}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));
