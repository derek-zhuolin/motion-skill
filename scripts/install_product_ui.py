"""Add the bundled product UI layer to a local project, preserving conflicts."""
import argparse, hashlib, json, shutil
from pathlib import Path
SKILL = Path(__file__).resolve().parents[1]
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def missing_ui_dependencies(deps):
    required={'react':'19.2.3','react-dom':'19.2.3','lucide-react':'1.61.0'}
    missing=[]
    for name,version in required.items():
        package=Path(deps)/name/'package.json'
        try: actual=json.loads(package.read_text()).get('version')
        except (OSError,ValueError): actual=None
        if actual!=version: missing.append({'name':name,'expected':version,'actual':actual})
    return missing

def inspect(project):
    runtime = SKILL/'assets/runtime'
    names = ['src/react-dom.d.ts','src/production/ProductUIFilm.tsx','src/production/product-ui.ts','src/production/product-ui.css','src/production/ui-frame.tsx','src/production/ui-frame.css','src/production/UISwipeArchive.tsx','src/production/ui-swipe-archive.css','src/production/UIFreeDrag.tsx','src/production/ui-free-drag.css','src/production/UIPhoneExpand.tsx','src/production/UIPhoneExpand.css','src/production/UIConversationCards.tsx','src/production/UIConversationCards.css']
    names += ['src/production/UIUpload.tsx','src/production/ui-upload.css','src/production/UIPresence.tsx','src/production/ui-presence.css','src/production/UIChartScrub.tsx','src/production/ui-chart-scrub.css','src/production/UIAggregate.tsx','src/production/ui-aggregate.css']
    names += [str(p.relative_to(runtime)) for p in (runtime/'vendor/stageshow').rglob('*') if p.is_file()]
    missing, conflicts = [], []
    for name in names:
        src, out = runtime/name, project/name
        if not out.exists(): missing.append(name)
        elif not out.is_file() or out.is_symlink() or sha(src)!=sha(out): conflicts.append(name)
    dependencies=missing_ui_dependencies(project/'node_modules')
    return names, {'missing':missing,'conflicts':conflicts,'dependency_issues':dependencies,'status':'ready' if not missing and not conflicts and not dependencies else 'needs_setup'}
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--project',required=True);g=parser.add_mutually_exclusive_group(required=True);g.add_argument('--check',action='store_true');g.add_argument('--apply',action='store_true');args=parser.parse_args()
    project=Path(args.project).expanduser().resolve()
    if not project.is_dir(): raise SystemExit('Project directory missing')
    names, report=inspect(project)
    if args.apply:
        if report['conflicts']: print(json.dumps(report,ensure_ascii=False,indent=2));raise SystemExit('Conflicting UI source; preserved without changes')
        # Resolve every target first so a project symlink cannot escape this tree.
        for name in names:
            if not (project/name).resolve().is_relative_to(project): raise SystemExit('Target escapes project: '+name)
        for name in report['missing']:
            out=project/name;out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(SKILL/'assets/runtime'/name,out)
        report=inspect(project)[1]
        report['note']='Files added only. Missing dependency is reported, never installed automatically.'
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 0 if report['status']=='ready' else 2
if __name__=='__main__': raise SystemExit(main())
