"""Public integration regressions: preserve captions, private scope and baseline originals."""
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import zipfile
import motion
from reuse import reuse_project

class PublicMergeTests(unittest.TestCase):
    def make_deps(self, root):
        deps = root / 'deps'
        for name, version in {'remotion':'4.0.538', '@remotion/player':'4.0.538',
                              '@remotion/bundler':'4.0.538', '@remotion/renderer':'4.0.538',
                              'react':'19.2.3'}.items():
            p = deps / name / 'package.json'
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps({'version':version}))
        return deps

    def test_separate_caption_input_survives_generation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); deps=self.make_deps(root)
            captions={'enabled':True,'fps':60,'cues':[{'id':'separate-caption','start_frame':0,'end_frame':60,'text':'明确的测试字幕'}]}
            path=root/'captions.json';path.write_text(json.dumps(captions))
            dest=root/'film'
            args=SimpleNamespace(dest=str(dest),deps=str(deps),media=None,story=None,transcript=None,captions=str(path))
            motion.new_project(args)
            self.assertEqual(json.loads((dest/'src/compiled-plan.json').read_text())['captions'],captions)
            self.assertIn('<CaptionFrame', (dest/'src/DirectedFilm.tsx').read_text())

    def test_pack_excludes_private_cache_outputs_and_public_demo(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'skill';root.mkdir()
            files=['SKILL.md','LICENSE','references/note.md','.local/transcript.json','.cache/cache.json',
                   'assets/runtime/outputs/private.mp4','assets/runtime/evidence/local.json','demo/reference.mp4']
            for name in files:
                p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('test fixture')
            target=Path(tmp)/'share.zip'
            with patch.object(motion,'SKILL',root):motion.pack(SimpleNamespace(out=str(target)))
            with zipfile.ZipFile(target) as z:
                self.assertEqual(set(z.namelist()),{'motion-video/SKILL.md','motion-video/LICENSE','motion-video/references/note.md'})

    def test_pack_rejects_source_audio_in_publishable_folders(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'skill';(root/'assets').mkdir(parents=True)
            (root/'assets/private.wav').write_bytes(b'fixture')
            with patch.object(motion,'SKILL',root):
                with self.assertRaisesRegex(ValueError,'Private/source media'):
                    motion.pack(SimpleNamespace(out=str(Path(tmp)/'share.zip')))

    def test_reuse_preserves_conflicting_reference_adapter(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source=root/'source';(source/'src/production').mkdir(parents=True)
            original='export const keepReference = true;'
            (source/'src/production/DetailMechanisms.tsx').write_text(original)
            (source/'src/Film.tsx').write_text('export const Film=()=>null;')
            cfg={'label':'fixture','source':str(source),'module':'Film','export':'Film','width':1920,
                 'height':1080,'fps':30,'frames':450,'fonts':[],'props':{},'files':[{'from':'src','to':'src'}]}
            registry=root/'registry.json';registry.write_text(json.dumps({'baselines':{'test':cfg}}))
            dest=root/'result'
            reuse_project(SimpleNamespace(registry=str(registry),baseline='test',dest=str(dest),deps=str(self.make_deps(root))))
            self.assertEqual((dest/'src/production/DetailMechanisms.tsx').read_text(),original)
            report=json.loads((dest/'evidence/adapters-available.json').read_text())
            self.assertIn('src/production/DetailMechanisms.tsx',report['preserved_reference_conflicts'])
            self.assertEqual(report['status'],'available_not_invoked')
            self.assertTrue((source/'src/Film.tsx').exists())
            self.assertTrue((dest/'scripts/browser.mjs').exists())

if __name__=='__main__':unittest.main()
