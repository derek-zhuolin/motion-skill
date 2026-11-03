import React from 'react';
import {Img} from 'remotion';

/** Frame-driven, deterministic helpers. No timers, fetching, image generation or fixed palette. */
export const progress=(t:number,a:number,b:number)=>{if(b<=a)throw Error('end must exceed start');const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*p*(10+p*(-15+6*p));};
export type Key={at:number,value:number};
export function track(t:number,keys:readonly Key[]):number{
 if(!keys.length)throw Error('track requires keys');
 if(keys.some((k,i)=>!Number.isFinite(k.at)||!Number.isFinite(k.value)||(i>0&&k.at<=keys[i-1].at)))throw Error('keys must be finite and strictly ordered');
 if(t<=keys[0].at)return keys[0].value;
 for(let i=1;i<keys.length;i++)if(t<keys[i].at){const p=progress(t,keys[i-1].at,keys[i].at);return keys[i-1].value+(keys[i].value-keys[i-1].value)*p;}
 return keys[keys.length-1].value;
}
export type Hop={at:number;duration:number;height:number};
export function hopPose(t:number,hops:readonly Hop[]){
 let lift=0,squash=0,tilt=0;
 for(const h of hops){if(h.duration<=0)throw Error('hop duration must be positive');const p=(t-h.at)/h.duration;
  // Smooth takeoff/landing, followed by a compact, continuous landing compression.
  if(p>0&&p<1){lift+=Math.pow(Math.sin(Math.PI*p),2)*h.height;tilt+=Math.sin(2*Math.PI*p)*4;}
  const q=(t-h.at-h.duration)/.18;if(q>0&&q<1)squash+=Math.pow(Math.sin(Math.PI*q),2)*.1;
 }
 return {lift,scaleX:1+squash,scaleY:1-squash,tilt};
}
export function blinkScale(t:number,at:readonly number[],duration=.16){
 if(duration<=0)throw Error('blink duration must be positive');
 let scale=1;for(const start of at){const p=(t-start)/duration;if(p>0&&p<1)scale=Math.min(scale,1-.96*Math.pow(Math.sin(Math.PI*p),2));}return scale;
}
export function IPActor({src,id,t,x,y,size=250,hops=[],rotate=0,children}:{src:string;id:string;t:number;x:number;y:number;size?:number;hops?:readonly Hop[];rotate?:number;children?:React.ReactNode}){
 const p=hopPose(t,hops);
 return <div data-ip={id} style={{position:'absolute',left:x-size/2,top:y-size/2-p.lift,width:size,height:size,transformOrigin:'50% 82%',transform:`rotate(${rotate+p.tilt}deg) scale(${p.scaleX},${p.scaleY})`}}><Img src={src} style={{width:'100%',height:'100%',objectFit:'contain'}}/>{children}</div>;
}
/** Coordinates are resolved once: all world objects, paths and shadows share this transform. */
export function CameraStage({x,y,zoom,centerX,centerY,children}:{x:number;y:number;zoom:number;centerX:number;centerY:number;children:React.ReactNode}){
 if(zoom<=0)throw Error('camera zoom must be positive');
 return <div data-camera={`${x},${y},${zoom}`} style={{position:'absolute',inset:0,transformOrigin:'0 0',transform:`translate(${centerX}px,${centerY}px) scale(${zoom}) translate(${-x}px,${-y}px)`}}>{children}</div>;
}
