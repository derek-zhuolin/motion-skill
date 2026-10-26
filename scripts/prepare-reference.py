#!/usr/bin/env python3
"""Prepare local reference media. Downloads only occur with --fetch-stock."""
import argparse,hashlib,json,shutil,subprocess,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; EX=ROOT/'examples/voice-to-video'; MEDIA=EX/'site/assets'
SOURCES=[
 {'id':'workspace','author':'Denise Jans','page':'https://unsplash.com/photos/macbook-pro-turned-on-ZEtE38ybfao','license':'https://unsplash.com/license','url':'https://images.unsplash.com/photo-1519217651866-847339e674d4?auto=format&fit=crop&w=1920&q=88','filename':'workspace-photo.jpg'},
 {'id':'phone','author':'Natures_Embrace','page':'https://pixabay.com/videos/id-202987/','license':'https://pixabay.com/service/license-summary/','url':'https://cdn.pixabay.com/video/2024/03/04/202987-919379330_small.mp4','filename':'phone-hands-original.mp4'}]
def run(args):subprocess.run(args,check=True)
def main():
 p=argparse.ArgumentParser();p.add_argument('--fetch-stock',action='store_true');a=p.parse_args()
 if not shutil.which('ffmpeg'):raise SystemExit('Install FFmpeg first; no automatic installation.')
 MEDIA.mkdir(parents=True,exist_ok=True)
 shutil.copytree(ROOT/'assets/runtime/site/assets/fonts',MEDIA/'fonts',dirs_exist_ok=True)
 shutil.copy2(ROOT/'assets/runtime/site/assets/study-placeholder.svg',MEDIA/'study-placeholder.svg')
 if not (MEDIA/'voice.wav').exists():run(['ffmpeg','-v','error','-n','-i',str(ROOT/'demo/motion-skill-reference.mp4'),'-map','0:a:0','-t','48.064','-ac','2','-ar','48000','-c:a','pcm_s16le',str(MEDIA/'voice.wav')])
 if a.fetch_stock:
  stock=MEDIA/'stock';stock.mkdir(exist_ok=True)
  for source in SOURCES:
   target=stock/source['filename']
   if not target.exists():
    temp=target.with_suffix(target.suffix+'.partial')
    req=urllib.request.Request(source['url'],headers={'User-Agent':'MotionSkillReference/1.1'})
    try:
     with urllib.request.urlopen(req,timeout=60) as response,open(temp,'wb') as f:shutil.copyfileobj(response,f)
     temp.rename(target)
    finally:
     if temp.exists():temp.unlink()
  clip=stock/'phone-hands-clip.mp4'
  if not clip.exists():run(['ffmpeg','-v','error','-n','-ss','2','-i',str(stock/'phone-hands-original.mp4'),'-t','5.4','-an','-vf','fps=30,format=yuv420p','-c:v','libx264','-crf','19','-preset','fast',str(clip)])
 missing=[str(MEDIA/'stock'/name) for name in ['workspace-photo.jpg','phone-hands-clip.mp4'] if not (MEDIA/'stock'/name).exists()]
 print(json.dumps({'fonts':'ready','audio':'derived from published reference, not raw recording','missing_stock':bool(missing),'next':'Use --fetch-stock to fetch attributed third-party sources; never commit the standalone downloads.' if missing else 'npm run build; npm run preview'},ensure_ascii=False))
if __name__=='__main__':main()
