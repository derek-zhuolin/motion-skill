import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdirSync,writeFileSync} from 'node:fs';
import {DirectedFrame} from './DirectedFilm';
import rawPlan from './compiled-plan.json';
const plan:any=rawPlan;
function valid(html:string,label:string){if(/NaN|Infinity|undefinedpx/.test(html))throw Error('Nonfinite frame: '+label)}
const frames=new Set<number>([0,Math.round(plan.duration*plan.fps)-1]);
for(const scene of plan.scenes)for(const t of [scene.start,scene.timing.content_ready_at,scene.timing.read_complete_at,scene.timing.protected_until,scene.timing.preparation_at,scene.end-1/plan.fps,...(scene.emphasis||[]).map((x:any)=>x.at)])frames.add(Math.max(0,Math.min(Math.round(plan.duration*plan.fps)-1,Math.round(t*plan.fps))));
for(const frame of frames)valid(renderToStaticMarkup(<DirectedFrame plan={plan} frame={frame}/>),`plan ${frame}`);
let arrivals=0;
for(const scene of plan.scenes)if(scene.visual.renderer==='connect'&&scene.emphasis?.length){
 const frame=Math.round(scene.emphasis[0].at*plan.fps),html=renderToStaticMarkup(<DirectedFrame plan={plan} frame={frame}/>);
 const end=Number(html.match(/data-action="connection"[^>]*d="[^"]*H([\d.]+)/)?.[1]);
 const center=plan.layout.face?.enabled?675:800,expected=center+(scene.visual.labels.length-1)/2*275;
 if(!Number.isFinite(end)||Math.abs(end-expected)>.01)throw Error('Connection misses the recorded emphasis arrival');arrivals++;
}
for(const cue of plan.captions?.cues||[]){
 const frame=Math.round((cue.start_frame+1)*plan.fps/plan.captions.fps);
 if(!renderToStaticMarkup(<DirectedFrame plan={plan} frame={frame}/>).includes(`data-caption-id="${cue.id}"`))throw Error('Caption layer missing');
}
mkdirSync('evidence',{recursive:true});
const report={studyFrameStates:0,studyCount:0,planFrameStates:frames.size,emphasisArrivalsChecked:arrivals,deterministic:true,scope:'DOM/frame geometry checks only; not proof of human comprehension, audio synchronization or pixel continuity'};
writeFileSync('evidence/frame-check.json',JSON.stringify(report,null,2));console.log(report);
