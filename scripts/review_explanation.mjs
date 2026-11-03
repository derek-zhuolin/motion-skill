/** Local renderer: one generated explanation project; no browser/model downloads. */
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {existsSync,readFileSync,mkdirSync,cpSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const project=resolve(process.argv[2]||'.');
const out=resolve(process.argv[3]||resolve(project,'evidence'));
if(existsSync(out))throw Error('Review destination exists; use a new revision');
const browserExecutable=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if(!existsSync(browserExecutable))throw Error('Supply an existing local Chrome; no download');
const require=createRequire(resolve(project,'package.json'));
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
function collect(folder,result=[]){for(const entry of readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
 const file=resolve(folder,entry.name);if(entry.isDirectory())collect(file,result);else if(entry.isFile())result.push({path:file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});
}return result;}
function fingerprintProject(){
 const result=[...collect(resolve(project,'src')),...collect(resolve(project,'public/assets'))];
 for(const name of ['package.json','tsconfig.json','package-lock.json','pnpm-lock.yaml','yarn.lock']){
  const file=resolve(project,name);if(existsSync(file))result.push({path:file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')});
 }
 return result;
}
// Snapshot before reading/bundling: a late hash must never certify an older bundle.
const dependencies=fingerprintProject();
const plan=JSON.parse(readFileSync(resolve(project,'src/plan.json'),'utf8'));
if(!['motion-explainer/v1','motion-explainer/v2'].includes(plan.schema)||plan.audio.playback_rate!==1)throw Error('Invalid plan/source clock');
mkdirSync(out,{recursive:true});
const publicDir=resolve(out,'render-public');mkdirSync(publicDir);
cpSync(resolve(project,'public/assets'),resolve(publicDir,'assets'),{recursive:true});
const serveUrl=await bundle({entryPoint:resolve(project,'src/render.tsx'),publicDir,outDir:resolve(out,'bundle'),enableCaching:false});
const composition=await selectComposition({serveUrl,id:'Explanation',browserExecutable,logLevel:'error'});
const frames=new Set([0,composition.durationInFrames-1]);
for(const event of plan.events){
 for(const t of [event.start-.1,event.start,event.start+.1,...event.action_window,event.readable_window[0],event.end-.1]){
  frames.add(Math.max(0,Math.min(composition.durationInFrames-1,Math.round(t*plan.fps))));
 }
}
const rendered=[];
for(const frame of [...frames].sort((a,b)=>a-b)){
 const file=`frame-${String(frame).padStart(4,'0')}.png`;
 await renderStill({composition,serveUrl,browserExecutable,output:resolve(out,file),frame,scale:.6,logLevel:'error',overwrite:false});
 rendered.push({frame,time:frame/plan.fps,file});
 console.log(`FRAME ${frame}/${composition.durationInFrames}`);
}
if(!process.argv.includes('--stills-only')){
 await renderMedia({composition,serveUrl,browserExecutable,outputLocation:resolve(out,'preview.mp4'),codec:'h264',audioCodec:'aac',pixelFormat:'yuv420p',crf:19,scale:.6,concurrency:1,overwrite:false,logLevel:'error'});
 execFileSync('ffmpeg',['-v','error','-i',resolve(out,'preview.mp4'),'-f','null','-'],{stdio:'pipe'});
 const media=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',resolve(out,'preview.mp4')],{encoding:'utf8'}));
 if(Math.abs(Number(media.format.duration)-plan.duration)>.08)throw Error('Export duration differs from plan');
 if(Boolean(plan.audio.url)!==media.streams.some(s=>s.codec_type==='audio'))throw Error('Unexpected audio track state');
 writeFileSync(resolve(out,'media-probe.json'),JSON.stringify(media,null,2));
}
if(JSON.stringify(dependencies)!==JSON.stringify(fingerprintProject()))throw Error('Source changed during review; artifacts are stale, use a new review directory');
const artifacts=collect(out);
writeFileSync(resolve(out,'verification.json'),JSON.stringify({project,fps:plan.fps,duration:plan.duration,frames:rendered,video:!process.argv.includes('--stills-only'),decode:process.argv.includes('--stills-only')?'not_run':'passed',dependencies,artifacts,
 review:{plan:'compiled',wiring:'rendered',frames:'awaiting_observation',playback:'awaiting_observation',user_acceptance:'pending'},
 scope:'Rendering and decode evidence. Meaning, viewing/listening quality and user acceptance require separate observations.'},null,2));
console.log(JSON.stringify({output:out,frames:rendered.length,video:!process.argv.includes('--stills-only')}));
// Remotion's local server may retain open handles after a completed export.
// All artifacts above are written synchronously before ending this CLI process.
process.exit(0);
