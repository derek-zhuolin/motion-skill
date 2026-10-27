import unittest,tempfile,json
from pathlib import Path
from types import SimpleNamespace
from transcript_cache import run
from reuse import reuse_project
class FastpathTests(unittest.TestCase):
 def test_cache_content_identity_and_invalidation(self):
  with tempfile.TemporaryDirectory() as d:
   r=Path(d);a=r/'audio';a.write_bytes(b'audio');t=r/'words.json';t.write_text('{"verified":false}')
   args=SimpleNamespace(command='put',media=str(a),transcript=str(t),cache=str(r/'cache'),engine='test')
   self.assertTrue(run(args)['registered']);self.assertFalse(run(args)['registered'])
   args.command='get';self.assertTrue(run(args)['hit']);self.assertFalse(run(args)['candidates'][0]['verified'])
   t.write_text('{"changed":true}');self.assertFalse(run(args)['hit'])
   args.command='put';run(args);a.write_bytes(b'different audio');args.command='get';self.assertFalse(run(args)['hit'])
 def test_reuse_unknown_and_existing_destination_fail(self):
  with tempfile.TemporaryDirectory() as d:
   r=Path(d);p=r/'registry.json';p.write_text(json.dumps({'baselines':{'one':{'source':d}}}))
   args=SimpleNamespace(registry=str(p),baseline='missing',dest=str(r/'out'),deps=d)
   with self.assertRaisesRegex(ValueError,'Unknown'):reuse_project(args)
   args.baseline='one';args.dest=d
   with self.assertRaisesRegex(ValueError,'exists'):reuse_project(args)
   self.assertFalse((r/'out').exists())
if __name__=='__main__':unittest.main()
