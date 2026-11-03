import React,{useLayoutEffect,useRef,useState} from 'react';
import {Stage,Window,Field,Row,Badge,Check,Text,Icon,Bar} from '../../vendor/stageshow/kit';
import {Cursor,type CursorKind} from '../../vendor/stageshow/kit/cursor';
import {type ProductUIStory,type ProductUITiming,PRODUCT_UI_TIMINGS,productUIState,validateProductUIStory,validateProductUITiming,progress,pulse,mix,clamp} from './product-ui';
export {PRODUCT_UI_TIMINGS,getProductUIState,validateProductUIStory,validateProductUITiming} from './product-ui';
export type {ProductUIStory,ProductUITiming} from './product-ui';
import './product-ui.css';

// The movie's frame is the only animation clock. Kit atoms retain their
// markup and geometry; local authored layout and transforms own choreography.
type Point={x:number;y:number};
type Targets=Partial<Record<'create'|'grip'|'share'|'send',Point>>;
const INITIAL={};
function cursorAt(t:number,drag:number,windowX:number,windowW:number,targets:Targets,timing:ProductUITiming):{at:Point;kind:CursorKind;press:number;opacity:number}{
 const create=targets.create??{x:windowX+windowW-170,y:504};
 const grip=targets.grip??{x:windowX+windowW-102,y:578-172*drag};
 const share=targets.share??{x:windowX+windowW-64,y:113};
 const send=targets.send??{x:windowX+windowW-237,y:425};
 const besideGrip={x:grip.x+35,y:grip.y+42};
 let at={x:windowX+windowW-76,y:626},kind:CursorKind='pointer',press=0;
 const between=(a:Point,b:Point,p:number)=>({x:mix(a.x,b.x,p),y:mix(a.y,b.y,p)});
 if(t<timing.toList[0]){at=between({x:create.x+150,y:create.y+100},create,progress(t,timing.createMove));press=pulse(t,timing.createPress);}
 else if(t<timing.dragApproach[0]){at=between(create,{x:grip.x+48,y:grip.y+40},progress(t,timing.toList));}
 else if(t<timing.drop){at=between({x:grip.x+48,y:grip.y+40},grip,progress(t,timing.dragApproach));if(t>=timing.grab){at=grip;kind='grab';press=1}else if(t>=timing.openHandAt)kind='open';}
 else if(t<timing.shareApproach[0]){at=between(grip,besideGrip,progress(t,timing.afterDropMove));}
 else if(t<timing.toSend[0]){at=between(besideGrip,share,progress(t,timing.shareApproach));press=pulse(t,timing.sharePress);}
 else if(t<timing.leaveSend[0]){at=between(share,send,progress(t,timing.toSend));press=pulse(t,timing.sendPress);}
 else at=between(send,{x:send.x+175,y:send.y+105},progress(t,timing.leaveSend));
 return{at,kind,press,opacity:progress(t,timing.cursorIn)*(1-progress(t,timing.cursorOut))};
}
export function ProductUIFilm({frame,fps=60,story,timing=PRODUCT_UI_TIMINGS.brisk,accent='#0070DB',fontFamily='InterflowCN, sans-serif'}:{frame:number;fps?:number;story:ProductUIStory;timing?:ProductUITiming;accent?:string;fontFamily?:string}){
 validateProductUIStory(story);validateProductUITiming(timing);
 const label=story.label??'发布计划';
 const windowTitle=story.windowTitle??label;
 const root=useRef<HTMLDivElement>(null),[targets,setTargets]=useState<Targets>({});
 // Geometry measurement is synchronous layout work, not an animation clock.
 // Normalize back to the 1280px film space, including when Player is scaled.
 useLayoutEffect(()=>{const host=root.current;if(!host)return;const r=host.getBoundingClientRect();if(!r.width)return;const k=1280/r.width,next:Targets={};for(const [key,name] of [['create','create'],['grip','grip-2'],['share','share'],['send','send']] as const){const el=host.querySelector(`[data-target="${name}"]`);if(!el)continue;const box=el.getBoundingClientRect();if(box.width&&box.height)next[key]={x:(box.left+box.width/2-r.left)*k,y:(box.top+box.height/2-r.top)*k}}setTargets(old=>JSON.stringify(old)===JSON.stringify(next)?old:next)},[frame,story,timing,accent,fontFamily]);
 const s=productUIState(frame,fps,timing),t=s.t;
 const expansion=s.list,wx=mix(184,72,expansion),ww=mix(912,1136,expansion),wy=mix(92,94,expansion);
 const enter=progress(t,timing.enter),formOut=progress(t,timing.formOut),listIn=progress(t,timing.listIn);
 const letters=Array.from(story.title),typed=letters.slice(0,Math.floor(letters.length*s.input)).join('');
 const lift=progress(t,timing.lift)*(1-progress(t,timing.settle));
 // Slot crossings move the neighbors only after the lifted row passes them.
 const second=progress(t,timing.neighborSecond),first=progress(t,timing.neighborFirst);
 const ordered=t>=timing.drop;
 const release=clamp((t-timing.drop)/(timing.settle[1]-timing.drop));
 const releaseNudge=2.5*Math.sin(release*Math.PI*2)*Math.exp(-4*release)*(1-release);
 const cy=[0+86*first,86+86*second,172-172*s.drag+releaseNudge];
 const popRaw=clamp((t-timing.shareOpen[0])/(timing.shareOpen[1]-timing.shareOpen[0]));
 const popBack=1+2.7*(popRaw-1)**3+1.7*(popRaw-1)**2;
 const cursor=cursorAt(t,s.drag,wx,ww,targets,timing);
 const sendProgress=progress(t,[timing.sending,timing.sent]);
 return <div ref={root} className="fusion-film" data-frame={frame} data-mechanism="stageshow-ui-flow" data-ui-adapter="stageshow-frame-v2" data-timing={timing.name} style={{fontFamily}}>
  <Stage width={1280} height={720} initial={INITIAL} className="fusion-stage" accent={accent} tokens={{'--ss-font':fontFamily,'--ss-accent':accent,'--ss-accent-2':accent}}>
   {()=> <>
    <div className="fusion-overline" style={{opacity:enter}}>{story.headline??story.heading??'一个想法，变成团队的下一步。'}</div>
    <Window title={windowTitle} className="fusion-window" style={{left:wx,top:wy+mix(24,0,enter),width:ww,height:710,opacity:enter}}
      toolbar={<div className="fusion-toolbar" style={{opacity:listIn}}><span className="fusion-share-trigger" data-target="share" data-open={s.share>.01||undefined} style={{background:s.share>.01?`color-mix(in srgb,${accent} 10%,white)`:'#f0f3f7'}}><Icon name="send" size={16}/><Text>分享</Text></span></div>}
      body={{className:'fusion-body'}}>
     <div className="fusion-form" style={{opacity:1-formOut,translate:`0 ${-24*formOut}px`,pointerEvents:'none'}}>
      <div className="fusion-form-kicker">新的内容，先有一个计划。</div>
      <Text className="fusion-form-heading">{`创建${label}`}</Text>
      <div className="fusion-field-wrap">
       <Field className="fusion-title-field" label="计划名称" value={typed} placeholder="给这个计划起个名字" focused={t>=timing.typing[0]-.15&&t<timing.createPress[0]} status={s.created?'valid':undefined} box={{'data-target':'project-name'}}/>
       <span className="fusion-field-hint">{story.hint??'把需要一起推进的事情，放在同一个地方。'}</span>
      </div>
      <div className="fusion-form-bottom">
       <div className="fusion-preview"><span className="fusion-preview-label">接下来</span><span>整理任务，安排优先级</span></div>
       <span className="fusion-create" data-target="create" style={{scale:1-.025*cursor.press,background:accent}}><span className="fusion-create-labels"><Text style={{opacity:1-progress(t,timing.createLabel)}}>创建计划</Text><Text style={{opacity:progress(t,timing.createLabel)}}>计划已创建</Text></span><Icon name={s.created?'check':'arrow'} size={20}/></span>
      </div>
      <div className="fusion-form-foot"><Icon name="lock" size={14}/><span>创建后可与团队共享</span></div>
     </div>
     <div className="fusion-project" style={{opacity:listIn,translate:`0 ${16*(1-listIn)}px`}}>
      <div className="fusion-project-kicker"><span>内容计划</span><Icon name="chevron-right" size={14}/><span>进行中</span></div>
      <Text className="fusion-project-heading">{story.title}</Text>
      <div className="fusion-project-meta"><span>{story.tasks.length} 项任务</span><span className="fusion-meta-divider"/><span>按优先级推进</span></div>
      <div className="fusion-list-head"><Text>任务清单</Text><span>{ordered?'已调整顺序':'拖动右侧把手调整顺序'}</span></div>
      <div className="fusion-list">
       {story.tasks.map((task,i)=>{
        const dragged=i===2,active=dragged&&lift>.001;
        return <div key={task} className="fusion-slot" data-object={`task-${i}`} style={{translate:`${active?8*s.drag:0}px ${cy[i]}px`,zIndex:active?3:1,scale:1+.018*(active?lift:0),rotate:dragged?`${-.55*lift}deg`:undefined}}>
         <Row className="fusion-task-row" pad={16} lead={<Check on={false} size={24}/>} title={<Text>{task}</Text>}
          style={{boxShadow:active?`0 ${10*lift}px ${28*lift}px ${-5*lift}px #243b6833`:'none',background:active?'#fff':dragged&&ordered?`color-mix(in srgb,${accent} 6%,white)`:'#fafbfc',borderColor:dragged&&ordered?`color-mix(in srgb,${accent} 16%,white)`:'#edf0f4'}}>
          <div className="fusion-row-end"><Badge tone={dragged&&ordered?'accent':'neutral'}>{dragged&&ordered?'优先':'待开始'}</Badge><span className="fusion-grip" data-target={`grip-${i}`}><Icon name="grip" size={20}/></span></div>
         </Row>
        </div>
       })}
      </div>
      <div className="fusion-add-row"><Icon name="plus" size={19}/><span>添加任务</span></div>
      <div className="fusion-project-footer"><span className="fusion-save-indicator"><Icon name="check" size={14}/><span>更改已保存</span></span><span>团队空间内可见</span></div>
     </div>
    </Window>
    <div className="fusion-share-pop" data-target="share-panel" style={{left:wx+ww-418,top:145,width:362,opacity:s.share,translate:`0 ${12*(1-popBack)}px`,visibility:s.share>0?'visible':'hidden'}}>
     <div className="fusion-pop-title"><Text>分享计划</Text><Icon name="lock" size={16}/></div>
     <div className="fusion-pop-project">{story.title}</div>
     <div className="fusion-pop-rule"/>
     <div className="fusion-pop-label">发送到</div>
     <div className="fusion-audience"><span className="fusion-audience-icon"><Icon name="user" size={17}/></span><Text>{story.audience}</Text><Icon name="chevron-down" size={16}/></div>
     <div className="fusion-pop-summary"><span>{story.tasks.length} 项任务</span><Badge tone="neutral">可查看与编辑</Badge></div>
     <div className="fusion-send-button" data-target="send" style={{background:s.sent?'#edf7ee':accent,color:s.sent?'#28733b':'#fff'}}>
      <span className="fusion-send-idle" style={{opacity:1-sendProgress}}><Icon name="send" size={18}/><Text>{s.sending?'正在发送…':'发送给团队'}</Text></span>
      <span className="fusion-send-done" style={{opacity:s.ending,translate:`0 ${4*(1-s.ending)}px`}}><Check on={s.sent} size={19}/><Text>{story.result}</Text></span>
     </div>
     <div className="fusion-pop-confirm" style={{opacity:s.ending}}><Text>{`${story.audience} · ${story.tasks.length} 项任务`}</Text></div>
    </div>
    <div className="fusion-cursor" data-pressed={cursor.press>.5||undefined} style={{left:cursor.at.x,top:cursor.at.y,opacity:cursor.opacity,scale:1-.08*cursor.press}}><Cursor cursorRef={null} kind={cursor.kind} style="large"/></div>
    <div className="fusion-film-note">演示数据 · 无真实提交</div>
   </>}
  </Stage>
 </div>
}
