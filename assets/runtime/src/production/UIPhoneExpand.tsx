import React from 'react';
import {Phone,Icon,Text,Bar,Check,Badge} from '../../vendor/stageshow/kit';
import {UIFrame,UIFrameCursor,uiTime,uiProgress,uiMix,uiText,type UIFrameProps} from './ui-frame';
import './UIPhoneExpand.css';
export interface PhoneExpandContent {title:string;cardTitle:string;cardSubtitle:string;detail:string;result:string}
export function validatePhoneExpandContent(c:PhoneExpandContent){if(!c)throw Error('UIPhoneExpand: explicit content required');uiText(c.title,'title',26);uiText(c.cardTitle,'cardTitle',18);uiText(c.cardSubtitle,'cardSubtitle',20);uiText(c.detail,'detail',48);uiText(c.result,'result',16)}
/** One retained card releases its clip into the detail screen; all geometry is frame-derived. */
export function getPhoneExpandState(frame:number,fps=60,duration=3.7){const t=uiTime(frame,fps,duration),u=t/duration;return{t,u,press:uiProgress(u,.15,.19)*(1-uiProgress(u,.23,.27)),open:uiProgress(u,.24,.5),body:uiProgress(u,.43,.59),sendPress:uiProgress(u,.68,.71)*(1-uiProgress(u,.75,.79)),done:uiProgress(u,.77,.85)}}
const PHONE={x:790,y:90,width:370,scale:370/428};
const onScreen=(x:number,y:number)=>({x:PHONE.x+13*PHONE.scale+x*PHONE.scale,y:PHONE.y+13*PHONE.scale+y*PHONE.scale});
export function UIPhoneExpand({frame,fps=60,duration=3.7,accent='#0070DB',fontFamily='InterflowCN, sans-serif',content}:{content:PhoneExpandContent}&UIFrameProps){
 validatePhoneExpandContent(content);const s=getPhoneExpandState(frame,fps,duration),p=s.open;
 const card={left:uiMix(18,0,p),top:uiMix(248,64,p),width:uiMix(366,402,p),height:uiMix(164,640,p),radius:uiMix(24,30,p)};
 const tap=onScreen(210,330),send=onScreen(201,594);const move=uiProgress(s.u,.59,.68),finger={x:uiMix(tap.x,send.x,move),y:uiMix(tap.y,send.y,move)};
 return <UIFrame className="mui-expand" mechanism="ui-phone-expand" accent={accent} fontFamily={fontFamily}>
  <div className="mui-expand-copy"><div className="mui-kicker">02 / DEEPEN</div><div className="mui-title">{content.title}</div><p className="mui-note">{content.cardTitle}</p><div className="mui-expand-copy-result" style={{opacity:s.done,translate:`0 ${8*(1-s.done)}px`}}><Check on={s.done>.7} size={22}/><span>{content.result}</span></div></div>
  <Phone width={PHONE.width} className="mui-expand-phone" style={{left:PHONE.x,top:PHONE.y}}>
   <div className="mui-expand-library" style={{opacity:1-.46*p}}>
    <div className="mui-expand-app-title">灵感库</div><span className="mui-expand-app-sub">选一个值得继续的方向</span>
    <div className="mui-expand-filler mui-expand-filler-first"><Bar w={118} h={9} tone={3}/><Bar w={184} h={8} tone={2}/></div>
    <div className="mui-expand-filler mui-expand-filler-last"><Bar w={154} h={9} tone={3}/><Bar w={206} h={8} tone={2}/></div>
   </div>
   <div className="mui-expand-card" data-object="retained-idea-card" style={{left:card.left,top:card.top,width:card.width,height:card.height,borderRadius:card.radius,translate:`0 ${-3*s.press}px`,boxShadow:`0 ${8+12*p}px ${26+20*p}px #1c477b20`}}>
    <div className="mui-expand-art" style={{height:uiMix(164,254,p),background:`linear-gradient(145deg,color-mix(in srgb,${accent} 72%,#fff),${accent} 70%,color-mix(in srgb,${accent} 75%,#163950))`}}>
     <div className="mui-expand-art-grid"/>
     <div className="mui-expand-close" style={{opacity:uiProgress(p,.55,.95)}}><Icon name="close" size={17}/></div>
     <div className="mui-expand-card-kicker" style={{top:uiMix(19,53,p)}}>保留下来的灵感</div>
     <div className="mui-expand-card-title" style={{top:uiMix(49,91,p)}}>{content.cardTitle}</div>
     <div className="mui-expand-card-sub" style={{top:uiMix(132,181,p)}}>{content.cardSubtitle}</div>
    </div>
    <div className="mui-expand-detail" style={{opacity:s.body,translate:`0 ${12*(1-s.body)}px`}}>
     <Badge tone="accent">选题详情</Badge><p>{content.detail}</p>
     <div className="mui-expand-detail-rule"/><div className="mui-expand-detail-meta"><Icon name="file" size={17}/><span>内容保留，继续向下展开</span></div>
    </div>
    <div className="mui-expand-action" data-object="next-action" style={{opacity:s.body,top:500,background:s.done>.01?'#edf6ee':accent,color:s.done>.01?'#357344':'#fff',scale:1-.025*s.sendPress}}>
     <span className="mui-expand-action-layer" style={{opacity:1-uiProgress(s.u,.72,.77)}}><Text>带着选题继续聊</Text><Icon name="arrow" size={19}/></span>
     <span className="mui-expand-action-layer" style={{opacity:s.done}}><Check on={s.done>.1} size={21}/><Text>{content.result}</Text></span>
    </div>
   </div>
  </Phone>
  <UIFrameCursor x={finger.x} y={finger.y} touch pressed={s.press+s.sendPress} opacity={uiProgress(s.u,.1,.13)*(1-uiProgress(s.u,.86,.94))}/>
 </UIFrame>
}
