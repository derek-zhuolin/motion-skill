"""Validate declared spatial relationships using measured browser samples.

Optional per-film contract, not a fixed layout, automatic aesthetic score or
proof of screenshot provenance. Opacity includes ancestors; bounds use film px.
"""
import math


def check_layout(contract, samples):
    errors=[]
    def fail(message): errors.append(message)
    if not samples:
        return ['LAYOUT_SAMPLES_REQUIRED']
    tolerance=contract.get('time_tolerance',1/30+.001)
    for t in contract.get('sample_times',[]):
        if not any(abs(s.get('time',-100)-t)<=tolerance for s in samples):
            fail('LAYOUT_SAMPLE_MISSING_'+str(t))
    for sample in samples:
        t=sample.get('time');nodes=sample.get('nodes',[])
        if not isinstance(t,(int,float)) or not math.isfinite(t):
            fail('LAYOUT_INVALID_TIME');continue
        by_id={n.get('id'):n for n in nodes}
        def active(rule):
            # Departure/arrival paths may intentionally cross the panel edge.
            # The film declares the interval where containment must hold.
            return rule.get('from',-math.inf)<=t<=rule.get('until',math.inf)
        if len(by_id)!=len(nodes): fail('LAYOUT_DUPLICATE_NODE_'+str(t))
        def visible(node): return node and node.get('opacity',0)>=contract.get('visible_threshold',.1)
        def rect(node):
            b=node.get('bounds',{})
            return [b.get(k) for k in ('x','y','width','height')]
        valid={}
        for name,node in by_id.items():
            r=rect(node)
            if not all(isinstance(v,(float,int)) and math.isfinite(v) for v in r) or r[2]<0 or r[3]<0:
                fail(f'LAYOUT_INVALID_BOUNDS_{name}@{t}')
            else:valid[name]=r
        for rule in contract.get('visibility',[]):
            if rule['from']<=t<=rule['until']:
                node=by_id.get(rule['id']);o=node.get('opacity',0) if node else 0
                if o<rule.get('min',0) or o>rule.get('max',1):
                    fail(f"LAYOUT_VISIBILITY_{rule['id']}@{t}")
                if 'min_onscreen' in rule:
                    viewport=contract.get('viewport',{})
                    vw,vh=viewport.get('width',0),viewport.get('height',0)
                    if rule['id'] not in valid or vw<=0 or vh<=0:
                        fail(f"LAYOUT_ONSCREEN_UNMEASURABLE_{rule['id']}@{t}")
                    else:
                        x,y,w,h=valid[rule['id']]
                        area=max(0,min(x+w,vw)-max(x,0))*max(0,min(y+h,vh)-max(y,0))
                        ratio=area/(w*h) if w*h>0 else 0
                        if ratio<rule['min_onscreen']:
                            fail(f"LAYOUT_OFFSCREEN_{rule['id']}@{t}")
        for rule in contract.get('contained',[]):
            if not active(rule):continue
            node=by_id.get(rule['id']);owner=by_id.get(rule['owner'])
            if not visible(node):continue
            if not visible(owner) or rule['owner'] not in node.get('ancestors',[]):
                fail(f"LAYOUT_OWNER_LOST_{rule['id']}@{t}");continue
            if rule['id'] in valid and rule['owner'] in valid:
                x,y,w,h=valid[rule['id']];a,b,c,d=valid[rule['owner']];p=rule.get('tolerance',2)
                if x<a-p or y<b-p or x+w>a+c+p or y+h>b+d+p:
                    fail(f"LAYOUT_OUTSIDE_OWNER_{rule['id']}@{t}")
        for relation in contract.get('disjoint',[]):
            if isinstance(relation,dict):
                if not active(relation):continue
                left,right=relation['ids']
            else:left,right=relation
            if not visible(by_id.get(left)) or not visible(by_id.get(right)) or left not in valid or right not in valid:continue
            x,y,w,h=valid[left];a,b,c,d=valid[right]
            if min(x+w,a+c)-max(x,a)>2 and min(y+h,b+d)-max(y,b)>2:
                fail(f'LAYOUT_OVERLAP_{left}_{right}@{t}')
    return errors
