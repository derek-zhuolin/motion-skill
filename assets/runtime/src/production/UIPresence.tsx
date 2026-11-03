import React, {useLayoutEffect, useRef, useState, type CSSProperties} from 'react';
import {Avatar, Bar, Check, Icon, Text, Window} from '../../vendor/stageshow/kit';
import {UIFrame, uiMix, uiProgress, uiText, uiTime, type UIFrameProps} from './ui-frame';
import './ui-presence.css';

export interface PresenceCollaborator {name:string;color:string}
export interface PresenceContent {
 title:string;documentTitle:string;body:string;focusText:string;result:string;
 collaborators:readonly [PresenceCollaborator,PresenceCollaborator];
}
export interface UIPresenceProps extends UIFrameProps {content:PresenceContent}
export function validatePresenceContent(c:PresenceContent){
 if(!c)throw Error('UIPresence: explicit content required');
 uiText(c.title,'title',24);uiText(c.documentTitle,'documentTitle',24);uiText(c.body,'body',58);uiText(c.focusText,'focusText',22);uiText(c.result,'result',24);
 if(!Array.isArray(c.collaborators)||c.collaborators.length!==2)throw Error('UIPresence: exactly two collaborators required');
 c.collaborators.forEach((p,i)=>{uiText(p.name,`collaborators[${i}].name`,10);if(!/^#[0-9a-f]{6}$/i.test(p.color))throw Error('UIPresence: collaborator colors must be six-digit hex colors')});
 if(c.collaborators[0].name===c.collaborators[1].name||c.collaborators[0].color.toLowerCase()===c.collaborators[1].color.toLowerCase())throw Error('UIPresence: collaborators require distinct names and colors');
}
/** One selection edge and its peer tip share the same measured text geometry. */
export function getPresenceState(frame:number,fps=60,duration=3.8,focusWidth=380){
 if(!Number.isFinite(focusWidth)||focusWidth<0||focusWidth>714)throw Error('UIPresence: focusWidth must be 0–714');
 const time=uiTime(frame,fps,duration),u=time/duration;
 const approach=uiProgress(u,.03,.17),selection=uiProgress(u,.18,.42),secondApproach=uiProgress(u,.26,.43),typing=uiProgress(u,.46,.74),settled=uiProgress(u,.78,.84);
 const first={x:uiMix(1000,428,approach)+focusWidth*selection,y:uiMix(269,404,approach)};
 const second={x:uiMix(1060,428,secondApproach),y:uiMix(567,506,secondApproach)};
 return{time,u,selection,typing,settled,focusX:428,focusY:385,focusWidth,selectionEdge:428+focusWidth*selection,first,second,peerOpacity:uiProgress(u,.01,.06),caretOpacity:uiProgress(u,.43,.47),resultOpacity:uiProgress(u,.76,.84)};
}
/** Peer shape and flag follow Stageshow's presence gold, with no CSS travel clock. */
function Peer({person,x,y,opacity}:{person:PresenceCollaborator;x:number;y:number;opacity:number}){
 return <span className="mui-presence-peer" style={{left:x,top:y,opacity,'--who':person.color} as CSSProperties}><svg width="21" height="24" viewBox="0 0 16 18" aria-hidden="true"><path d="M1.5 1.5v13.2l3.6-3.3 2.4 5.4 2.4-1-2.4-5.3h5.1Z" fill="var(--who)" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/></svg><span>{person.name}</span></span>;
}
export function UIPresence({frame,fps=60,duration=3.8,accent='#0070DB',fontFamily,content}:UIPresenceProps){
 validatePresenceContent(content);
 const focus=useRef<HTMLSpanElement>(null),[focusWidth,setFocusWidth]=useState(380);
 // Measuring a text slot is independent of playback. It also respects the caller's font.
 useLayoutEffect(()=>{if(focus.current)setFocusWidth(focus.current.offsetWidth)},[content.focusText,fontFamily]);
 const s=getPresenceState(frame,fps,duration,focusWidth),first=content.collaborators[0],second=content.collaborators[1];
 const typed=Array.from(content.result).slice(0,Math.floor(Array.from(content.result).length*s.typing)).join('');
 return <UIFrame mechanism="ui-presence" className="mui-presence" accent={accent} fontFamily={fontFamily}>
  <div className="mui-presence-copy"><div className="mui-kicker">05 / COLLABORATE</div><div className="mui-title">{content.title}</div><p className="mui-note">同一份内容，<br/>一起往前推一步。</p><div className="mui-presence-copy-result" style={{opacity:s.resultOpacity}}><Check on={s.resultOpacity>.1} size={23}/><span>方向已对齐</span></div></div>
  <Window title="协作文档" className="mui-presence-window" style={{left:370,top:68,width:850,height:690}} toolbar={<div className="mui-presence-people">{content.collaborators.map(p=><Avatar key={p.name} name={p.name} size={28} style={{background:p.color,color:'#fff'}}/>)}<Icon name="send" size={17}/></div>}>
   <div className="mui-presence-doc"><Text className="mui-presence-heading">{content.documentTitle}</Text><div className="mui-presence-lines"><Bar w="88%" h={8} r={4} tone={2}/><Bar w="62%" h={8} r={4} tone={2}/></div><p className="mui-presence-body">{content.body}</p>
    <span ref={focus} className="mui-presence-focus" data-object="shared-focus" style={{backgroundImage:`linear-gradient(${first.color}2e,${first.color}2e)`,backgroundSize:`${s.selection*100}% 100%`}}>{content.focusText}</span>
    <div className="mui-presence-edit-label">下一步</div><div className="mui-presence-edit" data-object="collaborative-result"><span>{typed}</span><span className="mui-presence-caret" style={{background:second.color,opacity:s.caretOpacity}}/></div>
    <div className="mui-presence-bottom-lines"><Bar w="92%" h={8} r={4} tone={2}/><Bar w="76%" h={8} r={4} tone={2}/><Bar w="85%" h={8} r={4} tone={2}/></div>
   </div>
  </Window>
  <Peer person={first} {...s.first} opacity={s.peerOpacity}/><Peer person={second} {...s.second} opacity={s.peerOpacity}/>
 </UIFrame>;
}
