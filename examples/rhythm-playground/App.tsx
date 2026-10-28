import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player,PlayerRef} from '@remotion/player';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {ClaySurface,defaultTheme} from '../../assets/runtime/src/production/Mechanisms';
import {createRhythmScore,cueProgress,sampleRhythmCamera} from '../../assets/runtime/src/production/rhythm';
import './style.css';

declare const __MOTION_BUILD_ID__:string;
const DURATION=12,FPS=30;
const themes={...defaultTheme,blue:'#0070DB',chinese:'system-ui',latin:'system-ui'};
const schedules={
 rhythm:[0,.52,1.03,1.55,2.07,2.59,3.10,3.62,4.14,4.66,5.69,6.21,7.24,8.28,9.31,10.34,11.38,12],
 even:[0,.71,1.42,2.13,2.84,3.55,4.26,4.97,5.68,6.39,7.10,7.81,8.52,9.23,9.94,10.65,11.36,12],
};
const names=['start','reveal','wide','prepare','send0','land0','send1','land1','send2','land2','hold','inspect','focus','read','release','wideAgain','settle','end'];
const scores=Object.fromEntries(Object.entries(schedules).map(([name,times])=>[name,createRhythmScore(DURATION,times.map((at,i)=>({id:names[i],at,source:name==='rhythm'?'music-onset':'editorial',note:'Authored against the synthetic test groove; not automatic beat detection.'})))]));
const variants={invoice:{name:'发票录入',source:'电子发票 · 示例',destination:'报销表',labels:['抬头','金额','日期'],values:['示例工作室','¥ 420.00','28 / ??']},inventory:{name:'库存整理',source:'到货单 · 示例',destination:'库存表',labels:['物品','数量','批次'],values:['蓝色样品','24 件','B / ??']}};
type Props={rhythm:boolean;sound:boolean;variant:keyof typeof variants};
const key=(event:string,value:number)=>({event,value});
function Demo({rhythm,sound,variant}:Props){
 const t=useCurrentFrame()/useVideoConfig().fps,score=scores[rhythm?'rhythm':'even'],data=variants[variant];
 const p=(a:string,b:string)=>cueProgress(t,score,a,b);
 const camera=sampleRhythmCamera(t,score,{
  x:[key('start',340),key('wide',640),key('hold',640),key('focus',890),key('read',890),key('wideAgain',640),key('end',640)],
  y:[key('start',350),key('wide',360),key('focus',390),key('read',390),key('wideAgain',360),key('end',360)],
  scale:[key('start',1.28),key('wide',1),key('hold',1),key('focus',1.16),key('read',1.16),key('wideAgain',1),key('end',1)],
 },{x:640,y:360,scale:1},{enabled:rhythm});
 const inspect=p('inspect','focus'),release=p('release','wideAgain');
 return <AbsoluteFill style={{background:'#eaf1f8',fontFamily:'system-ui',overflow:'hidden'}}>
  {sound&&<Audio src={staticFile('test-groove.wav')} volume={.75}/>}
  <svg viewBox="0 0 1280 720" width="1280" height="720" data-demo-variant={variant} style={{position:'absolute',inset:0}}>
   <g transform={`translate(640 360) scale(${camera.scale}) translate(${-camera.x} ${-camera.y})`}>
    <g opacity={1-inspect*.7}>
     <ClaySurface theme={themes} volume={.55} node={{id:'source-paper',x:330,y:340,width:325,height:370,rotation:0,depth:16,tone:'paper',children:null}}/>
     <text x="201" y="213" fontSize="20" fill="#6d8196">{data.source}</text>
     <text x="201" y="257" fontSize="30" fontWeight="700" fill="#16212c">{data.name}</text>
     <path d="M201 283h252" stroke="#d4dfe9" strokeWidth="2"/>
    </g>
    <g opacity={p('reveal','wide')}>
     <text x="732" y="231" fontSize="28" fontWeight="700" fill="#16212c">{data.destination}</text>
     {[0,1,2].map(i=><g key={i}><rect x="710" y={276+i*70} width="350" height="55" rx="15" fill="#dce8f3" stroke="#c5d5e4"/><text x="733" y={310+i*70} fontSize="19" fill="#7c93a8">{data.labels[i]}</text></g>)}
    </g>
    {[0,1,2].map(i=>{
     const a=p(`send${i}`,`land${i}`),x=210+(830-210)*a,y=310+i*70-62*Math.sin(a*Math.PI),uncertain=i===2;
     return <g key={i} data-field={i} data-state={a===1?'landed':'moving'} transform={`translate(${x} ${y})`}>
      <rect width="218" height="43" y="-27" rx="12" fill={uncertain&&a>.98?'#fff2ed':a>.98?'#fff':'#e1ecf6'} stroke={uncertain&&a>.98?'#e87660':'#d3e0eb'} strokeWidth="1.5"/>
      <text x="16" y="1" fontSize="21" fontWeight="650" fill={uncertain&&a>.98?'#be5948':'#20374a'}>{data.values[i]}</text>
      {a>0&&a<1&&<path d="M-23-8h-31" stroke="#0070DB" strokeWidth="3" strokeLinecap="round"/>}
     </g>;
    })}
    <g opacity={inspect*(1-release)}>
     <rect x="814" y="406" width="248" height="76" rx="20" fill="none" stroke="#e87660" strokeWidth="3"/>
     <path d="M1062 444h28" fill="none" stroke="#e87660" strokeWidth="2"/>
     <rect x="1090" y="418" width="177" height="52" rx="14" fill="#fff"/>
     <text x="1178" y="451" textAnchor="middle" fontSize="22" fontWeight="650" fill="#be5948">核对原件</text>
     <circle cx="800" cy="445" r="7" fill="#e87660"/>
    </g>
    <g opacity={p('settle','end')}><rect x="741" y="511" width="270" height="43" rx="14" fill="#dce8f3"/><text x="876" y="539" fontSize="18" textAnchor="middle" fill="#526e89">疑点保留，不冒充完成</text></g>
   </g>
   <text x="640" y="657" textAnchor="middle" fontSize="25" fill="#20374a" fontWeight="600">{t<score.events.send0?'先看资料，再进入任务':t<score.events.inspect?'让字段完成交接':t<score.events.release?'疑点出现，镜头停下来':'回到全貌，保留待核对项'}</text>
  </svg>
 </AbsoluteFill>;
}
function App(){
 const [buildId,setBuildId]=useState('checking');
 useEffect(()=>{let live=true;fetch('./build.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('missing');return r.json();}).then(data=>{if(live)setBuildId(data.buildId===__MOTION_BUILD_ID__?data.buildId.slice(0,12):'stale · 请重新构建并刷新');}).catch(()=>{if(live)setBuildId('unavailable');});return()=>{live=false;};},[]);
 const ref=useRef<PlayerRef>(null);const[rhythm,setRhythm]=useState(true),[sound,setSound]=useState(true),[variant,setVariant]=useState<keyof typeof variants>('invoice'),[frame,setFrame]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{const p=ref.current;if(!p)return;const sync=()=>setFrame(p.getCurrentFrame()),play=()=>setPlaying(true),pause=()=>setPlaying(false);p.addEventListener('frameupdate',sync);p.addEventListener('seeked',sync);p.addEventListener('play',play);p.addEventListener('pause',pause);p.addEventListener('ended',pause);return()=>{p.removeEventListener('frameupdate',sync);p.removeEventListener('seeked',sync);p.removeEventListener('play',play);p.removeEventListener('pause',pause);p.removeEventListener('ended',pause);};},[]);
 const toggle=()=>{const p=ref.current;if(!p)return;if(p.isPlaying())p.pause();else{if(p.getCurrentFrame()>=359)p.seekTo(0);p.play();}};
 return <main><header><span className="eyebrow">MOTION / RHYTHM STUDY</span><h1>动作有因果，节奏有留白。</h1><p>同一套黏土组件、同一段合成测试音，切换均匀编排与律动编排。</p></header>
  <nav aria-label="测试配置"><div><button aria-pressed={rhythm} onClick={()=>setRhythm(true)}>律动版</button><button aria-pressed={!rhythm} onClick={()=>setRhythm(false)}>均匀版</button></div><div><button aria-pressed={variant==='invoice'} onClick={()=>setVariant('invoice')}>发票录入</button><button aria-pressed={variant==='inventory'} onClick={()=>setVariant('inventory')}>库存整理</button></div><button aria-pressed={sound} onClick={()=>setSound(!sound)}>测试音 {sound?'开':'关'}</button></nav>
  <section className="screen"><Player ref={ref} component={Demo} inputProps={{rhythm,sound,variant}} fps={FPS} durationInFrames={DURATION*FPS} compositionWidth={1280} compositionHeight={720} controls={false} clickToPlay initiallyMuted={false} moveToBeginningWhenEnded={false} style={{width:'100%'}}/></section>
  <div className="transport"><button onClick={toggle}>{playing?'暂停':'播放'}</button><label htmlFor="seek">{(frame/FPS).toFixed(2)} / 12s</label><input id="seek" aria-label="时间进度" type="range" min="0" max="359" value={frame} onChange={e=>{ref.current?.pause();ref.current?.seekTo(Number(e.target.value));setFrame(Number(e.target.value));}}/><button onClick={()=>ref.current?.requestFullscreen()}>全屏</button></div>
  <footer><b>可复现编排示例 · 并非产品能力测试</b><span className="build-id" data-build-id={buildId}>BUILD {buildId}</span><p>音源为本仓库脚本合成的 116 BPM 测试节奏，不是 ACE-Step 生成作品。起音由作者选取；算法不判断强拍、语义或审美。两种内容变体共享同一个 rhythm helper。没有私人配音、原片或外部素材。</p></footer>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
