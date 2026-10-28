#!/usr/bin/env python3
"""Read-only checks for declared handoff timing, media preparation and UI evidence role."""
import argparse
import json
import math
from pathlib import Path

def validate(plan):
    errors=[]
    def fail(item,reason):errors.append(f'{item}: {reason}')
    def number(n):return isinstance(n,(int,float)) and not isinstance(n,bool) and math.isfinite(n)
    fps=plan.get('fps')
    if not number(fps) or fps<=0:return {'status':'blocked','blocking':['FPS_REQUIRED']}
    if plan.get('version')!=1:fail('plan','UNSUPPORTED_CONTRACT_VERSION')
    clock=plan.get('clock')
    if clock!='composition':fail('plan','COMPOSITION_CLOCK_REQUIRED')
    boundaries=plan.get('boundaries')
    if not isinstance(boundaries,list) or not boundaries:return {'status':'blocked','blocking':errors+['BOUNDARIES_REQUIRED']}
    ids=set()
    for row in boundaries:
        item=row.get('id','unnamed')
        if not item or item in ids:fail(item,'UNIQUE_HANDOFF_ID_REQUIRED')
        ids.add(item)
        if row.get('clock')!=clock or row.get('usesMountClock') is not False:fail(item,'INDEPENDENT_CLOCK_NOT_ALLOWED')
        if not row.get('geometryOwner') or row.get('nestedInterpolation') is not False:fail(item,'ONE_RESOLVED_GEOMETRY_OWNER_REQUIRED')
        role=row.get('role');component_role=row.get('componentRole')
        if role not in ('process','result','context'):fail(item,'EVIDENCE_ROLE_REQUIRED')
        if component_role not in ('process-indicator','completion-indicator','neutral'):fail(item,'COMPONENT_ROLE_REQUIRED')
        if component_role=='completion-indicator' and (role!='result' or row.get('completionEvidence') is not True):fail(item,'COMPLETION_CANNOT_BE_INFERRED_FROM_PROCESS')
        if row.get('handoff') not in ('shared-carrier','complementary-mask','cut','crossfade'):fail(item,'HANDOFF_METHOD_REQUIRED')
        out=row.get('outgoing',{});incoming=row.get('incoming',{})
        values=[out.get('visibleUntil'),out.get('readableUntil'),incoming.get('visibleFrom'),incoming.get('readableFrom'),row.get('cameraFocusAt')]
        if not all(number(n) and n>=0 for n in values):fail(item,'FINITE_TIMING_REQUIRED');continue
        visible_out,read_out,visible_in,read_in,camera_at=values
        tolerance=1/fps
        if read_out>visible_out or visible_in>read_in:fail(item,'INVALID_READABILITY_ORDER')
        if visible_out+tolerance<read_in:fail(item,'BLANK_OR_UNREADABLE_HANDOFF_GAP')
        if read_out>visible_out+tolerance:fail(item,'EXIT_BEFORE_OUTGOING_READING_COMPLETE')
        if camera_at+tolerance<read_in:fail(item,'CAMERA_ARRIVES_BEFORE_TARGET_READABLE')
        if 'mediaStart' in incoming:
            media=incoming.get('mediaStart');warm=incoming.get('premountSeconds',0)
            if not number(media) or not number(warm) or warm<0:fail(item,'INVALID_MEDIA_TIMING');continue
            if read_in+tolerance<media:fail(item,'MEDIA_NOT_AVAILABLE_AT_READABLE_TIME')
            alternatives=incoming.get('posterSourceMatches') is True or incoming.get('runtimeReadyGate') is True
            if warm<.5 and not alternatives:fail(item,'MEDIA_PREMOUNT_OR_VERIFIED_FALLBACK_REQUIRED')
    return {'status':'blocked' if errors else 'contract_valid_not_visual_acceptance','blocking':errors,
            'scope':'Declared plan only; inspect wiring, pixels and real waiting/resume events separately.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('plan',type=Path);parser.add_argument('--out',type=Path)
    args=parser.parse_args();result=validate(json.loads(args.plan.read_text()));output=json.dumps(result,ensure_ascii=False,indent=2)
    if args.out:args.out.write_text(output+'\n')
    print(output)
    raise SystemExit(1 if result['blocking'] else 0)
