"""Copy a registered local reference into a new editable project. Never execute it."""
from pathlib import Path
import hashlib,json,re,shutil,time
SKILL=Path(__file__).resolve().parents[1]
def digest(path):
 h=hashlib.sha256()
 with Path(path).open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def registry(path=None):
 p=Path(path).expanduser() if path else SKILL/'.local/baselines.json'
 if not p.is_file():raise ValueError('No local baseline registry. Register an authorized local project; no silent template fallback.')
 return json.loads(p.read_text())
def list_baselines(path=None):
 data=registry(path)
 return {'baselines':[{'id':k,'label':v['label'],'source':v['source'],'available':Path(v['source']).is_dir(),'duration':v['frames']/v['fps']} for k,v in data['baselines'].items()],'scope':'Local reference copies, not new content or guaranteed outcomes'}
def reuse_project(args):
 begin=time.perf_counter();data=registry(args.registry)
 if args.baseline not in data['baselines']:raise ValueError('Unknown baseline')
 cfg=data['baselines'][args.baseline];source=Path(cfg['source']).resolve();dest=Path(args.dest).expanduser().resolve();deps=Path(args.deps).expanduser().resolve()
 if dest.exists():raise ValueError('Destination exists; use a new run')
 if source==dest or source in dest.parents:raise ValueError('Destination cannot be inside reference source')
 for n,v in {'remotion':'4.0.538','@remotion/player':'4.0.538','@remotion/bundler':'4.0.538','@remotion/renderer':'4.0.538','react':'19.2.3'}.items():
  f=deps/n/'package.json'
  if not f.is_file() or json.loads(f.read_text()).get('version')!=v:raise ValueError('Missing/incompatible local dependency: '+n)
 if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*',cfg['export']):raise ValueError('Invalid export')
 if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_/-]*',cfg['module']):raise ValueError('Invalid module')
 jobs=[]
 for mapping in cfg['files']:
  src=(source/mapping['from']).resolve();out=(dest/mapping['to']).resolve()
  if not src.exists() or source not in src.parents:raise ValueError('Missing or outside-source file: '+str(src))
  if dest not in out.parents:raise ValueError('Unsafe destination')
  members=list(src.rglob('*')) if src.is_dir() else [src]
  for f in members:
   if f.is_symlink() or f.name.startswith('.env') or f.name in ('node_modules','.git'):raise ValueError('Unapproved symlink/environment entry: '+str(f))
  jobs.append((src,out))
 dest.mkdir(parents=True);manifest=[]
 for src,out in jobs:
  out.parent.mkdir(parents=True,exist_ok=True)
  if src.is_dir():shutil.copytree(src,out)
  else:shutil.copy2(src,out)
  copied=list(out.rglob('*')) if out.is_dir() else [out]
  for f in copied:
   if f.is_file():manifest.append({'path':str(f.relative_to(dest)),'sha256':digest(f)})
 for name in ('src','scripts','evidence','outputs','public'):(dest/name).mkdir(exist_ok=True)
 (dest/'node_modules').symlink_to(deps,target_is_directory=True)
 for name in ('tsconfig.json','src/react-dom-client.d.ts','src/react-dom-server.d.ts'):
  f=SKILL/'assets/runtime'/name
  if f.exists():shutil.copy2(f,dest/name)
 shutil.copy2(SKILL/'assets/runtime/serve.py',dest/'serve.py')
 # The common server serves site; link only this new project's public tree.
 (dest/'site').symlink_to(dest/'public',target_is_directory=True)
 for f in (SKILL/'assets/reuse-runtime').rglob('*'):
  if f.is_file():
   out=dest/f.relative_to(SKILL/'assets/reuse-runtime');out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,out)
 # Make current adapters available, without overwriting any reference implementation.
 adapter_copies=[];adapter_conflicts=[]
 for f in (SKILL/'assets/runtime/src/production').glob('*'):
  if not f.is_file():continue
  out=dest/'src/production'/f.name;out.parent.mkdir(parents=True,exist_ok=True)
  if out.exists():
   if digest(out)!=digest(f):adapter_conflicts.append(str(out.relative_to(dest)))
   continue
  shutil.copy2(f,out);adapter_copies.append(str(out.relative_to(dest)))
 (dest/'evidence/adapters-available.json').write_text(json.dumps({'copied':adapter_copies,'preserved_reference_conflicts':adapter_conflicts,'status':'available_not_invoked'},indent=2))
 (dest/'src/Baseline.tsx').write_text("export {"+cfg['export']+" as BaselineFilm} from './"+cfg['module']+"';\n")
 config={k:cfg[k] for k in ('label','width','height','fps','frames','fonts','props')}
 (dest/'src/baseline.json').write_text(json.dumps(config,ensure_ascii=False,indent=2))
 (dest/'baseline-provenance.json').write_text(json.dumps({'baseline':args.baseline,'source':str(source),'status':'reference_copy','copied':manifest,'new_content_verified':False,'asr_calls':0,'network_calls':0,'copy_seconds':time.perf_counter()-begin},ensure_ascii=False,indent=2))
 return {'created':str(dest),'status':'reference_copy','baseline':args.baseline,'copied_files':len(manifest),'copy_seconds':round(time.perf_counter()-begin,3),'next':'Review copied baseline; adapt content and timestamps before claiming a new film. npm run check && npm run build.'}
