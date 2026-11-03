import hashlib,json,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from audio_brief import prepare
from capabilities import inventory

class AudioBriefTests(unittest.TestCase):
 def test_new_audio_keeps_identity_and_no_old_shots(self):
  with tempfile.TemporaryDirectory() as t:
   r=Path(t); a=r/'voice.wav';a.write_bytes(b'fixture audio');out=r/'run'
   probe=SimpleNamespace(stdout=json.dumps({'format':{'duration':'31.2'},'streams':[{'codec_type':'audio'}]}))
   with patch('audio_brief.shutil.which',return_value='ffprobe'),patch('audio_brief.subprocess.run',return_value=probe):
    report=prepare(a,out,'Focus on evidence',20)
   brief=json.loads((out/'brief.json').read_text())
   self.assertEqual(brief['source']['sha256'],hashlib.sha256(a.read_bytes()).hexdigest())
   self.assertEqual(brief['source']['playback_rate'],1)
   self.assertEqual(brief['shots'],[])
   self.assertEqual(report['status'],'prepared_not_film')
   self.assertTrue((out/'src/production/DirectedPolish.tsx').is_file())
   self.assertEqual(brief['acceptance']['user'],'pending')
   with self.assertRaisesRegex(ValueError,'Destination exists'):prepare(a,out)
 def test_silent_video_does_not_create_a_project(self):
  with tempfile.TemporaryDirectory() as t:
   r=Path(t);a=r/'silent.mp4';a.write_bytes(b'fixture')
   probe=SimpleNamespace(stdout=json.dumps({'format':{'duration':'10'},'streams':[{'codec_type':'video'}]}))
   with patch('audio_brief.shutil.which',return_value='ffprobe'),patch('audio_brief.subprocess.run',return_value=probe):
    with self.assertRaisesRegex(ValueError,'no audio'):prepare(a,r/'run')
   self.assertFalse((r/'run').exists())
 def test_promoted_components_are_discoverable_and_not_auto_invoked(self):
  rows={x['id']:x for x in inventory() if x['type']=='component'}
  self.assertEqual(rows['page-handoff']['state'],'available_not_invoked')
  self.assertEqual(rows['soft-clay-surface']['representation'],'svg-simulated-volume')
  self.assertEqual(rows['phrase-reveal']['implementation']['export'],'PhraseReveal')

if __name__=='__main__':unittest.main()
