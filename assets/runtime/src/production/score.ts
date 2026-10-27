import {clamp,phase} from './motion';

export type Beat = number | {after:string;offset?:number};
export type MotionScore = {
 duration:number;
 beats:Record<string,Beat>;
 cues:Record<string,{from:string;to:string}>;
};
export type CompiledScore = {
 duration:number;
 beats:Readonly<Record<string,number>>;
 cues:Readonly<Record<string,Readonly<{start:number;end:number}>>>;
};

/** Resolve one semantic timing graph. This does not choose narrative or motion. */
export function compileScore(input:MotionScore):CompiledScore{
 if(!Number.isFinite(input.duration)||input.duration<=0)throw Error('Score duration must be positive');
 const resolved:Record<string,number>=Object.create(null),visiting=new Set<string>();
 const resolve=(id:string):number=>{
  if(Object.prototype.hasOwnProperty.call(resolved,id))return resolved[id];
  if(!Object.prototype.hasOwnProperty.call(input.beats,id))throw Error('Unknown beat: '+id);
  if(visiting.has(id))throw Error('Cyclic beat dependency: '+id);
  visiting.add(id);
  const spec=input.beats[id];
  if(typeof spec!=='number'&&(!spec||typeof spec.after!=='string'||!Number.isFinite(spec.offset??0)))throw Error('Invalid relative beat: '+id);
  const value=typeof spec==='number'?spec:resolve(spec.after)+(spec.offset??0);
  if(!Number.isFinite(value)||value<0||value>input.duration)throw Error('Beat outside duration: '+id);
  resolved[id]=value;visiting.delete(id);return value;
 };
 Object.keys(input.beats).forEach(resolve);
 const cues:Record<string,Readonly<{start:number;end:number}>>=Object.create(null);
 for(const [id,spec] of Object.entries(input.cues)){
  const start=resolve(spec.from),end=resolve(spec.to);
  if(!(start<end))throw Error('Cue must have positive duration: '+id);
  cues[id]=Object.freeze({start,end});
 }
 return Object.freeze({duration:input.duration,beats:Object.freeze(resolved),cues:Object.freeze(cues)});
}

/** Deterministic frame-clock progress; no mount clock, timer, or audio analysis. */
export function cueProgress(score:CompiledScore,id:string,t:number,easing:'soft'|'out'|'linear'='soft'):number{
 const cue=score.cues[id];
 if(!cue)throw Error('Unknown cue: '+id);
 if(!Number.isFinite(t))throw Error('Frame time must be finite');
 const p=clamp((t-cue.start)/(cue.end-cue.start));
 return easing==='out'?1-Math.pow(1-p,3):easing==='linear'?p:phase(t,cue.start,cue.end);
}
