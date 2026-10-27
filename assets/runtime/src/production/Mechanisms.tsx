import React from 'react';
import {clamp,mix,phase,contactPulse} from './motion';

export type MotionTheme={blue:string;ink:string;paper:string;card:string;chinese:string;latin:string;clay?:{paperSide:string;paperBottom:string;paperHighlight:string;paperShade:string}};
export const defaultTheme:MotionTheme={blue:'#0070DB',ink:'#141414',paper:'#fff',card:'#fff',chinese:'InterflowCN',latin:'Figtree'};
export const productionRegistry={
 'keyword-window':{study_id:10,component:'KeywordWindow',representation:'SVG glyph mask'},
 'keyword-rhythm':{study_id:11,component:'KineticWords',representation:'SVG word layout'},
 'clay-join':{study_id:19,component:'ClayJoin',representation:'SVG simulated volume; not mesh 3D'},
} as const;

export function KeywordWindow({id,text,x=800,y=490,size=190,open=0,theme=defaultTheme,children}:{id:string;text:string;x?:number;y?:number;size?:number;open?:number;theme?:MotionTheme;children:React.ReactNode}){
 const o=clamp(open),s=mix(1,2.6,o),expand=phase(o,.22,1);
 return <g data-mechanism="keyword-window" data-study="10">
  <defs><clipPath id={id}><text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight="700" fontFamily={theme.chinese} transform={`translate(${x} ${y-size*.35}) scale(${s}) translate(${-x} ${-(y-size*.35)})`}>{text}</text><rect x={800-800*expand} y={450-450*expand} width={1600*expand} height={900*expand} rx={60*(1-expand)}/></clipPath></defs>
  <g clipPath={`url(#${id})`}>{children}</g>
 </g>;
}

export function KineticWords({words,t,start=0,x=800,y=450,size=58,gap=12,theme=defaultTheme,anchor='middle',fill,duration=.46,stagger=.11,rise=28}:{words:string[];t:number;start?:number;x?:number;y?:number;size?:number;gap?:number;theme?:MotionTheme;anchor?:'middle'|'start';fill?:string;duration?:number;stagger?:number;rise?:number}){
 if(!Number.isFinite(duration+stagger+rise)||duration<=0||stagger<0||rise<0)throw Error('Invalid keyword timing or rise');
 return <g data-mechanism="keyword-rhythm" data-study="11">{words.map((word,i)=>{
  const p=phase(t,start+i*stagger,start+duration+i*stagger);
  return <text key={i} x={x} y={y+i*(size+gap)+mix(rise,0,p)} fill={fill||theme.ink} fontFamily={theme.chinese} fontWeight="700" fontSize={size} textAnchor={anchor} opacity={p}>{word}</text>;
 })}</g>;
}

export type ClayNode={id:string;x:number;y:number;width:number;height:number;rotation:number;depth:number;tone:'paper'|'blue';children:React.ReactNode};
export function ClaySurface({node,theme=defaultTheme,volume=1,squash=0}:{node:ClayNode;theme?:MotionTheme;volume?:number;squash?:number}){
 const {id,width:w,height:h,tone}=node,v=clamp(volume),d=node.depth*v;
 const rx=mix(25,Math.min(w,h)*.22,v),blue=tone==='blue';
 const sx=1-Math.max(0,squash)*.065,sy=1+Math.max(0,squash)*.035;
 return <g data-object={id} data-material={v>.05?'simulated-clay':'paper'} transform={`translate(${node.x} ${node.y}) rotate(${node.rotation}) scale(${sx} ${sy})`}>
  <defs>
   <linearGradient id={`${id}-side`} x1="0" y1="0" x2=".2" y2="1"><stop stopColor={blue?'#244B92':(theme.clay?.paperSide||'#CFDCE9')}/><stop offset="1" stopColor={blue?'#123775':(theme.clay?.paperBottom||'#AFC3D8')}/></linearGradient>
   <linearGradient id={`${id}-front`} x1="0" y1="0" x2=".9" y2="1"><stop stopColor={blue?'#709AF0':(theme.clay?.paperHighlight||'#FFFFFF')}/><stop offset=".42" stopColor={blue?theme.blue:theme.card}/><stop offset="1" stopColor={blue?'#234B9B':(theme.clay?.paperShade||'#E4EDF5')}/></linearGradient>
   <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".6" y2="1"><stop stopColor="white" stopOpacity=".8"/><stop offset=".6" stopColor="white" stopOpacity=".08"/><stop offset="1" stopColor="white" stopOpacity=".25"/></linearGradient>
   <filter id={`${id}-shadow`} x="-45%" y="-60%" width="200%" height="260%"><feDropShadow dx={6*v} dy={mix(9,27,v)} stdDeviation={mix(7,18,v)} floodColor="#29374B" floodOpacity={mix(.11,.22,v)}/></filter>
  </defs>
  <g filter={`url(#${id}-shadow)`}>
   {d>.01&&<rect x={-w/2+5*v} y={-h/2+d} width={w} height={h} rx={rx} fill={`url(#${id}-side)`}/>}
   <rect x={-w/2} y={-h/2} width={w} height={h} rx={rx} fill={v>.01?`url(#${id}-front)`:blue?theme.blue:theme.card} stroke={v>.01?'none':'#16171C24'} strokeWidth="1.4"/>
   <rect x={-w/2+3} y={-h/2+3} width={w-6} height={h-6} rx={Math.max(0,rx-3)} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={mix(.5,3,v)} opacity={v}/>
  </g>
  {node.children}
 </g>;
}

// Positions/camera are supplied by the caller's single timeline. No hidden
// scene clock, remount, or independently restarted entry animation.
export function ClayJoin({nodes,t,contactAt,volume=1,theme=defaultTheme}:{nodes:ClayNode[];t:number;contactAt:number;volume?:number;theme?:MotionTheme}){
 const pressure=Math.max(0,contactPulse(t,contactAt));
 const center=nodes.reduce((sum,n)=>sum+n.x,0)/Math.max(1,nodes.length);
 return <g data-mechanism="clay-join" data-study="19" data-contact-at={contactAt}>{nodes.map(n=>{
  const correction=nodes.length===2?Math.sign(center-n.x)*n.width*pressure*.065/2:0;
  return <ClaySurface key={n.id} node={{...n,x:n.x+correction}} theme={theme} volume={volume} squash={pressure}/>;
 })}</g>;
}
