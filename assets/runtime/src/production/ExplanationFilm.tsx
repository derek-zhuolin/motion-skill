import React from 'react';
import {AbsoluteFill, Audio, Img, Video, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ClaySurface, MotionTheme} from './Mechanisms';
import {CameraStage} from './ip-motion';
import {curve, mix, phase} from './motion';
import {ContentObject, ExplanationEvent, ExplanationPlan} from './explanation-types';

const font='"MotionCN", "PingFang SC", sans-serif';
const motionTheme=(plan:ExplanationPlan):MotionTheme=>({blue:plan.theme.blue,ink:plan.theme.ink,paper:plan.theme.paper,card:'#FAFCFF',chinese:font,latin:'Arial'});
const textProps={fontFamily:font,fill:'#162B36'};

/** One set of content rows remains mounted before, during and after the split. */
export function DocumentSplit({object,event,plan,t}:{object:ContentObject;event:ExplanationEvent;plan:ExplanationPlan;t:number}){
 const related=plan.events.filter(e=>e.object_id===event.object_id&&e.view===event.view&&e.start<=event.start);
 const split=[...related].reverse().find(e=>e.relation==='split');
 const previousFilter=[...related].reverse().find(e=>e.id!==event.id&&e.relation==='filter');
 const open=split?phase(t,...split.action_window):1;
 const advance=event.relation==='filter'?phase(t,...event.action_window):0;
 const previousChosen=object.segments.findIndex(s=>previousFilter?.selected_ids?.includes(s.id));
 const chosen=object.segments.findIndex(s=>(event.relation==='filter'?event.selected_ids:previousFilter?.selected_ids)?.includes(s.id));
 const focus=mix(previousChosen<0?0:1,event.relation==='filter'?1:previousChosen<0?0:1,advance);
 const n=object.segments.length, row=340/n;
 const spacing=Math.min(145,380/Math.max(1,n-1)),partHeight=Math.min(112,spacing*.78);
 const cameraX=mix(800,chosen<0?800:1040,focus),cameraY=420;
 return <CameraStage x={cameraX} y={cameraY} zoom={mix(1,.94,focus)} centerX={800} centerY={420}>
  <svg width="1600" height="900" viewBox="0 0 1600 900" style={{overflow:'visible'}}>
   <g opacity={1-open}>
    <ClaySurface theme={motionTheme(plan)} node={{id:`${event.object_id}-cover`,x:800,y:440,width:790,height:440,rotation:0,depth:12,tone:'paper',children:null}}/>
   </g>
   <g opacity={1-focus} transform={`translate(${mix(440,355,open)} ${mix(238,232,open)})`}>
    <rect width="170" height="44" rx="22" fill={plan.theme.blue}/><text x="85" y="29" textAnchor="middle" fontFamily={font} fontSize="23" fill="white">{object.owner}</text>
    <text x="193" y="30" {...textProps} fontSize="28" fontWeight="700">{object.title}</text>
   </g>
   {object.segments.map((part,i)=>({part,i})).sort((a,b)=>Number(event.selected_ids?.includes(a.part.id)||false)-Number(event.selected_ids?.includes(b.part.id)||false)).map(({part,i})=>{
    const baseY=345+i*row;
    const y=mix(baseY,500+(i-(n-1)/2)*spacing,open);
    const pose=(selection:number)=>({x:selection<0?800:i===selection?1040:550,y:selection<0?y:i===selection?460:500+(i-(n-1)/2)*spacing-(i<selection?35:0),width:selection<0?690:i===selection?760:580,opacity:selection<0||i===selection?1:.28,rotation:selection<0?(i-(n-1)/2)*-1.4:0,accent:i===selection?1:0});
    const from=pose(previousChosen),to=pose(chosen);
    const width=mix(from.width,to.width,advance),accent=mix(from.accent,to.accent,advance);
    return <g key={part.id} data-content-id={part.id} data-source-owner={object.owner} opacity={mix(from.opacity,to.opacity,advance)}>
     <ClaySurface theme={motionTheme(plan)} volume={mix(.2,1,open)} node={{id:`${event.object_id}-${part.id}`,x:mix(from.x,to.x,advance),y:mix(from.y,to.y,advance),width,height:mix(row-5,partHeight,open),rotation:mix(from.rotation,to.rotation,advance),depth:10,tone:'paper',children:<>
      <rect x={-width/2+24} y={-21} width="44" height="44" rx="13" fill={accent>.3?plan.theme.green:'#E6EEFC'}/>
      <text x={-width/2+46} y="9" textAnchor="middle" {...textProps} fontSize="23" fontWeight="700">{String(i+1).padStart(2,'0')}</text>
      <text x={-width/2+91} y="7" {...textProps} fontSize="34" fontWeight="650">{part.text}</text>
      <text x={width/2-24} y="39" textAnchor="end" {...textProps} fill="#6B80A0" fontSize="17" opacity={partHeight>=96?open:0}>{object.owner} · {i+1}</text>
     </>}}/>
    </g>;
   })}
   <g opacity={focus} transform="translate(1060 560)"><rect x="-195" y="-25" width="390" height="50" rx="25" fill={plan.theme.green}/><text textAnchor="middle" y="9" {...textProps} fontSize="25">内容仍然对应原来的那一段</text></g>
  </svg>
 </CameraStage>;
}

/** Filter uses the same row implementation and ids; it never reconstructs labels. */
export const DocumentFilter=DocumentSplit;

export function FlowFeedback({object,event,plan,t}:{object:ContentObject;event:ExplanationEvent;plan:ExplanationPlan;t:number}){
 const events=plan.events.filter(e=>e.object_id===event.object_id&&e.view===event.view&&e.relation==='feedback');
 const index=Math.max(0,events.findIndex(e=>e.id===event.id));
 const stage=Math.max(0,object.segments.findIndex(s=>s.id===event.after));
 const advance=phase(t,...event.action_window);
 const previous=index?Math.max(0,object.segments.findIndex(s=>s.id===events[index-1].after)):Math.max(0,object.segments.findIndex(s=>s.id===(object.initial_state||event.before)));
 const xAt=(i:number)=>400+i*760/Math.max(1,object.segments.length-1);
 const routeP=mix(previous,stage,advance)/Math.max(1,object.segments.length-1);
 const inv=1-routeP;
 const x=inv**3*400+3*inv**2*routeP*620+3*inv*routeP**2*940+routeP**3*1160;
 const y=inv**3*430+3*inv**2*routeP*250+3*inv*routeP**2*610+routeP**3*430;
 const reveal=phase(t,...events[0].action_window);
 const screen=object.screen_state===undefined?index>=events.length-1:object.screen_state===event.after;
 const expand=object.initial_expanded?1:screen?advance:0;
 const width=mix(290,420,expand),height=mix(150,265,expand);
 const mode=object.camera_mode;
 const zoom=mode==='follow'?1:mode==='overview'?mix(1.13,.84,advance):mix(1.13,.92,expand);
 const cx=mode==='follow'?x:mode==='overview'?mix(x,800,advance):curve(t,[{t:0,v:600},{t:events[events.length-1].end,v:900}]);
 const cy=mode==='follow'?y:430;
 return <CameraStage x={cx} y={cy} zoom={zoom} centerX={800} centerY={430}>
  <svg width="1600" height="900" viewBox="0 0 1600 900">
   <defs><linearGradient id="feedback-route"><stop stopColor="#B9CDF2"/><stop offset="1" stopColor={plan.theme.blue}/></linearGradient></defs>
   <path d="M400 430 C620 250 940 610 1160 430" fill="none" stroke="#D5E0F2" strokeWidth="5"/>
   <path d="M400 430 C620 250 940 610 1160 430" pathLength="1" strokeDasharray="1" strokeDashoffset={1-routeP} fill="none" stroke="url(#feedback-route)" strokeWidth="5"/>
   {object.segments.map((part,i)=>{
    const mark=object.emphasis?.find(m=>m.part_id===part.id);
    const cue=mark&&plan.anchors.cues.find(c=>mark.cue_ids.includes(c.id)&&c.start<=t&&t<c.end);
    const accent=cue?phase(t,cue.start,Math.min(cue.end,cue.start+.35)):0;
    return <g key={part.id} transform={`translate(${xAt(i)} 620)`} opacity={i<=stage?1:.35}>
     <circle cy="-27" r={mix(6,12,accent)} fill={accent>.1?plan.theme.green:i<=stage?plan.theme.blue:'#B8C7DE'} stroke={accent>.1?plan.theme.blue:'none'} strokeWidth="2"/><text textAnchor="middle" y="22" {...textProps} fill={accent>.1?plan.theme.blue:plan.theme.ink} fontSize="29" fontWeight="650">{part.text}</text>
    </g>;
   })}
   <g opacity={reveal} data-object={event.object_id} data-owner={object.owner} data-state={event.after}>
    <ClaySurface theme={motionTheme(plan)} node={{id:`${event.object_id}-carrier`,x,y,width,height,rotation:Math.sin(advance*Math.PI)*-4,depth:17,tone:'blue',children:<>
     <text x="0" y={mix(-38,-89,expand)} textAnchor="middle" fontFamily={font} fontSize="25" fontWeight="700" fill="white">{object.title}</text>
     <g opacity={1-expand}>{Array.from({length:25},(_,i)=>{
      const envelope=plan.audio.envelope;
      const energy=envelope?envelope[Math.max(0,Math.floor(t*plan.fps)+i-12)]||0:0;
      const h=10+energy*56;
      return <rect key={i} x={-115+i*9.5} y={-h/2+10} width="4" height={h} rx="2" fill={i%5===0?plan.theme.green:'white'}/>;
     })}</g>
     <g opacity={expand}>
      <rect x="-181" y="-63" width="362" height="172" rx="15" fill="#F1F6FF"/>
      <rect x="-159" y="-40" width="128" height="125" rx="18" fill={plan.theme.green}/>
      <circle cx="-95" cy="5" r="26" fill="#ECF9D2"/><path d="M-122 55 Q-95 22 -68 55" fill="none" stroke={plan.theme.blue} strokeWidth="9" strokeLinecap="round"/>
      <rect x="-10" y="-35" width="151" height="15" rx="7" fill={plan.theme.blue}/>
      <rect x="-10" y="-7" width="120" height="12" rx="6" fill="#BDD0EF"/>
      <path d={`M-10 57 Q20 ${17+Math.sin(t*2)*7} 47 35 T141 43`} fill="none" stroke={plan.theme.blue} strokeWidth="5"/>
     </g>
    </>}}/>
   </g>
   <g transform={`translate(${x} ${y-height/2-48})`} opacity={reveal}><rect x="-80" y="-22" width="160" height="42" rx="21" fill={plan.theme.green}/><text textAnchor="middle" y="7" {...textProps} fontSize="22">{object.owner}</text></g>
  </svg>
 </CameraStage>;
}

export function SpatialExplanation({object,event,plan,t}:{object:ContentObject;event:ExplanationEvent;plan:ExplanationPlan;t:number}){
 if(!plan.spatial)throw Error('Spatial explanation requires a rendered mesh asset');
 const range=event.asset_range||[0,1];
 const progress=mix(range[0],range[1],phase(t,...event.action_window));
 const unpacked=phase(progress,.22,.80);
 const asset=plan.spatial;
 const frame=asset.frames[Math.min(asset.frames.length-1,Math.floor(progress*(asset.frames.length-1)))];
 const content=<div data-representation="rendered-mesh-3d" data-object={event.object_id} style={{position:'absolute',left:180,top:210,width:1240,height:590}}>
  <Img src={staticFile(frame.file)} style={{position:'absolute',left:220,top:0,width:800,height:590,objectFit:'contain'}}/>
  {object.segments.map((part,i)=>{
   const point=frame.parts.find(p=>p.id===part.id);
   const labelY=115+(object.segments.length-1-i)*140;
   const visible=phase(unpacked,.1+i*.07,.45+i*.07);
   if(!point)return null;
   const px=220+point.x*800,py=point.y*590;
   return <React.Fragment key={part.id}>
    <svg width="1240" height="590" style={{position:'absolute',inset:0,opacity:visible}}><path d={`M${px} ${py} L${1060} ${py} L1080 ${labelY}`} fill="none" stroke={plan.theme.blue} strokeWidth="2"/><circle cx={px} cy={py} r="5" fill={plan.theme.blue}/></svg>
    <div style={{position:'absolute',left:1095,top:labelY-23,opacity:visible,color:plan.theme.ink,fontSize:28,fontWeight:650,whiteSpace:'nowrap'}}>{part.text}</div>
   </React.Fragment>;
  })}
 </div>;
 if(object.camera_mode!=='part-relay')return content;
 const pointFor=(state:string)=>{
  const part=object.segments.find(p=>(p.content_id||p.id)===state);
  const point=frame.parts.find(p=>p.id===part?.id);
  return {x:400+(point?.x??.5)*800,y:210+(point?.y??.5)*590};
 };
 const from=pointFor(event.before),to=pointFor(event.after);
 const enter=phase(t,event.start,Math.min(event.end,event.action_window[0]+.6));
 const leave=phase(t,event.end-.6,event.end);
 const cameraX=mix(mix(from.x,800,enter),to.x,leave);
 const cameraY=mix(mix(from.y,500,enter),to.y,leave);
 const zoom=mix(mix(1.25,.88,enter),1.25,leave);
 return <div style={{position:'absolute',left:0,top:248,width:1600,height:520,overflow:'hidden'}}><CameraStage x={cameraX} y={cameraY} zoom={zoom} centerX={800} centerY={212}>{content}</CameraStage></div>;
}

/** Display the referent itself. Recorded video keeps its own motion; source audio stays separate. */
export function MediaView({object,event,plan}:{object:ContentObject;event:ExplanationEvent;plan:ExplanationPlan;t:number}){
 const choice=object.media;
 const asset=choice&&plan.media?.[choice.asset_id];
 if(!choice||!asset?.url)throw Error('Media view requires a staged local asset');
 const style:React.CSSProperties={width:'100%',height:'100%',objectFit:choice.fit||'contain'};
 const reality=asset.reality==='generated'?'生成示意':asset.reality==='reconstructed'?'重建示意':asset.role==='evidence'?'实际素材':'场景素材';
 return <div data-media-asset={choice.asset_id} data-media-role={asset.role} style={{position:'absolute',left:110,right:110,top:260,bottom:150}}>
  <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:24,background:'#EDF2F9',boxShadow:'0 12px 32px #162B3610'}}>
   {asset.type==='image'?<Img src={staticFile(asset.url)} alt={asset.subject} style={style}/>:<Sequence from={event.start_frame} layout="none"><Video src={staticFile(asset.url)} startFrom={Math.round((choice.start_seconds||0)*plan.fps)} muted playbackRate={1} style={style}/></Sequence>}
  </div>
  <div style={{position:'absolute',left:0,right:0,bottom:-47,display:'flex',gap:16,alignItems:'center',fontSize:23,color:plan.theme.ink}}><span style={{padding:'5px 15px',borderRadius:20,background:plan.theme.green,fontSize:20,whiteSpace:'nowrap'}}>{reality}</span><span>{asset.caption}</span></div>
 </div>;
}

const components={split:DocumentSplit,filter:DocumentFilter,feedback:FlowFeedback,spatial:SpatialExplanation,show:MediaView};

function ViewLayer({plan,event,t,role}:{plan:ExplanationPlan;event:ExplanationEvent;t:number;role:'active'|'previous'}){
 const entity=plan.objects[event.object_id];
 const view=event.view?entity.views?.[event.view]:undefined;
 const object:ContentObject=view?{...entity,...view,owner:entity.owner}:entity;
 const Scene=components[event.relation];
 return <div data-content-object={event.object_id} data-view={event.view||entity.kind} data-handoff-role={role} style={{position:'absolute',inset:0}}><Scene object={object} event={event} plan={plan} t={t}/></div>;
}

function Picture({plan}:{plan:ExplanationPlan}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 const event=[...plan.events].reverse().find(e=>e.start<=t)||plan.events[0];
 const index=plan.events.findIndex(e=>e.id===event.id),previous=plan.events[index-1];
 const changed=previous&&(previous.view!==event.view||previous.object_id!==event.object_id);
 const transition=event.transition;
 const blend=changed?phase(t,event.start,event.start+(transition?.duration||.55)):1;
 const scale=mix(transition?.scale_from||.94,1,blend);
 const cue=plan.anchors.cues.find(c=>c.start<=t&&c.end>t);
 return <AbsoluteFill data-event={event.id} style={{background:plan.theme.paper,fontFamily:font,overflow:'hidden',color:plan.theme.ink}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 42% 50%,#DBE8FF99,transparent 65%),radial-gradient(ellipse at 80% 75%,#DDEBCF77,transparent 45%)'}}/>
  {changed&&blend<1&&<div style={{position:'absolute',inset:0,opacity:1-blend,transformOrigin:'800px 450px',scale:mix(1,1.025,blend)}}><ViewLayer plan={plan} event={previous} t={event.start-1/fps} role="previous"/></div>}
  <div style={{position:'absolute',inset:0,opacity:blend,transformOrigin:'800px 450px',transform:`translate(${mix(transition?.offset_x||0,0,blend)}px,${mix(transition?.offset_y||0,0,blend)}px) scale(${scale})`}}><ViewLayer plan={plan} event={event} t={t} role="active"/></div>
  <div style={{position:'absolute',left:90,top:57,fontSize:19,letterSpacing:3,color:'#6B80A0',fontWeight:650}}>MOTION · {plan.task==='process'?'让表达继续':'把关系讲清楚'}</div>
  <div style={{position:'absolute',left:90,top:99,fontSize:72,fontWeight:800,letterSpacing:-2}}>{event.headline||plan.title}</div>
  <div style={{position:'absolute',left:90,top:193,color:plan.theme.blue,fontSize:29,fontWeight:650}}>{event.meaning}</div>
  {cue&&<div style={{position:'absolute',left:130,right:130,bottom:51,textAlign:'center',fontSize:35,fontWeight:550,lineHeight:1.5,textWrap:'balance'}}>{cue.text}</div>}
 </AbsoluteFill>;
}

export function ExplanationFilm({plan}:{plan:ExplanationPlan}){
 return <><Picture plan={plan}/>{plan.audio.url&&<Audio src={staticFile(plan.audio.url)} playbackRate={1}/>}</>;
}
