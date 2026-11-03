"""Local inputs and review for Agent-directed films. No models or network calls.

The Agent supplies semantic judgments and candidates. This module parses clocks,
exposes the whole catalog, checks declarations and records inspected actual work.
"""
import argparse
from decimal import Decimal, ROUND_FLOOR, ROUND_CEILING
import hashlib
import json
import math
import os
from pathlib import Path
import re
from capabilities import inventory, resolved, lookup, wiring_errors
from scene_layout import check_layout

ROOT = Path(__file__).resolve().parents[1]
MEDIA = {'.mp4', '.mov', '.webm', '.m4v', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.wav', '.mp3', '.m4a'}
SKIP = {'node_modules', '.git', '.local', '__pycache__', '.cache'}


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')


def parse_srt(path, fps=30, duration=None):
    fps = Decimal(str(fps))
    if not fps.is_finite() or fps <= 0:
        raise ValueError('fps must be finite and positive')
    if duration is not None and (not math.isfinite(duration) or duration <= 0):
        raise ValueError('duration must be finite and positive')
    text = Path(path).read_text(encoding='utf-8-sig').replace('\r\n', '\n').replace('\r', '\n').strip()
    if not text:
        raise ValueError('Empty SRT')
    stamp = r'(\d{2,}):([0-5]\d):([0-5]\d)[,.](\d{3})'
    timing = re.compile(r'^' + stamp + r'\s*-->\s*' + stamp + r'\s*$')
    cues, warnings = [], []
    for i, block in enumerate(re.split(r'\n[ \t]*\n', text)):
        lines = block.splitlines()
        if lines and lines[0].strip().isdigit():
            lines = lines[1:]
        match = timing.fullmatch(lines[0].strip()) if lines else None
        if not match or len(lines) < 2 or not '\n'.join(lines[1:]).strip():
            raise ValueError(f'Invalid SRT block {i + 1}')
        nums = list(map(int, match.groups()))
        def seconds(values):
            h, m, s, ms = values
            return Decimal(h * 3600 + m * 60 + s) + Decimal(ms) / 1000
        start, end = seconds(nums[:4]), seconds(nums[4:])
        if end <= start:
            raise ValueError(f'Non-positive SRT interval {i + 1}')
        if cues and float(start) < cues[-1]['start']:
            raise ValueError(f'Unordered SRT block {i + 1}')
        if duration is not None and end > Decimal(str(duration)):
            raise ValueError(f'SRT exceeds source duration at block {i + 1}')
        if cues and float(start) < cues[-1]['end']:
            warnings.append(f'Overlapping cues {i} and {i + 1}; inspect speaker overlap')
        cues.append({'id': f'cue-{i + 1}', 'start': float(start), 'end': float(end),
                     'start_frame': int((start * fps).to_integral_value(rounding=ROUND_FLOOR)),
                     'end_frame': int((end * fps).to_integral_value(rounding=ROUND_CEILING)),
                     'text': '\n'.join(lines[1:]).strip()})
    return {'version': 1, 'source': str(Path(path).resolve()), 'source_sha256': digest(path),
            'enabled': True, 'fps': float(fps), 'cues': cues, 'warnings': warnings, 'alignment_verified': False,
            'scope': 'Parsed supplied subtitle timing only; no ASR, forced alignment, semantic grouping or shot generation.'}


def index_assets(roots):
    """Explicit roots only. Does not follow symlinks or infer rights/meaning."""
    files = {}
    for value in roots:
        root = Path(value).expanduser().resolve()
        if not root.is_dir():
            raise ValueError(f'Missing asset root: {root}')
        candidates = []
        for folder, dirs, names in os.walk(root, followlinks=False):
            dirs[:] = sorted(d for d in dirs if d not in SKIP and not d.startswith('.') and not (Path(folder) / d).is_symlink())
            candidates.extend(Path(folder) / name for name in sorted(names))
        for p in candidates:
            rel = p.relative_to(root)
            if any(part in SKIP or part.startswith('.') for part in rel.parts):
                continue
            if p.is_symlink() or not p.is_file() or p.suffix.lower() not in MEDIA:
                continue
            if any(parent.is_symlink() for parent in p.parents if parent != root and root in parent.parents):
                continue
            resolved = p.resolve()
            if not resolved.is_relative_to(root):
                continue
            files[str(resolved)] = {'path': str(resolved), 'root': str(root), 'relative_path': str(rel),
                                    'bytes': p.stat().st_size, 'kind': p.suffix.lower()[1:],
                                    'inspected': False, 'rights': 'unconfirmed', 'role': 'unassigned'}
    return {'version': 1, 'roots': [str(Path(r).expanduser().resolve()) for r in roots],
            'assets': list(files.values()), 'scope': 'Filename inventory only. Agent must inspect content, scope and rights before use.'}


def browse(query='', limit=12):
    catalog = read(ROOT / 'references/catalog.json')
    adapters = read(ROOT / 'references/production-registry.json')['adapters']
    by_study = {}
    for adapter in adapters:
        by_study.setdefault(adapter['study_id'], []).append(adapter)
    terms = query.casefold().split()
    rows = []
    for entry in catalog['effects']:
        hay = json.dumps(entry, ensure_ascii=False).casefold()
        score = sum(term in hay for term in terms)
        if terms and not score:
            continue
        rows.append({**entry, 'adapters': by_study.get(entry['id'], []), 'query_hits': score})
    rows.sort(key=lambda row: (-row['query_hits'], row['id']))
    extra = []
    for row in inventory():
        if row['type']=='study':
            continue
        score=sum(term in json.dumps(row,ensure_ascii=False).casefold() for term in terms)
        if not terms or score:
            extra.append({**row,'query_hits':score})
    extra.sort(key=lambda row:(-row['query_hits'],str(row['id'])))
    pick=lambda values:values[:limit] if limit else values
    return {'matches':len(rows),'effect_matches':len(rows),'total_matches':len(rows)+len(extra),
            'effects':pick(rows),'components':pick([r for r in extra if r['type']=='component']),
            'compositions':pick([r for r in extra if r['type']=='composition']),
            'icons':pick([r for r in extra if r['type']=='icon']),
            'examples':pick([r for r in extra if r['type']=='example']),
            'scope':'Unified local retrieval. Research recipes and browser parts still require adaptation; inventory is not invocation.'}



def history_records(path):
    if path is None or not Path(path).exists():
        return []
    runs = {}
    for line in Path(path).read_text().splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if row.get('event') == 'feedback':
            if row['run_id'] in runs:
                runs[row['run_id']].setdefault('feedback', {}).update(row['dimensions'])
                runs[row['run_id']]['feedback_note'] = row['note']
        else:
            runs[row['run_id']] = row
    return list(runs.values())


def select(plan, history=None):
    """Rank only candidates whose suitability the Agent has explicitly assessed."""
    recent = history_records(history)[-8:]
    used = [shot for film in recent for shot in film['actual_shots']]
    blocking, warnings, shots = [], [], []
    duration = plan.get('duration')
    if not isinstance(duration, (float, int)) or isinstance(duration, bool) or not math.isfinite(duration) or duration <= 0:
        raise ValueError('Positive finite duration required')
    seen = set()
    anchors = plan.get('anchors', {}).get('cues', [])
    cue_ids = {cue['id'] for cue in anchors}
    cue_map = {cue['id']: cue for cue in anchors}
    if len(cue_ids) != len(anchors):
        blocking.append('DUPLICATE_CUE_IDS')
    for cue in anchors:
        a, b = cue.get('start'), cue.get('end')
        if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in (a, b)) or not 0 <= a < b <= duration:
            blocking.append('INVALID_CUE_INTERVAL_' + str(cue['id']))
    concepts = plan.get('concepts', [])
    if not concepts or any(not c.get('idea') or not c.get('tradeoff') for c in concepts):
        blocking.append('CONCEPT_AND_TRADEOFF_REQUIRED')
    if plan.get('selected_concept') not in {c.get('id') for c in concepts} or not plan.get('concept_reason'):
        blocking.append('CONCEPT_CHOICE_AND_REASON_REQUIRED')
    if len({c.get('id') for c in concepts}) != len(concepts) or len({str(c.get('idea', '')).strip() for c in concepts}) != len(concepts):
        blocking.append('DUPLICATE_CONCEPTS')
    covered_until = 0
    previous_start = -1
    for index, shot in enumerate(plan.get('shots', [])):
        sid = shot.get('id', str(index))
        def fail(message):
            blocking.append(f'{sid}: {message}')
        if sid in seen:
            fail('DUPLICATE_ID')
        seen.add(sid)
        for field in ('meaning', 'relationship', 'before', 'after', 'focus_object', 'composition', 'medium', 'action'):
            if not shot.get(field):
                fail('MISSING_' + field.upper())
        start, end = shot.get('start'), shot.get('end')
        valid = all(isinstance(v, (float, int)) and not isinstance(v, bool) and math.isfinite(v) for v in (start, end)) and 0 <= start < end <= duration
        if not valid:
            fail('INVALID_INTERVAL')
        else:
            if start > covered_until or start < previous_start:
                fail('UNCOVERED_OR_UNORDERED_TIMELINE')
            covered_until = max(covered_until, end)
            previous_start = start
        for cue in shot.get('cue_ids', []):
            if cue not in cue_ids:
                fail('UNKNOWN_CUE_' + str(cue))
            elif valid and all(isinstance(cue_map[cue].get(k), (int, float)) for k in ('start', 'end')):
                if not (start < cue_map[cue]['end'] and end > cue_map[cue]['start']) and not shot.get('anchor_offset_reason'):
                    fail('CUE_DOES_NOT_OVERLAP_SHOT_' + str(cue))
        if anchors and not shot.get('cue_ids') and not shot.get('timing_reason'):
            fail('CUE_ANCHOR_OR_TIMING_REASON_REQUIRED')
        reading = shot.get('reading', {})
        times = [reading.get(k) for k in ('ready_at', 'until', 'min_seconds')]
        if not (valid and all(isinstance(t, (float, int)) and math.isfinite(t) for t in times)
                and start <= times[0] < times[1] <= end and times[2] > 0 and times[1] - times[0] + 1e-9 >= times[2]
                and reading.get('basis')):
            fail('READ_WINDOW_AND_BASIS_REQUIRED')
        candidates = []
        for c in shot.get('candidates', []):
            if c.get('suitable') is not True or not c.get('reason'):
                continue
            kind, cid = c.get('type'), c.get('id')
            implementation,state=resolved(c)
            if kind == 'custom' and isinstance(cid,str) and c.get('design'):
                implementation,state=None,'implementation_required'
            elif state is None:
                fail('INVALID_CANDIDATE_'+str(cid))
                continue
            required=c.get('representation')
            resource=lookup('component' if kind=='adapter' else kind,cid)
            if required and kind!='custom' and (not resource or resource.get('representation','unspecified')!=required):
                fail('REPRESENTATION_NOT_PROVIDED_'+str(cid))
                continue
            if not isinstance(c.get('fit'), (int, float)) or isinstance(c['fit'], bool) or not math.isfinite(c['fit']) or not 0 <= c['fit'] <= 1:
                fail('FIT_MUST_BE_AGENT_ASSESSED_0_TO_1')
                continue
            repeats = sum(x.get('mechanism') == cid for x in used)
            candidates.append({**c, 'implementation': implementation, 'state': state, 'recent_uses': repeats})
        candidates.sort(key=lambda c: (-c['fit'], c['recent_uses']))
        if not candidates:
            fail('NO_SUITABLE_CANDIDATES')
        repeated = any(all(old.get(k) == shot.get(k) for k in ('composition', 'medium', 'action')) for old in used)
        if repeated and not shot.get('repeat_reason'):
            warnings.append(f'{sid}: composition/medium/action repeated; redesign or explain continuity')
        if index + 1 < len(plan.get('shots', [])):
            handoff = shot.get('handoff', {})
            nxt = plan['shots'][index + 1]
            if handoff.get('to') != nxt.get('id') or not handoff.get('reason'):
                fail('HANDOFF_REQUIRED')
            if handoff.get('kind') != 'cut':
                obj = handoff.get('object_id')
                if not obj or obj not in shot.get('object_ids', []) or obj not in nxt.get('object_ids', []):
                    fail('HANDOFF_OBJECT_LOST')
        selected_layers=[]
        layer_ids=set()
        for layer in shot.get('layers',[]):
            lid=layer.get('id')
            if not lid or lid in layer_ids:
                fail('INVALID_OR_DUPLICATE_LAYER_ID')
                continue
            layer_ids.add(lid)
            available=[]
            for c in layer.get('candidates',[]):
                if c.get('suitable') is not True or not c.get('reason'):
                    continue
                implementation,state=resolved(c)
                if c.get('type')=='custom' and c.get('design'):
                    implementation,state=None,'implementation_required'
                fit=c.get('fit')
                if state is None or not isinstance(fit,(int,float)) or isinstance(fit,bool) or not math.isfinite(fit) or not 0<=fit<=1:
                    fail('INVALID_LAYER_CANDIDATE_'+str(lid))
                    continue
                resource=lookup('component' if c.get('type')=='adapter' else c.get('type'),c.get('id'))
                if c.get('representation') and c.get('type')!='custom' and (not resource or resource.get('representation','unspecified')!=c['representation']):
                    fail('LAYER_REPRESENTATION_NOT_PROVIDED_'+str(lid))
                    continue
                available.append({**c,'implementation':implementation,'state':state})
            available.sort(key=lambda c:-c['fit'])
            if not available:
                fail('NO_SUITABLE_LAYER_'+str(lid))
            else:
                selected_layers.append({**layer,'selected':available[0],'alternatives':available[1:]})
        shots.append({**shot, 'selected': candidates[0] if candidates else None, 'alternatives': candidates[1:], 'selected_layers':selected_layers,'state': 'planned_not_wired'})
    if not shots:
        blocking.append('NO_SHOTS')
    if covered_until != duration:
        blocking.append('UNCOVERED_ENDING')
    feedback = [{'run_id': row['run_id'], 'dimensions': row['feedback'], 'note': row.get('feedback_note', '')}
                for row in recent if row.get('feedback')]
    return {'version': 2, 'duration': duration, 'shots': shots, 'blocking': blocking, 'warnings': warnings,
            'recent_feedback': feedback,
            'status': 'blocked' if blocking else 'ready_for_implementation',
            'scope': 'Agent-assessed candidates. No closed relation enum, random effect choice, automatic codegen or visual certification.'}


def is_frame_image(path):
    """Check PNG/JPEG container dimensions, not pixels or screenshot provenance."""
    with Path(path).open('rb') as stream:
        header = stream.read(24)
        if len(header) == 24 and header[:8] == b'\x89PNG\r\n\x1a\n' and header[12:16] == b'IHDR':
            return int.from_bytes(header[16:20], 'big') > 0 and int.from_bytes(header[20:24], 'big') > 0
        if header[:2] != b'\xff\xd8':
            return False
        stream.seek(2)
        while stream.read(1) == b'\xff':
            marker = stream.read(1)
            while marker == b'\xff':
                marker = stream.read(1)
            if not marker or marker[0] in (0xda, 0xd9):
                return False
            if marker[0] == 1 or 0xd0 <= marker[0] <= 0xd8:
                continue
            length_bytes = stream.read(2)
            if len(length_bytes) != 2:
                return False
            length = int.from_bytes(length_bytes, 'big')
            if length < 2:
                return False
            if marker[0] in (0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf):
                size = stream.read(5)
                return length >= 7 and len(size) == 5 and int.from_bytes(size[1:3], 'big') > 0 and int.from_bytes(size[3:5], 'big') > 0
            stream.seek(length - 2, 1)
    return False


def review(plan, project, actual):
    """Validate declared implementation evidence, not aesthetic acceptance."""
    root = Path(project).resolve()
    blocking, files = [], {}
    if plan.get('blocking') or plan.get('status') != 'ready_for_implementation':
        blocking.append('PLAN_NOT_READY')
    fps = actual.get('fps', 30)
    if not isinstance(fps, (float, int)) or isinstance(fps, bool) or not math.isfinite(fps) or fps <= 0:
        raise ValueError('Invalid observation fps')
    expected = {s['id']: s for s in plan.get('shots', [])}
    actual_shots = actual.get('shots', [])
    if len({s.get('id') for s in actual_shots}) != len(actual_shots):
        blocking.append('DUPLICATE_ACTUAL_SHOT')
    if set(expected) != {s.get('id') for s in actual_shots}:
        blocking.append('PLAN_ACTUAL_SHOT_IDS_DIFFER')
    if not actual_shots:
        blocking.append('NO_ACTUAL_SHOTS')
    normalized = []
    def local_file(value):
        path = (root / value).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError('Missing/nonlocal evidence: ' + str(value))
        files[str(path)] = digest(path)
        return path
    def fingerprint_source(path):
        """Conservative static imports/assets; dynamic paths still need dependencies."""
        if str(path) in scanned or path.suffix not in ('.ts', '.tsx', '.js', '.jsx'):
            return
        scanned.add(str(path))
        code = path.read_text()
        for module in re.findall(r'(?:from\s*|import\s*)[\"\'](\.[^\"\']+)[\"\']', code):
            target = (path.parent / module).resolve()
            choices = [target] + [Path(str(target) + ext) for ext in ('.ts', '.tsx', '.js', '.jsx', '.json')] + [target / 'index.ts', target / 'index.tsx']
            resolved = next((p for p in choices if p.is_file()), None)
            if resolved is None:
                raise ValueError('Missing dependency: ' + module)
            fingerprint_source(local_file(str(resolved)))
        for asset in re.findall(r'staticFile\(\s*[\"\']([^\"\']+)[\"\']\s*\)', code):
            local_file(str(root / 'public' / asset))
    def callable_binding(caller, implementation, symbol):
        """The declared implementation must be the module actually imported."""
        code=caller.read_text()
        imported=re.search(r'import\s*\{[^}]*\b'+re.escape(symbol)+r'\b[^}]*\}\s*from\s*[\"\']([^\"\']+)[\"\']',code) if symbol else None
        invoked=symbol and (re.search(r'<\s*'+re.escape(symbol)+r'\b',code) or re.search(r'component\s*=\s*\{\s*'+re.escape(symbol)+r'\s*\}',code))
        if not imported or not invoked:
            return 'NO_STATIC_IMPORT_AND_JSX_USAGE'
        if not imported.group(1).startswith('.'):
            return 'LOCAL_IMPLEMENTATION_IMPORT_REQUIRED'
        module=(caller.parent/imported.group(1)).resolve()
        if implementation not in [module,Path(str(module)+'.tsx'),Path(str(module)+'.ts'),module/'index.tsx',module/'index.ts']:
            return 'IMPORT_IMPLEMENTATION_MISMATCH'
        return None
    scanned = set()
    for dependency in actual.get('dependencies', []):
        try:
            fingerprint_source(local_file(dependency))
        except (OSError, ValueError) as error:
            blocking.append(str(error))
    for filename in ('package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'):
        if (root / filename).is_file():
            local_file(filename)
    for shot in actual_shots:
        spec = expected.get(shot.get('id'), {})
        try:
            caller = local_file(shot.get('caller', ''))
            implementation_file = local_file(shot.get('implementation', ''))
            fingerprint_source(caller)
            fingerprint_source(implementation_file)
            code = caller.read_text()
            binding_error=callable_binding(caller,implementation_file,shot.get('symbol',''))
            if binding_error:
                blocking.append(str(shot.get('id'))+': '+binding_error)
            for error in wiring_errors(spec.get('selected'),shot,implementation_file,code):
                blocking.append(str(shot.get('id'))+': '+error)
            frame = shot.get('observed_frame')
            if not isinstance(frame, (float, int)) or not spec.get('start', 0) <= frame / fps < spec.get('end', 0):
                blocking.append(str(shot.get('id')) + ': OBSERVATION_OUTSIDE_SHOT')
            evidence = local_file(shot.get('frame_evidence', ''))
            if not is_frame_image(evidence):
                blocking.append(str(shot.get('id')) + ': IMAGE_FRAME_EVIDENCE_REQUIRED')
        except (ValueError, OSError, UnicodeError, ZeroDivisionError) as error:
            blocking.append(str(error))
        for adaptation in shot.get('adaptations',[]):
            try:
                ac=local_file(adaptation.get('caller',''))
                ai=local_file(adaptation.get('implementation',''))
                af=local_file(adaptation.get('frame_evidence',''))
                fingerprint_source(ac);fingerprint_source(ai)
                if callable_binding(ac,ai,adaptation.get('symbol','')) or not is_frame_image(af):
                    blocking.append(str(shot.get('id'))+': ADAPTATION_CALL_AND_FRAME_REQUIRED')
            except (OSError,ValueError) as error:
                blocking.append(str(error))
        actual_layers={layer.get('id'):layer for layer in shot.get('layers',[])}
        if len(actual_layers)!=len(shot.get('layers',[])):
            blocking.append(str(shot.get('id'))+': DUPLICATE_ACTUAL_LAYER')
        for layer in spec.get('selected_layers',[]):
            evidence=actual_layers.get(layer['id'])
            if not evidence:
                blocking.append(str(shot.get('id'))+': MISSING_SELECTED_LAYER_'+layer['id'])
                continue
            try:
                lc=local_file(evidence.get('caller',shot.get('caller','')))
                li=local_file(evidence.get('implementation',''))
                fingerprint_source(lc);fingerprint_source(li)
                code=lc.read_text()
                binding_error=callable_binding(lc,li,evidence.get('symbol',''))
                if binding_error:
                    blocking.append(str(shot.get('id'))+': '+layer['id']+': '+binding_error)
                for error in wiring_errors(layer['selected'],evidence,li,code):
                    blocking.append(str(shot.get('id'))+': '+layer['id']+': '+error)
                frame=evidence.get('observed_frame',shot.get('observed_frame'))
                image=local_file(evidence.get('frame_evidence',shot.get('frame_evidence','')))
                if not is_frame_image(image) or not isinstance(frame,(int,float)) or not spec.get('start',0)<=frame/fps<spec.get('end',0):
                    blocking.append(str(shot.get('id'))+': LAYER_FRAME_REQUIRED_'+layer['id'])
                if layer['selected'].get('state')=='frame_binding_required' and not evidence.get('frame_binding'):
                    blocking.append(str(shot.get('id'))+': FRAME_BINDING_REQUIRED_'+layer['id'])
            except (OSError,ValueError) as error:
                blocking.append(str(error))
        selected = spec.get('selected') or {}
        if shot.get('mechanism') != selected.get('id') and not shot.get('change_reason'):
            blocking.append(str(shot.get('id')) + ': UNEXPLAINED_PLAN_CHANGE')
        if not shot.get('visual_note'):
            blocking.append(str(shot.get('id')) + ': VISUAL_OBSERVATION_REQUIRED')
        for key in ('composition', 'medium', 'action'):
            if not shot.get(key):
                blocking.append(str(shot.get('id')) + ': ACTUAL_' + key.upper() + '_REQUIRED')
            elif shot[key] != spec.get(key) and not shot.get('change_reason'):
                blocking.append(str(shot.get('id')) + ': UNEXPLAINED_ACTUAL_' + key.upper())
        for dimension in ('meaning', 'material', 'continuity'):
            check = shot.get('visual_checks', {}).get(dimension, {})
            if check.get('status') not in ('pass', 'not_applicable') or not check.get('observation'):
                blocking.append(str(shot.get('id')) + ': VISUAL_CHECK_' + dimension.upper() + '_UNRESOLVED')
        normalized.append({**{key: shot.get(key) for key in ('id', 'composition', 'medium', 'action')}, 'mechanism': shot.get('mechanism')})
    passes = actual.get('passes', {})
    for stage in ('remove', 'improve', 'performance'):
        if not passes.get(stage, {}).get('findings'):
            blocking.append('REVIEW_FINDINGS_REQUIRED_' + stage)
    if actual.get('layout'):
        try:
            contract=read(local_file(actual['layout'].get('contract','')))
            samples=read(local_file(actual['layout'].get('samples','')))
            blocking.extend(check_layout(contract,samples))
        except (OSError,ValueError,KeyError,TypeError) as error:
            blocking.append('LAYOUT_EVIDENCE_INVALID: '+str(error))
    return {'version': 2, 'blocking': blocking, 'actual_shots': normalized, 'files': files,
            'passes': passes, 'status': 'blocked' if blocking else 'evidence_recorded',
            'user_acceptance': 'pending', 'scope': 'Static references and supplied observations only. Frame files need actual inspection. Performance improvements require measurements.'}


def remember(report_path, history, run_id):
    report = read(report_path)
    if report.get('version') != 2 or report.get('blocking') or report.get('status') != 'evidence_recorded' or not report.get('files'):
        raise ValueError('Only reviewed actual work can enter history')
    for filename, sha in report['files'].items():
        if not Path(filename).is_file() or digest(filename) != sha:
            raise ValueError('Stale review evidence: ' + filename)
    existing = history_records(history)
    if any(row['run_id'] == run_id for row in existing):
        raise ValueError('Run already recorded')
    record = {'run_id': run_id, 'report': str(Path(report_path).resolve()), 'report_sha256': digest(report_path),
              'actual_shots': report['actual_shots'], 'user_acceptance': 'pending'}
    path = Path(history)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('a', encoding='utf-8') as stream:
        stream.write(json.dumps(record, ensure_ascii=False) + '\n')
    return {'recorded': run_id, 'history': str(path.resolve())}


def record_feedback(path, history):
    """Append explicit user feedback, preserving the original work record."""
    value = read(path)
    if value.get('run_id') not in {r['run_id'] for r in history_records(history)}:
        raise ValueError('Unknown feedback run')
    if value.get('source') != 'user' or not value.get('note') or not value.get('dimensions'):
        raise ValueError('Explicit user feedback and dimensions required')
    if any(v not in ('accepted', 'needs_revision', 'pending') for v in value['dimensions'].values()):
        raise ValueError('Invalid feedback status')
    event = {**value, 'event': 'feedback', 'feedback_file': str(Path(path).resolve()), 'feedback_sha256': digest(path)}
    with Path(history).open('a', encoding='utf-8') as stream:
        stream.write(json.dumps(event, ensure_ascii=False) + '\n')
    return {'recorded_feedback': value['run_id'], 'dimensions': value['dimensions']}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    srt = sub.add_parser('srt'); srt.add_argument('source'); srt.add_argument('--fps', type=float, default=30); srt.add_argument('--duration', type=float)
    index = sub.add_parser('assets'); index.add_argument('--root', action='append', required=True)
    catalog = sub.add_parser('catalog'); catalog.add_argument('--query', default=''); catalog.add_argument('--limit', type=int, default=12)
    choose = sub.add_parser('select'); choose.add_argument('plan'); choose.add_argument('--history', default=str(ROOT / '.local/composition-history.jsonl'))
    audit = sub.add_parser('review'); audit.add_argument('plan'); audit.add_argument('--project', required=True); audit.add_argument('--actual', required=True)
    record = sub.add_parser('remember'); record.add_argument('report'); record.add_argument('--history', default=str(ROOT / '.local/composition-history.jsonl')); record.add_argument('--run-id', required=True)
    feedback = sub.add_parser('feedback'); feedback.add_argument('input'); feedback.add_argument('--history', default=str(ROOT / '.local/composition-history.jsonl'))
    for command in (srt, index, catalog, choose, audit):
        command.add_argument('--out', required=True)
    args = parser.parse_args(argv)
    if args.command == 'srt': result = parse_srt(args.source, args.fps, args.duration)
    elif args.command == 'assets': result = index_assets(args.root)
    elif args.command == 'catalog': result = browse(args.query, args.limit)
    elif args.command == 'select': result = select(read(args.plan), args.history)
    elif args.command == 'review': result = review(read(args.plan), args.project, read(args.actual))
    elif args.command == 'feedback':
        print(json.dumps(record_feedback(args.input, args.history), ensure_ascii=False)); return 0
    else:
        print(json.dumps(remember(args.report, args.history, args.run_id), ensure_ascii=False)); return 0
    save(args.out, result)
    print(json.dumps({'command': args.command, 'output': args.out, 'status': result.get('status', 'written'), 'blocking': result.get('blocking', [])}, ensure_ascii=False))
    return 2 if result.get('blocking') else 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError, KeyError, TypeError) as error:
        raise SystemExit(str(error))
