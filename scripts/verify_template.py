#!/usr/bin/env python3
"""Build a fresh silent template with the repository's installed dependencies."""
from pathlib import Path
import subprocess,tempfile
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='motion-skill-verify-') as d:
 dest=Path(d)/'film'
 subprocess.run(['python3',str(ROOT/'scripts/motion.py'),'new','--dest',str(dest),'--deps',str(ROOT/'node_modules')],check=True)
 for task in ['check','build','verify:frames','verify:score']:subprocess.run(['npm','run',task],cwd=dest,check=True)
