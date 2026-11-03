"""Check local UI install safety and self-contained source availability."""
import json, subprocess, sys, tempfile, unittest
from pathlib import Path
from install_product_ui import SKILL, inspect, missing_ui_dependencies
class ProductUIInstall(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.project=Path(self.temp.name)
 def tearDown(self):self.temp.cleanup()
 def run_install(self,*flags):
  return subprocess.run([sys.executable,str(SKILL/'scripts/install_product_ui.py'),'--project',str(self.project),*flags],text=True,capture_output=True)
 def test_installs_vendor_and_reports_missing_dependency_without_fetching(self):
  p=self.run_install('--apply');self.assertEqual(p.returncode,2);self.assertTrue((self.project/'vendor/stageshow/LICENSE').is_file());self.assertTrue((self.project/'src/production/ProductUIFilm.tsx').is_file());self.assertFalse((self.project/'node_modules').exists());self.assertEqual(inspect(self.project)[1]['missing'],[])
 def test_conflict_is_preflighted_without_any_overwrite(self):
  target=self.project/'src/production/ProductUIFilm.tsx';target.parent.mkdir(parents=True);target.write_text('user-owned content')
  p=self.run_install('--apply');self.assertNotEqual(p.returncode,0);self.assertEqual(target.read_text(),'user-owned content');self.assertFalse((self.project/'vendor').exists())
 def test_ready_with_existing_local_dependency_and_idempotent_apply(self):
  for name,version in {'react':'19.2.3','react-dom':'19.2.3','lucide-react':'1.61.0'}.items():
   dep=self.project/'node_modules'/name/'package.json';dep.parent.mkdir(parents=True);dep.write_text(json.dumps({'name':name,'version':version}))
  self.assertEqual(self.run_install('--apply').returncode,0);self.assertEqual(self.run_install('--apply').returncode,0);self.assertEqual(inspect(self.project)[1]['status'],'ready')
 def test_lucide_only_is_not_runtime_ready(self):
  dep=self.project/'lucide-react/package.json';dep.parent.mkdir(parents=True);dep.write_text(json.dumps({'version':'1.61.0'}))
  issues=missing_ui_dependencies(self.project);self.assertEqual({x['name'] for x in issues},{'react','react-dom'})
if __name__=='__main__':unittest.main()
