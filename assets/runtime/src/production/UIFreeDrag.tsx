import React from 'react';
import {Window,Avatar,Bar,Icon,Text,Badge} from '../../vendor/stageshow/kit';
import {UIFrame,UIFrameCursor,uiTime,uiProgress,uiMix,uiText,type UIFrameProps} from './ui-frame';
import './ui-free-drag.css';
export interface FreeDragContent {title:string;task:string;subtitle?:string;result?:string}
export interface UIFreeDragProps extends UIFrameProps {content:FreeDragContent}
const GRID={x:452,y:176,col:178,row:74,width:712,height:370};
const CARD={w:168,h:138,startX:457,startY:329,endX:813,endY:181,gripX:58,gripY:31};
/** Grid slots jump discretely; lifted card and hand share one continuous path. */
export function getFreeDragState(frame:number,fps=60,duration=4.4){
 const t=uiTime(frame,fps,duration),u=t/duration;
 const drag=uiProgress(u,.30,.62),settle=uiProgress(u,.64,.73);
 const rawX=uiMix(CARD.startX,CARD.endX+18,drag),rawY=uiMix(CARD.startY,CARD.endY-12,drag)-25*Math.sin(drag*Math.PI);
 const q=Math.max(0,Math.min(1,(u-.64)/.09));
 const nudge=2.4*Math.sin(q*Math.PI*2)*Math.exp(-4*q)*(1-q);
 const x=uiMix(rawX,CARD.endX,settle),y=uiMix(rawY,CARD.endY,settle)+nudge;
 const lift=uiProgress(u,.27,.30)*(1-settle),pressed=uiProgress(u,.263,.275)*(1-uiProgress(u,.64,.665));
 const targetCol=Math.max(0,Math.min(3,Math.round((x-GRID.x-5)/GRID.col))),targetRow=Math.max(0,Math.min(3,Math.round((y-GRID.y-5)/GRID.row)));
 const handApproach=uiProgress(u,.14,.25),away=uiProgress(u,.665,.78);
 const dragPoint={x:x+CARD.gripX,y:y+CARD.gripY};
 const before={x:uiMix(CARD.startX+230,CARD.startX+CARD.gripX,handApproach),y:uiMix(CARD.startY+120,CARD.startY+CARD.gripY,handApproach)};
 const cursorX=u<.27?before.x:uiMix(dragPoint.x,CARD.endX+CARD.w+36,away),cursorY=u<.27?before.y:uiMix(dragPoint.y,CARD.endY+CARD.h+46,away);
 return{time:t,progress:u,drag,settle,x,y,lift,pressed,targetCol,targetRow,targetX:GRID.x+targetCol*GRID.col+5,targetY:GRID.y+targetRow*GRID.row+5,targetVisible:u>=.30&&u<.73&&(targetCol!==0||targetRow!==2),landed:u>=.73,cursorX,cursorY,cursorOpacity:uiProgress(u,.10,.15)*(1-uiProgress(u,.79,.85)),resultOpacity:uiProgress(u,.75,.82)};
}
function validate(content:FreeDragContent){if(!content)throw Error('UIFreeDrag: content is required');uiText(content.title,'title',18);uiText(content.task,'task',12);if(content.subtitle!==undefined)uiText(content.subtitle,'subtitle',32);if(content.result!==undefined)uiText(content.result,'result',30)}
export function UIFreeDrag({frame,fps=60,duration=4.4,accent='#0070DB',fontFamily,content}:UIFreeDragProps){
 validate(content);const s=getFreeDragState(frame,fps,duration);
 return <UIFrame mechanism="ui-free-drag" className="mui-drag" accent={accent} fontFamily={fontFamily}>
  <div className="mui-drag-copy"><div className="mui-kicker">04 / 安排</div><Text className="mui-title">{content.title}</Text><p className="mui-note">{content.subtitle??'给选中的方向，留出真实的制作时间。'}</p><div className="mui-drag-result" style={{opacity:s.resultOpacity,translate:`0 ${8*(1-s.resultOpacity)}px`}}><span style={{color:accent}}><Icon name="check" size={21}/></span><Text>{content.result??'已加入制作日程'}</Text></div></div>
  <Window title="制作日程" className="mui-drag-window" style={{left:370,top:68,width:830,height:670}} toolbar={<div className="mui-drag-window-tools"><Icon name="calendar" size={16}/><Text>本周</Text></div>} body={{className:'mui-drag-body'}}>
   <div className="mui-drag-days"><span/><div>{['周一','周二','周三','周四'].map((x,i)=><span key={x}><Text>{x}</Text><b>{20+i}</b></span>)}</div></div>
   <div className="mui-drag-hours">{['09:00','10:00','11:00','12:00','13:00'].map((h,i)=><span key={h} style={{top:i*GRID.row+4}}>{h}</span>)}</div>
   <div className="mui-drag-grid" style={{left:82,top:70,width:GRID.width,height:GRID.height,backgroundSize:`${GRID.col}px ${GRID.row}px`}}>
    {[[1,1],[3,0],[1,3],[3,3]].map(([col,row],i)=><div key={i} className="mui-drag-busy" style={{left:col*GRID.col+5,top:row*GRID.row+5,width:168,height:i%2?62:130}}><Bar w={86+i*9} h={7} tone={2}/><Bar w={65+i*11} h={6} tone={1}/></div>)}
   </div>
   <div className="mui-drag-window-foot"><Icon name="lock" size={13}/><span>示例日程 · 可以继续调整</span></div>
  </Window>
  <div className="mui-drag-target" style={{left:s.targetX,top:s.targetY,width:CARD.w,height:CARD.h,opacity:s.targetVisible?1:0,borderColor:accent,background:`color-mix(in srgb,${accent} 5%,transparent)`}}/>
  <div className="mui-drag-card" data-object="scheduled-task" style={{left:s.x,top:s.y,width:CARD.w,height:CARD.h,rotate:`${-1.8*s.lift}deg`,boxShadow:`0 ${5+17*s.lift}px ${12+26*s.lift}px #26405b2b`,borderColor:`color-mix(in srgb,${accent} 28%,white)`,background:s.landed?`color-mix(in srgb,${accent} 8%,white)`:'#fff'}}>
   <span className="mui-drag-card-rule" style={{background:accent}}/><span className="mui-drag-card-label" style={{color:accent}}><Icon name="file" size={13}/><Text>视频制作</Text></span><Text className="mui-drag-task">{content.task}</Text><div className="mui-drag-people"><Avatar name="我" size={22}/><Badge tone={s.landed?'accent':'neutral'}>{s.landed?'已安排':'待安排'}</Badge></div>
  </div>
  <UIFrameCursor x={s.cursorX} y={s.cursorY} pressed={s.pressed} opacity={s.cursorOpacity} kind={s.progress>=.27&&s.progress<.64?'grab':s.progress>=.21&&s.progress<.27?'open':'pointer'}/>
 </UIFrame>;
}
