"""Public CLI acceptance seams approved for the three-goal upgrade."""
import json
import base64
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

CLI = Path(__file__).with_name('motion.py')


class ExplainerCommandTests(unittest.TestCase):
    def test_mesh_input_resolves_a_spatial_view_of_the_same_content_object(self):
        from explainer import spatial_assembly
        brief={'objects':{'voice':{'kind':'flow','owner':'同一语音','title':'语音','segments':[{'id':'tone','text':'音色'}],
                                  'views':{'layers':{'kind':'spatial','title':'处理关系','segments':[{'id':'base','content_id':'tone','text':'音色'},{'id':'cap','content_id':'tone','text':'结果'}]}}}},
               'events':[{'relation':'spatial','object_id':'voice','view':'layers'}]}
        selected=spatial_assembly(brief)
        self.assertEqual(selected['owner'],'同一语音')
        self.assertEqual([p['id'] for p in selected['segments']],['base','cap'])
        self.assertEqual(brief['objects']['voice']['kind'],'flow')

    def test_local_media_keeps_content_identity_and_requires_honest_provenance(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root/'source.srt').write_text('1\n00:00:00,000 --> 00:00:04,000\n看这段已有的结果。\n')
            brief = {'title':'查看结果','task':'process','source_note':'Authored silent media fixture',
                     'media':{'result':{'path':'result.png','type':'image','subject':'已有结果界面',
                                        'role':'evidence','reality':'recorded','source_note':'Local test screenshot',
                                        'caption':'已有结果示例'}},
                     'objects':{'voice':{'kind':'flow','owner':'我的语音','title':'表达',
                                        'segments':[{'id':'video','text':'视频结果'}],
                                        'views':{'result':{'kind':'media','title':'实际结果','segments':[{'id':'video','text':'视频结果'}],
                                                           'media':{'asset_id':'result','fit':'contain'}}}}},
                     'events':[{'id':'show','relation':'show','view':'result','object_id':'voice','cue_ids':['cue-1'],
                                'meaning':'展示对应的已有结果','before':'requested','after':'video'}]}
            (root/'brief.json').write_text(json.dumps(brief))
            args = [sys.executable,str(CLI),'explain','compile',str(root/'brief.json'),'--srt',str(root/'source.srt'),'--out',str(root/'plan.json')]
            result = subprocess.run(args,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr+result.stdout)
            plan = json.loads((root/'plan.json').read_text())
            self.assertEqual(plan['events'][0]['component'],'MediaView')
            self.assertEqual(plan['events'][0]['owner'],'我的语音')
            self.assertEqual(plan['media']['result']['path'],str((root/'result.png').resolve()))
            # A generated picture cannot silently become evidence of an operation.
            brief['media']['result']['reality']='generated'
            (root/'brief.json').write_text(json.dumps(brief))
            args[-1]=str(root/'rejected.json')
            rejected = subprocess.run(args,capture_output=True,text=True)
            self.assertNotEqual(rejected.returncode,0)
            self.assertIn('MEDIA_EVIDENCE_REQUIRES_RECORDED',rejected.stdout+rejected.stderr)
            self.assertFalse((root/'rejected.json').exists())

    def test_build_stages_only_used_local_media_and_rejects_a_missing_asset(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder); deps=root/'deps'
            for name in ('remotion','@remotion/player','@remotion/bundler','@remotion/renderer','react','react-dom','esbuild','typescript'):
                package=deps/name;package.mkdir(parents=True);(package/'package.json').write_text('{"version":"0.0.0"}')
            image=root/'source.png'
            image.write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ioAAAAASUVORK5CYII='))
            plan={'schema':'motion-explainer/v2','fps':30,'duration':4,'duration_in_frames':120,'audio':{},'source_note':'Test fixture',
                  'media':{'used':{'path':str(image),'type':'image','role':'context','reality':'reconstructed','subject':'测试图','source_note':'Fixture','caption':'示意'},
                           'unused':{'path':str(root/'absent.png'),'type':'image'}},
                  'objects':{'a':{'kind':'media','media':{'asset_id':'used'},'segments':[{'id':'a','text':'测试'}]}},
                  'events':[{'relation':'show','object_id':'a','start':0,'end':4}]}
            (root/'plan.json').write_text(json.dumps(plan))
            args=[sys.executable,str(CLI),'explain','build',str(root/'plan.json'),'--deps',str(deps),'--dest',str(root/'project')]
            result=subprocess.run(args,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr+result.stdout)
            built=json.loads((root/'project/src/plan.json').read_text())
            self.assertEqual(set(built['media']),{'used'})
            self.assertEqual((root/'project/public'/built['media']['used']['url']).read_bytes(),image.read_bytes())
            plan['media']['used']['path']=str(root/'missing.png');(root/'plan.json').write_text(json.dumps(plan))
            args[-1]=str(root/'rejected')
            result=subprocess.run(args,capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertFalse((root/'rejected').exists())
            # build also accepts saved plans: recheck ids rather than trusting a schema label.
            key='../../../../victim'
            plan['media']={key:{'path':str(image),'type':'image'}}
            plan['objects']['a']['media']['asset_id']=key
            (root/'plan.json').write_text(json.dumps(plan))
            victim=root/'victim.png';victim.write_bytes(b'keep existing original')
            args[-1]=str(root/'escaped')
            result=subprocess.run(args,capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertEqual(victim.read_bytes(),b'keep existing original')
            self.assertFalse((root/'escaped').exists())

    def test_scene_holds_cover_subtitle_pauses_and_keep_source_times(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'source.srt').write_text('1\n00:00:00,500 --> 00:00:03,000\n发送语音。\n\n2\n00:00:04,000 --> 00:00:07,000\n拆解任务。\n')
            brief={'title':'同一段语音','task':'process','source_note':'authored timing fixture',
                   'objects':{'voice':{'kind':'flow','owner':'我','title':'语音','segments':[{'id':'sent','text':'已发送'},{'id':'tone','text':'音色'}],
                                      'views':{'signal':{'kind':'flow','title':'发送','segments':[{'id':'sent','text':'已发送'}]},'tasks':{'kind':'document','title':'任务','segments':[{'id':'tone','text':'音色'}]}}}},
                   'events':[{'id':'send','relation':'feedback','view':'signal','object_id':'voice','cue_ids':['cue-1'],'meaning':'发送','before':'recorded','after':'sent'},
                             {'id':'split','relation':'split','view':'tasks','object_id':'voice','cue_ids':['cue-2'],'meaning':'拆解','before':'sent','after':'parts'}]}
            (root/'brief.json').write_text(json.dumps(brief))
            result=subprocess.run([sys.executable,str(CLI),'explain','compile',str(root/'brief.json'),'--srt',str(root/'source.srt'),'--duration','8','--out',str(root/'plan.json')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr+result.stdout)
            plan=json.loads((root/'plan.json').read_text())
            self.assertEqual([(s['start'],s['end']) for s in plan['scenes']],[(0,4),(4,8)])
            self.assertEqual([(c['start'],c['end']) for c in plan['anchors']['cues']],[(.5,3),(4,7)])
            self.assertEqual(plan['audio']['playback_rate'],1)

    def test_same_audio_object_changes_view_without_losing_identity(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'source.srt').write_text('1\n00:00:00,000 --> 00:00:03,000\n把这段语音交给助手。\n\n2\n00:00:03,000 --> 00:00:07,000\n拆开后半段的处理任务。\n')
            brief={'title':'同一段语音','task':'process','source_note':'authored multi-view acceptance fixture',
                   'objects':{'voice':{'kind':'flow','owner':'我','title':'我的语音',
                                      'segments':[{'id':'agent','text':'助手'},{'id':'tone','text':'音色'},{'id':'video','text':'视频'}],
                                      'views':{'signal':{'kind':'flow','title':'我的语音','segments':[{'id':'agent','text':'助手'}]},
                                               'tasks':{'kind':'document','title':'处理任务','segments':[{'id':'tone','text':'音色'},{'id':'video','text':'视频'}]}}}},
                   'events':[{'id':'send','relation':'feedback','view':'signal','object_id':'voice','cue_ids':['cue-1'],'meaning':'交给助手','before':'recorded','after':'agent'},
                             {'id':'split','relation':'split','view':'tasks','object_id':'voice','cue_ids':['cue-2'],'meaning':'展开任务','before':'agent','after':'tasks_visible'}]}
            (root/'brief.json').write_text(json.dumps(brief))
            result=subprocess.run([sys.executable,str(CLI),'explain','compile',str(root/'brief.json'),'--srt',str(root/'source.srt'),'--out',str(root/'plan.json')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr+result.stdout)
            plan=json.loads((root/'plan.json').read_text())
            self.assertEqual([e['component'] for e in plan['events']],['FlowFeedback','DocumentSplit'])
            self.assertEqual([e['object_id'] for e in plan['events']],['voice','voice'])
            self.assertEqual([e['owner'] for e in plan['events']],['我','我'])
            self.assertEqual(plan['events'][1]['handoff_from'],'send')
            self.assertEqual(plan['objects']['voice']['segments'],brief['objects']['voice']['segments'])
            self.assertEqual(len(plan['scenes']),2)

    def test_long_speech_does_not_stretch_a_short_action(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'input.srt').write_text('1\n00:00:00,000 --> 00:00:10,000\n用十秒钟解释这次拆分的原因。\n')
            brief={'title':'拆分','task':'explanation','source_note':'authored silent acceptance fixture',
                   'objects':{'doc':{'kind':'document','owner':'原文','title':'原文','segments':[{'id':'a','text':'内容一'},{'id':'b','text':'内容二'}]}},
                   'events':[{'id':'split','relation':'split','object_id':'doc','cue_ids':['cue-1'],'meaning':'按段拆开','before':'whole','after':'parts'}]}
            (root/'brief.json').write_text(json.dumps(brief))
            result=subprocess.run([sys.executable,str(CLI),'explain','compile',str(root/'brief.json'),'--srt',str(root/'input.srt'),'--out',str(root/'plan.json')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr+result.stdout)
            event=json.loads((root/'plan.json').read_text())['events'][0]
            self.assertLessEqual(event['action_window'][1]-event['action_window'][0],1.5)
            self.assertEqual(event['end_frame'],300)

    def test_spatial_plan_declares_mesh_requirement_and_reuses_reverse_sequence(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'input.srt').write_text('1\n00:00:00,000 --> 00:00:08,000\n展开同一组装配部件。\n')
            brief={'title':'空间关系','task':'explanation','source_note':'authored silent example',
                   'objects':{'assembly':{'kind':'spatial','owner':'装配体','title':'分层装配','segments':[{'id':'base','text':'底座'},{'id':'cap','text':'上盖'}]}},
                   'events':[{'id':'space','relation':'spatial','object_id':'assembly','cue_ids':['cue-1'],'meaning':'组合已有部件','before':'exploded','after':'whole','asset_range':[1,0]}]}
            (root/'brief.json').write_text(json.dumps(brief))
            result=subprocess.run([sys.executable,str(CLI),'explain','compile',str(root/'brief.json'),'--srt',str(root/'input.srt'),'--out',str(root/'plan.json')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr+result.stdout)
            plan=json.loads((root/'plan.json').read_text())
            self.assertEqual(plan['events'][0]['component'],'SpatialExplanation')
            self.assertEqual(plan['events'][0]['requires'],'rendered-mesh-3d')
            self.assertEqual(plan['events'][0]['asset_range'],[1,0])

    def test_identity_and_state_cannot_change_during_handoff(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'input.srt').write_text('1\n00:00:00,000 --> 00:00:03,000\n先录音。\n\n2\n00:00:03,000 --> 00:00:06,000\n得到反馈。\n')
            brief={'title':'表达', 'task':'process', 'source_note':'authored acceptance fixture',
                   'objects':{'voice':{'kind':'flow','owner':'我','title':'我的表达','segments':[{'id':'recorded','text':'录音'},{'id':'visual','text':'画面'}]}},
                   'events':[{'id':'one','relation':'feedback','object_id':'voice','cue_ids':['cue-1'],'meaning':'录音','before':'idea','after':'recorded'},
                             {'id':'two','relation':'feedback','object_id':'voice','cue_ids':['cue-2'],'meaning':'反馈','before':'recorded','after':'visual'}]}
            for field,value,error in [('owner','AI','IDENTITY_CHANGED'),('before','unrelated','STATE_HANDOFF_MISMATCH')]:
                changed=json.loads(json.dumps(brief));changed['events'][1][field]=value
                (root/'brief.json').write_text(json.dumps(changed))
                result=subprocess.run([sys.executable,str(CLI),'explain','compile',str(root/'brief.json'),'--srt',str(root/'input.srt'),'--out',str(root/'rejected.json')],capture_output=True,text=True)
                self.assertNotEqual(result.returncode,0)
                self.assertIn(error,result.stdout+result.stderr)
                self.assertFalse((root/'rejected.json').exists())

    def test_feedback_can_span_cues_and_retimes_from_srt(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            brief = {'title': '表达得到画面反馈', 'task': 'process', 'source_note': 'Local authored timing fixture',
                     'objects': {'idea': {'kind': 'flow', 'owner': '创作者', 'title': '我的表达',
                                          'segments': [{'id': 'voice', 'text': '录下想法'}, {'id': 'film', 'text': '画面反馈'}]}},
                     'events': [{'id': 'capture', 'relation': 'feedback', 'object_id': 'idea', 'cue_ids': ['cue-1', 'cue-2'],
                                 'meaning': '同一次表达进入录音', 'before': 'idea', 'after': 'voice'},
                                {'id': 'return', 'relation': 'feedback', 'object_id': 'idea', 'cue_ids': ['cue-3'],
                                 'meaning': '同一表达得到画面反馈', 'before': 'voice', 'after': 'film'}]}
            (root/'brief.json').write_text(json.dumps(brief))
            for name, middle in [('original', '03'), ('changed', '04')]:
                (root/f'{name}.srt').write_text(f'1\n00:00:00,000 --> 00:00:01,000\n有想法。\n\n2\n00:00:01,000 --> 00:00:{middle},000\n录下来。\n\n3\n00:00:{middle},000 --> 00:00:07,000\n得到画面。\n')
                result = subprocess.run([sys.executable, str(CLI), 'explain', 'compile', str(root/'brief.json'),
                                         '--srt', str(root/f'{name}.srt'), '--out', str(root/f'{name}.json')], capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            a, b = (json.loads((root/f'{name}.json').read_text()) for name in ['original', 'changed'])
            self.assertEqual(a['events'][1]['start_frame'], 90)
            self.assertEqual(b['events'][1]['start_frame'], 120)
            self.assertEqual(a['objects'], b['objects'])
            self.assertEqual(b['audio']['playback_rate'], 1)

    def test_srt_to_renderable_plan_preserves_document_content(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root/'voice.srt').write_text('1\n00:00:00,000 --> 00:00:03,000\n按段拆开。\n\n2\n00:00:03,000 --> 00:00:06,000\n找到相关段。\n')
            brief = {
                'title': '一份文档如何保留来源', 'task': 'explanation',
                'source_note': 'Authored silent acceptance fixture, not a user recording.',
                'objects': {'doc': {'kind': 'document', 'owner': '原文', 'title': '原文',
                                    'segments': [{'id': 'a', 'text': '第一段'}, {'id': 'b', 'text': '第二段'}]}},
                'events': [
                    {'id': 'split', 'relation': 'split', 'object_id': 'doc', 'cue_ids': ['cue-1'],
                     'meaning': '同一文档按原段落拆开', 'before': 'whole', 'after': 'parts'},
                    {'id': 'find', 'relation': 'filter', 'object_id': 'doc', 'cue_ids': ['cue-2'],
                     'meaning': '保留来源找到第二段', 'before': 'parts', 'after': 'selected', 'selected_ids': ['b']}
                ]}
            (root/'brief.json').write_text(json.dumps(brief, ensure_ascii=False))
            result = subprocess.run([sys.executable, str(CLI), 'explain', 'compile', str(root/'brief.json'),
                                     '--srt', str(root/'voice.srt'), '--out', str(root/'plan.json')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            plan = json.loads((root/'plan.json').read_text())
            self.assertEqual(plan['objects']['doc']['segments'], brief['objects']['doc']['segments'])
            self.assertEqual([e['component'] for e in plan['events']], ['DocumentSplit', 'DocumentFilter'])
            self.assertEqual(plan['events'][1]['handoff_from'], 'split')
            self.assertEqual(plan['audio']['playback_rate'], 1)
            self.assertEqual(plan['review']['user_acceptance'], 'pending')


if __name__ == '__main__':
    unittest.main()
