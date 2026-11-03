import React from 'react';
import {Phone,Row,Avatar,Bar,Icon,Text} from '../../vendor/stageshow/kit';
import {UIFrame,UIFrameCursor,uiTime,uiProgress,uiMix,uiText,type UIFrameProps} from './ui-frame';
import './ui-swipe-archive.css';
export interface SwipeArchiveContent {title:string;discardTitle:string;discardDetail:string;keepTitle:string;keepDetail:string;result:string}
export interface UISwipeArchiveProps extends UIFrameProps {content:SwipeArchiveContent}
const PHONE={x:790,y:90,width:370,scale:370/428,screen:402,edge:13};
const ROW_HEIGHT=156,LIST_TOP=210;
/** Piecewise gesture with matching velocity at the release boundary.
 * All geometry is in iPhone screen points; no accumulated browser samples. */
export function getSwipeArchiveState(frame:number,fps=60,duration=3.4){
 const t=uiTime(frame,fps,duration),u=t/duration;
 let dx=0;
 if(u>=.24&&u<.46)dx=-230*(u-.24)/.22;
 else if(u>=.46&&u<.59){const p=(u-.46)/.13,p2=p*p,p3=p2*p;const h00=2*p3-3*p2+1,h10=p3-2*p2+p,h01=-2*p3+3*p2;dx=-230*h00+(-230/.22*.13)*h10-430*h01;}
 else if(u>=.59)dx=-430;
 const close=uiProgress(u,.59,.75),pressed=uiProgress(u,.19,.22)*(1-uiProgress(u,.46,.49));
 const startX=PHONE.x+(PHONE.edge+PHONE.screen*.82)*PHONE.scale;
 const y=PHONE.y+(PHONE.edge+LIST_TOP+ROW_HEIGHT*.5)*PHONE.scale;
 const fingerShift=u<.46?dx:-230-uiMix(0,30,uiProgress(u,.46,.52));
 return{time:t,progress:u,dx,close,pressed,archived:u>=.75,discardHeight:ROW_HEIGHT*(1-close),cursorX:startX+fingerShift*PHONE.scale,cursorY:y,cursorOpacity:uiProgress(u,.13,.18)*(1-uiProgress(u,.49,.55)),resultOpacity:uiProgress(u,.75,.81)};
}
function validate(content:SwipeArchiveContent){if(!content)throw Error('UISwipeArchive: content is required');uiText(content.title,'title',28);uiText(content.discardTitle,'discardTitle',16);uiText(content.discardDetail,'discardDetail',42);uiText(content.keepTitle,'keepTitle',16);uiText(content.keepDetail,'keepDetail',42);uiText(content.result,'result',24)}
export function UISwipeArchive({frame,fps=60,duration=3.4,accent='#0070DB',fontFamily,content}:UISwipeArchiveProps){
 validate(content);const s=getSwipeArchiveState(frame,fps,duration),open=Math.min(402,-s.dx);
 return <UIFrame mechanism="ui-swipe-archive" className="mui-swipe" accent={accent} fontFamily={fontFamily}>
  <div className="mui-swipe-copy"><div className="mui-kicker">01 / 清理</div><Text className="mui-title">{content.title}</Text><div className="mui-swipe-line" style={{background:accent}}/><p className="mui-note">{content.discardDetail}</p><div className="mui-swipe-outcome" style={{opacity:s.resultOpacity,translate:`0 ${7*(1-s.resultOpacity)}px`}}><span style={{background:`color-mix(in srgb,${accent} 11%,white)`,color:accent}}><Icon name="check" size={19}/></span><Text>{content.result}</Text></div></div>
  <Phone width={PHONE.width} className="mui-swipe-phone" style={{left:PHONE.x,top:PHONE.y}}>
   <div className="mui-swipe-app">
    <header className="mui-swipe-head"><div className="mui-swipe-nav"><Icon name="chevron-right" size={21} style={{rotate:'180deg'}}/><Icon name="more" size={21}/></div><div className="mui-swipe-title">灵感收件箱</div><div className="mui-swipe-filter"><span style={{background:accent}}><Icon name="mail" size={15}/>全部灵感</span><Icon name="archive" size={19}/></div></header>
    <div className="mui-swipe-list">
     <div className="mui-swipe-discard-slot" data-object="discarded-idea" style={{height:s.discardHeight}}>
      <div className="mui-swipe-action" style={{background:accent,opacity:s.dx===0?0:1}}><span style={{left:Math.max(0,402-open),width:Math.max(74,open)}}><Icon name="archive" size={25}/><Text>归档</Text></span></div>
      <Row className="mui-swipe-row" pad={16} lead={<Avatar name="未整理" size={40}/>} title={<Text>{content.discardTitle}</Text>} meta={<Text>刚刚</Text>} subtitle={<Text>暂时不做</Text>} preview={content.discardDetail} style={{translate:`${s.dx}px 0`,visibility:s.close>=1?'hidden':'visible'}}/>
     </div>
     <div className="mui-swipe-keep" data-object="kept-idea"><Row className="mui-swipe-row" pad={16} lead={<Avatar name="我的选题" size={40}/>} title={<Text>{content.keepTitle}</Text>} meta={<Icon name="chevron-right" size={15}/>} subtitle={<Text>保留这个方向</Text>} preview={content.keepDetail}/></div>
     {[0,1].map(i=><Row key={i} className="mui-swipe-row mui-swipe-filler" pad={16} lead={<Avatar size={40}/>} title={<Bar w={102+i*18} h={10} tone={3}/>} subtitle={<Bar w={154-i*20} h={8} tone={2}/>} preview={[230-i*18,174+i*12]}/>)}
    </div>
   </div>
  </Phone>
  <UIFrameCursor x={s.cursorX} y={s.cursorY} touch pressed={s.pressed} opacity={s.cursorOpacity}/>
 </UIFrame>;
}
