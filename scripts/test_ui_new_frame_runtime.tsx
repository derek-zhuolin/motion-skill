/** Public API/state/SSR regressions. Actual pixels and playback are checked separately. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {UIPresence,getPresenceState,validatePresenceContent} from '../assets/runtime/src/production/UIPresence';
import {UIChartScrub,getChartScrubState} from '../assets/runtime/src/production/UIChartScrub';
import {UIUpload,getUploadState} from '../assets/runtime/src/production/UIUpload';
import {UIAggregate,getAggregateState} from '../assets/runtime/src/production/UIAggregate';

let checks=0;
const ok=(condition:boolean,note:string)=>{if(!condition)throw Error(note);checks++};
const rejects=(run:()=>unknown,note:string)=>{let rejected=false;try{run()}catch{rejected=true}ok(rejected,note)};
const near=(a:number,b:number)=>Math.abs(a-b)<1e-6;
const normalized=(state:unknown)=>JSON.stringify(state,(_key,value)=>typeof value==='number'?Math.round(value*1e6)/1e6:value);
const points=[{label:'第一段',value:12},{label:'第二段',value:27},{label:'第三段',value:18},{label:'第四段',value:42}];
const presence={title:'一起把方向讲清楚',documentTitle:'一段散步录音',body:'先留住一个具体发现，再把它做成一个短版本。',focusText:'只讲清一个发现',result:'剪成60秒小片',collaborators:[{name:'剪辑',color:'#c15389'},{name:'策划',color:'#268a7c'}] as const};
const cases=[
 {C:UIPresence,id:'ui-presence',duration:3.8,content:presence,needle:'一段散步录音',state:(f:number,fps:number,d:number)=>getPresenceState(f,fps,d,300)},
 {C:UIChartScrub,id:'ui-chart-scrub',duration:3.6,content:{title:'读清变化',chartTitle:'可用片段',unit:'秒',points,result:'保留最清楚的一段'},needle:'可用片段',state:(f:number,fps:number,d:number)=>getChartScrubState(f,fps,d,points)},
 {C:UIUpload,id:'ui-upload',duration:3.8,content:{title:'把录音放进来',fileName:'散步录音.m4a',fileType:'音频',fileSize:'3.2 MB',result:'已进入素材库'},needle:'散步录音.m4a',state:getUploadState},
 {C:UIAggregate,id:'ui-aggregate',duration:3.7,content:{title:'让一个想法进入整体',listTitle:'本期内容库',itemTitle:'剪成60秒小片',itemDetail:'来自一段散步录音',metricLabel:'可用内容',unit:'条',baseValue:12,increment:1,result:'本次已计入'},needle:'剪成60秒小片',state:(f:number,fps:number,d:number)=>getAggregateState(f,fps,d,12,1)},
];
for(const c of cases){
 const C=c.C as any;
 for(const seconds of [0,c.duration*.5,c.duration]){
  const html=renderToStaticMarkup(<C frame={seconds*60} fps={60} duration={c.duration} content={c.content}/>);
  ok(html.includes(`data-mechanism="${c.id}"`)&&html.includes(c.needle),`${c.id}: real component or supplied content missing from SSR`);
 }
 rejects(()=>renderToStaticMarkup(<C frame={0} content={undefined}/>),`${c.id}: missing content accepted`);
 const sought=c.state(.58*c.duration*60,60,c.duration);
 c.state(c.duration*60,60,c.duration);c.state(0,60,c.duration);
 ok(JSON.stringify(sought)===JSON.stringify(c.state(.58*c.duration*60,60,c.duration)),`${c.id}: reverse seeking retained playback history`);
 rejects(()=>c.state(20,0,c.duration),`${c.id}: zero fps accepted`);
 const alternateDuration=c.duration*.8;
 ok(normalized(c.state(.58*alternateDuration*24,24,alternateDuration))===normalized(c.state(.58*alternateDuration*60,60,alternateDuration)),`${c.id}: equivalent time changes with fps`);
 rejects(()=>renderToStaticMarkup(<C frame={0} content={{...c.content,title:'长'.repeat(25)}}/>),`${c.id}: unreadable long title accepted`);
 rejects(()=>c.state(20,60,NaN),`${c.id}: invalid duration accepted`);
}

const selected=getPresenceState(1.4*60,60,3.8,300);
ok(near(selected.first.x,selected.selectionEdge), 'presence: peer tip no longer meets the live selection edge');
let unicodeAccepted=true;try{validatePresenceContent({...presence,focusText:'🙂'.repeat(22)})}catch{unicodeAccepted=false}
ok(unicodeAccepted,'presence: Unicode code-point limit incorrectly counts surrogate pairs');

const scrub=getChartScrubState(1.6*60,60,3.6,points);
ok(scrub.value===points[scrub.selectedIndex].value&&scrub.selectedLabel===points[scrub.selectedIndex].label,'chart: readout invents a data point');
ok(near(scrub.cursorX,scrub.plot.x+scrub.x)&&near(scrub.cursorY,scrub.plot.y+scrub.y+23),'chart: marker and pointer diverge');
const flat=getChartScrubState(1.6*60,60,3.6,[{label:'A',value:7},{label:'B',value:7},{label:'C',value:7}]);
ok(near(flat.y,1)&&flat.value===7,'chart: flat input produces a false change');
const chartEnd=getChartScrubState(99999,60,3.6,points);
ok(chartEnd.selectedIndex===points.length-1&&chartEnd.value===42,'chart: final supplied point is not retained');

for(const fraction of [.26,.40]){
 const file=getUploadState(fraction*3.8*60,60,3.8);
 ok(near(file.cursorX-file.x,36)&&near(file.cursorY-file.y,40),'upload: carried file slips beneath its grab point');
}
const carried=getUploadState(.42*3.8*60,60,3.8),uploadEnd=getUploadState(99999,60,3.8);
ok(carried.progress===0&&carried.done===0&&uploadEnd.uploaded&&uploadEnd.progress===1&&uploadEnd.done===1,'upload: completion does not follow transport and progress');

const beforeLanding=getAggregateState(.50*3.7*60,60,3.7,12,3),afterLanding=getAggregateState(.60*3.7*60,60,3.7,12,3);
ok(!beforeLanding.landed&&beforeLanding.value===12&&afterLanding.landed&&afterLanding.value>12,'aggregate: dependent total changes before its object lands');
const aggregateEnd=getAggregateState(99999,60,3.7,12,3);
ok(aggregateEnd.value===15&&aggregateEnd.landed,'aggregate: final total is not base plus the supplied contribution');
ok(getAggregateState(99999,60,3.7,0,0).value===0,'aggregate: valid zero is lost or replaced');

console.log(JSON.stringify({status:'passed',checks,scope:'public API, seek determinism, causal state, data identity and server markup; pixels checked separately'}));
