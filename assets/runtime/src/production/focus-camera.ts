/** Experimental, opt-in camera emphasis. Seconds + explicit world-space targets; no tracking/ASR. */
export type Point = {x:number;y:number};
export type Rect = Point & {width:number;height:number};
export type Pose = Point & {scale:number};
export type FocusTarget = {id:string;rect:Rect;kind:'object'|'text'|'media';maxScale?:number};
export type FocusCue = {
 id:string;keyword:string;targetId:string;mode:'focus-return'|'pull-back-reveal';
 start:number;arrive:number;holdUntil:number;end:number;zoom:number;minReadSeconds:number;
 anchor?:Point;fromCenter?:Point;color?:string;
 annotation?:{label:string;detail?:string;width:number;height:number};
 trigger?:{at:number;point:Point};
};
export type FocusPlan = {width:number;height:number;duration:number;maxZoom?:number;safeArea?:Rect;protectedRegions?:Rect[];targets:FocusTarget[];cues:FocusCue[]};
export type CompiledFocusPlan = FocusPlan & {maxZoom:number;safeArea:Rect};
export type FocusOptions = {enabled?:boolean;strength?:number;annotations?:boolean};
export type FocusFrame = {
 width:number;height:number;pose:Pose;active:boolean;cue?:FocusCue;target?:Rect;
 annotation?:{rect:Rect;opacity:number;label:string;detail?:string};annotationReason?:string;
 trigger?:{point:Point;progress:number;opacity:number};
};
const finite=(n:number)=>Number.isFinite(n);
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(t:number)=>{const x=clamp(t);return x*x*x*(x*(x*6-15)+10)};
const phase=(t:number,a:number,b:number)=>b===a?(t>=b?1:0):ease((t-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const inside=(a:Rect,b:Rect)=>a.x>=b.x&&a.y>=b.y&&a.x+a.width<=b.x+b.width&&a.y+a.height<=b.y+b.height;
const overlap=(a:Rect,b:Rect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const validRect=(r:Rect)=>[r.x,r.y,r.width,r.height].every(finite)&&r.width>0&&r.height>0;
const validPoint=(p:Point)=>finite(p.x)&&finite(p.y);
function requireValue(ok:boolean,message:string){if(!ok)throw new Error(`FocusCamera: ${message}`)}
export function projectPoint(point:Point,pose:Pose,width:number,height:number):Point{return {x:width/2+(point.x-pose.x)*pose.scale,y:height/2+(point.y-pose.y)*pose.scale}}
export function projectRect(rect:Rect,pose:Pose,width:number,height:number):Rect{return {...projectPoint(rect,pose,width,height),width:rect.width*pose.scale,height:rect.height*pose.scale}}
function fullPose(plan:CompiledFocusPlan,cue:FocusCue):Pose{
 const target=plan.targets.find(t=>t.id===cue.targetId)!,center={x:target.rect.x+target.rect.width/2,y:target.rect.y+target.rect.height/2};
 if(cue.mode==='pull-back-reveal')return {...(cue.fromCenter??center),scale:cue.zoom};
 const anchor=cue.anchor??{x:plan.width/2,y:plan.height*.44};
 return {x:center.x-(anchor.x-plan.width/2)/cue.zoom,y:center.y-(anchor.y-plan.height/2)/cue.zoom,scale:cue.zoom};
}
/** Reject ambiguous/crowded plans instead of adding continuous camera drift. */
export function compileFocusPlan(input:FocusPlan):CompiledFocusPlan{
 const plan=JSON.parse(JSON.stringify(input)) as CompiledFocusPlan;
 const {width,height,duration}=plan;
 requireValue([width,height,duration].every(n=>finite(n)&&n>0),'positive canvas and duration required');
 plan.maxZoom??=1.6;plan.safeArea??={x:width*.05,y:height*.16,width:width*.9,height:height*.66};
 const canvas={x:0,y:0,width,height};
 requireValue(finite(plan.maxZoom)&&plan.maxZoom>=1&&plan.maxZoom<=2,'maxZoom must be 1–2');
 requireValue(validRect(plan.safeArea)&&inside(plan.safeArea,canvas),'safeArea outside canvas');
 for(const r of plan.protectedRegions??[])requireValue(validRect(r)&&inside(r,canvas),'invalid protected region');
 const ids=new Set<string>(),cueIds=new Set<string>();
 for(const target of plan.targets){
  requireValue(!!target.id&&!ids.has(target.id),'duplicate/empty target id');ids.add(target.id);
  requireValue(['object','text','media'].includes(target.kind)&&validRect(target.rect)&&inside(target.rect,canvas),'invalid target');
  if(target.maxScale!==undefined)requireValue(finite(target.maxScale)&&target.maxScale>=1,'invalid media scale limit');
 }
 let previousEnd=-Infinity;
 for(const cue of plan.cues){
  requireValue(!!cue.id&&!cueIds.has(cue.id),'duplicate/empty cue id');cueIds.add(cue.id);
  requireValue(!!cue.keyword.trim()&&ids.has(cue.targetId),'keyword must bind to a known target');
  requireValue(['focus-return','pull-back-reveal'].includes(cue.mode),'unknown mode');
  requireValue([cue.start,cue.arrive,cue.holdUntil,cue.end,cue.zoom,cue.minReadSeconds].every(finite),'non-finite cue');
  requireValue(cue.start>=0&&cue.start>=previousEnd&&cue.start<=cue.arrive&&cue.arrive<cue.holdUntil&&cue.holdUntil<cue.end&&cue.end<=duration,'overlap or invalid cue timing');
  requireValue(cue.mode==='pull-back-reveal'?cue.arrive===cue.start:cue.arrive>cue.start,'invalid arrival');
  requireValue(cue.minReadSeconds>=.3&&cue.holdUntil-cue.arrive-(cue.annotation ? .12 : 0)>=cue.minReadSeconds,'reading hold too short');
  const target=plan.targets.find(t=>t.id===cue.targetId)!;
  requireValue(cue.zoom>=1&&cue.zoom<=plan.maxZoom&&cue.zoom<=(target.maxScale??plan.maxZoom),'zoom exceeds plan/media limit');
  if(cue.anchor)requireValue(validPoint(cue.anchor),'invalid anchor');
  if(cue.fromCenter)requireValue(validPoint(cue.fromCenter),'invalid camera center');
  if(cue.mode==='focus-return'){
   const projected=projectRect(target.rect,fullPose(plan,cue),width,height);
   requireValue(inside(projected,plan.safeArea)&&!(plan.protectedRegions??[]).some(r=>overlap(projected,r)),'focused target conflicts with reading area');
  }
  if(cue.annotation)requireValue(cue.mode==='focus-return'&&!!cue.annotation.label.trim()&&validRect({x:0,y:0,...cue.annotation}),'invalid annotation');
  if(cue.trigger)requireValue(cue.mode==='pull-back-reveal'&&cue.trigger.at===cue.holdUntil&&validPoint(cue.trigger.point)&&inside({...cue.trigger.point,width:.001,height:.001},target.rect),'trigger must be the reveal cause inside target');
  previousEnd=cue.end;
 }
 return plan;
}
function placeAnnotation(plan:CompiledFocusPlan,target:Rect,width:number,height:number):Rect|undefined{
 const gap=23,cx=target.x+target.width/2,cy=target.y+target.height/2,s=plan.safeArea;
 const xs=(x:number)=>Math.max(s.x,Math.min(x,s.x+s.width-width));
 const candidates=[{x:xs(cx-width/2),y:target.y+target.height+gap,width,height},{x:xs(cx-width/2),y:target.y-height-gap,width,height},{x:target.x+target.width+gap,y:cy-height/2,width,height},{x:target.x-width-gap,y:cy-height/2,width,height}];
 return candidates.find(r=>inside(r,s)&&!overlap(r,target)&&!(plan.protectedRegions??[]).some(p=>overlap(r,p)));
}
/** One frame clock; arbitrary seeks/reverse/repeat resolve the same pose. Disabled by default. */
export function focusFrameAt(plan:CompiledFocusPlan,time:number,options:FocusOptions={}):FocusFrame{
 requireValue(finite(time),'time must be finite');
 const strength=options.strength??1;
 requireValue(finite(strength)&&strength>=0&&strength<=1,'strength must be 0–1');
 const base:FocusFrame={width:plan.width,height:plan.height,pose:{x:plan.width/2,y:plan.height/2,scale:1},active:false};
 if(!options.enabled||strength===0)return base;
 const cue=plan.cues.find(c=>time>=c.start&&time<c.end);if(!cue)return base;
 const weight=(cue.mode==='pull-back-reveal'?1:phase(time,cue.start,cue.arrive))*(1-phase(time,cue.holdUntil,cue.end))*strength;
 const full=fullPose(plan,cue),pose={x:mix(base.pose.x,full.x,weight),y:mix(base.pose.y,full.y,weight),scale:mix(1,full.scale,weight)};
 const target=projectRect(plan.targets.find(t=>t.id===cue.targetId)!.rect,pose,plan.width,plan.height);
 const frame:FocusFrame={...base,pose,active:weight>0,cue,target};
 if(cue.annotation&&options.annotations!==false){
  const rect=placeAnnotation(plan,target,cue.annotation.width,cue.annotation.height);
  if(rect)frame.annotation={...cue.annotation,rect,opacity:phase(time,cue.arrive,cue.arrive+.12)*(1-phase(time,cue.holdUntil,Math.min(cue.end,cue.holdUntil+.2)))};
  else frame.annotationReason='No free reading area; callout suppressed.';
 }
 if(cue.trigger){const p=(time-cue.trigger.at)/.38;if(p>=-.15&&p<=1)frame.trigger={point:projectPoint(cue.trigger.point,pose,plan.width,plan.height),progress:clamp(p),opacity:phase(time,cue.trigger.at-.06,cue.trigger.at)*(1-phase(time,cue.trigger.at+.18,cue.trigger.at+.38))}}
 return frame;
}
