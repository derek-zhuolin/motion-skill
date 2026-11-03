/** Renderer-independent API/markup checks. Pixel acceptance uses real renders. */
import React from 'react';import{renderToStaticMarkup}from'react-dom/server';
import{UISwipeArchive,getSwipeArchiveState}from'../assets/runtime/src/production/UISwipeArchive';
import{UIFreeDrag,getFreeDragState}from'../assets/runtime/src/production/UIFreeDrag';
import{UIPhoneExpand,getPhoneExpandState}from'../assets/runtime/src/production/UIPhoneExpand';
import{UIConversationCards,getConversationCardsState}from'../assets/runtime/src/production/UIConversationCards';
let checks=0;const ok=(condition:boolean,note:string)=>{if(!condition)throw Error(note);checks++};
const cases=[{C:UISwipeArchive,id:'ui-swipe-archive',duration:3.4,content:{title:'先留一个',discardTitle:'支线',discardDetail:'先放一边',keepTitle:'一段散步录音',keepDetail:'继续展开',result:'保留这个'}},{C:UIPhoneExpand,id:'ui-phone-expand',duration:3.7,content:{title:'展开看',cardTitle:'一段散步录音',cardSubtitle:'随手记录',detail:'一个具体发现',result:'带着选题继续聊'}},{C:UIConversationCards,id:'ui-conversation-cards',duration:4.9,content:{title:'聊出下一步',prompt:'录音可以怎么做？',question:'先做哪个？',choices:['剪成60秒小片','整理图文','保留录音'],selectedIndex:0,answer:'先讲一个发现',result:'选好了'}},{C:UIFreeDrag,id:'ui-free-drag',duration:4.4,content:{title:'排进日程',task:'剪成60秒小片',subtitle:'选中的下一步',result:'已安排'}}];
for(const c of cases){const C=c.C as any;for(const seconds of [0,c.duration*.5,c.duration]){const html=renderToStaticMarkup(<C frame={seconds*60} fps={60} duration={c.duration} content={c.content}/>);ok(html.includes(`data-mechanism="${c.id}"`),c.id+' not actually rendered');ok(html.includes(c.id==='ui-free-drag'?'剪成60秒小片':c.id==='ui-conversation-cards'?'录音可以怎么做':'一段散步录音'),c.id+' loses content')}
let rejected=false;try{renderToStaticMarkup(<C frame={0} content={undefined}/>)}catch{rejected=true}ok(rejected,c.id+' missing content not rejected')}
const end=getSwipeArchiveState(204,60,3.4);ok(end.close===1&&end.dx<-400,'archive does not leave/close gap');
const handA=getSwipeArchiveState((.46*3.4-1e-5)*60,60,3.4),handB=getSwipeArchiveState(.46*3.4*60,60,3.4),handC=getSwipeArchiveState((.46*3.4+1e-5)*60,60,3.4);ok(Math.abs((handB.dx-handA.dx)/1e-5-(handC.dx-handB.dx)/1e-5)<1,'release loses velocity');
for(const duration of [2.8,4.4,6.2]){const s=getFreeDragState(duration*60,60,duration);ok(s.landed&&Math.abs(s.x-813)<.01&&Math.abs(s.y-181)<.01,'drag end missing target');ok(Number.isInteger(s.targetCol)&&Number.isInteger(s.targetRow),'grid target is not a slot')}
ok(getPhoneExpandState(222,60).open===1&&getPhoneExpandState(222,60).done===1,'phone detail incomplete');ok(getPhoneExpandState(-20,60).open===0,'negative frame does not clamp');ok(getConversationCardsState(294,60).done===1,'conversation result incomplete');
for(const get of [getSwipeArchiveState,getFreeDragState,getPhoneExpandState,getConversationCardsState]){let rejected=false;try{get(20,0)}catch{rejected=true}ok(rejected,'invalid fps accepted')}
console.log(JSON.stringify({status:'passed',checks,scope:'API, state, input and server markup; pixels separately rendered'}));
