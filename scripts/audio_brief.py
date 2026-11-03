"""Prepare an audio-led directing brief. No model calls, ASR, upload or render."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

SKILL = Path(__file__).resolve().parents[1]
RUNTIME = ['DirectedPolish.tsx', 'SoftClay.tsx', 'Mechanisms.tsx', 'motion.ts']

def fingerprint(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

def prepare(audio, destination, prompt='', preview_seconds=20):
    audio, out = Path(audio).expanduser().resolve(), Path(destination).expanduser().resolve()
    if not audio.is_file():
        raise ValueError('Audio source does not exist')
    if out.exists():
        raise ValueError('Destination exists; preserve it and choose a new run')
    if not 0 < preview_seconds <= 600:
        raise ValueError('Preview duration must be within 0..600 seconds')
    binary = shutil.which('ffprobe')
    if not binary:
        raise ValueError('ffprobe unavailable; no project created')
    result = subprocess.run([binary, '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(audio)], capture_output=True, text=True, check=True, timeout=60)
    media = json.loads(result.stdout)
    if not any(s.get('codec_type') == 'audio' for s in media.get('streams', [])):
        raise ValueError('Source contains no audio stream')
    duration = float(media['format']['duration'])
    if not 0 < duration < 86400:
        raise ValueError('Invalid audio duration')
    profile = json.loads((SKILL/'references/directed-profile.json').read_text())
    local = SKILL/'.local/accepted-motion.json'
    baseline = json.loads(local.read_text()) if local.is_file() else None
    brief = {'schema_version':1, 'status':'prepared_not_film',
        'source':{'path':str(audio),'sha256':fingerprint(audio),'duration_seconds':duration,'playback_rate':1},
        'request':prompt,'profile':profile,'local_reference':baseline,
        'preview':{'requested_seconds':min(preview_seconds,duration),'range_status':'agent_must_choose_complete_meaning'},
        'transcript':{'status':'lookup_cache_then_verify','invent_text':False},
        'shots':[], 'acceptance':{'technical':'pending','visual':'pending','user':'pending'},
        'next':'Verify transcript; design content-specific events; import actual components; build and watch Playground. Do not substitute the previous film text or timings.'}
    out.mkdir(parents=True)
    (out/'brief.json').write_text(json.dumps(brief,ensure_ascii=False,indent=2)+'\n')
    (out/'DIRECTOR.md').write_text((SKILL/'references/audio-directed-prompt.md').read_text())
    target = out/'src/production'; target.mkdir(parents=True)
    for name in RUNTIME:
        shutil.copy2(SKILL/'assets/runtime/src/production'/name, target/name)
    return {'created':str(out),'status':'prepared_not_film','source_sha256':brief['source']['sha256'],
        'duration_seconds':duration,'runtime_files':RUNTIME,'asr_calls':0,'model_calls':0,'rendered':False}

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--audio',required=True); p.add_argument('--out',required=True)
    p.add_argument('--prompt-file'); p.add_argument('--preview-seconds',type=float,default=20)
    a=p.parse_args(argv)
    prompt=Path(a.prompt_file).read_text() if a.prompt_file else ''
    print(json.dumps(prepare(a.audio,a.out,prompt,a.preview_seconds),ensure_ascii=False,indent=2))
    return 0

if __name__=='__main__': main()
