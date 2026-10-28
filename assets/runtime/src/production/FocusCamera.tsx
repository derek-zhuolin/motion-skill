import React from 'react';
import {FocusFrame} from './focus-camera';
/** Wrap only the scene world. Keep captions, brands and footer outside. */
export function FocusCameraStage({frame,children}:{frame:FocusFrame;children:React.ReactNode}){
 if(!frame.active)return <>{children}</>;
 const {width,height,pose}=frame;
 return <div data-focus-camera={frame.cue?.id} data-focus-keyword={frame.cue?.keyword} data-camera-scale={pose.scale} style={{position:'absolute',width,height,transformOrigin:'0 0',transform:`translate(${width/2-pose.x*pose.scale}px,${height/2-pose.y*pose.scale}px) scale(${pose.scale})`}}>{children}</div>;
}
/** Screen-space annotation: legible type stays still while the world moves. No new material/theme. */
export function FocusCameraAnnotation({frame,color='#0870dc',fontFamily='sans-serif'}:{frame:FocusFrame;color?:string;fontFamily?:string}){
 if(!frame.active)return null;
 const c=frame.cue?.color??color,a=frame.annotation,r=frame.target,p=frame.trigger;
 const below=a&&r&&a.rect.y>=r.y+r.height,above=a&&r&&a.rect.y+a.rect.height<=r.y;
 const leader=a&&r?(below?`M${r.x+r.width/2} ${r.y+r.height+13}V${a.rect.y-10}H${a.rect.x+a.rect.width/2}V${a.rect.y}`:above?`M${r.x+r.width/2} ${r.y-13}V${a.rect.y+a.rect.height+10}H${a.rect.x+a.rect.width/2}V${a.rect.y+a.rect.height}`:`M${a.rect.x>r.x?r.x+r.width+13:r.x-13} ${r.y+r.height/2}H${a.rect.x>r.x?a.rect.x:a.rect.x+a.rect.width}`):'';
 return <svg data-focus-overlay={frame.cue?.id} width={frame.width} height={frame.height} style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
  {a&&r&&a.opacity>0&&<g opacity={a.opacity}>
   <path d={`M${r.x-13} ${r.y+20}v-33h33M${r.x+r.width-20} ${r.y-13}h33v33M${r.x-13} ${r.y+r.height-20}v33h33M${r.x+r.width-20} ${r.y+r.height+13}h33v-33`} fill="none" stroke={c} strokeWidth="2.5"/>
   <path d={leader} fill="none" stroke={c} strokeWidth="1.5"/>
   <rect {...a.rect} rx="17" fill="#fffffff5" stroke={c} strokeOpacity=".32"/>
   <text x={a.rect.x+20} y={a.rect.y+32} fill={c} fontFamily={fontFamily} fontSize="21">{a.label}</text>
   {a.detail&&<text x={a.rect.x+20} y={a.rect.y+66} fill="#72889e" fontFamily={fontFamily} fontSize="21">{a.detail}</text>}
  </g>}
  {p&&<g opacity={p.opacity} transform={`translate(${p.point.x} ${p.point.y})`}><circle r={10+30*p.progress} stroke={c} strokeWidth="2" fill="none" opacity={1-p.progress}/><path d="M0 0l10 33 8-13 15-5z" fill={c} stroke="#fff" strokeWidth="3" strokeLinejoin="round"/></g>}
 </svg>;
}
