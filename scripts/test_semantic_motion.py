import unittest,copy,json,tempfile
from pathlib import Path
from semantic_motion import recommend,summarize,ROOT
from remotion_preflight import locate
from production import audit_production
class SemanticTests(unittest.TestCase):
 def setUp(self):self.plan=json.loads((ROOT/'assets/semantic-plan.example.json').read_text())
 def test_valid_and_not_yet_wired(self):
  r=recommend(self.plan);self.assertEqual(r['blocking'],[]);self.assertTrue(all(s['state']=='planned_not_wired' for s in r['shots']))
 def test_same_type_can_use_alternative(self):
  r=recommend(self.plan);self.assertEqual([s['primary'] for s in r['shots'][:2]],['number-reel','value-reveal'])
 def test_adjacent_reveal_family_varies(self):
  r=recommend(self.plan);self.assertEqual(r['shots'][2]['primary'],'keyword-rhythm')
 def test_deterministic_not_random(self):self.assertEqual(recommend(self.plan),recommend(self.plan))
 def test_history_changes_eligible_choice(self):
  self.plan['recent_mechanisms']=['number-reel'];self.assertEqual(recommend(self.plan)['shots'][0]['primary'],'value-reveal')
 def test_snapshot_no_growth(self):
  self.plan['shots'][0]['number']['animate_growth']=True;self.assertIn('s1: SNAPSHOT_CANNOT_IMPLY_GROWTH',recommend(self.plan)['blocking'])
 def test_zero_is_known(self):
  self.plan['shots'][0]['number']['display']='0';self.assertFalse(recommend(self.plan)['blocking'])
 def test_missing_source(self):
  self.plan['shots'][0]['number']['source']='';self.assertIn('s1: NUMBER_SOURCE_REQUIRED',recommend(self.plan)['blocking'])
 def test_verified_change_uses_comparison(self):
  s=self.plan['shots'][0];s['kind']='number_change';s['number']={'source':'fixture','compatible_units':True,'observations':[{'value':0,'label':'before','source':'fixture','observed_at':'t1'},{'value':2,'label':'after','source':'fixture','observed_at':'t2'}]}
  r=recommend(self.plan);self.assertFalse(r['blocking']);self.assertEqual(r['shots'][0]['primary'],'numeric-comparison')
 def test_unknown_change_cannot_count(self):
  self.plan['shots'][0]['kind']='number_change';self.assertIn('s1: TWO_VERIFIED_OBSERVATIONS_REQUIRED',recommend(self.plan)['blocking'])
 def test_media_requires_actual_inspection(self):
  self.plan['shots'][3]['media']['inspected']=False;self.assertIn('s4: MEDIA_INSPECTION_SOURCE_RIGHTS_REQUIRED',recommend(self.plan)['blocking'])
 def test_moving_subject_holds_camera(self):
  self.plan['shots'][3]['media']['has_subject_motion']=True;self.assertEqual(recommend(self.plan)['shots'][3]['options']['camera'],'hold')
 def test_claim_vs_hierarchy(self):
  self.plan['shots'][2]['intent']='hierarchy';self.assertEqual(recommend(self.plan)['shots'][2]['primary'],'keyword-rhythm')
 def test_not_arbitrary_forced_mechanism(self):
  self.plan['shots'][0]['preferred_adapter']='clay-join';self.assertIn('s1: PREFERRED_ADAPTER_NOT_SUITABLE',recommend(self.plan)['blocking'])
 def test_read_budget_is_protected(self):
  self.plan['shots'][0]['reading']['ready_at']=2.4;self.assertIn('s1: READ_WINDOW_TOO_SHORT',recommend(self.plan)['blocking'])
 def test_handoff_not_earlier_than_reading(self):
  self.plan['shots'][0]['handoff']['at']=2;self.assertIn('s1: EXIT_BEFORE_READING_COMPLETE',recommend(self.plan)['blocking'])
 def test_handoff_time_is_bounded(self):
  self.plan['shots'][0]['handoff']['at']=99;self.assertIn('s1: HANDOFF_OUTSIDE_SHOT',recommend(self.plan)['blocking'])
 def test_object_handoff_is_real(self):
  self.plan['shots'][1]['object_ids']=[];self.assertIn('s1: HANDOFF_OBJECT_LOST',recommend(self.plan)['blocking'])
 def test_plan_is_readable_and_numbered(self):
  t=summarize(recommend(self.plan));self.assertIn('#35',t);self.assertIn('阅读窗口',t);self.assertIn('计划，不代表已接入',t)
 def test_missing_dependency_does_not_install(self):
  with tempfile.TemporaryDirectory() as d:self.assertEqual(locate(d,[],d)['status'],'missing')
 def test_project_dependency_and_no_false_read_claim(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'.agents/skills/remotion-best-practices';p.mkdir(parents=True);(p/'SKILL.md').write_text('version: test\n')
   r=locate(d,[],d);self.assertEqual(r['version'],'test');self.assertFalse(r['agent_read_confirmed'])
 def test_new_adapter_real_import_required(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'src/production').mkdir(parents=True);(root/'src/production/DetailMechanisms.tsx').write_text('export const NumberReel=()=>null;')
   caller=root/'src/Film.tsx';caller.write_text("import {NumberReel} from './production/DetailMechanisms'; const x=<NumberReel/>;")
   m={'duration':3,'visual_system':{k:'test' for k in ['palette','typography','material','motion','sound']},'mechanisms':[{'adapter':'number-reel','file':'src/Film.tsx','start':0,'end':3,'reason':'show count'}]}
   reg=json.loads((ROOT/'references/production-registry.json').read_text());self.assertFalse(audit_production(m,root,reg)['blocking']);caller.write_text('const x="NumberReel";');self.assertTrue(audit_production(m,root,reg)['blocking'])
if __name__=='__main__':unittest.main()
