import React from 'react';
import {Chart, chartPoints, Check, Text, Window} from '../../vendor/stageshow/kit';
import {StillContext} from '../../vendor/stageshow/kit/reduced-motion';
import {UIFrame, UIFrameCursor, uiMix, uiProgress, uiText, uiTime, type UIFrameProps} from './ui-frame';
import './ui-chart-scrub.css';

export interface ChartScrubPoint {label:string;value:number}
export interface ChartScrubContent {title:string;chartTitle:string;unit:string;points:readonly ChartScrubPoint[];result?:string}
export interface UIChartScrubProps extends UIFrameProps {content:ChartScrubContent}
export const CHART_SCRUB_PLOT={x:428,y:346,width:714,height:236};
export function validateChartScrubContent(c:ChartScrubContent){
 if(!c)throw Error('UIChartScrub: explicit content required');
 uiText(c.title,'title',24);uiText(c.chartTitle,'chartTitle',24);uiText(c.unit,'unit',8);if(c.result!==undefined)uiText(c.result,'result',28);
 if(!Array.isArray(c.points)||c.points.length<2||c.points.length>16)throw Error('UIChartScrub: 2–16 points required');
 c.points.forEach((p,i)=>{uiText(p.label,`points[${i}].label`,14);if(!Number.isFinite(p.value)||p.value<0||p.value>1e12)throw Error('UIChartScrub: finite values from 0 to 1e12 required')});
 if(new Set(c.points.map(p=>p.label)).size!==c.points.length)throw Error('UIChartScrub: point labels must be unique');
}
type Point={x:number;y:number};
const cubic=(a:number,b:number,c:number,d:number,t:number)=>{const m=1-t;return m*m*m*a+3*m*m*t*b+3*m*t*t*c+t*t*t*d};
const inverseEase=(p:number)=>{let a=0,b=1;for(let i=0;i<24;i++){const t=(a+b)/2;if(uiProgress(t,0,1)<p)a=t;else b=t}return(a+b)/2};
function segment(points:Point[],i:number){const b=points[i],c=points[i+1],a=points[i-1]??b,e=points[i+2]??c;return{b,c,c1:{x:b.x+(c.x-a.x)/6,y:b.y+(c.y-a.y)/6},c2:{x:c.x-(e.x-b.x)/6,y:c.y-(e.y-b.y)/6}}}
/** Geometry starts at kit chartPoints; solve the kit's pinned, resampled curve without DOM/RAF. */
export function getChartScrubCurveY(points:Point[],x:number){
 const sampled:Point[]=[];
 for(let s=0;s<=48;s++){const u=s/48*(points.length-1),i=Math.min(Math.floor(u),points.length-2),t=u-i,k=segment(points,i);sampled.push({x:cubic(k.b.x,k.c1.x,k.c2.x,k.c.x,t),y:cubic(k.b.y,k.c1.y,k.c2.y,k.c.y,t)})}
 let i=0;while(i<sampled.length-2&&sampled[i+1].x<x)i++;
 const k=segment(sampled,i);let lo=0,hi=1;
 for(let n=0;n<24;n++){const mid=(lo+hi)/2;if(cubic(k.b.x,k.c1.x,k.c2.x,k.c.x,mid)<x)lo=mid;else hi=mid}
 return cubic(k.b.y,k.c1.y,k.c2.y,k.c.y,(lo+hi)/2);
}
/** Actual-point readout and continuous crosshair mirror the upstream gold's distinct roles. */
export function getChartScrubState(frame:number,fps=60,duration=3.6,points:readonly ChartScrubPoint[]=[{label:'1',value:0},{label:'2',value:1}]){
 if(points.length<2||points.length>16||points.some(p=>!Number.isFinite(p.value)||p.value<0||p.value>1e12))throw Error('UIChartScrub: valid point values required');
 const time=uiTime(frame,fps,duration),u=time/duration,p=CHART_SCRUB_PLOT;
 const positions=chartPoints({data:points.map(n=>n.value),width:p.width,height:p.height,dot:false});
 const travel=uiProgress(u,.16,.72),x=uiMix(positions[0].x,positions[positions.length-1].x,travel),y=getChartScrubCurveY(positions,x);
 let selectedIndex=0;for(let i=1;i<positions.length;i++)if(Math.abs(positions[i].x-x)<Math.abs(positions[selectedIndex].x-x))selectedIndex=i;
 const max=Math.max(...points.map(q=>q.value),1),interpolatedValue=(p.height-1-y)/(p.height-2)*max;
 const approach=uiProgress(u,.02,.14),active=uiProgress(u,.12,.16);
 const previousIndex=Math.max(0,selectedIndex-1),boundaryU=selectedIndex===0?0:.16+.56*inverseEase((selectedIndex-.5)/(points.length-1));
 const readoutProgress=selectedIndex===0?1:uiProgress(u,boundaryU,boundaryU+.025);
 return{time,u,travel,x,y,selectedIndex,selectedLabel:points[selectedIndex].label,value:points[selectedIndex].value,previousLabel:points[previousIndex].label,previousValue:points[previousIndex].value,readoutProgress,interpolatedValue,cursorX:uiMix(p.x-72,p.x+x,approach),cursorY:uiMix(p.y+p.height+65,p.y+y+23,approach),active,resultOpacity:uiProgress(u,.76,.84),plot:p};
}
const numberText=(value:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
function Readout({previous,current,progress}:{previous:string;current:string;progress:number}){
 const n=Math.max(previous.length,current.length),a=previous.padStart(n,' '),b=current.padStart(n,' ');
 return <>{Array.from(b).map((glyph,i)=><span key={i} className="mui-chart-digit" style={{width:/[,.]/.test(glyph)?'.28em':'.62em'}}>{a[i]===glyph?<span>{glyph}</span>:<><span style={{translate:`0 ${-progress*100}%`,opacity:1-progress}}>{a[i]}</span><span style={{translate:`0 ${(1-progress)*100}%`,opacity:progress}}>{glyph}</span></>}</span>)}</>;
}
export function UIChartScrub({frame,fps=60,duration=3.6,accent='#0070DB',fontFamily,content}:UIChartScrubProps){
 validateChartScrubContent(content);const s=getChartScrubState(frame,fps,duration,content.points),p=CHART_SCRUB_PLOT;
 // StillContext disables Chart's browser draw-in; the film owns every moving frame.
 return <UIFrame mechanism="ui-chart-scrub" className="mui-chart-scrub" accent={accent} fontFamily={fontFamily}>
  <div className="mui-chart-copy"><div className="mui-kicker">06 / READ THE SIGNAL</div><div className="mui-title">{content.title}</div><p className="mui-note">指到哪里，<br/>就看清哪里的变化。</p>{content.result&&<div className="mui-chart-copy-result" style={{opacity:s.resultOpacity}}><Check on={s.resultOpacity>.1} size={22}/><span>{content.result}</span></div>}</div>
  <Window title={content.chartTitle} className="mui-chart-window" style={{left:370,top:68,width:850,height:690}}>
   <div className="mui-chart-body"><div className="mui-chart-period"><span style={{translate:`0 ${-s.readoutProgress*100}%`,opacity:1-s.readoutProgress}}>{s.previousLabel}</span><span style={{translate:`0 ${(1-s.readoutProgress)*100}%`,opacity:s.readoutProgress}}>{s.selectedLabel}</span></div><div className="mui-chart-readout" data-selected-index={s.selectedIndex} aria-label={`${s.selectedLabel} ${numberText(s.value)} ${content.unit}`}><span className="mui-chart-value"><Readout previous={numberText(s.previousValue)} current={numberText(s.value)} progress={s.readoutProgress}/></span><span className="mui-chart-unit">{content.unit}</span></div><div className="mui-chart-rule"/><div className="mui-chart-context"><Text>{content.chartTitle}</Text><span>逐点查看</span></div>
    <div className="mui-chart-plot" style={{width:p.width,height:p.height}}><div className="mui-chart-guides"/><StillContext.Provider value={true}><Chart data={content.points.map(q=>q.value)} width={p.width} height={p.height} dot={false}/></StillContext.Provider><span className="mui-chart-hair" style={{left:s.x,opacity:s.active}}/><span className="mui-chart-dot" style={{left:s.x,top:s.y,opacity:s.active}}/></div>
    <div className="mui-chart-axis"><span>{content.points[0].label}</span><span>{content.points[content.points.length-1].label}</span></div><div className="mui-chart-foot"><span className="mui-chart-legend" style={{background:accent}}/>读数对应输入数据点</div>
   </div>
  </Window>
  <UIFrameCursor x={s.cursorX} y={s.cursorY} kind={s.u>.12?'crosshair':'pointer'} opacity={uiProgress(s.u,.01,.05)}/>
 </UIFrame>;
}
