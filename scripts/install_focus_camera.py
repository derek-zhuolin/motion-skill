#!/usr/bin/env python3
"""Copy the opt-in extension into an existing project; never overwrite different code."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

def install(skill: Path, project: Path):
    project=project.resolve()
    if not (project/'package.json').is_file() or not (project/'src').is_dir():
        raise ValueError('Expected an existing project with package.json and src/')
    source=skill/'assets/runtime/src/production'
    dest=project/'src/production'
    names=('focus-camera.ts','FocusCamera.tsx')
    # Check all conflicts before writing either file. No automatic scene/entry changes.
    for name in names:
        target=dest/name
        if target.exists() and target.read_bytes()!=(source/name).read_bytes():
            raise ValueError(f'Refusing to overwrite different file: {target}')
    dest.mkdir(parents=True,exist_ok=True)
    for name in names:
        if not (dest/name).exists():
            shutil.copy2(source/name,dest/name)
    return {'status':'installed_opt_in_only','files':[
        {'path':str(dest/name),'sha256':hashlib.sha256((dest/name).read_bytes()).hexdigest()}
        for name in names], 'scene_edits':False,'default_enabled':False}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project',type=Path,required=True)
    args=parser.parse_args()
    print(json.dumps(install(Path(__file__).resolve().parents[1],args.project),indent=2))
