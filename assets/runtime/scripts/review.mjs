import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const plan=JSON.parse(readFileSync(resolve(root,'src/compiled-plan.json'),'utf8'));
if(plan.audit.blocking.length)throw Error('Resolve plan blockers before review');
if(plan.mode==='voice'&&(plan.source.prepared_speed!==1.1||plan.audio_speed!==1.1))throw Error('Real 1.1x media preparation required');
const out=resolve(process.argv[2]||resolve(root,'evidence/visual-review'));
const browserExecutable=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if(!existsSync(browserExecutable))throw Error('Set CHROME_PATH to an existing Chrome executable; no automatic download');
mkdirSync(out,{recursive:true});
const serveUrl=await bundle({enableCaching:false,entryPoint:resolve(root,'src/render.tsx'),publicDir:resolve(root,'site'),outDir:resolve(root,'evidence/review-bundle')});
const composition=await selectComposition({serveUrl,id:'Motion-Video',browserExecutable});
const last=composition.durationInFrames-1;
const frames=new Map([[0,'首帧'],[last,'片尾']]);
for(const scene of plan.scenes){
 for(const [time,label] of [[scene.timing.content_ready_at,'信息可读'],...((scene.emphasis||[]).map(x=>[x.at,'动作落点'])),[scene.end-1/plan.fps,'交接前'],[scene.end,'交接中'],[scene.end+.2,'交接后']]){
  const f=Math.min(last,Math.max(0,Math.round(time*plan.fps)));frames.set(f,`${scene.id} · ${label}`);
 }
}
const shots=[];
for(const [frame,label] of [...frames].sort((a,b)=>a[0]-b[0])){
 const file=`frame-${String(frame).padStart(5,'0')}.png`;
 await renderStill({composition,serveUrl,browserExecutable,output:resolve(out,file),frame,scale:.6,logLevel:'error',overwrite:false});
 shots.push({frame,time:frame/plan.fps,label,file});
}
if(!process.argv.includes('--stills-only')){
 await renderMedia({composition,serveUrl,browserExecutable,outputLocation:resolve(out,'preview.mp4'),codec:'h264',audioCodec:'aac',pixelFormat:'yuv420p',crf:20,scale:1,concurrency:2,overwrite:false,logLevel:'error'});
}
writeFileSync(resolve(out,'frames.json'),JSON.stringify({fps:plan.fps,duration:plan.duration,shots},null,2));
console.log(JSON.stringify({output:out,frames:shots.length,duration:plan.duration,video:!process.argv.includes('--stills-only')}));
