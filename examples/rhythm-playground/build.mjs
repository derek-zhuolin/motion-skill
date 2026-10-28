import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve,join,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
const at=process.argv.indexOf('--deps');const deps=at>=0?resolve(process.argv[at+1]):join(root,'node_modules');
const require=createRequire(join(deps,'_motion_build.cjs'));let build;
try{({build}=require('esbuild'));}catch{throw Error('Install the repository dependencies with npm ci, or pass --deps /absolute/node_modules with matching versions.');}
const out=join(here,'dist');await mkdir(out,{recursive:true});
const config={entryPoints:[join(here,'App.tsx')],bundle:true,minify:true,platform:'browser',outfile:join(out,'app.js'),nodePaths:[deps],metafile:true,logLevel:'silent'};
// First pass discovers actual source and dependency inputs without writing a bundle.
const result=await build({...config,write:false,define:{__MOTION_BUILD_ID__:JSON.stringify('pending')}});
await copyFile(join(here,'index.html'),join(out,'index.html'));
// Original, deterministic percussion + pluck test groove. Not a generated song.
const rate=44100,duration=12,n=rate*duration,samples=new Float64Array(n),beat=60/116;
const add=(time,length,fn)=>{const begin=Math.round(time*rate),count=Math.round(length*rate);for(let j=0;j<count&&begin+j<n;j++){if(begin+j>=0)samples[begin+j]+=fn(j/rate,j/count);}};
let seed=104729;const noise=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2147483648-1;};
for(let k=0;k*beat<duration;k++){
 const start=k*beat;
 add(start,.23,(t)=>.42*Math.sin(2*Math.PI*(48*t+6*(1-Math.exp(-t*28))))*Math.exp(-t*20));
 if(k%4===1||k%4===3)add(start,.14,t=>noise()*.16*Math.exp(-t*33));
 for(const fraction of [0,.5])add(start+fraction*beat,.055,t=>noise()*.035*Math.exp(-t*85));
 if(k%4!==3){const freq=[261.63,329.63,392,329.63][k%4];add(start+.5*beat,.28,t=>Math.sin(2*Math.PI*freq*t)*.07*Math.exp(-t*15)*(1-Math.exp(-t*300)));}
}
const wav=Buffer.alloc(44+n*2);wav.write('RIFF');wav.writeUInt32LE(36+n*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);
let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(samples[i]));
for(let i=0;i<n;i++){const fade=Math.min(1,i/(rate*.005),(n-1-i)/(rate*.15));wav.writeInt16LE(Math.round(samples[i]*.7/Math.max(peak,.001)*fade*32767),44+i*2);}
await writeFile(join(out,'test-groove.wav'),wav);
const files=Object.keys(result.metafile.inputs).map(p=>resolve(p));
files.push(join(here,'build.mjs'),join(here,'index.html'),join(root,'package.json'),join(root,'package-lock.json'));
const inputs={};for(const path of [...new Set(files)].sort()){
 const normalized=path.replaceAll('\\','/'),position=normalized.lastIndexOf('/node_modules/');
 const name=position>=0?normalized.slice(position+1):relative(root,path);
 if(name.startsWith('..'))throw Error('Build input outside repository/dependency directory');
 inputs[name]=createHash('sha256').update(await readFile(path)).digest('hex');
}
const audio={source:'deterministic synth in build.mjs; not ACE-Step',duration,bpm:116,sha256:createHash('sha256').update(wav).digest('hex')};
const compiler={esbuild:require('esbuild').version};
const buildId=createHash('sha256').update(JSON.stringify({inputs,audio,compiler})).digest('hex');
await build({...config,define:{__MOTION_BUILD_ID__:JSON.stringify(buildId)}});
const artifacts={};for(const name of ['app.js','app.css','index.html','test-groove.wav'])artifacts[name]=createHash('sha256').update(await readFile(join(out,name))).digest('hex');
await writeFile(join(out,'build.json'),JSON.stringify({schema:1,buildId,kind:'synthetic-rhythm-demo',compiler,inputs,audio,artifacts},null,2)+'\n');
console.log('Built examples/rhythm-playground/dist. Serve that folder over HTTP.');
