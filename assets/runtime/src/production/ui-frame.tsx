import React from 'react';
import {Stage} from '../../vendor/stageshow/kit';
import {Cursor,type CursorKind} from '../../vendor/stageshow/kit/cursor';
import './ui-frame.css';
export interface UIFrameProps {frame:number;fps?:number;duration?:number;accent?:string;fontFamily?:string}
export const uiClamp=(n:number)=>Math.max(0,Math.min(1,n));
export const uiEase=(n:number)=>{const p=uiClamp(n);return p*p*p*(p*(p*6-15)+10)};
export const uiProgress=(t:number,a:number,b:number)=>uiEase((t-a)/(b-a));
export const uiMix=(a:number,b:number,p:number)=>a+(b-a)*p;
export function uiTime(frame:number,fps=60,duration=4){if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0||!Number.isFinite(duration)||duration<=0)throw Error('UI frame: finite frame, positive fps and duration required');return uiClamp(frame/fps/duration)*duration}
export function uiText(value:unknown,name:string,max=40){if(typeof value!=='string'||!value.trim()||Array.from(value).length>max)throw Error(`UI frame: ${name} requires 1–${max} Unicode code points`)}
const EMPTY={};
/** Token/geometry provider only. No Act, CSS clock, timers or async playback. */
export function UIFrame({children,className='',accent='#0070DB',fontFamily='InterflowCN, sans-serif',mechanism}:{children:React.ReactNode;className?:string;accent?:string;fontFamily?:string;mechanism:string}){return <div className={'mui-frame '+className} data-mechanism={mechanism} style={{width:1280,height:720,fontFamily}}><Stage width={1280} height={720} initial={EMPTY} accent={accent} tokens={{'--ss-font':fontFamily,'--ss-accent':accent,'--ss-accent-2':accent}}>{()=>children}</Stage></div>}
export function UIFrameCursor({x,y,kind='pointer',pressed=0,opacity=1,touch=false}:{x:number;y:number;kind?:CursorKind;pressed?:number;opacity?:number;touch?:boolean}){return <div className="mui-cursor" data-pressed={pressed>.5||undefined} style={{left:x,top:y,opacity,scale:1-.08*pressed}}><Cursor cursorRef={null} kind={kind} style={touch?'touch':'large'}/>{touch&&<span className="mui-touch" style={{opacity:pressed,scale:1+.1*pressed}}/>}</div>}
