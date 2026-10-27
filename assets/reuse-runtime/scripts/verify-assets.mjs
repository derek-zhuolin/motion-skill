import{readFileSync,existsSync,statSync}from'node:fs';import{resolve}from'node:path';
const root=process.cwd(),config=JSON.parse(readFileSync(resolve(root,'src/baseline.json'))),proof=JSON.parse(readFileSync(resolve(root,'baseline-provenance.json')));
for(const k of ['width','height','fps','frames'])if(!Number.isFinite(config[k])||config[k]<=0)throw Error('Invalid '+k);
const missing=proof.copied.filter(x=>!existsSync(resolve(root,x.path))||statSync(resolve(root,x.path)).size===0);
if(missing.length)throw Error('Missing/empty baseline files: '+missing.map(x=>x.path).join(', '));
console.log(JSON.stringify({baseline:proof.baseline,files:proof.copied.length,scope:'local assets and composition dimensions only; visual review required'}));
