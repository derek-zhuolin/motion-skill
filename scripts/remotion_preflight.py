"""Locate the installed Remotion guidance; detection does not prove Agent compliance."""
from pathlib import Path
import hashlib,json

def locate(project=None,skills_roots=None,home=None):
    h=Path(home).expanduser() if home else Path.home()
    roots=[Path(x).expanduser() for x in (skills_roots or [])]
    if project:roots += [Path(project)/'.agents/skills',Path(project)/'.codex/skills',Path(project)/'.claude/skills']
    roots += [h/'.codex/skills',h/'.agents/skills',h/'.claude/skills']
    for root in roots:
        p=root/'remotion-best-practices/SKILL.md'
        if p.is_file():
            data=p.read_bytes();text=data.decode('utf8');version=next((x.split(':',1)[1].strip() for x in text.splitlines() if x.startswith('version:')),None)
            routes={}
            for key in ['remotion-create','remotion-markup','remotion-studio','remotion-render']:
                candidates=[p.parent/key/'REFERENCE.md',root/key/'SKILL.md']
                routes[key]=next((str(x.resolve()) for x in candidates if x.is_file()),None)
            return {'status':'found','entry':str(p.resolve()),'version':version,'sha256':hashlib.sha256(data).hexdigest(),'routes':routes,'ready_for_code':all(routes[k] for k in ['remotion-create','remotion-markup','remotion-studio']),'missing_routes':[k for k,v in routes.items() if not v],'agent_read_confirmed':False,'note':'Agent must read entry and relevant routes before writing code. This report only locates files.'}
    return {'status':'missing','entry':None,'agent_read_confirmed':False,'official_source':'https://github.com/remotion-dev/skills','setup':'npx skills add remotion-dev/skills','note':'No installation performed. Report missing dependency; do not claim Best Practices were used.'}
