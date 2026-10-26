import React from 'react';
export function CaptionFrame({plan,frame}:{plan:any;frame:number}){
 const cfg=plan.captions;if(!cfg?.enabled)return null;
 const f=Math.round(frame*(cfg.fps||plan.fps)/plan.fps);
 const cue=(cfg.cues||[]).find((c:any)=>f>=c.start_frame&&f<c.end_frame);
 if(!cue)return null;
 const units=Array.from(cue.text as string).reduce((n:number,c:string)=>n+(/[A-Za-z0-9]/.test(c)?.56:c===' '?.35:1),0);
 const width=Math.max(280,Math.min(1440,units*38+66));
 return <g data-caption-id={cue.id}>
 <rect x={800-width/2} y={770} width={width} height={56} rx={15} fill="#141414" fillOpacity={.94}/>
 <text x={800} y={810} textAnchor="middle" fontFamily="InterflowCN,Figtree,sans-serif" fontSize={38} fontWeight={400} fill="#fff">{cue.text}</text>
 </g>;
}
