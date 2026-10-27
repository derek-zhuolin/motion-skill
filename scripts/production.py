"""Static production wiring audit. Does not certify pixels, sound or taste."""
import json
import re
from pathlib import Path

def audit_production(manifest, project, registry):
    root = Path(project).resolve()
    known = {a['id']: a for a in registry['adapters']}
    blocking, warnings, wired = [], [], []
    for key in ('palette','typography','material','motion','sound'):
        if not manifest.get('visual_system', {}).get(key):
            blocking.append('Missing shared visual rule: '+key)
    for use in manifest.get('mechanisms', []):
        adapter = known.get(use.get('adapter'))
        if not adapter:
            blocking.append('No production adapter: '+str(use.get('adapter')))
            continue
        source = (root / use.get('file', '')).resolve()
        implementation = root / adapter['file']
        if not source.is_relative_to(root) or not source.is_file():
            blocking.append('Missing/nonlocal caller: '+str(use.get('file')))
            continue
        if not implementation.is_file():
            blocking.append('Missing implementation: '+adapter['file'])
            continue
        text = source.read_text()
        symbol = adapter['export']
        module='production/'+Path(adapter['file']).stem
        imported=bool(re.search(r'import\s*\{[^}]*\b'+re.escape(symbol)+r'\b[^}]*\}\s*from\s*[\"\'][^\"\']*'+re.escape(module)+r'[\"\']', text))
        if '<'+symbol not in text or not imported:
            blocking.append('Caller does not import/invoke '+symbol)
        if not use.get('reason'):
            blocking.append('Mechanism has no content purpose: '+use['adapter'])
        start, end = use.get('start', -1), use.get('end', -1)
        if not 0 <= start < end <= manifest.get('duration', 0):
            blocking.append('Invalid usage interval: '+use['adapter'])
        wired.append({'adapter':use['adapter'],'study_id':adapter['study_id'],'caller':use['file'],'implementation':adapter['file']})
    if not manifest.get('mechanisms'):
        blocking.append('No production mechanisms declared')
    for hold in manifest.get('holds', []):
        if hold.get('end',0)-hold.get('start',0)>1 and not hold.get('reason'):
            warnings.append('Unexplained hold longer than 1s; inspect, do not add meaningless drift')
    for handoff in manifest.get('handoffs', []):
        if not handoff.get('object_ids') or not handoff.get('reason'):
            blocking.append('Handoff lacks persistent identity or purpose')
    return {'blocking':blocking,'warnings':warnings,'wired':wired,'ready_for_pixel_review':not blocking,
            'scope':'Static import/invocation and declaration checks only. Require sampled DOM markers, pixel review and 1x playback; not proof of visual continuity or taste.'}
