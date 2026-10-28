import {curve, phase, mix} from './motion';

/** Editorial cue sheet, in composition seconds. This does not detect beats or retime media. */
export type RhythmEvent = {id:string;at:number;source:'music-onset'|'voice'|'action'|'editorial';note?:string};
export type RhythmScore = {duration:number;events:Readonly<Record<string,number>>;cues:readonly RhythmEvent[];audioHash?:string};
export type RhythmKey = {event:string;value:number};
export type RhythmOptions = {enabled?:boolean;strength?:number};
export type RhythmPose = {x:number;y:number;scale:number};
const finite=(v:number,label:string)=>{if(!Number.isFinite(v))throw Error(`${label} must be finite`);};

export function createRhythmScore(duration:number,cues:readonly RhythmEvent[],audioHash?:string):RhythmScore {
 finite(duration,'duration');if(duration<=0)throw Error('duration must be positive');
 const events:Record<string,number>=Object.create(null);
 for(const cue of cues){
  if(!cue.id.trim()||Object.prototype.hasOwnProperty.call(events,cue.id))throw Error(`Missing or duplicate cue: ${cue.id}`);
  finite(cue.at,`cue ${cue.id}`);
  if(cue.at<0||cue.at>duration)throw Error(`Cue outside composition: ${cue.id}`);
  if(!['music-onset','voice','action','editorial'].includes(cue.source))throw Error(`Unknown cue source: ${cue.id}`);
  events[cue.id]=cue.at;
 }
 return Object.freeze({duration,events:Object.freeze(events),cues:Object.freeze(cues.map(c=>Object.freeze({...c}))),audioHash});
}
export function cueTime(score:RhythmScore,id:string):number {
 if(!Object.prototype.hasOwnProperty.call(score.events,id))throw Error(`Unknown cue: ${id}`);
 return score.events[id];
}
export function cueProgress(t:number,score:RhythmScore,start:string,end:string):number {
 finite(t,'composition time');const a=cueTime(score,start),b=cueTime(score,end);
 if(b<=a)throw Error(`Cue window must advance: ${start} -> ${end}`);
 return phase(t,a,b);
}
function strengthAt(options:RhythmOptions){
 const strength=options.enabled===false?0:(options.strength??1);
 finite(strength,'strength');if(strength<0||strength>1)throw Error('strength must be between 0 and 1');return strength;
}
/** Equal adjacent values are intentional reading holds; they stay exactly still. */
export function sampleRhythmTrack(t:number,score:RhythmScore,keys:readonly RhythmKey[],baseline:number,options:RhythmOptions={}):number {
 finite(t,'composition time');finite(baseline,'baseline');
 if(keys.length<2)throw Error('A track needs at least two named cues');
 const resolved=keys.map(k=>{finite(k.value,'key value');return {t:cueTime(score,k.event),v:k.value};});
 for(let i=1;i<resolved.length;i++)if(resolved[i].t<=resolved[i-1].t)throw Error('Track cue times must be strictly increasing');
 return mix(baseline,curve(t,resolved),strengthAt(options));
}
/** A single pose can be shared by the camera and any world-space focus decoration. */
export function sampleRhythmCamera(t:number,score:RhythmScore,tracks:{x:readonly RhythmKey[];y:readonly RhythmKey[];scale:readonly RhythmKey[]},baseline:RhythmPose,options:RhythmOptions={}):RhythmPose {
 if(baseline.scale<=0||tracks.scale.some(k=>k.value<=0))throw Error('Camera scale must be positive');
 return {x:sampleRhythmTrack(t,score,tracks.x,baseline.x,options),y:sampleRhythmTrack(t,score,tracks.y,baseline.y,options),scale:sampleRhythmTrack(t,score,tracks.scale,baseline.scale,options)};
}
