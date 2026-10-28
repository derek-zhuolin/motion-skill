import {readFile,realpath,stat,mkdir,writeFile,copyFile,mkdtemp,rm,symlink,unlink} from 'node:fs/promises';
import {resolve,dirname,relative,join,sep,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const script=fileURLToPath(import.meta.url),defaultRoot=resolve(dirname(script),'..');
const args=process.argv.slice(2);
function option(name,fallback){const i=args.indexOf(name);if(i<0)return fallback;if(!args[i+1]||args[i+1].startsWith('--'))throw Error(`${name} needs a path`);return resolve(args[i+1]);}
const hash=value=>createHash('sha256').update(value).digest('hex');
const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const isMap=value=>value&&typeof value==='object'&&!Array.isArray(value);
function safeName(name){
 if(typeof name!=='string'||!name||name.includes('\\')||name.includes('\0')||name.includes(':')||posix.isAbsolute(name)||posix.normalize(name)!==name||name.split('/').some(p=>p==='..'||p==='.'))throw Error(`unsafe path: ${name}`);
 return name;
}
async function boundedFile(base,name){
 safeName(name);const boundary=await realpath(base),actual=await realpath(resolve(boundary,name));
 const rel=relative(boundary,actual);
 if(!rel||rel==='..'||rel.startsWith('..'+sep)||resolve(boundary,rel)!==actual)throw Error(`path leaves declared root: ${name}`);
 if(!(await stat(actual)).isFile())throw Error(`not a file: ${name}`);
 return actual;
}
async function verify(project,deps=join(project,'node_modules')){
 const root=await realpath(project),dist=join(root,'examples/rhythm-playground/dist');
 const manifest=JSON.parse(await readFile(await boundedFile(root,'examples/rhythm-playground/dist/build.json'),'utf8'));
 const failures=[];
 if(manifest.schema!==1||manifest.kind!=='synthetic-rhythm-demo'||!validHash(manifest.buildId)||!isMap(manifest.inputs)||!Object.keys(manifest.inputs).length||!isMap(manifest.artifacts)||!isMap(manifest.audio)||!isMap(manifest.compiler))throw Error('invalid build manifest');
 if(hash(JSON.stringify({inputs:manifest.inputs,audio:manifest.audio,compiler:manifest.compiler}))!==manifest.buildId)failures.push('manifest: build ID does not match declared input metadata');
 for(const required of ['app.js','app.css','index.html','test-groove.wav'])if(!Object.hasOwn(manifest.artifacts,required))failures.push(`artifact missing from manifest: ${required}`);
 const check=async(kind,base,name,want)=>{
  try{if(!validHash(want))throw Error('invalid sha256');const actual=hash(await readFile(await boundedFile(base,name)));if(actual!==want)failures.push(`${kind}: ${name} changed`);}
  catch(error){failures.push(`${kind}: ${name}: ${error.message}`);}
 };
 for(const [name,want] of Object.entries(manifest.inputs)){
  try{safeName(name);}catch(error){failures.push(`input: ${error.message}`);continue;}
  if(name.startsWith('node_modules/'))await check('dependency',deps,name.slice('node_modules/'.length),want);
  else await check('input',root,name,want);
 }
 for(const [name,want] of Object.entries(manifest.artifacts))await check('artifact',dist,name,want);
 await check('audio',dist,'test-groove.wav',manifest.audio.sha256);
 return {status:failures.length?'stale':'current',buildId:manifest.buildId,checked:{inputs:Object.keys(manifest.inputs).length,artifacts:Object.keys(manifest.artifacts).length,audio:1},failures};
}
async function negativeTests(project,deps){
 const original=await verify(project,deps);assert.equal(original.status,'current',JSON.stringify(original.failures));
 const manifest=JSON.parse(await readFile(join(project,'examples/rhythm-playground/dist/build.json'),'utf8'));
 const temp=await mkdtemp(join(tmpdir(),'motion-rhythm-build-')),root=join(temp,'project');await mkdir(root);
 const copy=async(from,to)=>{await mkdir(dirname(to),{recursive:true});await copyFile(from,to);};
 try{
  for(const name of Object.keys(manifest.inputs))await copy(name.startsWith('node_modules/')?join(deps,name.slice(13)):join(project,name),join(root,name));
  for(const name of [...Object.keys(manifest.artifacts),'build.json'])await copy(join(project,'examples/rhythm-playground/dist',name),join(root,'examples/rhythm-playground/dist',name));
  const run=()=>{const result=spawnSync(process.execPath,[script,'--project',root],{encoding:'utf8'});return {code:result.status,text:result.stdout+result.stderr};};
  assert.equal(run().code,0,'independent copy is current');
  for(const name of ['examples/rhythm-playground/App.tsx','examples/rhythm-playground/dist/test-groove.wav','examples/rhythm-playground/dist/app.js']){
   const path=join(root,name),before=await readFile(path),changed=Buffer.from(before);changed[name.endsWith('.wav')?44:0]^=1;await writeFile(path,changed);
   const stale=run();assert.equal(stale.code,1,`${name} must return nonzero`);assert.match(stale.text,/changed/);
   await writeFile(path,before);assert.equal(run().code,0,`${name} restored`);
  }
  const manifestPath=join(root,'examples/rhythm-playground/dist/build.json'),before=await readFile(manifestPath);
  const bad=JSON.parse(before);bad.inputs['../outside.txt']='0'.repeat(64);bad.buildId=hash(JSON.stringify({inputs:bad.inputs,audio:bad.audio,compiler:bad.compiler}));await writeFile(manifestPath,JSON.stringify(bad));
  const escaped=run();assert.equal(escaped.code,1);assert.match(escaped.text,/unsafe path/);await writeFile(manifestPath,before);
  const target=join(root,'examples/rhythm-playground/App.tsx'),bytes=await readFile(target),outside=join(temp,'outside.tsx');await writeFile(outside,bytes);await unlink(target);await symlink(outside,target);
  const linked=run();assert.equal(linked.code,1);assert.match(linked.text,/path leaves declared root/);await unlink(target);await writeFile(target,bytes);assert.equal(run().code,0);
  console.log('rhythm build negative tests passed: actual source/audio/bundle byte changes return stale; restore returns current; traversal and symlink escapes rejected.');
 }finally{await rm(temp,{recursive:true,force:true});}
}
try{
 const project=option('--project',defaultRoot),deps=option('--deps',join(project,'node_modules'));
 if(args.includes('--self-test'))await negativeTests(project,deps);
 else{const result=await verify(project,deps);console.log(JSON.stringify(result,null,2));if(result.status==='stale')process.exitCode=1;}
}catch(error){console.error(JSON.stringify({status:'stale',failures:[error.message]},null,2));process.exitCode=1;}
