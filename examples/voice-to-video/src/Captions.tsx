import React from 'react';
import data from './captions.json';
export function CaptionFrame({frame,fps}:{frame:number;fps:number}){
 const sourceFrame=Math.round(frame*data.fps/fps);
 const cue=data.cues.find(c=>sourceFrame>=c.start_frame&&sourceFrame<c.end_frame);
 if(!cue)return null;
 const units=Array.from(cue.text).reduce((n,c)=>n+(/[A-Za-z0-9]/.test(c)?.56:c===' '?.35:1),0);
 const width=Math.max(280,Math.min(1240,units*38+66));
 return <g data-caption-id={cue.id} data-caption-start={cue.start_frame} data-caption-end={cue.end_frame}>
 <rect x={800-width/2} y={770} width={width} height={56} rx={15} fill="#141414" fillOpacity={.94} stroke="#ffffff20" strokeWidth={1}/>
 <text x={800} y={810} textAnchor="middle" fontFamily="InterflowCN,Figtree,sans-serif" fontSize={38} fontWeight={400} fill="#fff">{cue.text}</text>
 </g>;
}
