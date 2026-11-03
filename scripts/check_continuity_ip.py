"""Validate declared timing/layout, not rendered pixels or perceptual acceptance."""
import json,sys,math

def validate(p):
 errors=[]
 def need(ok,msg):
  if not ok: errors.append(msg)
 duration=p['duration'];w,h=p['canvas'];previous=None
 need(duration>0 and w>0 and h>0,'invalid duration/canvas')
 for shot in p['shots']:
  label=shot['id'];a,b=shot['visible'];ra,rb=shot['readable']
  need(0<=a<=ra<rb<=b<=duration,label+': invalid windows')
  need(rb-ra>=shot['minimum_read_seconds'],label+': reading budget')
  if previous:need(a<=previous['visible'][1],label+': handoff gap')
  else:need(a==0,'opening gap')
  if shot.get('camera'):need(bool(shot['camera'].get('target')) and bool(shot['camera'].get('purpose')),label+': camera needs target/purpose')
  boxes=shot.get('boxes',[])
  for box in boxes:
   x,y,bw,bh=box['rect'];need(all(math.isfinite(v) for v in box['rect']) and bw>0 and bh>0,label+': invalid box')
   need(x>=0 and y>=0 and x+bw<=w and y+bh<=h,label+': box outside canvas')
  for i,u in enumerate(boxes):
   for v in boxes[i+1:]:
    if u.get('allow_overlap') or v.get('allow_overlap'):continue
    x,y,bw,bh=u['rect'];xx,yy,ww,hh=v['rect']
    need(min(x+bw,xx+ww)<=max(x,xx) or min(y+bh,yy+hh)<=max(y,yy),label+': overlapping '+u['id']+'/'+v['id'])
  previous=shot
 need(previous is not None and previous['visible'][1]==duration,'ending gap')
 return errors
if __name__=='__main__':
 p=json.load(open(sys.argv[1]));errors=validate(p)
 print(json.dumps({'status':'invalid' if errors else 'declared_contract_passed','errors':errors,'visual_acceptance':False},ensure_ascii=False,indent=2));sys.exit(bool(errors))
