"""Publication must reject directory and broken symlinks too, not only file links."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


class SymlinkGuard(unittest.TestCase):
    def test_directory_and_broken_links_are_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            (root / 'scripts').mkdir()
            shutil.copy2(Path(__file__).with_name('privacy_check.py'), root / 'scripts/privacy_check.py')
            (root / 'actual-directory').mkdir()
            (root / 'directory-link').symlink_to(root / 'actual-directory', target_is_directory=True)
            (root / 'broken-link').symlink_to(root / 'not-there')
            result = subprocess.run([sys.executable, str(root / 'scripts/privacy_check.py')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            issues = json.loads(result.stdout)['issues']
            self.assertEqual({x['file'] for x in issues if x['kind'] == 'symlink'}, {'directory-link', 'broken-link'})


if __name__ == '__main__':
    unittest.main()
