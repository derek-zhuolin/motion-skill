import unittest,tempfile
from pathlib import Path
from pilot_gate import evaluate
class PilotTests(unittest.TestCase):
 def test_technical_success_never_approves_human(self):
  with tempfile.TemporaryDirectory() as d:
   r=Path(d);(r/'sample.mp4').write_bytes(b'fixture');(r/'voice.wav').write_bytes(b'fixture')
   data={'sample':{'duration':16.6,'audio_speed':1,'asr_reused':True},'artifacts':{'mp4':'sample.mp4','source_excerpt':'voice.wav'},'technical':{k:True for k in ['typecheck','frame_geometry','audio_alignment','media_decode','source_provenance']},'human_review':{'status':'pending'}}
   self.assertFalse(evaluate(data,r)['can_expand']);self.assertEqual(data['human_review']['status'],'pending')
   data['human_review']={'status':'accepted'};self.assertFalse(evaluate(data,r)['can_expand'])
   data['human_review']['direct_user_evidence']='UNIT TEST ONLY';self.assertTrue(evaluate(data,r)['can_expand'])
   data['sample']['duration']=30;self.assertIn('PILOT_DURATION',evaluate(data,r)['technical_blockers'])
   (r/'sample.mp4').unlink();self.assertIn('MISSING_MP4',evaluate(data,r)['technical_blockers'])
if __name__=='__main__':unittest.main()
