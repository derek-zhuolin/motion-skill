from pathlib import Path
import subprocess,json
root=Path(__file__).resolve().parents[1]
files=sorted((root/'outputs').glob('*.mp4'),key=lambda p:p.stat().st_mtime)
if not files:raise SystemExit('Run npm run render first')
f=files[-1]
subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True)
x=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]))
print(json.dumps({'file':f.name,'streams':[{k:s.get(k) for k in ['codec_type','codec_name','width','height','duration','nb_frames']} for s in x['streams']]},indent=2))
