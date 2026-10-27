import React from 'react';
import {CaptionFrame} from './Captions';
import {AbsoluteFill,Html5Audio,OffthreadVideo,Img,staticFile,useCurrentFrame} from 'remotion';

const ease=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
const mix=(a:number,b:number,v:number)=>a+(b-a)*v;
export const phase=(t:number,a:number,b:number)=>ease((t-a)/Math.max(.001,b-a));
export function sceneAt(plan:any,t:number){return plan.scenes.find((s:any)=>t>=s.start&&t<s.end)||plan.scenes[plan.scenes.length-1]}
const Text=({x=800,y=450,size=40,fill='#141414',children,...rest}:any)=><text x={x} y={y} fill={fill} fontSize={size} textAnchor="middle" fontFamily="InterflowCN,Figtree,sans-serif" fontWeight="700" {...rest}>{children}</text>;

function Visual({scene,t,blue,center}:any){
 const labels=scene.visual.labels||[],enter=phase(t,scene.start,scene.timing.stable_at),type=scene.visual.renderer;
 const xs=labels.map((_:any,i:number)=>center+(i-(labels.length-1)/2)*275);
 const accent=scene.emphasis?.[0]?.at??scene.timing.content_ready_at+.8;
 // The accent is an arrival, not the beginning of a one-second animation.
 const progress=accent<=scene.start?1:phase(t,Math.max(scene.start,accent-.8),accent);
 if(type==='evidence'&&scene.visual.asset)return <g opacity={enter}><image href={staticFile(scene.visual.asset)} x={center-500} y="330" width="1000" height="360" preserveAspectRatio="xMidYMid meet"/><rect x={center-500} y="330" width="1000" height="360" rx="24" fill="none" stroke={blue} strokeWidth="3"/></g>;
 if(type==='conclusion')return <g opacity={enter}><rect x={center-205} y="362" width="410" height="140" rx="70" fill={blue} filter="url(#mv-shadow)"/><Text x={center} y={449} size={43} fill="#fff">{labels[0]||'下一步'}</Text><path d={`M${center} 512V578`} stroke={blue} strokeWidth="4" strokeLinecap="round"/></g>;
 return <g opacity={enter}>
  {(type==='connect'||type==='compare')&&<path d={`M${xs[0]??center} 456H${xs[xs.length-1]??center}`} stroke="#CCD6E2" strokeWidth="5"/>}
  {type==='connect'&&<path data-action="connection" data-arrival={accent} d={`M${xs[0]??center} 456H${mix(xs[0]??center,xs[xs.length-1]??center,progress)}`} stroke={blue} strokeWidth="6"/>}
  {labels.map((label:string,i:number)=>{
   const scatter=type==='collect'?mix((i-1)*28,0,enter):0;
   const y=type==='collect'?425+Math.sin(i*1.6)*22:425;
   return <g key={i} data-object={scene.visual.object_ids?.[i+1]??`label-${i}`} transform={`translate(${xs[i]} ${y+mix(25,0,enter)}) rotate(${scatter})`}>
    <rect x="-111" y="-65" width="222" height="130" rx="27" fill={i===1?'#141414':'#fff'} stroke={i===1?'#141414':blue} strokeWidth="3" filter="url(#mv-shadow)"/>
    <Text x={0} y={13} size={36} fill={i===1?'#fff':'#141414'}>{label}</Text>
   </g>
  })}
  {type==='collect'&&<path d={`M${center-220} 555Q${center} 605 ${center+220} 555`} fill="none" stroke={blue} strokeWidth="3" strokeDasharray="5 8" opacity={.55}/>}
 </g>
}

export function DirectedFrame({plan,frame}:{plan:any;frame:number}){
 const t=frame/plan.fps,scene=sceneAt(plan,t),blue=plan.brand.blue||'#0070DB',ink=plan.brand.ink||'#141414';
 if(!scene||plan.audit.blocking.length)return <AbsoluteFill style={{background:'#fff',alignItems:'center',justifyContent:'center',color:ink,fontSize:44,fontFamily:'InterflowCN,sans-serif'}}><strong>先补齐原话与可读时间</strong><p style={{fontSize:24}}>编排存在阻塞，尚未生成可验收影片</p></AbsoluteFill>;
 const index=plan.scenes.indexOf(scene),prev=plan.scenes[index-1],next=plan.scenes[index+1];
 const center=plan.layout.face?.enabled?675:800;
 const enter=phase(t,scene.start,scene.timing.stable_at);
 const exit=next?1-phase(t,scene.end-.16,scene.end):1;
 const pos=scene.visual.token||{x:center,y:610};
 let x=pos.x,y=pos.y;
 if(prev&&prev.timing.preparation_seconds<.001){const from=prev.visual.token||pos;x=mix(from.x,x,enter);y=mix(from.y,y,enter)}
 if(next&&scene.timing.preparation_seconds>.001){const to=next.visual.token||pos,p=phase(t,scene.timing.preparation_at,scene.end);x=mix(x,to.x,p);y=mix(y,to.y,p)}
 return <svg viewBox="0 0 1600 900" width="1600" height="900" style={{width:'100%',height:'100%',display:'block',background:plan.brand.paper||'#fff'}} data-frame={frame} data-scene={scene.id}>
 <defs><filter id="mv-shadow" x="-50%" y="-50%" width="200%" height="240%"><feDropShadow dx="0" dy="13" stdDeviation="14" floodColor="#12304A" floodOpacity=".12"/></filter><radialGradient id="mv-clay" cx=".3" cy=".2" r=".9"><stop stopColor="#4698E7"/><stop offset=".58" stopColor={blue}/><stop offset="1" stopColor="#0055A4"/></radialGradient></defs>
 <g opacity={(index===0?1:enter)*exit}><Text x={center} y={242} size={65} fill={ink}>{scene.headline}</Text></g>
 <g opacity={enter*exit}><Visual scene={scene} t={t} blue={blue} center={center}/></g>
 <g data-object={scene.visual.focus_object} transform={`translate(${x} ${y})`}><circle r="22" fill="url(#mv-clay)" filter="url(#mv-shadow)"/><circle cx="-7" cy="-8" r="5" fill="#ffffff65"/></g>
 {next&&scene.timing.preparation_seconds>.001&&<path d="M1450 390Q1510 450 1450 510" fill="none" stroke={blue} strokeWidth="7" strokeLinecap="round" opacity={phase(t,scene.timing.preparation_at,scene.end)*.65}/>}
 {plan.mode==='example'&&<Text x={800} y={815} size={23} fill="#666" fontWeight="400">结构示例 · 无真实口播 · 不代表人类阅读验收</Text>}
 {!plan.captions?.enabled&&scene.caption&&<Text x={center} y={805} size={29} fill={ink} fontWeight="400">{scene.caption}</Text>}
 <CaptionFrame plan={plan} frame={frame}/>
 </svg>
}

export function DirectedFilm({plan,sound=false}:{plan:any;sound?:boolean}){
 const frame=useCurrentFrame(),f=plan.layout.face,ready=plan.audit.blocking.length===0;
 return <AbsoluteFill style={{fontFamily:'InterflowCN,Figtree,sans-serif',background:'#fff'}}>
  {sound&&ready&&plan.source.voice_url&&<Html5Audio src={staticFile(plan.source.voice_url)}/>}
  {sound&&ready&&plan.source.sfx_url&&<Html5Audio src={staticFile(plan.source.sfx_url)}/>}
  {sound&&ready&&plan.source.music_url&&<Html5Audio src={staticFile(plan.source.music_url)}/>}
  <DirectedFrame plan={plan} frame={frame}/>
  {ready&&f?.enabled&&plan.source.video_url&&<div style={{position:'absolute',left:`${f.x*100}%`,top:`${f.y*100}%`,width:`${f.w*100}%`,height:`${f.h*100}%`,borderRadius:24,overflow:'hidden',border:'3px solid white',boxShadow:'0 12px 35px #14141422'}}><OffthreadVideo src={staticFile(plan.source.video_url)} muted style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:f.object_position||'50% 50%'}}/></div>}
 </AbsoluteFill>
}
