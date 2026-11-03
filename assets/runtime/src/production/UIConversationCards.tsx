import React from 'react';
import {Window,Field,Check,Text,Icon,Badge} from '../../vendor/stageshow/kit';
import {UIFrame,UIFrameCursor,uiTime,uiProgress,uiMix,uiText,type UIFrameProps} from './ui-frame';
import './UIConversationCards.css';
export interface ConversationCardsContent {title:string;prompt:string;question:string;choices:readonly [string,string,string];selectedIndex?:number;answer:string;result:string}
export function validateConversationCardsContent(c:ConversationCardsContent){if(!c)throw Error('UIConversationCards: explicit content required');uiText(c.title,'title',24);uiText(c.prompt,'prompt',44);uiText(c.question,'question',28);uiText(c.answer,'answer',36);uiText(c.result,'result',16);if(!Array.isArray(c.choices)||c.choices.length!==3)throw Error('UIConversationCards: choices must contain exactly three labels');c.choices.forEach((v,i)=>uiText(v,`choices[${i}]`,22));if(new Set(c.choices.map(x=>x.trim())).size!==3)throw Error('UIConversationCards: choices must be distinct');const pick=c.selectedIndex??1;if(!Number.isInteger(pick)||pick<0||pick>2)throw Error('UIConversationCards: selectedIndex must be 0, 1 or 2')}
/** The conversation retains the answered card while the next answer grows in its own lane. */
export function getConversationCardsState(frame:number,fps=60,duration=4.9){const t=uiTime(frame,fps,duration),u=t/duration;return{t,u,question:uiProgress(u,.04,.14),choices:uiProgress(u,.15,.29),chosen:uiProgress(u,.35,.39),search:uiProgress(u,.4,.44)*(1-uiProgress(u,.5,.54)),answer:uiProgress(u,.49,.65),confirmPress:uiProgress(u,.72,.75)*(1-uiProgress(u,.79,.82)),done:uiProgress(u,.82,.88)}}
export function UIConversationCards({frame,fps=60,duration=4.9,accent='#0070DB',fontFamily='InterflowCN, sans-serif',content}:{content:ConversationCardsContent}&UIFrameProps){
 validateConversationCardsContent(content);const s=getConversationCardsState(frame,fps,duration),selected=content.selectedIndex??1;
 const promptH=Math.max(66,Math.ceil(Array.from(content.prompt).length/26)*35+34),questionTop=promptH+20,choicesTop=questionTop+46;
 const choiceH=184*s.choices,answerTop=choicesTop+choiceH+18,answerH=210*s.answer,totalH=answerTop+answerH,scroll=Math.max(0,totalH-478);
 const choicePoint={x:370+26+710,y:68+38+24+choicesTop+selected*59+27-scroll};
 const confirm={x:370+26+380,y:68+38+24+answerTop+177-scroll};
 const cursorProgress=uiProgress(s.u,.66,.72),cursor={x:uiMix(choicePoint.x,confirm.x,cursorProgress),y:uiMix(choicePoint.y,confirm.y,cursorProgress)};
 const choicePress=uiProgress(s.u,.32,.35)*(1-uiProgress(s.u,.39,.42));
 return <UIFrame className="mui-chat" mechanism="ui-conversation-cards" accent={accent} fontFamily={fontFamily}>
  <div className="mui-chat-copy"><div className="mui-kicker">03 / DECIDE</div><div className="mui-title">{content.title}</div><p className="mui-note">先聊清一个方向。</p><div className="mui-chat-copy-result" style={{opacity:s.done}}><Check on={s.done>.1} size={22}/><span>{content.result}</span></div></div>
  <Window title="创作对话" className="mui-chat-window" style={{left:370,top:68,width:830,height:670}}>
   <div className="mui-chat-body">
    <div className="mui-chat-thread">
     <div className="mui-chat-content" style={{translate:`0 ${-scroll}px`}}>
      <div className="mui-chat-prompt" data-object="idea-prompt" style={{minHeight:promptH}}><Text>{content.prompt}</Text></div>
      <div className="mui-chat-question" style={{top:questionTop,opacity:s.question,translate:`0 ${8*(1-s.question)}px`}}><Text>{content.question}</Text></div>
      <div className="mui-chat-choices" data-object="answered-choice-card" style={{top:choicesTop,height:choiceH,opacity:s.choices}}>
       {content.choices.map((label,i)=><div key={label} className="mui-chat-choice" data-selected={s.chosen>.5&&i===selected||undefined} style={{top:i*59,background:s.chosen>.01&&i===selected?`color-mix(in srgb,${accent} ${Math.round(s.chosen*10)}%,white)`:'#f7f9fc',borderColor:s.chosen>.01&&i===selected?`color-mix(in srgb,${accent} ${Math.round(s.chosen*27)}%,#e4e9f0)`:'#e4e9f0'}}><span className="mui-chat-choice-number">{String(i+1).padStart(2,'0')}</span><Text>{label}</Text><span className="mui-chat-choice-mark" style={{opacity:i===selected?s.chosen:0}}><Check on={s.chosen>.1&&i===selected} size={22}/></span></div>)}
      </div>
      <div className="mui-chat-thinking" style={{top:answerTop+5,opacity:s.search}}><Icon name="search" size={18}/><span>正在整理方向</span></div>
      <div className="mui-chat-answer" data-object="selected-direction" style={{top:answerTop,height:answerH,opacity:s.answer,clipPath:`inset(0 0 ${(1-s.answer)*100}% 0)`}}>
       <Text className="mui-chat-answer-line">{content.answer}</Text>
       <div className="mui-chat-task-card"><span className="mui-chat-task-icon"><Icon name="file" size={25}/></span><div><span className="mui-chat-task-kicker">确定的下一步</span><Text className="mui-chat-task-title">{content.choices[selected]}</Text></div><Badge tone="accent">任务</Badge></div>
       <div className="mui-chat-confirm" data-object="confirmed-direction" style={{background:s.done>.01?'#edf6ee':accent,color:s.done>.01?'#347144':'#fff',scale:1-.02*s.confirmPress}}><span style={{opacity:1-uiProgress(s.u,.76,.82)}}><Icon name="check" size={20}/><Text>采用这个方向</Text></span><span style={{opacity:s.done}}><Check on={s.done>.1} size={23}/><Text>{content.result}</Text></span></div>
      </div>
     </div>
    </div>
    <Field className="mui-chat-composer" value="" placeholder="继续补充你的想法" trailing={<Icon name="arrow" size={22}/>} />
   </div>
  </Window>
  <UIFrameCursor x={cursor.x} y={cursor.y} kind={s.u>.68?'pointer':'hand'} pressed={choicePress+s.confirmPress} opacity={uiProgress(s.u,.28,.32)*(1-uiProgress(s.u,.9,.96))}/>
 </UIFrame>
}
