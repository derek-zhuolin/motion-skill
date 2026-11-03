import React,{useId} from 'react';
import {defaultTheme,type ClayNode,type MotionTheme} from './Mechanisms';
export type {ClayNode};
function blend(a:string,b:string,p:number){
 const normalize=(color:string)=>/^#[0-9a-f]{3}$/i.test(color)?'#'+color.slice(1).split('').map(c=>c+c).join(''):color;
 a=normalize(a);b=normalize(b);
 const rgb=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 if(!/^#[0-9a-f]{6}$/i.test(a)||!/^#[0-9a-f]{6}$/i.test(b))throw Error('SoftClaySurface colors must be three- or six-digit hex');
 const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*p).toString(16).padStart(2,'0')).join('');
}
// One continuous outline: the speech tail shares the material and the bevel.
// Promoted from the accepted polish32 material. SVG volume, not a 3D mesh.
function outline(w:number,h:number,r:number,tail:number){
 const l=-w/2,R=w/2,T=-h/2,b=h/2;
 return `M${l+r} ${T}H${R-r}Q${R} ${T} ${R} ${T+r}V${b-r}Q${R} ${b} ${R-r} ${b}`+
  (tail>0?`H${w*.29}C${w*.285} ${b+tail*.35} ${w*.295} ${b+tail*.7} ${w*.305} ${b+tail*.92}Q${w*.312} ${b+tail+4} ${w*.292} ${b+tail+3}C${w*.22} ${b+tail*.97} ${w*.17} ${b+tail*.48} ${w*.16} ${b}`:'')+
  `H${l+r}Q${l} ${b} ${l} ${b-r}V${T+r}Q${l} ${T} ${l+r} ${T}Z`;
}
export function SoftClaySurface({node,theme=defaultTheme,volume=1,squash=0,tail=0}:{node:ClayNode;theme?:MotionTheme;volume?:number;squash?:number;tail?:number}){
 const colors={blue:theme.blue,ink:theme.ink,white:theme.card,highlight:blend(theme.blue,theme.card,.30),shade:blend(theme.blue,theme.ink,.17),paper:blend(theme.card,theme.ink,.025),paperShade:blend(theme.card,theme.ink,.12)};
 const uid='soft'+useId().replace(/[^a-zA-Z0-9]/g,''),{width:w,height:h,tone}=node,blue=tone==='blue',d=node.depth*volume*.62;
 const radius=Math.min(w*.28,h*.31),shape=outline(w,h,radius,tail),sideShape=outline(w,h,radius,Math.max(0,tail-d)),s=Math.max(0,Math.min(1,squash));
 return <g data-object={node.id} data-material="soft-clay-svg" transform={`translate(${node.x} ${node.y}) rotate(${node.rotation}) scale(${1+.035*s} ${1-.045*s})`}>
  <defs>
   <radialGradient id={uid+'front'} cx="29%" cy="13%" r="105%" gradientTransform="translate(0 -.1) scale(1 1.13)">
    <stop stopColor={blue?colors.highlight:'#FFFFFF'}/><stop offset=".24" stopColor={blue?colors.highlight:colors.white}/><stop offset=".63" stopColor={blue?theme.blue:colors.paper}/><stop offset="1" stopColor={blue?colors.shade:colors.paperShade}/>
   </radialGradient>
   <linearGradient id={uid+'side'} x1="0" y1="0" x2=".28" y2="1"><stop stopColor={blue?colors.highlight:colors.paper}/><stop offset=".64" stopColor={blue?colors.blue:colors.paperShade}/><stop offset="1" stopColor={blue?colors.shade:colors.paperShade}/></linearGradient>
   <linearGradient id={uid+'rim'} x1=".15" y1="0" x2=".7" y2="1"><stop stopColor="white" stopOpacity=".43"/><stop offset=".38" stopColor="white" stopOpacity=".08"/><stop offset=".7" stopColor={colors.ink} stopOpacity=".02"/><stop offset="1" stopColor={colors.ink} stopOpacity=".23"/></linearGradient>
   <linearGradient id={uid+'upper'} x1="0" y1="0" x2="0" y2="1"><stop stopColor="white" stopOpacity={blue?'.12':'.55'}/><stop offset=".42" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
   <filter id={uid+'shadow'} x="-40%" y="-65%" width="190%" height="250%"><feDropShadow dx="9" dy={d+19} stdDeviation="20" floodColor={colors.ink} floodOpacity=".15"/><feDropShadow dx="2" dy={d+4} stdDeviation="5" floodColor={colors.ink} floodOpacity=".13"/></filter>
   <filter id={uid+'soft'} x="-10%" y="-15%" width="120%" height="135%"><feGaussianBlur stdDeviation={Math.min(5,h*.025)}/></filter>
   <filter id={uid+'grain'} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="19" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
   <clipPath id={uid+'clip'}><path d={shape}/></clipPath>
  </defs>
  <g filter={`url(#${uid}shadow)`}>
   <path d={sideShape} transform={`translate(1 ${d})`} fill={`url(#${uid}side)`}/>
   <path d={shape} fill={`url(#${uid}front)`}/>
   <g clipPath={`url(#${uid}clip)`}>
    <path d={shape} fill="none" stroke={`url(#${uid}rim)`} strokeWidth={Math.min(22,h*.12)} filter={`url(#${uid}soft)`}/>
    <path d={shape} fill={`url(#${uid}upper)`}/>
   </g>
  </g>
  <g data-clay-content>{node.children}</g>
 </g>;
}
export function SoftClayJoin({nodes,t,contactAt,volume=1,theme=defaultTheme}:{nodes:ClayNode[];t:number;contactAt:number;volume?:number;theme?:MotionTheme}){
 const q=(t-contactAt)/.32,pressure=q>0&&q<1?Math.sin(q*Math.PI)*.8:0;
 return <g data-clay-action="soft-contact">{nodes.map(n=><SoftClaySurface key={n.id} node={n} theme={theme} volume={volume} squash={pressure}/>)}</g>;
}
