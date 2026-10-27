"""Validate pilot evidence without granting human approval or rendering a full film."""
from pathlib import Path
import argparse,json

def evaluate(data,base):
 blockers=[];sample=data.get('sample',{});duration=sample.get('duration',0)
 override=data.get('duration_override',{}).get('direct_user_evidence')
 if not isinstance(duration,(int,float)) or not (15<=duration<=20) and not override:blockers.append('PILOT_DURATION')
 if sample.get('audio_speed')!=1:blockers.append('SOURCE_SPEED_CHANGED')
 if sample.get('asr_reused') is not True:blockers.append('TRANSCRIPT_REUSE_UNCONFIRMED')
 for k in ('mp4','source_excerpt'):
  p=data.get('artifacts',{}).get(k)
  if not p or not (base/p).is_file():blockers.append('MISSING_'+k.upper())
 for key in ('typecheck','frame_geometry','audio_alignment','media_decode','source_provenance'):
  if data.get('technical',{}).get(key) is not True:blockers.append('TECH_'+key.upper())
 human=data.get('human_review',{});accepted=human.get('status')=='accepted' and bool(human.get('direct_user_evidence'))
 return {'technical_blockers':blockers,'human_status':human.get('status','pending'),'can_expand':not blockers and accepted,'note':'Technical checks never promote human status; approval must come directly from the user.'}
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('review');a=p.parse_args();f=Path(a.review).resolve();result=evaluate(json.loads(f.read_text()),f.parent);print(json.dumps(result,ensure_ascii=False,indent=2))
