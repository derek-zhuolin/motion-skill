"""One local capability inventory for discovery, selection and wiring checks.

Inventory is not invocation. Browser behaviors and research recipes retain their
adaptation boundary; finding a source file never upgrades them to frame-ready.
"""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ALIASES = {'Phone':'手机 语音 聊天 device', 'Thread':'聊天 对话 消息 会话',
           'Bubble':'聊天 气泡 语音 消息', 'Keyboard':'键盘 输入',
           'Expand':'展开 深入 详情', 'Camera':'镜头 运镜', 'Fly':'接力 交接 飞行',
           'SpatialExplanation':'3D mesh 空间 粘土 拆装'}


def _read(name):
    return json.loads((ROOT/'references'/name).read_text(encoding='utf-8'))


def inventory():
    catalog, components = _read('catalog.json'), _read('component-catalog.json')
    registry=_read('production-registry.json')
    canonical_ids={row['export']:row['id'] for row in registry.get('adapters',[])+registry.get('ui_extensions',[])+registry.get('directed_extensions',[])}
    rows = []
    for item in catalog['effects']:
        rows.append({**item, 'type':'study', 'state':'adaptation_required'})
    for item in catalog.get('compositions', []):
        rows.append({**item, 'type':'composition', 'state':'adaptation_required',
                     'members':list(item['ids']), 'implementation':None})
    known = set()
    for item in components['items']:
        file = 'assets/runtime/'+item['file']
        symbol = item['export_name']
        known.add(symbol)
        representation = 'svg-simulated-volume' if symbol in ('ClaySurface','ClayJoin','SoftClaySurface','SoftClayJoin') else 'unspecified'
        if symbol == 'SpatialExplanation':
            representation = 'rendered-mesh-3d'
        canonical_id=canonical_ids.get(symbol,item['id'])
        rows.append({**item, 'id':canonical_id,'id_aliases':[item['id']], 'type':'component', 'name':item['title'],
                     'aliases':ALIASES.get(symbol,''), 'representation':representation,
                     'state':'available_not_invoked' if item['status']=='frame_component' else 'frame_binding_required',
                     'implementation':{'file':file, 'export':symbol}})
    # The curated catalog is not the whole kit: Thread/Bubble and motion parts
    # must also be discoverable. Read exports as data; do not execute the kit.
    index = ROOT/'assets/runtime/vendor/stageshow/kit/index.ts'
    for block in re.findall(r'export\s*\{([^}]+)\}\s*from',index.read_text()):
        for entry in block.split(','):
            name = entry.strip().split(' as ')[-1]
            if not name or not name[0].isupper() or name.isupper() or name in known:
                continue
            known.add(name)
            rows.append({'type':'component','id':'part-'+name,'name':name,
                         'aliases':ALIASES.get(name,''), 'status':'composable_part',
                         'state':'frame_binding_required','representation':'unspecified',
                         'implementation':{'file':'assets/runtime/vendor/stageshow/kit/index.ts','export':name},
                         'meaning':'Native kit part; caller must adapt browser behavior to the film frame.'})
    for name in components.get('icons',[]):
        rows.append({'type':'icon','id':'icon-'+name,'name':name,'state':'frame_binding_required',
                     'required_props':{'name':name},
                     'implementation':{'file':'assets/runtime/vendor/stageshow/kit/index.ts','export':'Icon'}})
    for source in sorted((ROOT/'assets/runtime/vendor/stageshow/examples').glob('*/index.tsx')):
        name=source.parent.name
        aliases='手机 聊天 消息 语音' if name in ('imessage','ai-chat','phone-touch','dynamic-island') else ''
        rows.append({'type':'example','id':'gold-'+name,'name':name,'aliases':aliases,
                     'state':'adaptation_required','implementation':{'file':str(source.relative_to(ROOT)),'export':'default'},
                     'meaning':'Complete native Gold reference. Its browser script must be adapted to the film frame before use.'})
    return rows


def lookup(kind, identifier):
    return next((row for row in inventory() if row['type']==kind and
                 (row['id']==identifier or identifier in row.get('id_aliases',[]))),None)


def resolved(candidate):
    kind, cid = candidate.get('type'), candidate.get('id')
    if kind == 'adapter':
        row=next((a for a in _read('production-registry.json')['adapters'] if a['id']==cid),None)
        return (row,'available_not_invoked') if row else (None,None)
    row=lookup(kind,cid)
    if not row:
        return None,None
    if kind=='study':
        return row['implementation'],row['state']
    if kind=='composition':
        return {'members':row['members'],'recipe':row},row['state']
    return row['implementation'],row['state']


def wiring_errors(selected, actual, implementation, caller_code=''):
    """Verify the chosen callable, rather than any convenient imported JSX.

    This is a source check, not a claim about aesthetics or live invocation.
    Copied runtimes are accepted by hash, not merely by matching filenames.
    """
    if not selected or selected.get('type')=='custom':
        return []
    kind=selected['type']
    if kind in ('study','composition','example'):
        expected=set(selected['implementation'].get('members',[])) if kind=='composition' else {selected['id']}
        covered={item.get('id') for item in actual.get('adaptations',[])
                 if all(item.get(key) for key in ('caller','implementation','symbol','frame_evidence'))}
        return [] if expected <= covered else ['SELECTED_ADAPTATION_BINDINGS_REQUIRED']
    target=selected.get('implementation') or {}
    symbol,expected_symbol=actual.get('symbol',''),target.get('export','')
    bound_exports=[]
    for block in re.findall(r'import\s*\{([^}]+)\}\s*from',caller_code):
        for entry in block.split(','):
            match=re.fullmatch(r'\s*(\w+)(?:\s+as\s+(\w+))?\s*',entry)
            if match and (match.group(2) or match.group(1))==symbol:
                bound_exports.append(match.group(1))
    if not expected_symbol or expected_symbol not in bound_exports:
        return ['SELECTED_CAPABILITY_NOT_INVOKED']
    canonical=ROOT/target.get('file','')
    if kind=='adapter':
        canonical=ROOT/'assets/runtime'/target.get('file','')
    sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
    if not canonical.is_file() or sha(canonical)!=sha(implementation):
        return ['SELECTED_IMPLEMENTATION_DIFFERS_DECLARE_CUSTOM_ADAPTATION']
    if kind=='icon':
        expected=lookup(kind,selected['id'])['required_props']
        if any(actual.get('props',{}).get(k)!=v for k,v in expected.items()):
            return ['SELECTED_ICON_PROPS_NOT_ACCOUNTED_FOR']
    return []
