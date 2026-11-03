import React from 'react';
import {Window,Row,Bar,Icon,Text,Check} from '../../vendor/stageshow/kit';
import {UIFrame,uiTime,uiProgress,uiMix,uiText,type UIFrameProps} from './ui-frame';
import './ui-aggregate.css';

export interface AggregateContent {title:string;listTitle:string;itemTitle:string;itemDetail?:string;metricLabel:string;unit?:string;baseValue:number;increment:number;result:string}
export interface UIAggregateProps extends UIFrameProps {content:AggregateContent}
export function validateAggregateContent(c:AggregateContent){if(!c)throw Error('UIAggregate: content is required');uiText(c.title,'title',24);uiText(c.listTitle,'listTitle',18);uiText(c.itemTitle,'itemTitle',18);uiText(c.metricLabel,'metricLabel',14);uiText(c.result,'result',24);if(c.itemDetail!==undefined)uiText(c.itemDetail,'itemDetail',24);if(c.unit!==undefined&&c.unit!=='')uiText(c.unit,'unit',6);if(!Number.isFinite(c.baseValue)||!Number.isFinite(c.increment)||c.baseValue<0||c.increment<0||c.baseValue+c.increment>1e9)throw Error('UIAggregate: finite nonnegative baseValue/increment with total <= 1e9 required')}
/** A single chip leaves its source and lands before its dependent metric changes. No autonomous reset. */
export function getAggregateState(frame:number,fps=60,duration=3.7,baseValue=12,increment=1,chipWidth=96){
 if(!Number.isFinite(baseValue)||!Number.isFinite(increment)||baseValue<0||increment<0||baseValue+increment>1e9||!Number.isFinite(chipWidth)||chipWidth<96||chipWidth>290)throw Error('UIAggregate: invalid metric');
 const time=uiTime(frame,fps,duration),u=time/duration,flight=uiProgress(u,.22,.53),slot=uiProgress(u,.18,.40),landed=u>=.53,count=uiProgress(u,.56,.72),result=uiProgress(u,.76,.84);
 const x=uiMix(224-(chipWidth+12)/2,1160-chipWidth,flight),y=uiMix(591,387,flight)-92*Math.sin(flight*Math.PI),w=uiMix(chipWidth+12,chipWidth,flight),h=uiMix(42,36,flight);
 return{time,u,flight,slot,landed,count,value:uiMix(baseValue,baseValue+increment,count),chipX:x,chipY:y,chipW:w,chipH:h,chipLift:Math.sin(flight*Math.PI),rowContent:uiProgress(u,.48,.60),sourceDone:uiProgress(u,.53,.63),resultOpacity:result};
}
export function UIAggregate({frame,fps=60,duration=3.7,accent='#0070DB',fontFamily,content}:UIAggregateProps){
 validateAggregateContent(content);const format=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:Number.isInteger(content.baseValue)&&Number.isInteger(content.increment)?0:2}).format(n),chipWidth=Math.max(96,Math.min(290,34+format(content.increment).length*12+Array.from(content.unit??'').length*17));const s=getAggregateState(frame,fps,duration,content.baseValue,content.increment,chipWidth);
 return <UIFrame mechanism="ui-aggregate" className="mui-aggregate" accent={accent} fontFamily={fontFamily}>
  <div className="mui-aggregate-copy"><div className="mui-kicker">OBJECT / CONSEQUENCE</div><Text className="mui-title">{content.title}</Text><p className="mui-note">一个新对象，带来整体变化。</p><div className="mui-aggregate-result" style={{opacity:s.resultOpacity}}><Check on={s.resultOpacity>.1} size={22}/><span>{content.result}</span></div></div>
  <Window title={content.listTitle} className="mui-aggregate-window" style={{left:370,top:68,width:830,height:670}} toolbar={<Icon name="more" size={18}/>} body={{className:'mui-aggregate-body'}}>
   <div className="mui-aggregate-metric"><span className="mui-aggregate-label">{content.metricLabel}</span><div className="mui-aggregate-amount" data-value={s.value}><Text>{format(s.value)}</Text>{content.unit&&<span>{content.unit}</span>}</div><div className="mui-aggregate-rule"><span style={{opacity:s.count}}>原有 {format(content.baseValue)} + 本次 {format(content.increment)}{content.unit}</span></div></div>
   <div className="mui-aggregate-list-heading"><span>最近加入</span><span>本次计入</span></div>
   <div className="mui-aggregate-list">
    <div className="mui-aggregate-slot" style={{height:82*s.slot,overflow:'hidden'}}><Row className="mui-aggregate-new" data-object="aggregate-row" lead={<span className="mui-aggregate-icon" style={{opacity:s.rowContent}}><Icon name="file" size={24}/></span>} title={<span style={{opacity:s.rowContent}}>{content.itemTitle}</span>} subtitle={content.itemDetail?<span style={{opacity:s.rowContent}}>{content.itemDetail}</span>:undefined} meta={<span className="mui-aggregate-chip-slot" style={{width:chipWidth}} aria-hidden/>} style={{background:`color-mix(in srgb,${accent} ${Math.round(5*s.rowContent)}%,white)`}}/></div>
    <Row lead={<Icon name="file" size={23}/>} title={<Text>内容提纲</Text>} subtitle={<Text>已加入工作区</Text>} meta={<Bar w={59} h={7} tone={2}/>}/>
    <Row lead={<Icon name="file" size={23}/>} title={<Text>选题记录</Text>} subtitle={<Text>已加入工作区</Text>} meta={<Bar w={46} h={7} tone={2}/>}/>
    {[174,128,190].map((v,i)=><Row key={i} lead={<Icon name="file" size={23}/>} title={<Bar w={v} h={8} tone={2}/>} subtitle={<Bar w={v-40} h={6} tone={1}/>} meta={<Bar w={50+i*6} h={7} tone={1}/>}/>)}
   </div>
  </Window>
  <div className="mui-aggregate-source" data-object="aggregate-source"><span className="mui-aggregate-source-head"><span className="mui-aggregate-icon"><Icon name="file" size={24}/></span><Text>{content.itemTitle}</Text></span><p>{content.itemDetail??'准备加入工作区'}</p><div className="mui-aggregate-source-action" style={{background:s.sourceDone>.01?'#edf6ee':accent}}><span style={{opacity:s.sourceDone}}><Check on={s.sourceDone>.1} size={20}/><Text>已加入</Text></span></div></div>
  <div className="mui-aggregate-chip" data-object="aggregate-chip" style={{left:s.chipX,top:s.chipY,width:s.chipW,height:s.chipH,background:s.landed?`color-mix(in srgb,${accent} 9%,white)`:'#fff',color:accent,boxShadow:`0 ${8*s.chipLift}px ${20*s.chipLift}px #2a4a702b`,borderColor:`color-mix(in srgb,${accent} ${Math.round(20*(1-s.flight))}%,transparent)`}}>+{format(content.increment)}{content.unit&&<span>{content.unit}</span>}</div>
 </UIFrame>;
}
