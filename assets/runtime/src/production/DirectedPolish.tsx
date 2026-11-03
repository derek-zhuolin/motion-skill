import React from 'react';

/** Frames, not milliseconds. All callers share the composition clock. */
export function polishProgress(frame:number,from:number,to:number){
 if(![frame,from,to].every(Number.isFinite)||to<=from)throw new Error('Invalid polish frame interval');
 const p=Math.max(0,Math.min(1,(frame-from)/(to-from)));
 return p*p*p*(10+p*(-15+6*p));
}
type Cue={frame:number;from:number;to:number};
type Wrapper=Cue&{children:React.ReactNode;style?:React.CSSProperties};

export function PhraseReveal({frame,from,to,children,rise=16,style}:Wrapper&{rise?:number}){
 const p=polishProgress(frame,from,to);
 return <span data-mechanism="phrase-reveal" style={{display:'block',overflow:'hidden',paddingBottom:2,marginBottom:-2,...style}}><span style={{display:'block',opacity:p,transform:`translateY(${rise*(1-p)}px)`}}>{children}</span></span>;
}

/** Place this INSIDE one persistent Window, not around two complete windows. */
export function PageHandoff({frame,leave,enter,outgoing,incoming,style}:{frame:number;leave:[number,number];enter:[number,number];outgoing:React.ReactNode;incoming:React.ReactNode;style?:React.CSSProperties}){
 if(enter[0]<leave[1])throw new Error('Page contents must not overlap; preserve the shell');
 const a=polishProgress(frame,...leave),b=polishProgress(frame,...enter);
 return <div data-mechanism="page-handoff" style={{position:'relative',height:'100%',overflow:'hidden',...style}}>
  <div aria-hidden={a===1} style={{position:'absolute',inset:0,opacity:1-a,visibility:a===1?'hidden':'visible',transform:`translateY(${-28*a}px)`}}>{outgoing}</div>
  <div aria-hidden={b===0} style={{position:'absolute',inset:0,opacity:b,visibility:b===0?'hidden':'visible',transform:`translateY(${22*(1-b)}px)`}}>{incoming}</div>
 </div>;
}

export function CardResponse({frame,from,to,kind,children,style}:Wrapper&{kind:'arrive'|'receive'|'recede'}){
 const p=polishProgress(frame,from,to),q=Math.sin(Math.PI*p);
 const pose=kind==='arrive'?{opacity:p,y:24*(1-p),rotate:7*(1-p),scale:.97+.03*p}:kind==='receive'?{opacity:1,y:4*q,rotate:0,scale:1-.018*q}:{opacity:1-.90*p,y:6*p,rotate:-3*p,scale:1-.05*p};
 return <div data-mechanism="card-response" data-action={kind} style={{transformOrigin:'50% 85%',...style,opacity:pose.opacity,transform:`perspective(1200px) translateY(${pose.y}px) rotateX(${pose.rotate}deg) scale(${pose.scale})`}}>{children}</div>;
}

export function TraceRule({frame,from,to,width=148,color='#0070DB'}:Cue&{width?:number;color?:string}){
 const p=polishProgress(frame,from,to);
 return <svg data-mechanism="trace-rule" width={width} height={10} viewBox={`0 0 ${width} 10`} style={{display:'block',overflow:'visible',opacity:p===0?0:1}}><path d={`M3 6 Q${width*.42} 4 ${width-3} 5`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/></svg>;
}

export function TraceConfirm({frame,from,to,size=26,color='#0070DB'}:Cue&{size?:number;color?:string}){
 const p=polishProgress(frame,from,to),fill=polishProgress(frame,from+(to-from)*.2,to),mark=polishProgress(frame,from+(to-from)*.4,to);
 return <svg data-mechanism="trace-confirm" width={size} height={size} viewBox="0 0 32 32" style={{opacity:p===0?0:1,transform:`scale(${.8+.2*p})`}}><circle cx={16} cy={16} r={13} fill={color} fillOpacity={fill} stroke={color} strokeWidth={1.7} pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/><path d="m10 16 4 4 8-9" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-mark}/></svg>;
}

/** Navigation announces the destination before the camera approaches it. */
export function NavigationCue({frame,from,to,startX,endX,width=78,color='#0070DB'}:Cue&{startX:number;endX:number;width?:number;color?:string}){
 const p=polishProgress(frame,from,to);
 return <i data-mechanism="navigation-cue" style={{position:'absolute',left:0,bottom:0,width,height:2,borderRadius:3,background:color,transform:`translateX(${startX+(endX-startX)*p}px)`}}/>;
}
