#!/usr/bin/env python3
"""Scan the publishable snapshot, not dependency trees or generated local media."""
from pathlib import Path
import json,re,subprocess,sys,shutil
ROOT=Path(__file__).resolve().parents[1]
def files():
 p=subprocess.run(['git','-C',str(ROOT),'ls-files','--cached','--others','--exclude-standard','-z'],capture_output=True)
 if p.returncode==0:return [ROOT/x.decode() for x in p.stdout.split(b'\0') if x]
 return [x for x in ROOT.rglob('*') if x.is_file() and not any(t in x.parts for t in ['node_modules','.git','.cache','__pycache__','evidence','outputs']) and '/site/assets/' not in str(x.relative_to(ROOT)) or x.is_file() and 'assets/runtime/site/assets' in str(x.relative_to(ROOT))]
def ffprobe_binary():
 system=shutil.which('ffprobe')
 if system:return system
 for path in sorted((ROOT/'node_modules/@remotion').glob('compositor-*/ffprobe*')):
  if path.name not in ('ffprobe','ffprobe.exe'):continue
  try:
   test=subprocess.run([str(path),'-version'],cwd=str(path.parent),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
   if test.returncode==0:return str(path)
  except OSError:pass
 raise RuntimeError('ffprobe required: install FFmpeg or run npm ci for the pinned Remotion compositor.')
patterns={'home_path':re.compile(r'/(?:Users|home)/[^\s/"\']+/'),'private_key':re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),'credential':re.compile(r'(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{24,})'),'email':re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')}
issues=[];count=0
for p in files():
 rel=p.relative_to(ROOT).as_posix()
 if p.is_symlink():
  count+=1;issues.append({'file':rel,'kind':'symlink'});continue
 if not p.is_file():continue
 count+=1
 if any(part in {'.local','.cache','node_modules','__pycache__','backups'} for part in p.relative_to(ROOT).parts):issues.append({'file':rel,'kind':'local_cache_or_backup'})
 if p.suffix.lower() in {'.mp4','.mov','.webm','.mkv','.aac','.flac','.ogg'} and rel!='demo/motion-skill-reference.mp4':issues.append({'file':rel,'kind':'unreviewed_source_media'})
 if p.name.startswith('.env') or p.suffix.lower() in {'.m4a','.wav','.mp3','.pem','.key'}:issues.append({'file':rel,'kind':'private_source_or_secret_file'})
 if p.suffix.lower() in {'.md','.json','.py','.tsx','.ts','.mjs','.yaml','.yml','.html','.css','.txt','.srt'} or p.name in {'.gitignore','LICENSE'}:
  content=p.read_text(errors='replace')
  for name,regex in patterns.items():
   for m in regex.finditer(content):
    # Copyright/licensing contacts and public package metadata are retained, never anonymized.
    if name=='email' and ('LICENSE' in p.name or p.name.endswith('-OFL.txt') or p.name.endswith('-NOTICE.txt') or p.name=='package-lock.json'):continue
    issues.append({'file':rel,'kind':name,'line':content[:m.start()].count('\n')+1})
 if p.suffix.lower()=='.mp4':
  binary=ffprobe_binary()
  probe=subprocess.run([binary,'-v','error','-show_format','-show_streams','-of','json',str(p)],cwd=str(Path(binary).parent),capture_output=True,text=True,check=True)
  meta=json.loads(probe.stdout);tags={**meta.get('format',{}).get('tags',{})}
  for s in meta.get('streams',[]):tags.update(s.get('tags',{}))
  if any(k.lower() in ['location','location-eng','creation_time','title','artist','comment','description','voice-memo-uuid'] or k.startswith('com.apple.') for k in tags):issues.append({'file':rel,'kind':'media_metadata'})
print(json.dumps({'files_scanned':count,'issues':issues,'scope':'publishable snapshot, text patterns and media metadata; not a proof of rights or anonymous voice'},ensure_ascii=False,indent=2))
sys.exit(bool(issues))
