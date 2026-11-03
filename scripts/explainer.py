"""Small, explicit semantic recipes. Agent supplies meaning; SRT supplies time.

No keyword-to-template classifier, model, ASR or network calls.
"""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys
import wave
from array import array
from open_direction import parse_srt, is_frame_image

SKILL = Path(__file__).resolve().parents[1]
RECIPES = {
    'split': ('DocumentSplit', 'document', ['ClaySurface', 'CameraStage']),
    'filter': ('DocumentFilter', 'document', ['ClaySurface', 'CameraStage']),
    'feedback': ('FlowFeedback', 'flow', ['ClaySurface', 'CameraStage', 'curve']),
    'spatial': ('SpatialExplanation', 'spatial', ['rendered-mesh-3d']),
    'show': ('MediaView', 'media', ['local-image-or-video']),
}


def action_window(event, refs, part_count):
    """Speech/read duration does not stretch a UI action into slow motion."""
    start, end = min(c['start'] for c in refs), max(c['end'] for c in refs)
    anchor = event.get('action_cue')
    if anchor:
        matches=[c for c in refs if c['id']==anchor]
        if not matches:raise ValueError('Action cue must belong to the semantic event')
        start=matches[0]['start']
    defaults={'split':min(1.4,.5+.2*part_count),'filter':.85,'feedback':1.05,'spatial':2.2,'show':.45}
    seconds=event.get('action_seconds',defaults[event['relation']])
    if not isinstance(seconds,(int,float)) or not math.isfinite(seconds) or seconds<=0:
        raise ValueError('Action seconds must be finite and positive')
    available=end-start
    orient=min(.3,available*.08)
    return [start+orient,start+orient+min(seconds,available*.65)]


def load(path):
    return json.loads(Path(path).read_text())


def write_new(path, value):
    path = Path(path)
    if path.exists():
        raise ValueError('Output exists; choose a new path: ' + str(path))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def validate_parts(view, label):
    if view.get('kind') not in {recipe[1] for recipe in RECIPES.values()}:
        raise ValueError('Unknown representation kind: '+label)
    parts=view.get('segments',[])
    if not isinstance(parts,list) or not 1<=len(parts)<=6:
        raise ValueError('This small renderer supports 1–6 content-bearing parts per view')
    ids=[p.get('id') for p in parts]
    if len(set(ids))!=len(ids) or not all(ids) or not all(isinstance(p.get('text'),str) and p['text'].strip() for p in parts):
        raise ValueError('Parts need unique ids and actual text')
    if any(len(p['text'])>24 for p in parts):
        raise ValueError('Part text exceeds this renderer reading capacity; simplify or use a custom scene')
    return set(ids)


def event_view(obj, event):
    name=event.get('view')
    if name is None:return obj
    if name not in obj.get('views',{}):raise ValueError('Unknown object view: '+str(name))
    return obj['views'][name]


def spatial_assembly(brief):
    """Resolve the same explicit representation used by compile/build for mesh input."""
    candidates = {}
    for event in brief.get('events', []):
        if event.get('relation') != 'spatial':
            continue
        obj = brief['objects'][event['object_id']]
        view = event_view(obj, event)
        if view.get('kind') != 'spatial':
            raise ValueError('Spatial event must select a spatial representation')
        key = (event['object_id'], event.get('view'))
        candidates[key] = {**view, 'owner': obj['owner']}
    if not candidates:
        candidates = {key: obj for key, obj in brief['objects'].items() if obj['kind'] == 'spatial'}
    if len(candidates) != 1:
        raise ValueError('This mesh recipe needs exactly one spatial representation')
    result = copy.deepcopy(next(iter(candidates.values())))
    validate_parts(result, 'mesh input')
    return result


def validate_media_view(view, media):
    if view['kind'] != 'media':
        return
    choice = view.get('media', {})
    validate_media_id(choice.get('asset_id'))
    if choice.get('asset_id') not in media:
        raise ValueError('Media view needs a declared local asset')
    if choice.get('fit', 'contain') not in ('contain', 'cover'):
        raise ValueError('Media fit must be contain or cover')
    start = choice.get('start_seconds', 0)
    if not isinstance(start, (int, float)) or isinstance(start, bool) or not math.isfinite(start) or start < 0:
        raise ValueError('Media start_seconds must be finite and nonnegative')


def validate_media_id(key):
    if not isinstance(key, str) or not key or not all(c.isalnum() or c in '-_' for c in key):
        raise ValueError('Media ids use letters, numbers, hyphens or underscores')


def compile_explanation(brief, srt, fps=30, duration=None):
    anchors = parse_srt(srt, fps, duration)
    cues = {c['id']: c for c in anchors['cues']}
    duration = duration or max(c['end'] for c in cues.values())
    if not brief.get('title') or brief.get('task') not in {'explanation', 'process', 'recount'}:
        raise ValueError('Declare title and task: explanation / process / recount')
    if not brief.get('source_note'):
        raise ValueError('Declare the content source and whether the timing is authored or recorded')
    objects = copy.deepcopy(brief.get('objects', {}))
    media = copy.deepcopy(brief.get('media', {}))
    for key, asset in media.items():
        validate_media_id(key)
        if asset.get('type') not in ('image', 'video') or not all(isinstance(asset.get(k), str) and asset[k].strip() for k in ('path', 'subject', 'source_note', 'caption')):
            raise ValueError('Media needs type, local path, subject, source_note and visible caption')
        if asset.get('role') not in ('evidence', 'context', 'explanation') or asset.get('reality') not in ('recorded', 'reconstructed', 'generated'):
            raise ValueError('Declare media role and reality')
        if asset['role'] == 'evidence' and asset['reality'] != 'recorded':
            raise ValueError('MEDIA_EVIDENCE_REQUIRES_RECORDED: generated/reconstructed media is illustrative')
    for key, obj in objects.items():
        if not obj.get('owner') or not obj.get('title'):
            raise ValueError('Object needs stable owner and title: ' + key)
        ids=validate_parts(obj,key)
        validate_media_view(obj, media)
        if not isinstance(obj.get('views',{}),dict):raise ValueError('Object views must be named representations')
        for name,view in obj.get('views',{}).items():
            view_ids=validate_parts(view,key+'.'+name)
            validate_media_view(view, media)
            if view.get('owner',obj['owner'])!=obj['owner']:raise ValueError('IDENTITY_CHANGED: a view cannot replace the content owner')
            for part in view['segments']:
                if part.get('content_id',part['id']) not in ids:
                    raise ValueError('View part must refer to existing source content: '+part['id'])
                if any(c not in cues for c in part.get('cue_ids',[])):raise ValueError('Unknown source cue in a view')
            for field in ('initial_state','screen_state'):
                if view.get(field) is not None and view[field] not in view_ids:raise ValueError('Unknown '+field+' in view '+name)
            modes={'flow':(None,'follow','overview'),'document':(None,),'spatial':(None,'part-relay'),'media':(None,)}
            if view.get('camera_mode') not in modes[view['kind']]:raise ValueError('Camera mode does not match the representation')
            for mark in view.get('emphasis',[]):
                if mark.get('part_id') not in view_ids or any(c not in cues for c in mark.get('cue_ids',[])):raise ValueError('Invalid source-bound emphasis')
    events, states, prior = [], {}, {}
    for event in brief.get('events', []):
        event = copy.deepcopy(event)
        relation, object_id = event.get('relation'), event.get('object_id')
        if relation not in RECIPES:
            raise ValueError('No production recipe for %r; supply a custom implementation, no card fallback' % relation)
        if object_id not in objects:
            raise ValueError('Unknown object: ' + str(object_id))
        obj = objects[object_id]
        view=event_view(obj,event)
        if view['kind'] != RECIPES[relation][1]:
            raise ValueError('Relation does not match the selected representation: ' + str(relation))
        if event.get('owner', obj['owner']) != obj['owner']:
            raise ValueError('IDENTITY_CHANGED: keep the object owner across handoffs')
        if not all(event.get(k) for k in ('id', 'meaning', 'before', 'after', 'cue_ids')):
            raise ValueError('Each event needs id, meaning, before, after and cue_ids')
        if object_id in states and event['before'] != states[object_id]:
            raise ValueError('STATE_HANDOFF_MISMATCH: ' + event['id'])
        if any(k not in cues for k in event['cue_ids']):
            raise ValueError('Unknown cue id')
        refs = [cues[k] for k in event['cue_ids']]
        start, end = min(c['start'] for c in refs), max(c['end'] for c in refs)
        if events and start < events[-1]['end'] - .001:
            raise ValueError('Overlapping event windows need an explicit custom composition')
        if end - start < 1.5:
            raise ValueError('Insufficient explanation/read window; merge cues or simplify')
        if relation == 'filter':
            if not event.get('selected_ids') or not set(event['selected_ids']) <= {p['id'] for p in view['segments']}:
                raise ValueError('Filter must select existing content parts')
            if len(event['selected_ids'])!=1:
                raise ValueError('This filter has one primary selection; use a custom layout for multiple results')
        if relation == 'split' and any(e['object_id']==object_id and e.get('view')==event.get('view') and e['relation']=='split' for e in events):
            raise ValueError('DOCUMENT_ALREADY_SPLIT: use an explicit custom fold/unfold rather than resetting the same view')
        if relation in ('feedback', 'show') and event['after'] not in {p['id'] for p in view['segments']}:
            raise ValueError('Feedback/media after-state must identify an actual content stage')
        if relation=='spatial':
            if view.get('camera_mode')=='part-relay' and not {event['before'],event['after']}<={p.get('content_id',p['id']) for p in view['segments']}:
                raise ValueError('Spatial handoff must identify the input and output content parts')
            asset_range=event.get('asset_range',[0,1])
            if not isinstance(asset_range,list) or len(asset_range)!=2 or not all(isinstance(v,(float,int)) and not isinstance(v,bool) and math.isfinite(v) and 0<=v<=1 for v in asset_range) or asset_range[0]==asset_range[1]:
                raise ValueError('Spatial asset_range needs distinct endpoints within 0–1')
        window=action_window(event,refs,len(view['segments']))
        event.update(start=start, end=end, start_frame=math.floor(start*fps), end_frame=math.ceil(end*fps),
                     component=RECIPES[relation][0], uses=RECIPES[relation][2],
                     handoff_from=prior.get(object_id), owner=obj['owner'],
                     action_window=window,
                     readable_window=[window[1], end])
        if relation=='spatial':event['requires']='rendered-mesh-3d'
        states[object_id] = event['after']
        prior[object_id] = event['id']
        events.append(event)
    if not events or len({e['id'] for e in events}) != len(events):
        raise ValueError('Need events with unique ids')
    scenes=[]
    previous_key=None
    for event in events:
        name=event.get('view') or event['object_id']
        key=(event.get('view'),event['object_id'])
        if key!=previous_key:
            scenes.append({'id':'scene-'+str(len(scenes)+1),'view':name,'object_id':event['object_id'],'start':event['start'],'end':event['end'],'event_ids':[]})
        scenes[-1]['end']=event['end'];scenes[-1]['event_ids'].append(event['id'])
        event['scene_id']=scenes[-1]['id']
        previous_key=key
    scenes[0]['start']=0
    for i,scene in enumerate(scenes):scene['end']=scenes[i+1]['start'] if i+1<len(scenes) else duration
    audio = copy.deepcopy(brief.get('audio', {}))
    if audio.get('playback_rate', 1) != 1:
        raise ValueError('Source audio must remain 1x')
    audio.update(playback_rate=1)
    return {'schema': 'motion-explainer/v2' if any(o.get('views') for o in objects.values()) else 'motion-explainer/v1', 'title': brief['title'], 'task': brief['task'],
            'source_note': brief['source_note'], 'fps': fps, 'duration': duration,
            'duration_in_frames': math.ceil(duration*fps), 'objects': objects,
            'events': events, 'scenes':scenes, 'anchors': anchors, 'audio': audio, 'media':media,
            'theme': {'blue': '#2055C9', 'ink': '#162B36', 'paper': '#F3F7FC', 'green': '#C9F176'},
            'review': {'plan': 'compiled', 'wiring': 'not_checked', 'frames': 'not_checked',
                       'playback': 'not_checked', 'user_acceptance': 'pending'},
            'scope': 'Explicit Agent-authored semantic events; SRT timing compilation, not automatic semantic understanding.'}


def build_project(plan_path, dest, deps, audio=None, offset=0, audio_seconds=None, spatial=None):
    """Generate a small standalone project that imports the actual Skill components."""
    plan, dest, deps = load(plan_path), Path(dest).resolve(), Path(deps).resolve()
    if dest.exists():
        raise ValueError('Destination exists; choose a new project')
    for package in ('remotion', '@remotion/player', '@remotion/bundler', '@remotion/renderer', 'react', 'react-dom', 'esbuild', 'typescript'):
        if not (deps/package/'package.json').is_file():
            raise ValueError('Missing installed dependency: '+package)
    if plan.get('schema') not in ('motion-explainer/v1','motion-explainer/v2'):
        raise ValueError('Supply a compiled explanation plan')
    if any(e['relation']=='spatial' for e in plan['events']) and not spatial:
        raise ValueError('Spatial events require a real mesh render manifest (--spatial); no simulated-volume fallback')
    source_audio = Path(audio).resolve() if audio else None
    audio_seconds = audio_seconds or plan['duration']
    if source_audio:
        if not source_audio.is_file() or not math.isfinite(offset+audio_seconds) or offset<0 or audio_seconds<=0 or audio_seconds>plan['duration']:
            raise ValueError('Invalid local audio excerpt')
        ffprobe, ffmpeg = shutil.which('ffprobe'), shutil.which('ffmpeg')
        if not ffprobe or not ffmpeg: raise ValueError('ffmpeg/ffprobe are required for a local 1x excerpt')
        metadata=json.loads(subprocess.check_output([ffprobe,'-v','error','-show_format','-show_streams','-of','json',str(source_audio)]))
        if not any(s['codec_type']=='audio' for s in metadata['streams']) or offset+audio_seconds>float(metadata['format']['duration'])+.02:
            raise ValueError('Audio excerpt exceeds the actual source')
    # Validate every used asset before creating a project; unused/private files stay out.
    used_media = {}
    for event in plan['events']:
        view = event_view(plan['objects'][event['object_id']], event)
        if view['kind'] != 'media':
            continue
        key = view['media']['asset_id']
        asset = copy.deepcopy(plan.get('media', {}).get(key, {}))
        validate_media_view(view, plan.get('media', {}))
        source = Path(asset.get('path', '')).resolve()
        if not source.is_file():
            raise ValueError('Missing local media: ' + key)
        if asset.get('type') == 'image':
            if not is_frame_image(source):
                raise ValueError('Supply an actual PNG/JPEG image: ' + key)
        elif asset.get('type') == 'video':
            probe = shutil.which('ffprobe')
            if not probe:
                raise ValueError('ffprobe is required to validate local video')
            info = json.loads(subprocess.check_output([probe, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(source)]))
            if not any(s['codec_type'] == 'video' for s in info['streams']):
                raise ValueError('Media has no video stream: ' + key)
            asset['duration'] = float(info['format']['duration'])
            if view['media'].get('start_seconds', 0) + event['end'] - event['start'] > asset['duration'] + .05:
                raise ValueError('Media excerpt exceeds local video: ' + key)
        else:
            raise ValueError('Unsupported local media type: ' + key)
        asset['sha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
        asset['url'] = 'assets/media/' + key + source.suffix.lower()
        used_media[key] = asset
    dest.mkdir(parents=True)
    (dest/'src/production').mkdir(parents=True)
    (dest/'public/assets').mkdir(parents=True)
    (dest/'node_modules').symlink_to(deps, target_is_directory=True)
    for asset in used_media.values():
        target = dest/'public'/asset['url']
        if not target.resolve().is_relative_to((dest/'public/assets/media').resolve()):
            raise ValueError('Media destination must stay inside the new project')
        target.parent.mkdir(parents=True, exist_ok=True)
        with Path(asset['path']).open('rb') as source, target.open('xb') as output:
            shutil.copyfileobj(source, output)
    plan['media'] = used_media
    origin=SKILL/'assets/runtime/src/production'
    used=['ExplanationFilm.tsx','explanation-types.ts','Mechanisms.tsx','motion.ts','ip-motion.tsx']
    for name in used: shutil.copy2(origin/name,dest/'src/production'/name)
    shutil.copy2(SKILL/'assets/runtime/src/react-dom-client.d.ts',dest/'src/react-dom-client.d.ts')
    if spatial:
        manifest_path=Path(spatial).resolve();asset=load(manifest_path)
        if asset.get('representation')!='rendered-mesh-3d' or not asset.get('frames'):
            raise ValueError('Expected an actual rendered-mesh-3d asset')
        target=dest/'public/assets/spatial';target.mkdir()
        representations=[event_view(plan['objects'][e['object_id']],e) for e in plan['events'] if e['relation']=='spatial']
        expected_ids={p['id'] for view in representations for p in view['segments']}
        for frame in asset['frames']:
            source=(manifest_path.parent/frame['file']).resolve()
            if not source.is_relative_to(manifest_path.parent) or not source.is_file():raise ValueError('Missing or unsafe 3D frame')
            if not expected_ids<={p['id'] for p in frame['parts']}:raise ValueError('3D parts do not correspond to explanation content')
            shutil.copy2(source,target/source.name);frame['file']='assets/spatial/'+source.name
        plan['spatial']=asset
    if source_audio:
        out=dest/'public/assets/voice.wav'
        stream=next(s for s in metadata['streams'] if s['codec_type']=='audio')
        subprocess.run([ffmpeg,'-v','error','-n','-i',str(source_audio),'-ss',str(offset),'-t',str(audio_seconds),'-vn',
                        '-ar',str(stream['sample_rate']),'-ac',str(stream['channels']),'-c:a','pcm_s16le',str(out)],check=True)
        plan['audio'].update(url='assets/voice.wav',source_sha256=hashlib.sha256(source_audio.read_bytes()).hexdigest(),
                             source_offset=offset,excerpt_seconds=audio_seconds,playback_rate=1)
        with wave.open(str(out),'rb') as wav:
            samples=array('h',wav.readframes(wav.getnframes()))
            if sys.byteorder!='little':samples.byteswap()
            step=max(1,round(wav.getframerate()*wav.getnchannels()/plan['fps']))
            values=[math.sqrt(sum(s*s for s in samples[i:i+step])/len(samples[i:i+step])) for i in range(0,len(samples),step)]
            peak=max(values) or 1
            plan['audio']['envelope']=[round(v/peak,4) for v in values]
    write_new(dest/'src/plan.json',plan)
    write_new(dest/'package.json',{'name':'motion-semantic-explanation','private':True,'scripts':{
        'check':'tsc --noEmit','build':'esbuild src/player.tsx --bundle --outfile=public/player.js',
        'studio':'remotion studio src/render.tsx --no-open'},
        'dependencies':{name:load(deps/name/'package.json')['version'] for name in ('remotion','@remotion/player','@remotion/bundler','@remotion/renderer','react','react-dom')},
        'devDependencies':{name:load(deps/name/'package.json')['version'] for name in ('esbuild','typescript')}})
    write_new(dest/'tsconfig.json',{'compilerOptions':{'target':'ES2020','module':'ESNext','moduleResolution':'Bundler','jsx':'react-jsx',
        'strict':True,'noEmit':True,'resolveJsonModule':True,'esModuleInterop':True,'skipLibCheck':True,'lib':['ES2020','DOM']},'include':['src']})
    (dest/'src/render.tsx').write_text("import React from 'react';\nimport {Composition,registerRoot} from 'remotion';\nimport {ExplanationFilm} from './production/ExplanationFilm';\nimport {ExplanationPlan} from './production/explanation-types';\nimport data from './plan.json';\nconst plan=data as unknown as ExplanationPlan;\nconst Root=()=> <Composition id=\"Explanation\" component={ExplanationFilm} width={1600} height={900} fps={plan.fps} durationInFrames={plan.duration_in_frames} defaultProps={{plan}}/>;\nregisterRoot(Root);\n")
    player_source = SKILL/'assets/explainer-player.tsx'
    shutil.copy2(player_source, dest/'src/player.tsx')
    (dest/'public/index.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Motion · 可复用解释</title><style>body{margin:0;background:#F3F7FC}#root{width:100%;min-height:100vh;display:grid;align-items:start}button{font:inherit}</style><div id="root"></div><script>window.remotion_staticBase=new URL(".",location.href).pathname.replace(/\\/$/,"");</script><script src="player.js"></script></html>')
    write_new(dest/'provenance.json',{'plan_sha256':hashlib.sha256(Path(plan_path).read_bytes()).hexdigest(),
        'runtime_sources':[{'file':str(origin/name),'sha256':hashlib.sha256((origin/name).read_bytes()).hexdigest()} for name in used],
        'audio':plan['audio'],'media':used_media,'source_note':plan['source_note'],'model_calls':0,'asr_calls':0,'network_calls':0,'user_acceptance':'pending'})
    return {'project':str(dest),'entry':'src/render.tsx','preview':'public/index.html','status':'generated_not_visually_reviewed'}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('recipes',help='List the small implemented recipe set; unsupported meanings remain custom')
    mesh_cmd=commands.add_parser('mesh',help='Render one procedural clay assembly using an explicitly supplied local Blender')
    mesh_cmd.add_argument('brief')
    mesh_cmd.add_argument('--blender',required=True)
    mesh_cmd.add_argument('--dest',required=True)
    mesh_cmd.add_argument('--frames',type=int,default=64)
    compile_cmd = commands.add_parser('compile')
    compile_cmd.add_argument('brief')
    compile_cmd.add_argument('--srt', required=True)
    compile_cmd.add_argument('--fps', type=float, default=30)
    compile_cmd.add_argument('--duration', type=float)
    compile_cmd.add_argument('--out', required=True)
    build_cmd=commands.add_parser('build')
    build_cmd.add_argument('plan')
    build_cmd.add_argument('--dest',required=True)
    build_cmd.add_argument('--deps',required=True)
    build_cmd.add_argument('--audio')
    build_cmd.add_argument('--offset',type=float,default=0)
    build_cmd.add_argument('--audio-seconds',type=float)
    build_cmd.add_argument('--spatial')
    args = parser.parse_args(argv)
    if args.command=='recipes':
        print(json.dumps({'recipes':[{ 'relationship':r,'component':v[0],'object_kind':v[1],'uses':v[2]} for r,v in RECIPES.items()],
                          'scope':'Implemented bounded examples, not an exhaustive animation selector. Use direction catalog/select and a custom scene for other relationships.'},ensure_ascii=False,indent=2))
        return 0
    if args.command=='mesh':
        blender=Path(args.blender).expanduser().resolve()
        if not blender.is_file():raise ValueError('Supply the existing local Blender executable; no automatic install')
        subprocess.run([str(blender),'--background','--factory-startup','--python',str(SKILL/'scripts/render_clay_mesh.py'),
                        '--','--brief',str(Path(args.brief).resolve()),'--dest',str(Path(args.dest).resolve()),'--frames',str(args.frames)],check=True)
        return 0
    if args.command=='build':
        print(json.dumps(build_project(args.plan,args.dest,args.deps,args.audio,args.offset,args.audio_seconds,args.spatial),ensure_ascii=False))
        return 0
    brief = load(args.brief)
    for asset in brief.get('media', {}).values():
        path = Path(asset.get('path', ''))
        if not path.is_absolute():
            asset['path'] = str((Path(args.brief).resolve().parent/path).resolve())
    result = compile_explanation(brief, args.srt, args.fps, args.duration)
    write_new(args.out, result)
    print(json.dumps({'output': args.out, 'events': len(result['events']), 'status': 'compiled_not_visually_reviewed'}))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(2)
