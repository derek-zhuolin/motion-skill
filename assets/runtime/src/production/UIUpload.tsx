import React from 'react';
import {Window,Row,Bar,Icon,Text,Check} from '../../vendor/stageshow/kit';
import {UIFrame,UIFrameCursor,uiTime,uiProgress,uiMix,uiText,type UIFrameProps} from './ui-frame';
import './ui-upload.css';

export interface UploadContent {title:string;fileName:string;fileType:string;fileSize:string;result:string}
export interface UIUploadProps extends UIFrameProps {content:UploadContent}
const START={x:74,y:452,w:268,h:94},END={x:398,y:238,w:774,h:82},GRIP={x:36,y:40};
export function validateUploadContent(c:UploadContent){if(!c)throw Error('UIUpload: content is required');uiText(c.title,'title',24);uiText(c.fileName,'fileName',24);uiText(c.fileType,'fileType',8);uiText(c.fileSize,'fileSize',12);uiText(c.result,'result',22)}
/** The file is one persistent Row. Pickup, transport, row expansion and upload share this frame. */
export function getUploadState(frame:number,fps=60,duration=3.8){
 const time=uiTime(frame,fps,duration),u=time/duration;
 const travel=uiProgress(u,.19,.43),morph=uiProgress(u,.43,.53),slot=uiProgress(u,.34,.49),progress=uiProgress(u,.54,.78),done=uiProgress(u,.80,.85);
 const carryX=uiMix(START.x,END.x,travel),carryY=uiMix(START.y,END.y,travel)-58*Math.sin(travel*Math.PI);
 const x=carryX,y=carryY,w=uiMix(START.w,END.w,morph),h=uiMix(START.h,END.h,morph);
 const lift=uiProgress(u,.165,.19)*(1-uiProgress(u,.43,.53)),pressed=uiProgress(u,.16,.175)*(1-uiProgress(u,.43,.455));
 const approach=uiProgress(u,.055,.16),depart=uiProgress(u,.46,.57);
 const cursorX=u<.19?uiMix(START.x+180,START.x+GRIP.x,approach):uiMix(x+GRIP.x,END.x+END.w-18,depart);
 const cursorY=u<.19?uiMix(START.y+110,START.y+GRIP.y,approach):uiMix(y+GRIP.y,END.y+END.h+33,depart);
 return{time,u,x,y,w,h,travel,morph,slot,progress,done,lift,pressed,cursorX,cursorY,cursorOpacity:uiProgress(u,.035,.07)*(1-uiProgress(u,.60,.68)),over:uiProgress(u,.29,.34)*(1-uiProgress(u,.49,.54)),detailOpacity:uiProgress(u,.48,.53),resultOpacity:uiProgress(u,.84,.90),uploaded:progress===1};
}
export function UIUpload({frame,fps=60,duration=3.8,accent='#0070DB',fontFamily,content}:UIUploadProps){
 validateUploadContent(content);const s=getUploadState(frame,fps,duration);
 return <UIFrame mechanism="ui-upload" className="mui-upload" accent={accent} fontFamily={fontFamily}>
  <div className="mui-upload-copy"><div className="mui-kicker">INPUT / ASSET</div><Text className="mui-title">{content.title}</Text><p className="mui-note">从随手记录，进入素材库。</p><div className="mui-upload-result" style={{opacity:s.resultOpacity}}><Check on={s.done>.1} size={22}/><span>{content.result}</span></div></div>
  <Window title="内容素材库" className="mui-upload-window" style={{left:370,top:68,width:830,height:670}} toolbar={<span className="mui-upload-tools"><Icon name="search" size={18}/><Icon name="more" size={18}/></span>} body={{className:'mui-upload-body'}}>
   <div className="mui-upload-heading"><span><Icon name="file" size={23}/><Text>本期内容</Text></span><span className="mui-upload-subtle">名称<span>状态</span></span></div>
   <div className="mui-upload-zone" style={{background:`color-mix(in srgb,${accent} ${Math.round(5*s.over)}%,transparent)`,boxShadow:`inset 0 0 0 ${2*s.over}px ${accent}`}}/>
   <div className="mui-upload-old" style={{translate:`0 ${82*s.slot}px`}}>
    <Row lead={<Icon name="file" size={22}/>} title={<Text>选题草稿</Text>} subtitle={<Text>内容工作区</Text>} meta={<Text>已整理</Text>}/>
    <Row lead={<Icon name="file" size={22}/>} title={<Text>参考画面</Text>} subtitle={<Text>本期收集</Text>} meta={<Text>已整理</Text>}/>
    {[138,184,116,156].map((v,i)=><Row key={i} lead={<Icon name="file" size={22}/>} title={<Bar w={v} h={8} tone={2}/>} subtitle={<Bar w={v-34} h={6} tone={1}/>} meta={<Bar w={53+i*3} h={6} tone={1}/>}/>)}
   </div>
  </Window>
  <Row className="mui-upload-file" data-object="uploaded-file" lead={<span className="mui-upload-file-icon" style={{background:`color-mix(in srgb,${accent} 10%,white)`,color:accent}}><Icon name="file" size={27}/></span>} title={<Text>{content.fileName}</Text>} subtitle={<Text>{`${content.fileType} · ${content.fileSize}`}</Text>} meta={<div className="mui-upload-status" style={{opacity:s.detailOpacity,width:205*s.morph,overflow:'hidden'}}><div className="mui-upload-progress" style={{opacity:1-uiProgress(s.u,.77,.80)}}><span className="mui-upload-track"><span style={{width:`${100*s.progress}%`,background:accent}}/></span><span>{Math.round(100*s.progress)}%</span></div><span className="mui-upload-done" style={{opacity:s.done}}><Check on={s.done>.1} size={20}/><Text>已就绪</Text></span></div>} style={{position:'absolute',left:s.x,top:s.y,width:s.w,height:s.h,zIndex:20,scale:1+.025*s.lift,rotate:`${-1.5*s.lift}deg`,transformOrigin:`${GRIP.x}px ${GRIP.y}px`,boxShadow:`0 ${3+12*s.lift}px ${12+21*s.lift}px #203a5726`,borderColor:`color-mix(in srgb,${accent} ${Math.round(18+8*s.over)}%,#e2e8ef)`,background:s.done>.01?'#fff':`color-mix(in srgb,${accent} ${Math.round(5*s.morph)}%,white)`}}/>
  <UIFrameCursor x={s.cursorX} y={s.cursorY} pressed={s.pressed} opacity={s.cursorOpacity} kind={s.u>=.19&&s.u<.43?'grab':s.u>=.14&&s.u<.19?'open':'pointer'}/>
 </UIFrame>;
}
