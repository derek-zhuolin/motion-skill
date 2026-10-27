"""Regression checks for unused references, missing visual rules and SFX as voice."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
import wave
from types import SimpleNamespace
from motion import SKILL, new_project
from production import audit_production

class ProductionRegression(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='motion11-test-')
        self.root = Path(self.temp.name)
        (self.root/'src/production').mkdir(parents=True)
        (self.root/'src/production/Mechanisms.tsx').write_text('export function ClayJoin(){}')
        (self.root/'src/Film.tsx').write_text("import {ClayJoin} from './production/Mechanisms'; const film=<ClayJoin/>;")
        self.registry=json.loads((SKILL/'references/production-registry.json').read_text())
        self.manifest={'duration':4,'visual_system':{k:'shared rule' for k in ['palette','typography','material','motion','sound']},'mechanisms':[{'adapter':'clay-join','file':'src/Film.tsx','start':0,'end':4,'reason':'join two complementary tasks'}]}
    def tearDown(self):
        self.temp.cleanup()
    def audit(self):
        return audit_production(self.manifest,self.root,self.registry)
    def test_wired(self):
        self.assertFalse(self.audit()['blocking'])
    def test_unused_reference_rejected(self):
        self.manifest['mechanisms'][0]['adapter']='study-only-69'
        self.assertTrue(self.audit()['blocking'])
    def test_name_without_component_rejected(self):
        (self.root/'src/Film.tsx').write_text('const title="ClayJoin";')
        self.assertTrue(self.audit()['blocking'])
    def test_missing_shared_style_rejected(self):
        del self.manifest['visual_system']['typography']
        self.assertTrue(self.audit()['blocking'])
    def test_unexplained_hold_warns(self):
        self.manifest['holds']=[{'start':0,'end':3}]
        self.assertTrue(self.audit()['warnings'])
        self.manifest['holds'][0]['reason']='Read the source claim'
        self.assertFalse(self.audit()['warnings'])
    def test_outside_caller_rejected(self):
        self.manifest['mechanisms'][0]['file']='../outside.tsx'
        self.assertTrue(self.audit()['blocking'])
    def media_args(self, kind):
        deps=self.root/'deps'
        for name, version in [('remotion','4.0.538'),('@remotion/player','4.0.538'),('react','19.2.3')]:
            folder=deps/name;folder.mkdir(parents=True,exist_ok=True)
            (folder/'package.json').write_text(json.dumps({'version':version}))
        audio=self.root/'effect.wav'
        with wave.open(str(audio),'wb') as f:
            f.setparams((1,2,8000,0,'NONE','not compressed'));f.writeframes(b'\0\0'*1600)
        story=self.root/'story.json'
        story.write_text(json.dumps({'mode':'script','duration':4,'fps':60,'source':{},'layout':{'face':{'enabled':False}},'scenes':[{'id':'one','start':0,'end':4,'headline':'看懂关系','relation':'claim','visual':{'renderer':'collect','labels':[],'focus_object':'a','object_ids':['a']}}]}))
        return SimpleNamespace(dest=str(self.root/'generated'),deps=str(deps),media=str(audio),audio_kind=kind,story=str(story),transcript=None)
    def test_sfx_needs_no_transcript_and_keeps_story_duration(self):
        args=self.media_args('sfx');result=new_project(args)
        story=json.loads((Path(args.dest)/'inputs/story.json').read_text())
        self.assertEqual(story['mode'],'script');self.assertEqual(story['duration'],4)
        self.assertEqual(story['source']['sfx_url'],'assets/sfx.wav')
        self.assertNotIn('voice_url',story['source']);self.assertNotIn('actual_duration',story['source'])
        self.assertEqual(result['status'],'ready_for_visual_review')
        self.assertEqual((Path(args.dest)/'public').resolve(),(Path(args.dest)/'site').resolve())
    def test_default_voice_does_not_accept_script_sfx(self):
        args=self.media_args('voice')
        with self.assertRaisesRegex(ValueError,'voice mode'):
            new_project(args)
        self.assertFalse(Path(args.dest).exists())

if __name__=='__main__':
    unittest.main()
