"""Validate Agent-authored content events. No ASR, models, rendering or aesthetic scoring."""
import argparse
import hashlib
import json
import math
import re
from pathlib import Path

ACTIONS = {'reveal', 'compose', 'emphasize', 'connect', 'compare', 'replace', 'media', 'feedback', 'hold', 'camera'}

def normalized(s):
    return re.sub(r'[\W_]+', '', s.casefold())

def number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)

def validate(plan):
    errors, warnings = [], []
    def fail(message): errors.append(message)
    if not isinstance(plan, dict):
        return {'status':'invalid','errors':['plan must be an object'],'warnings':[], 'visual_acceptance':False}
    duration, objects, sources, events = (plan.get(k) for k in ('duration','objects','sources','events'))
    if plan.get('schema') != 'content-events/v1': fail('unsupported schema')
    if not number(duration) or duration <= 0: fail('duration must be positive'); duration = 0
    if not isinstance(objects, dict) or not objects: fail('objects must be a nonempty map'); objects = {}
    if not isinstance(sources, dict) or not sources: fail('sources must be a nonempty map'); sources = {}
    if not isinstance(events, list) or not events: fail('events must be nonempty'); events = []
    states = {}
    for name, obj in objects.items():
        if not isinstance(obj, dict) or 'initial' not in obj: fail(f'{name}: initial state required')
        else: states[name] = obj['initial']
    for name, src in sources.items():
        if not isinstance(src, dict) or src.get('role') not in {'evidence','explanation','context'} or not src.get('description'):
            fail(f'{name}: source needs role and description')
    seen, last_time, meanings, object_end = {}, -1, {}, {}
    advancing = []
    for index, event in enumerate(events):
        if not isinstance(event, dict): fail(f'event {index}: must be object'); continue
        eid = event.get('id')
        if not isinstance(eid, str) or not eid or eid in seen: fail(f'event {index}: missing/duplicate id'); continue
        time, end = event.get('at'), event.get('end')
        if not number(time) or not number(end) or not (0 <= time < end <= duration):
            fail(f'{eid}: invalid interval'); continue
        if time < last_time: fail(f'{eid}: events must be time ordered')
        last_time = time
        obj, action = event.get('object'), event.get('action')
        if not isinstance(obj,str) or obj not in states: fail(f'{eid}: unknown object'); continue
        if not isinstance(action,str) or action not in ACTIONS: fail(f'{eid}: unknown action'); continue
        meaning = event.get('meaning')
        if not isinstance(meaning,str) or not meaning.strip(): fail(f'{eid}: meaning required')
        if not isinstance(event.get('focus'),str) or not event['focus'].strip(): fail(f'{eid}: one named focus required')
        refs = event.get('source_refs')
        if not isinstance(refs,list) or not refs or any(not isinstance(r,str) or r not in sources for r in refs):
            fail(f'{eid}: missing/unknown source reference')
        if 'before' not in event or 'after' not in event: fail(f'{eid}: explicit before/after required'); continue
        if event['before'] != states[obj]: fail(f'{eid}: before state breaks continuity for {obj}')
        if time < object_end.get(obj,0): fail(f'{eid}: overlapping state ownership for {obj}; split independent properties into named objects')
        semantic = action not in {'camera','hold'}
        if semantic and event['before'] == event['after']: fail(f'{eid}: action has no declared content change')
        if not semantic:
            if event['before'] != event['after']: fail(f'{eid}: camera/hold must not pretend to change content')
            if not event.get('reason'): fail(f'{eid}: hold/camera needs reason')
        if action == 'camera' and not event.get('target'): fail(f'{eid}: camera needs target')
        if action == 'feedback':
            result = seen.get(event.get('result_of')) if isinstance(event.get('result_of'),str) else None
            if not result or result['action'] in {'camera','hold','feedback'} or result['end'] > time:
                fail(f'{eid}: feedback must follow a completed content event')
        readable = event.get('readable')
        if readable is not None:
            if not isinstance(readable,list) or len(readable)!=2 or not all(number(v) for v in readable) or not end <= readable[0] < readable[1] <= duration:
                fail(f'{eid}: readable interval must follow completion')
        if event.get('claims_evidence') and isinstance(refs,list):
            if not any(isinstance(sources.get(r),dict) and sources[r].get('role')=='evidence' for r in refs if isinstance(r,str)):
                fail(f'{eid}: context/explanation cannot be claimed as factual evidence')
        if isinstance(meaning,str) and semantic:
            key = normalized(meaning)
            if key in meanings: warnings.append(f'{eid}: repeated meaning; review against {meanings[key]}')
            meanings[key] = eid
        states[obj] = event['after']; seen[eid] = event; object_end[obj] = end
        if semantic: advancing.append(event)
    if not advancing: fail('no content-changing events; movement alone is not progression')
    # Warnings prompt review; reading holds are legitimate, not a mandatory motion quota.
    for prev, nxt in zip(advancing, advancing[1:]):
        if nxt['at']-prev['end'] > 2:
            warnings.append(f"{prev['id']} -> {nxt['id']}: >2s without declared content change; check reading/pause purpose")
    copies = plan.get('screen_copy', [])
    if not isinstance(copies,list): fail('screen_copy must be a list'); copies=[]
    valid_copy=[]
    for item in copies:
        if not isinstance(item,dict) or not isinstance(item.get('text'),str) or not number(item.get('start')) or not number(item.get('end')) or not 0 <= item['start'] < item['end'] <= duration:
            fail('invalid screen_copy interval/text'); continue
        valid_copy.append(item)
    for i,a in enumerate(valid_copy):
        for b in valid_copy[i+1:]:
            if max(a['start'],b['start']) < min(a['end'],b['end']) and normalized(a['text']) and normalized(a['text'])==normalized(b['text']):
                warnings.append('simultaneous duplicate copy: '+a['text'])
    return {'status':'invalid' if errors else 'declared_contract_passed','errors':errors,'warnings':warnings,
            'content_event_count':len(advancing),'visual_acceptance':False,'playback_verified':False,
            'scope':'Declared state/source/timing only; Agent reviews semantics, rendered pixels and audio separately.'}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['check','compile'])
    parser.add_argument('plan',type=Path); parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--shotbook',type=Path)
    args=parser.parse_args()
    raw=args.plan.read_bytes();plan=json.loads(raw);report=validate(plan)
    if args.command=='compile' and not report['errors']:
        report={'schema':'content-event-score/v1','status':'planned_not_wired','plan_sha256':hashlib.sha256(raw).hexdigest(),
                'duration':plan['duration'],'events':plan['events'],'validation':report}
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    if args.shotbook and not report.get('errors') and report.get('status')!='invalid':
        rows=['# Content event plan','', 'Plan only: not wiring, rendering or acceptance evidence.', '', '| Time | Event | Focus | New understanding |', '|---|---|---|---|']
        for e in plan['events']:
            clean=lambda s:str(s).replace('|','/').replace('\n',' ')
            rows.append(f"| {e['at']}–{e['end']} | {clean(e['id'])} / {clean(e['action'])} | {clean(e['focus'])} | {clean(e['meaning'])} |")
        args.shotbook.parent.mkdir(parents=True,exist_ok=True);args.shotbook.write_text('\n'.join(rows)+'\n')
    print(json.dumps({'status':report['status'],'out':str(args.out)},ensure_ascii=False))
    return 1 if report.get('status')=='invalid' else 0

if __name__=='__main__':
    raise SystemExit(main())
