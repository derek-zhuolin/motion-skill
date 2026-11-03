import copy
import base64
import json
from pathlib import Path
import tempfile
import unittest
from open_direction import parse_srt, index_assets, browse, select, review, remember, save, record_feedback, history_records, is_frame_image


def fixture():
    return {'duration': 4, 'concepts': [{'id': 'a', 'idea': '物体聚合', 'tradeoff': '强调关系'},
                                     {'id': 'b', 'idea': '文字对话', 'tradeoff': '强调观点'}],
            'selected_concept': 'a', 'concept_reason': '变化发生在对象关系',
            'shots': [{'id': 's1', 'meaning': '多个观点成为共识', 'relationship': '分歧变共识',
                       'before': '彼此分离', 'after': '共同结论', 'focus_object': '结论',
                       'composition': '空间聚合', 'medium': '图形', 'action': '汇聚',
                       'start': 0, 'end': 4, 'reading': {'ready_at': 2, 'until': 4, 'min_seconds': 1.5, 'basis': '短句'},
                       'candidates': [{'type': 'custom', 'id': 'consensus', 'design': '共享对象汇聚为共同轮廓',
                                       'fit': 1, 'suitable': True, 'reason': '具体呈现关系变化'}]}]}


class DirectionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def srt(self, text):
        p = self.root/'input.srt'; p.write_text(text); return p

    def actual_fixture(self):
        (self.root/'caller.tsx').write_text("import {Shape} from './Shape'; export const Scene=()=> <Shape />;")
        (self.root/'Shape.tsx').write_text('export const Shape=()=>null;')
        (self.root/'frame.png').write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC9sAAAAASUVORK5CYII='))
        spec = fixture()['shots'][0]
        shot = {key: spec[key] for key in ('composition', 'medium', 'action')}
        shot.update(id='s1', mechanism='consensus', caller='caller.tsx', implementation='Shape.tsx', symbol='Shape', observed_frame=75, frame_evidence='frame.png', visual_note='测试观察字段，不是实际审美验收',
                    visual_checks={k: {'status': 'pass', 'observation': 'fixture only'} for k in ('meaning', 'material', 'continuity')})
        return {'shots': [shot], 'passes': {k: {'findings': ['fixture']} for k in ('remove', 'improve', 'performance')}}

    def test_srt_bom_crlf_multiline_fractional_fps(self):
        r = parse_srt(self.srt('\ufeff1\r\n00:00:00,100 --> 00:00:01,001\r\n第一行\r\n第二行\r\n'), 29.97)
        self.assertEqual((r['cues'][0]['start_frame'], r['cues'][0]['end_frame']), (2, 30))
        self.assertEqual(r['cues'][0]['text'], '第一行\n第二行')
        self.assertTrue(r['enabled']); self.assertFalse(r['alignment_verified'])

    def test_srt_rejects_bad_times_and_truncation(self):
        for text in ('', '1\n00:99:00,000 --> 00:00:01,000\na', '1\n00:00:02,000 --> 00:00:01,000\na', '1\n00:00:00,000 --> 00:00:01,000'):
            with self.assertRaises(ValueError): parse_srt(self.srt(text))
        with self.assertRaises(ValueError): parse_srt(self.srt('1\n00:00:00,000 --> 00:00:02,000\na'), duration=1)

    def test_overlap_preserved_as_warning_not_silently_shifted(self):
        result = parse_srt(self.srt('1\n00:00:00,000 --> 00:00:02,000\na\n\n2\n00:00:01,000 --> 00:00:03,000\nb'))
        self.assertEqual(result['cues'][1]['start'], 1)
        self.assertEqual(len(result['warnings']), 1)

    def test_local_index_excludes_symlinks_and_private_directories(self):
        assets = self.root/'assets'; assets.mkdir(); (assets/'image.png').write_bytes(b'fixture')
        (assets/'linked.png').symlink_to(assets/'image.png')
        (assets/'.secret').mkdir(); (assets/'.secret'/'private.png').write_bytes(b'fixture')
        result = index_assets([assets, assets])
        self.assertEqual(len(result['assets']), 1)
        self.assertEqual(result['assets'][0]['rights'], 'unconfirmed')

    def test_full_catalog_not_only_adapters(self):
        result = browse(limit=0)
        self.assertEqual(len(result['effects']), 96)
        self.assertTrue(any(not row['adapters'] for row in result['effects']))

    def test_open_relation_and_custom_not_rejected_by_closed_enum(self):
        result = select(fixture())
        self.assertFalse(result['blocking'])
        self.assertEqual(result['shots'][0]['selected']['state'], 'implementation_required')

    def test_srt_many_to_many_shots_and_unknown_cue(self):
        plan = fixture(); plan['anchors'] = {'cues': [{'id': 'cue-1', 'start': 0, 'end': 2}, {'id': 'cue-2', 'start': 2, 'end': 4}]}
        plan['shots'][0]['cue_ids'] = ['cue-1', 'cue-2']
        self.assertFalse(select(plan)['blocking'])
        plan['shots'][0]['cue_ids'].append('missing')
        self.assertTrue(select(plan)['blocking'])

    def test_history_breaks_equal_fit_ties_only(self):
        plan = fixture(); shot = plan['shots'][0]
        shot['candidates'] = [{'type': 'adapter', 'id': name, 'fit': 1, 'suitable': True, 'reason': '承载关键词'} for name in ['line-reveal', 'keyword-rhythm']]
        history = self.root/'history.jsonl'
        history.write_text(json.dumps({'run_id': 'old', 'actual_shots': [{'mechanism': 'line-reveal'}]})+'\n')
        self.assertEqual(select(plan, history)['shots'][0]['selected']['id'], 'keyword-rhythm')
        shot['candidates'][1]['fit'] = .9
        self.assertEqual(select(plan, history)['shots'][0]['selected']['id'], 'line-reveal')

    def test_gaps_and_empty_reading_block(self):
        plan = fixture(); plan['shots'][0]['start'] = .5
        self.assertTrue(select(plan)['blocking'])
        plan = fixture(); plan['shots'][0]['reading']['until'] = 2
        self.assertTrue(select(plan)['blocking'])

    def test_history_refuses_unrendered_and_stale_work(self):
        report_path = self.root/'report.json'; history = self.root/'history.jsonl'
        save(report_path, {'blocking': [], 'status': 'planned_not_wired'})
        with self.assertRaises(ValueError): remember(report_path, history, 'one')
        actual = self.actual_fixture()
        result = review(select(fixture()), self.root, actual)
        self.assertFalse(result['blocking'])
        self.assertEqual(result['user_acceptance'], 'pending')
        valid = self.root/'valid.json'; save(valid, result)
        remember(valid, history, 'one')
        with self.assertRaises(ValueError): remember(valid, history, 'one')
        (self.root/'Shape.tsx').write_text('changed')
        with self.assertRaises(ValueError): remember(valid, history, 'two')

    def test_srt_link_requires_time_overlap_or_explicit_offset(self):
        plan = fixture(); plan['duration'] = 8
        plan['anchors'] = {'cues': [{'id': 'late', 'start': 6, 'end': 8}]}
        plan['shots'][0]['cue_ids'] = ['late']
        self.assertTrue(any('CUE_DOES_NOT_OVERLAP' in s for s in select(plan)['blocking']))
        plan['shots'][0]['anchor_offset_reason'] = '先出现视觉问题，后由口播作答'
        self.assertFalse(any('CUE_DOES_NOT_OVERLAP' in s for s in select(plan)['blocking']))

    def test_failed_visual_check_cannot_be_remembered(self):
        actual = self.actual_fixture(); actual['shots'][0]['visual_checks']['meaning']['status'] = 'needs_revision'
        result = review(select(fixture()), self.root, actual)
        self.assertIn('s1: VISUAL_CHECK_MEANING_UNRESOLVED', result['blocking'])
        report = self.root/'report.json'; save(report, result)
        with self.assertRaises(ValueError): remember(report, self.root/'history.jsonl', 'bad')

    def test_actual_layout_must_not_silently_copy_plan(self):
        actual = self.actual_fixture(); actual['shots'][0]['composition'] = '不同的实际构图'
        self.assertTrue(review(select(fixture()), self.root, actual)['blocking'])
        actual['shots'][0]['change_reason'] = '素材实际比例需要调整'
        result = review(select(fixture()), self.root, actual)
        self.assertFalse(result['blocking'])
        self.assertEqual(result['actual_shots'][0]['composition'], '不同的实际构图')

    def test_dependency_change_invalidates_review(self):
        actual = self.actual_fixture()
        (self.root/'Shape.tsx').write_text("import {color} from './theme'; export const Shape=()=>null;")
        (self.root/'theme.ts').write_text("export const color='blue';")
        result = review(select(fixture()), self.root, actual);self.assertFalse(result['blocking'])
        report = self.root/'report.json';save(report,result)
        (self.root/'theme.ts').write_text("export const color='red';")
        with self.assertRaises(ValueError): remember(report, self.root/'history.jsonl', 'changed')

    def test_text_file_is_not_frame_evidence(self):
        actual = self.actual_fixture();(self.root/'frame.png').write_text('not an image')
        self.assertIn('s1: IMAGE_FRAME_EVIDENCE_REQUIRED', review(select(fixture()), self.root, actual)['blocking'])

    def test_jpeg_header_uses_bytes_not_filename(self):
        path=self.root/'screenshot.png'
        path.write_bytes(b'\xff\xd8\xff\xe0\x00\x04xx\xff\xc0\x00\x07\x08\x00\x10\x00\x20')
        self.assertTrue(is_frame_image(path))
        path.write_bytes(b'\xff\xd8\xff\xc0\x00\x07\x08\x00')
        self.assertFalse(is_frame_image(path))

    def test_feedback_is_preserved_separately_from_executed_work(self):
        history=self.root/'history.jsonl'
        history.write_text(json.dumps({'run_id':'old','actual_shots':[{'mechanism':'consensus'}]})+'\n')
        feedback=self.root/'feedback.json'
        save(feedback,{'run_id':'old','source':'user','note':'字体可以，内容不清楚','dimensions':{'typography':'accepted','meaning':'needs_revision'}})
        record_feedback(feedback,history)
        rows=history_records(history);self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['actual_shots'][0]['mechanism'],'consensus')
        self.assertEqual(select(fixture(),history)['recent_feedback'][0]['dimensions']['meaning'],'needs_revision')

    def test_two_identical_concepts_are_not_two_choices(self):
        plan=fixture();plan['concepts'][1]=copy.deepcopy(plan['concepts'][0])
        self.assertIn('DUPLICATE_CONCEPTS',select(plan)['blocking'])

    def test_one_reasoned_direction_does_not_require_a_fake_alternative(self):
        plan=fixture();plan['concepts']=plan['concepts'][:1]
        self.assertEqual(select(plan)['blocking'],[])

    def test_empty_direction_still_requires_a_reasoned_choice(self):
        plan=fixture();plan['concepts']=[]
        self.assertIn('CONCEPT_AND_TRADEOFF_REQUIRED',select(plan)['blocking'])


if __name__ == '__main__': unittest.main()
