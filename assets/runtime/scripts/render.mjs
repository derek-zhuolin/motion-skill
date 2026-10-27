import {resolveBrowser} from './browser.mjs';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia} from '@remotion/renderer';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync,existsSync,mkdirSync,cpSync} from 'node:fs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const plan=JSON.parse(readFileSync(resolve(root,'src/compiled-plan.json'),'utf8'));
if(plan.audit.blocking.length)throw Error('Resolve semantic/reading/audio blockers before render.');
if(plan.mode==='voice'&&!plan.source.voice_url)throw Error('Voice mode has no audio source.');
for(const asset of [plan.source.voice_url,plan.source.sfx_url,plan.source.music_url,plan.layout.face?.enabled?plan.source.video_url:null].filter(Boolean)){
 const base=resolve(root,'site'),file=resolve(base,asset);
 if(!file.startsWith(base+'/')||!existsSync(file))throw Error('Missing or nonlocal source asset: '+asset);
}
if(plan.mode==='example'&&!process.argv.includes('--allow-example'))throw Error('This is a silent structure example; use --allow-example only for an explicitly requested example export.');
const browserExecutable=resolveBrowser();
mkdirSync(resolve(root,'outputs'),{recursive:true});
const outputLocation=resolve(root,`outputs/Motion-Video-${new Date().toISOString().replace(/[:.]/g,'-')}.mp4`);
const tag=String(Date.now()),publicDir=resolve(root,'evidence/render-public-'+tag);
mkdirSync(publicDir,{recursive:true});
if(existsSync(resolve(root,'site/assets')))cpSync(resolve(root,'site/assets'),resolve(publicDir,'assets'),{recursive:true,dereference:true,filter:(src)=>!src.split('/').at(-1).startsWith('.env')});
const extras=[plan.source.voice_url,plan.source.sfx_url,plan.source.music_url,plan.layout.face?.enabled?plan.source.video_url:null,...plan.scenes.map(s=>s.visual.asset)].filter(Boolean);
for(const asset of extras){const base=resolve(root,'site'),src=resolve(base,asset);if(!src.startsWith(base+'/')||!existsSync(src))throw Error('Missing or nonlocal scene asset: '+asset);const dest=resolve(publicDir,asset);if(!existsSync(dest)){mkdirSync(dirname(dest),{recursive:true});cpSync(src,dest,{recursive:true,dereference:true});}}
const serveUrl=await bundle({entryPoint:resolve(root,'src/render.tsx'),publicDir,outDir:resolve(root,'evidence/render-bundle-'+tag)});
const composition=await selectComposition({serveUrl,id:'Motion-Video',browserExecutable});
await renderMedia({composition,serveUrl,outputLocation,browserExecutable,codec:'h264',audioCodec:'aac',audioBitrate:'192k',pixelFormat:'yuv420p',crf:18,scale:1.2,concurrency:1,overwrite:false});
console.log(outputLocation);
