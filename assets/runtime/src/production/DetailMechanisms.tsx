import React from 'react';
import {Easing,Interactive,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
const ease={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.18,.72,.25,1)} as const;
const sans='Figtree,InterflowCN,sans-serif';
function validTiming(duration:number){if(!Number.isFinite(duration)||duration<=0)throw Error('Duration must be positive');}
export function reelPosition(frame:number,fps:number,digit:number,index:number,duration=.94){
 validTiming(duration);if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0||!Number.isInteger(digit)||digit<0||digit>9||!Number.isInteger(index)||index<0)throw Error('Invalid number reel input');
 return (20+digit)*interpolate(frame,[(.04+index*.085)*fps,(.04+duration+index*.085)*fps],[0,1],ease);
}
function Digit({digit,index,size,color,at,duration,fontFamily,edgeFade,motionBlur}:{digit:number;index:number;size:number;color:string;at:number;duration:number;fontFamily:string;edgeFade:boolean;motionBlur:number}){
 const f=useCurrentFrame(),{fps}=useVideoConfig(),h=size*1.12,p=reelPosition(f-at*fps,fps,digit,index,duration);
 return <Interactive.Div name={`数字位 ${index+1} / ${digit}`} style={{position:'relative',width:size*.64,height:h,overflow:'hidden',fontVariantNumeric:'tabular-nums',maskImage:edgeFade?'linear-gradient(transparent,black 13%,black 87%,transparent)':undefined}}><div data-mechanism="number-reel" data-study="35" data-digit={digit} data-position={p.toFixed(4)} style={{translate:`0px ${-p*h}px`,filter:motionBlur>0?`blur(${interpolate(f-at*fps,[.1*duration*fps,.55*duration*fps,duration*fps],[0,motionBlur,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px)`:undefined}}>{Array.from({length:31},(_,i)=><div key={i} style={{height:h,lineHeight:`${h}px`,fontSize:size,textAlign:'center',fontFamily,fontWeight:700,color}}>{i%10}</div>)}</div></Interactive.Div>;
}
/** Decorative entrance to a fixed observed value; not a time-series or growth model. */
export function NumberReel({value,size=260,color='#0070DB',at=0,duration=.94,fontFamily=sans,edgeFade=true,motionBlur=2.2,separatorScale=.62,separatorGap=9}:{value:string;size?:number;color?:string;at?:number;duration?:number;fontFamily?:string;edgeFade?:boolean;motionBlur?:number;separatorScale?:number;separatorGap?:number}){
 validTiming(duration);let index=0;
 return <div data-final-value={value} aria-label={value} style={{display:'flex',alignItems:'center',whiteSpace:'nowrap',lineHeight:1.12}}>{[...value].map((c,k)=>/\d/.test(c)?<Digit key={k} digit={Number(c)} index={index++} size={size} color={color} at={at} duration={duration} fontFamily={fontFamily} edgeFade={edgeFade} motionBlur={motionBlur}/>:<span key={k} style={{fontSize:size*separatorScale,fontFamily,fontWeight:700,color,margin:`0 ${separatorGap}px`}}>{c}</span>)}</div>;
}
/** Snapshot alternative: reveal the actual value without any intermediate digits. */
export function ValueReveal({value,at=0,duration=.6,size=260,color='#0070DB',fontFamily=sans}:{value:string;at?:number;duration?:number;size?:number;color?:string;fontFamily?:string}){
 validTiming(duration);const f=useCurrentFrame(),{fps}=useVideoConfig();return <Interactive.Div name="固定数值揭露" data-mechanism="value-reveal" data-study="31" style={{fontSize:size,fontFamily,fontWeight:700,color,clipPath:`inset(0 0 ${interpolate(f,[at*fps,(at+duration)*fps],[100,0],ease)}% 0)`}}>{value}</Interactive.Div>;
}
/** Two source-supplied values remain visible. No inferred delta, progress or causality. */
export function NumericComparison({left,right,at=0,duration=.65,size=130,color='#0070DB',ink='#141414'}:{left:{label:string;value:string};right:{label:string;value:string};at?:number;duration?:number;size?:number;color?:string;ink?:string}){
 validTiming(duration);const f=useCurrentFrame(),{fps}=useVideoConfig();return <div data-mechanism="numeric-comparison" data-study="43" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,fontFamily:sans,color:ink}}><div><div style={{fontSize:28,marginBottom:22}}>{left.label}</div><strong style={{fontSize:size}}>{left.value}</strong></div><Interactive.Div name="对照数值拉幕" style={{borderLeft:`3px solid ${color}`,paddingLeft:50,clipPath:`inset(0 ${interpolate(f,[at*fps,(at+duration)*fps],[100,0],ease)}% 0 0)`}}><div style={{fontSize:28,marginBottom:22}}>{right.label}</div><strong style={{fontSize:size,color}}>{right.value}</strong></Interactive.Div></div>;
}
export function LineReveal({children,at=0,duration=.45,rise=110,height=120}:{children:React.ReactNode;at?:number;duration?:number;rise?:number;height?:number}){
 validTiming(duration);const f=useCurrentFrame(),{fps}=useVideoConfig();return <div data-mechanism="line-reveal" data-study="31" style={{overflow:'hidden',height}}><Interactive.Div name="逐行揭露" style={{translate:interpolate(f,[at*fps,(at+duration)*fps],[`0px ${rise}px`,'0px 0px'],ease)}}>{children}</Interactive.Div></div>;
}
export type FrameRect={x:number;y:number;width:number;height:number};
export function FocusHandoff({from,to,at=0,duration=.65,color='#0070DB',opacity=.6,objectId='attention-frame'}:{from:FrameRect;to:FrameRect;at?:number;duration?:number;color?:string;opacity?:number;objectId?:string}){
 validTiming(duration);const f=useCurrentFrame(),{fps}=useVideoConfig(),a=[at*fps,(at+duration)*fps],x=interpolate(f,a,[from.x,to.x],ease),y=interpolate(f,a,[from.y,to.y],ease),w=interpolate(f,a,[from.width,to.width],ease),h=interpolate(f,a,[from.height,to.height],ease),c=Math.min(38,w/5,h/5);
 return <path data-mechanism="focus-handoff" data-object={objectId} data-study="38" d={`M${x} ${y+c}V${y}H${x+c}M${x+w-c} ${y}H${x+w}V${y+c}M${x+w} ${y+h-c}V${y+h}H${x+w-c}M${x+c} ${y+h}H${x}V${y+h-c}`} fill="none" stroke={color} strokeWidth={3} opacity={opacity}/>;
}
export function DrawAnnotation({d,at=0,duration=.6,color='#0070DB',width=6}:{d:string;at?:number;duration?:number;color?:string;width?:number}){
 validTiming(duration);const f=useCurrentFrame(),{fps}=useVideoConfig();return <path data-mechanism="draw-annotation" data-study="36" d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={interpolate(f,[at*fps,(at+duration)*fps],[1,0],ease)}/>;
}
export function MediaFocus({children,from={x:0,y:0,scale:1},to={x:0,y:0,scale:1},at=0,duration=.7,hold=false,radius=24}:{children:React.ReactNode;from?:{x:number;y:number;scale:number};to?:{x:number;y:number;scale:number};at?:number;duration?:number;hold?:boolean;radius?:number}){
 validTiming(duration);const f=useCurrentFrame(),{fps}=useVideoConfig();return <div data-mechanism="media-focus" data-study="27" style={{width:'100%',height:'100%',overflow:'hidden',borderRadius:radius}}><Interactive.Div name="素材内部取景" style={{width:'100%',height:'100%',transformOrigin:'0 0',scale:hold?from.scale:interpolate(f,[at*fps,(at+duration)*fps],[from.scale,to.scale],{...ease,output:'perceptual-scale'}),translate:hold?`${from.x}px ${from.y}px`:interpolate(f,[at*fps,(at+duration)*fps],[`${from.x}px ${from.y}px`,`${to.x}px ${to.y}px`],ease)}}>{children}</Interactive.Div></div>;
}
