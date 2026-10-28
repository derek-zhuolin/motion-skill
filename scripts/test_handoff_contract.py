import copy,json,unittest
from pathlib import Path
from validate_handoffs import validate

class HandoffTests(unittest.TestCase):
    def setUp(self):self.plan=json.loads((Path(__file__).resolve().parents[1]/'assets/handoff-contract.example.json').read_text())
    def reject(self,fn,code):
        fn(self.plan['boundaries'][0]);self.assertTrue(any(code in e for e in validate(self.plan)['blocking']))
    def test_valid_is_not_visual_acceptance(self):self.assertEqual(validate(self.plan)['status'],'contract_valid_not_visual_acceptance')
    def test_gap(self):self.reject(lambda r:r['outgoing'].update(visibleUntil=2.8,readableUntil=2.7),'HANDOFF_GAP')
    def test_process_cannot_claim_completion(self):self.reject(lambda r:r.update(componentRole='completion-indicator'),'COMPLETION_CANNOT')
    def test_true_result_can_show_completion(self):
        self.plan['boundaries'][0].update(role='result',componentRole='completion-indicator',completionEvidence=True);self.assertFalse(validate(self.plan)['blocking'])
    def test_no_video_cold_mount(self):self.reject(lambda r:r['incoming'].update(premountSeconds=0),'PREMOUNT_OR')
    def test_explicit_ready_gate_alternative(self):
        self.plan['boundaries'][0]['incoming'].update(premountSeconds=0,runtimeReadyGate=True);self.assertFalse(validate(self.plan)['blocking'])
    def test_one_clock(self):self.reject(lambda r:r.update(usesMountClock=True),'INDEPENDENT_CLOCK')
    def test_no_double_interpolation(self):self.reject(lambda r:r.update(nestedInterpolation=True),'GEOMETRY_OWNER')
    def test_camera_readiness(self):self.reject(lambda r:r.update(cameraFocusAt=2),'CAMERA_ARRIVES')
    def test_missing_role(self):self.reject(lambda r:r.update(componentRole=None),'COMPONENT_ROLE')
    def test_non_finite_timing(self):self.reject(lambda r:r['incoming'].update(readableFrom=float('nan')),'FINITE_TIMING')
    def test_no_source_frame_before_start(self):self.reject(lambda r:r['incoming'].update(mediaStart=4),'MEDIA_NOT_AVAILABLE')

if __name__=='__main__':unittest.main()
