import copy
import json
from pathlib import Path
import tempfile
import unittest

from orchestration import check, project_file, resolve, shotbook, snapshot

ROOT = Path(__file__).resolve().parents[1]


class OrchestrationTests(unittest.TestCase):
    def setUp(self):
        self.plan = json.loads((ROOT / 'assets/orchestration.example.json').read_text())

    def test_optional_extension_preserves_legacy(self):
        result = resolve({'duration': 3, 'shots': []})
        self.assertEqual(result['status'], 'not_requested')
        self.assertEqual(result['evidence']['plan'], 'not_checked')

    def test_hold_and_custom_are_legal_not_visual_pass(self):
        result = resolve(self.plan)
        self.assertEqual(result['status'], 'plan_valid', result['blocking'])
        self.assertEqual(result['shots'][1]['motion_intent'], 'hold')
        self.assertEqual(result['evidence']['pixels'], 'not_checked')
        self.assertEqual(result['evidence']['user_acceptance'], 'pending')
        self.assertIn('3.6', shotbook(result))
        self.assertTrue(result['risk_windows'])

    def test_handoff_receiver_starts_after_sender_disappears(self):
        events = self.plan['orchestration']['events']
        events.update(inspectMounted=6, inspectReady=6.2, inspectRead=7.8)
        self.plan['orchestration']['shots'][1]['minReadSeconds'] = 1.2
        result = resolve(self.plan)
        self.assertEqual(result['blocking'], ['organize: HANDOFF_RECEIVER_NOT_ACTIVE'])
        self.assertEqual(result['status'], 'blocked')

    def test_mounting_before_handoff_does_not_prove_readability(self):
        self.plan['orchestration']['events']['inspectReady'] = 4.8
        result = resolve(self.plan)
        self.assertIn('organize: HANDOFF_RECEIVER_NOT_READABLE', result['blocking'])
        self.assertEqual(result['handoff_checks'][0]['receiver_active'], 'declared_valid')
        self.assertEqual(result['handoff_checks'][0]['receiver_readable'], 'blocked')

    def test_receiver_can_premount_then_hold_when_handoff_arrives(self):
        self.plan['orchestration']['events']['inspectMounted'] = 3
        result = resolve(self.plan)
        self.assertEqual(result['status'], 'plan_valid', result['blocking'])
        self.assertEqual(result['handoff_checks'][0]['status'], 'declared_valid')
        self.assertEqual(result['shots'][1]['motion_intent'], 'hold')

    def test_receiver_without_extension_is_explicitly_partial(self):
        self.plan['orchestration']['shots'].pop()
        result = resolve(self.plan)
        self.assertEqual(result['status'], 'plan_partial')
        self.assertEqual(result['evidence']['plan'], 'partial')
        self.assertEqual(result['handoff_checks'][0]['status'], 'not_checked')
        self.assertTrue(any('HANDOFF_RECEIVER_NOT_EXTENDED' in w for w in result['warnings']))

    def test_unresolved_receiver_does_not_claim_handoff_checked(self):
        del self.plan['orchestration']['events']['inspectReady']
        result = resolve(self.plan)
        self.assertEqual(result['status'], 'blocked')
        self.assertEqual(result['handoff_checks'][0]['status'], 'not_checked')
        self.assertTrue(any('HANDOFF_RECEIVER_TIMING_UNRESOLVED' in w for w in result['warnings']))

    def test_cut_can_have_entry_animation_but_coverage_is_unchecked(self):
        self.plan['orchestration']['shots'][0]['handoff']['kind'] = 'cut'
        self.plan['orchestration']['events']['inspectReady'] = 4.8
        result = resolve(self.plan)
        self.assertEqual(result['blocking'], [])
        self.assertEqual(result['status'], 'plan_partial')
        self.assertEqual(result['handoff_checks'][0]['receiver_readable'], 'not_checked')

    def test_result_requires_evidence_reference(self):
        self.plan['orchestration']['shots'][1]['role'] = 'result'
        result = resolve(self.plan)
        self.assertIn('inspect: RESULT_EVIDENCE_REFERENCE_REQUIRED', result['blocking'])
        self.plan['orchestration']['evidence'] = [{'id': 'synthetic', 'source': 'fixture://authored', 'scope': 'A synthetic result only'}]
        self.plan['orchestration']['shots'][1]['evidenceRef'] = 'synthetic'
        self.assertEqual(resolve(self.plan)['status'], 'plan_valid')

    def test_missing_event_is_blocked(self):
        del self.plan['orchestration']['events']['inspectReady']
        self.assertIn('inspect: readableFromEvent: UNKNOWN_EVENT', resolve(self.plan)['blocking'])

    def test_duplicate_geometry_decision_is_blocked(self):
        self.plan['orchestration']['objects'][0]['geometry'].append({'property': 'transform', 'owner': 'anotherClock'})
        self.assertIn('record.transform: DUPLICATE_GEOMETRY_OWNER', resolve(self.plan)['blocking'])

    def test_legacy_time_conflict_is_blocked(self):
        self.plan['shots'][0]['end'] = 3.8
        self.assertIn('organize: end: LEGACY_TIME_CONFLICT', resolve(self.plan)['blocking'])

    def test_short_read_window_and_early_handoff_are_blocked(self):
        self.plan['orchestration']['events']['organizedRead'] = 4.5
        result = resolve(self.plan)
        self.assertIn('organize: INVALID_TIME_ORDER', result['blocking'])
        self.assertIn('organize: HANDOFF_BEFORE_READING_OR_OUTSIDE_SHOT', result['blocking'])

    def test_shared_object_must_survive_handoff(self):
        self.plan['shots'][1]['object_ids'] = ['cursor']
        self.plan['shots'][1]['focus_object'] = 'cursor'
        self.assertIn('organize: HANDOFF_OBJECT_LOST', resolve(self.plan)['blocking'])

    def test_same_caption_is_review_warning_not_forced_rewrite(self):
        s = self.plan['orchestration']['shots'][0]
        s['visual'] = s['narration']
        result = resolve(self.plan)
        self.assertEqual(result['status'], 'plan_valid')
        self.assertEqual(len(result['warnings']), 1)

    def test_nonfinite_or_bool_times_fail(self):
        self.plan['orchestration']['events']['organized'] = True
        self.assertIn('events.organized: INVALID_EVENT_TIME', resolve(self.plan)['blocking'])


class FreshnessTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / 'scene.tsx').write_text('frame driven')
        (self.root / 'music.wav').write_bytes(b'fixture-not-real-audio')

    def tearDown(self):
        self.tmp.cleanup()

    def manifest(self):
        return snapshot(self.root, {'source': ['scene.tsx'], 'audio': ['music.wav']})

    def test_unchanged_is_fresh_not_accepted(self):
        report = check(self.root, self.manifest())
        self.assertEqual(report['status'], 'fresh')
        self.assertEqual(report['evidence']['user_acceptance'], 'pending')

    def test_music_change_invalidates_binding(self):
        manifest = self.manifest()
        (self.root / 'music.wav').write_bytes(b'new-music')
        report = check(self.root, manifest)
        self.assertEqual(report['status'], 'stale')
        self.assertEqual(report['changes'][0]['category'], 'audio')

    def test_missing_file_is_stale(self):
        manifest = self.manifest()
        (self.root / 'scene.tsx').unlink()
        self.assertEqual(check(self.root, manifest)['changes'][0]['reason'], 'missing')

    def test_missing_snapshot_file_fails(self):
        with self.assertRaises(FileNotFoundError):
            snapshot(self.root, {'source': ['missing.tsx']})

    def test_traversal_absolute_and_private_paths_fail(self):
        for name in ('../scene.tsx', '/tmp/outside', '.env', '.aws/config', 'credentials.json', 'secret.pem'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                project_file(self.root, name)

    def test_symlink_escape_and_private_alias_fail(self):
        (self.root / 'outside').symlink_to(self.root.parent)
        with self.assertRaises(ValueError):
            project_file(self.root, 'outside')
        (self.root / '.env').write_text('fixture secret')
        (self.root / 'innocent.txt').symlink_to(self.root / '.env')
        with self.assertRaises(ValueError):
            project_file(self.root, 'innocent.txt')

    def test_empty_duplicate_and_tampered_manifest_fail(self):
        with self.assertRaises(ValueError):
            snapshot(self.root, {})
        with self.assertRaises(ValueError):
            snapshot(self.root, {'source': ['scene.tsx'], 'asset': ['scene.tsx']})
        manifest = self.manifest()
        manifest['files'][0]['bytes'] = 1
        with self.assertRaises(ValueError):
            check(self.root, manifest)

    def test_deterministic_snapshot_id(self):
        first = self.manifest()
        second = snapshot(self.root, {'audio': ['music.wav'], 'source': ['scene.tsx']})
        self.assertEqual(first['build_id'], second['build_id'])


if __name__ == '__main__':
    unittest.main()
