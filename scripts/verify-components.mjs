// Explicit local pixel smoke test. No network media, model calls or browser download.
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {resolveBrowser} from '../assets/runtime/scripts/browser.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const browserExecutable=resolveBrowser();
// Avoid the default Studio range and leave existing previews alone.
const port=await new Promise((resolve,reject)=>{const server=createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const address=server.address();server.close(()=>resolve(address.port));});});
const start=Date.now(),out=resolve(root,'.cache','components-'+start);
mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:resolve(root,'scripts/fixtures/ComponentsSmoke.tsx'),publicDir:resolve(root,'assets/runtime/site'),outDir:resolve(out,'bundle')});
const composition=await selectComposition({serveUrl,id:'Components-Smoke',browserExecutable,port});
const frames=[9,30,75];
for(const frame of frames)await renderStill({serveUrl,composition,browserExecutable,port,frame,output:resolve(out,`frame-${frame}.png`),imageFormat:'png',scale:.75});
const report={frames,seconds:(Date.now()-start)/1000,private_media:false,scope:'Seven adapters, synthetic content, representative pixels only; not narrative, audio or human acceptance.'};
writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({directory:out,...report},null,2));
