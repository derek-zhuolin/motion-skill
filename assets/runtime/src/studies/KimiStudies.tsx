import palette from './palette.json';
import React from 'react';
const B=palette.accent,K=palette.ink,W=palette.paper;
const c=(v:number)=>Math.max(0,Math.min(1,v));
const e=(v:number)=>{v=c(v);return v*v*v*(v*(v*6-15)+10)};
const w=(t:number,a:number,b:number)=>e((t-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const seq=(n:number)=>Array.from({length:n},(_,i)=>i);
const tr=(x:number,y:number,a=0,s=1)=>`translate(${x} ${y}) rotate(${a}) scale(${s})`;
const T=({x=800,y=460,size=92,fill=K,anchor='middle',children,...props}:any)=><text x={x} y={y} textAnchor={anchor} fontWeight="700" fontSize={size} fill={fill} {...props}>{children}</text>;
export const kimiStudies=[
 {id:81,name:'贴纸剥离 · 揭开下一步',category:'产品揭露',sourceId:'2113915835387670793',kind:'新增方向',mechanism:'折线反射 × 翻面明暗 × 底层内容揭露',desc:'让“揭开”承担内容交接：蓝色贴纸翻出浅色背面，再露出下一层。适合新栏目、产品卖点与片头。二维折面近似。',difference:'比旧77号撕纸多出背面、折线与接触影；纸面保持完整。'},
 {id:82,name:'分层拆解 · 把做法展开',category:'产品揭露',sourceId:'2113680701770068067-5',kind:'新增方向',mechanism:'等轴投影 × 有序拆装 × 标注跟随',desc:'把一份看起来完整的成果拆成洞察、创意、分发与复盘四层，再合回一件作品。适合把能力讲清楚的中段。',difference:'从旧7号叠卡延伸到带轴线、组件关系和有序装配的拆解。'},
 {id:83,name:'体素重组 · 从散点到成形',category:'材质与重组',sourceId:'2113611006039761281',kind:'新增方向',mechanism:'体块聚拢 × 分辨率变化 × 平滑外形',desc:'散开的立方体按不同路径聚拢，逐渐从体素块变成一个完整的蓝色物体。适合“从零散信息到清楚判断”的表达。',difference:'新增体块的顶面、侧面与粗细变化，区别于旧72号的平面网点。'},
 {id:84,name:'连锁机关 · 让下一步发生',category:'因果与节奏',sourceId:'2113869535338000625',kind:'新增方向',mechanism:'落球 × 杠杆 × 骨牌 × 齿轮接力',desc:'从一次落球开始，杠杆、骨牌和转轮连续响应。动作按接触时机编排，表达“一个好判断带来下一步”。并非物理求解。',difference:'旧80号是小球沿线经过节点；这里用不同对象之间的动作接力组织因果。'},
 {id:85,name:'光盘惯性 · 摇摆之后落定',category:'材质与重组',sourceId:'2113820737236869177',kind:'新增方向',mechanism:'投影倾转 × 摇摆衰减 × 反射扫过',desc:'蓝银色光盘在边缘上摇摆，旋转与倾倒逐渐放慢，最后安静落定。适合节奏释放和品牌收尾前的呼吸。',difference:'新增受控的倾倒、边缘接触与明暗旋转；保留蓝黑白，不沿用原片彩虹配色。'},
 {id:86,name:'立体折页 · 把内容立起来',category:'编辑与叙事',sourceId:'2113719584050348104',kind:'改编提案',mechanism:'书页展开 × 折面升起 × 编辑式留白',desc:'从绘本条目延伸出一张立体编辑页，让案例、方法与合作从纸上站起来。这是我们的编排提案，不声称是原片中的同款折页。',difference:'比旧15号翻页多了页面内部的立体层级；比旧67号海报多了结构展开。'},
 {id:87,name:'剖面追光 · 看见里面的关系',category:'产品揭露',sourceId:'2113929455110603016',kind:'新增方向',mechanism:'外壳 × 扫描窗口 × 内部结构同步',desc:'追光经过外壳时，窗口里出现互相咬合的结构。把注意力带到产品内部，适合解释“这一步到底发生了什么”。',difference:'旧18号只是选择画面焦点；这里同一位置显示外观和内部两种状态。'},
 {id:88,name:'一镜回环 · 结尾接上开头',category:'镜头编排升级',sourceId:'2113726609597596014',kind:'升级旧8/20号',mechanism:'共享形状 × 角色转换 × 首尾相接',desc:'让一个蓝色物体先成为案例，再展开为方法与合作的空间，最后回到最初形态。单项6秒、组合12秒的首尾均可验证。',difference:'升级旧8/20号：重点是跨内容角色的连续表达与完整回环，不把配色或倍速变化计作新技法。'},
];
export const kimiCombos=[
 {id:'k-reveal',name:'把好做法，拆给你看',tag:'产品与解释',note:'贴纸揭开 → 分层拆解 → 剖面追光',ids:[81,82,87],desc:'用遮挡揭露下一层，再把成果拆开讲清楚；三段画面用空间遮罩接力。适合产品卖点、案例拆解与新栏目片头。'},
 {id:'k-reaction',name:'一个动作，带出下一步',tag:'节奏与因果',note:'连锁机关 → 体素重组 → 光盘落定',ids:[84,83,85],desc:'开头连续触发，中段快速聚拢，最后让运动缓下来。用密与疏的变化组织12秒，不把全片简单加速。'},
 {id:'k-loop',name:'让结尾，回到新的开始',tag:'连续回环',note:'共享对象 → 案例 → 方法 → 合作 → 起点',ids:[88],desc:'一组真正首尾相接的形状编排：同一物体承担几个角色，保留蓝色形状作为视觉线索。推荐观察连续循环两次。'},
];
const Header=({id,label,dark=false}:{id:number;label:string;dark?:boolean})=><><T x={64} y={64} size={17} fill={dark?W:K} anchor="start" letterSpacing="3" fontWeight="400">INTERFLOW / STUDY {id}</T><T x={1536} y={64} size={17} fill={dark?W:K} anchor="end" letterSpacing="2" fontWeight="400">{label}</T></>;
const Foot=({children,dark=false}:any)=><T x={70} y={844} size={24} fill={dark?W:K} anchor="start" fontWeight="400">{children}</T>;
const Defs=()=> <defs>
 <linearGradient id="ks-blue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7db8ee"/><stop offset=".36" stopColor={B}/><stop offset="1" stopColor="#004687"/></linearGradient>
 <linearGradient id="ks-back" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d7e2ed"/><stop offset=".4" stopColor={W}/><stop offset=".85" stopColor="#b9c9d9"/><stop offset="1" stopColor="#7a91a4"/></linearGradient>
 <linearGradient id="ks-fold"><stop stopColor={K} stopOpacity=".4"/><stop offset=".4" stopColor={W} stopOpacity=".5"/><stop offset="1" stopColor={W} stopOpacity="0"/></linearGradient>
 <linearGradient id="ks-foil"><stop stopColor="#777f88"/><stop offset=".2" stopColor={W}/><stop offset=".4" stopColor="#4a86ba"/><stop offset=".55" stopColor={W}/><stop offset=".7" stopColor="#4b5662"/><stop offset=".88" stopColor="#cde9ff"/><stop offset="1" stopColor="#8a929a"/></linearGradient>
 <filter id="ks-shadow" x="-80%" y="-100%" width="260%" height="300%"><feDropShadow dx="0" dy="16" stdDeviation="13" floodOpacity=".2"/></filter>
 <pattern id="ks-dot" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill={B} opacity=".2"/></pattern>
 </defs>;
const Ground=({dark=false}:{dark?:boolean})=><rect width="1600" height="900" fill={dark?K:W}/>;
function clipHalf(poly:number[][],q:number,keep=true){
 const out:number[][]=[];const inside=(v:number[])=>keep?v[0]+v[1]<=q:v[0]+v[1]>=q;
 poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length],ia=inside(a),ib=inside(b);if(ia)out.push(a);if(ia!==ib){const u=(q-a[0]-a[1])/(b[0]+b[1]-a[0]-a[1]);out.push([mix(a[0],b[0],u),mix(a[1],b[1],u)]);}});return out;
}
const poly=(p:number[][])=>p.map(([x,y])=>`${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
function Peel({t}:{t:number}){
 const p=w(t,.5,5.3),q=mix(1230,-300,p),rect=[[0,0],[720,0],[720,470],[0,470]];
 const front=clipHalf(rect,q),back=clipHalf(rect,q,false).map(([x,y])=>[q-y,q-x]);
 return <><Ground/><rect width="1600" height="900" fill="url(#ks-dot)"/><g transform="translate(440 210)">
 <rect width="720" height="470" rx="26" fill="#f0f3f6"/><T x={360} y={210} size={90} fill={B}>下一种玩法</T><T x={360} y={285} size={26} fontWeight="400">看案例 · 找方法 · 一起做事</T>
 <defs><clipPath id="ks-peel-front"><polygon points={poly(front)}/></clipPath></defs><g clipPath="url(#ks-peel-front)"><rect width="720" height="470" rx="26" fill={B}/><T x={360} y={230} size={92} fill={W}>揭开下一步</T><T x={360} y={295} size={26} fill={W} fontWeight="400">有些新意，就在下一层。</T></g>
 {back.length>2&&<g filter="url(#ks-shadow)"><polygon points={poly(back)} fill="url(#ks-back)" stroke="#d2dbe4" strokeWidth="1"/>{q>0&&q<1190&&<path d={`M${Math.max(0,q-470)} ${Math.min(470,q)}L${Math.min(720,q)} ${Math.max(0,q-720)}`} stroke={W} strokeWidth="5"/>}</g>}
 </g><Header id={81} label="PEEL / REVEAL"/><Foot>换一层，看见新的可能。</Foot></>;
}
const Mat=({z=0,children}:any)=><g transform={`matrix(.9 .24 -.53 .43 800 ${510-z})`}>{children}</g>;
function Layers({t}:{t:number}){
 const spread=w(t,.3,2.3)*(1-w(t,4.1,5.8));const sep=spread*135;
 return <><Ground dark/><path d="M800 110V760" stroke={W} strokeWidth="1" strokeDasharray="5 9" opacity=".22"/>
 {seq(4).map(i=>{const z=(i-1.5)*sep;const blue=i===3;return <g key={i}>
 <Mat z={z-14}><rect x="-375" y="-215" width="750" height="430" rx="35" fill={i===3?'#004a95':'#596775'}/></Mat>
 <Mat z={z}><rect x="-375" y="-215" width="750" height="430" rx="35" fill={blue?'url(#ks-blue)':i===2?'#e8f0f8':W} stroke={blue?'#93c7fa':'#dce5ee'} strokeWidth="2"/>
 {i===0?<g stroke={B} strokeWidth="7" fill="none"><path d="M-260 120V-110H260"/>{seq(5).map(j=><rect key={j} x={-210+j*93} y={60-j*28} width="48" height={45+j*28} fill={B} rx="8"/>)}</g>:i===1?<g stroke={B} fill="none" strokeWidth="12">{seq(6).map(j=><ellipse key={j} cx={j*34-90} rx="80" ry="100"/>)}</g>:i===2?<g fill={B}>{seq(8).map(j=><rect key={j} x={-265+j%4*140} y={-115+Math.floor(j/4)*130} width="110" height="90" rx="14" opacity={.4+j*.07}/>)}</g>:<><T x={0} y={10} size={78} fill={W}>好做法，有层次。</T><T x={0} y={90} size={22} fill={W} fontWeight="400" letterSpacing="8">INTERFLOW / CASE STUDY</T></>}
 </Mat>
 {spread>.05&&<g opacity={spread}><path d={`M${i%2?1060:550} ${510-z-25}h${i%2?160:-180}`} fill="none" stroke={W} opacity=".5"/><T x={i%2?1250:345} y={510-z-16} size={30} fill={W} anchor={i%2?'start':'end'}>{['洞察','创意','分发','复盘'][i]}</T></g>}
 </g>})}<Header id={82} label="EXPLODE / UNDERSTAND" dark/><Foot dark>从一个结果，看懂背后的做法。</Foot></>;
}
function Cube({x,y,r,color=B}:any){return <g transform={tr(x,y)}><path d={`M0 ${-r}L${r} ${-r*.5}V${r*.5}L0 ${r}L${-r} ${r*.5}V${-r*.5}Z`} fill={color}/><path d={`M0 ${-r}L${r} ${-r*.5}L0 0L${-r} ${-r*.5}Z`} fill={W} opacity=".23"/><path d={`M0 0L${r} ${-r*.5}V${r*.5}L0 ${r}Z`} fill={K} opacity=".27"/></g>}
function Voxels({t}:{t:number}){
 const out=w(t,3.6,5.25);return <><Ground dark/>{seq(23).flatMap(row=>seq(23).map(col=>{const dx=(col-11)*22,dy=(row-11)*22,d=Math.hypot(dx,dy);if(d>248)return null;const j=row*23+col,seed=(Math.sin(j*137.5)+1)/2,p=w(t,.1+seed*.7,3+seed*.5);const x=mix(800+Math.sin(j*43)*750,800+dx,p),y=mix(450+Math.cos(j*29)*430,450+dy,p);const blue=Math.round(100+100*(1-d/300));return <g key={j} opacity={1-out}><Cube x={x} y={y} r={mix(6,14,p)} color={`rgb(0,${Math.min(151,blue)},219)`}/></g>;}))}
 <circle cx="800" cy="450" r={250} fill="url(#ks-blue)" opacity={out}/><T y={480} size={78} fill={W} opacity={w(t,4.2,5.45)}>从零散，到成形。</T><Header id={83} label="VOXEL / RESOLUTION" dark/><Foot dark>让分散的信号，成为一个清楚的想法。</Foot></>;
}
function gear(cx:number,cy:number,r:number,angle:number,color:string){const pts=seq(96).map(i=>{const a=i/96*Math.PI*2,rr=r*(i%4<2?1:.86);return [Math.cos(a)*rr,Math.sin(a)*rr]});return <g transform={tr(cx,cy,angle)}><polygon points={poly(pts)} fill={color}/><circle r={r*.65} fill="none" stroke={K} strokeWidth={r*.1} opacity=".35"/>{seq(6).map(i=><path key={i} d={`M${r*.24} 0H${r*.62}`} transform={`rotate(${i*60})`} stroke={K} strokeWidth={r*.13} opacity=".35"/>)}<circle r={r*.14} fill={W}/></g>}
function Chain({t}:{t:number}){
 const drop=w(t,.1,1),launch=w(t,1,1.9),sp=1-w(t,1.9,2.15),finish=w(t,4.3,5.6);const bx=mix(210,505,launch),by=mix(160,580,drop)-Math.sin(launch*Math.PI)*205;
 return <><Ground/><path d="M110 665H1480" stroke="#dce1e5" strokeWidth="3"/><g transform={tr(300,620,-w(t,.85,1.3)*16)}><rect x="-130" y="-10" width="260" height="20" rx="10" fill={B}/></g><path d="M280 665L300 625L320 665Z" fill={K}/><circle cx={bx} cy={by} r="30" fill="url(#ks-blue)" opacity={sp}/>
 {seq(7).map(i=><g key={i} transform={tr(520+i*62,650,w(t,1.78+i*.23,2.24+i*.23)*72)}><rect x="-12" y="-145" width="25" height="145" rx="7" fill={i%2?K:B}/><path d="M-7-140V-25" stroke={W} opacity=".25" strokeWidth="2"/></g>)}
 {gear(1100,540,100,w(t,3.25,5.8)*260,B)}<path d="M1190 565Q1270 550 1310 450" fill="none" stroke={B} strokeWidth="4" strokeDasharray="6 8"/>
 <g transform={tr(1320,350,mix(-13,0,finish),mix(.18,1,finish))} opacity={finish}><rect x="-128" y="-115" width="256" height="230" rx="35" fill={B} filter="url(#ks-shadow)"/><T x={0} y={12} size={45} fill={W}>下一步</T></g><Header id={84} label="CHAIN / CAUSE & EFFECT"/><T x={800} y={235} size={68}>一个好判断，带出下一步。</T><Foot>触发 → 接力 → 一个新的可能</Foot></>;
}
function Disc({t}:{t:number}){
 const settle=w(t,1.4,5.7),tilt=mix(.1,1.27,settle),sy=Math.cos(tilt),rot=Math.sin(t*13)*15*(1-settle);const cy=660-285*sy;
 return <><Ground/><ellipse cx="800" cy="669" rx={mix(90,315,settle)} ry={mix(12,27,settle)} fill={K} opacity=".13"/><g transform={`translate(800 ${cy+7}) rotate(${rot}) scale(1 ${sy})`}><circle r="291" fill="#444f5c"/></g><g transform={`translate(800 ${cy}) rotate(${rot}) scale(1 ${sy})`}>
 <circle r="290" fill="url(#ks-foil)"/>{seq(64).map(i=>{const a=i/64*Math.PI*2+t*(1-settle)*2,b=(i+1)/64*Math.PI*2+t*(1-settle)*2;return <path key={i} d={`M0 0L${Math.cos(a)*287} ${Math.sin(a)*287}A287 287 0 0 1 ${Math.cos(b)*287} ${Math.sin(b)*287}Z`} fill={i%9<3?B:W} opacity={i%9<3?.35:.1}/>})}<circle r="277" fill="none" stroke={W} strokeWidth="2" opacity=".6"/><circle r="85" fill="#edf3f8"/><circle r="42" fill={W}/><circle r="42" fill="none" stroke="#95a9b9" strokeWidth="5"/>
 </g><Header id={85} label="INERTIA / SETTLE"/><T y={215} size={72} opacity={w(t,3.5,5.2)}>有节奏，也有呼吸。</T><Foot>让速度变化，成为画面的一部分。</Foot></>;
}
function PopUp({t}:{t:number}){
 const open=w(t,.2,2.25),lift=w(t,1.2,3.65);const baseY=590;
 return <><Ground dark/><ellipse cx="800" cy="700" rx="570" ry="40" fill={W} opacity=".07"/>
 <g transform={`translate(800 ${baseY})`}><g transform={`matrix(${.94*open+.02} .2 -.45 .38 0 0)`}><rect x="-560" y="-350" width="1120" height="700" rx="15" fill="#dbe4ed"/><path d="M0-350V350" stroke="#9eafbe" strokeWidth="3"/>{seq(7).map(i=><path key={i} d={`M-470 ${-220+i*75}H-80M80 ${-220+i*75}H470`} stroke="#b7c8d7" strokeWidth="2"/>)}</g></g>
 {['案例','方法','合作'].map((label,i)=>{const p=w(t,1.05+i*.27,2.95+i*.27),x=440+i*350,y=565-i*15;return <g key={i} transform={`translate(${x} ${y})`}><path d={`M-110 10L-150 ${-220*p}L40 ${-200*p}L120 25Z`} fill={i===1?W:'#0056aa'}/><g transform={`matrix(1 .14 -.12 ${p*.92+.001} 0 0)`}><rect x="-125" y="-265" width="250" height="265" rx="10" fill={i===1?B:W} filter="url(#ks-shadow)"/><T x={0} y={-120} size={62} fill={i===1?W:K}>{label}</T><path d="M-65-65H65" stroke={i===1?W:B} strokeWidth="5"/><circle cx="85" cy="-220" r="9" fill={i===1?W:B}/></g></g>})}
 <Header id={86} label="POP-UP / EDITORIAL" dark/><T y={760} size={48} fill={W} opacity={lift}>让内容，站起来。</T></>;
}
function Cutaway({t}:{t:number}){
 const u=w(t,.2,5.4),cx=mix(350,1250,u),full=w(t,4.2,5.5);const inside=<><rect x="380" y="280" width="840" height="340" rx="140" fill={K}/>{gear(650,450,95,t*35,B)}{gear(805,450,60,-t*35*95/60,W)}{gear(985,450,120,t*35*95/120,B)}<path d="M450 340H1110M450 560H1110" stroke={W} opacity=".23" strokeWidth="2"/></>;
 return <><Ground/><defs><clipPath id="ks-lens"><circle cx={cx} cy="450" r={mix(160,1000,full)}/></clipPath></defs><rect x="380" y="280" width="840" height="340" rx="140" fill="url(#ks-blue)" filter="url(#ks-shadow)"/><T y={473} size={72} fill={W}>里面，还有好做法。</T><g clipPath="url(#ks-lens)">{inside}</g><circle cx={cx} cy="450" r="160" stroke={W} strokeWidth="3" fill="none" opacity={1-full}/><path d={`M${cx} 280V200H${cx+130}`} stroke={B} fill="none" opacity={1-full}/><T x={cx+142} y={208} size={24} anchor="start" fill={B} opacity={1-full} fontWeight="400">看见内部关系</T><Header id={87} label="CUTAWAY / EXPLAIN"/><Foot>外观让人注意，内部让人理解。</Foot></>;
}
function LoopObject({t,duration=6}:{t:number;duration?:number}){
 const u=(t%duration)/duration,angle=u*Math.PI*2;const spread=Math.sin(angle)**2;const shape=2+6*Math.sin(angle/2)**2;const rx=155+100*Math.sin(angle/2)**2,ry=155-30*Math.sin(angle/2)**2;
 const cx=800+Math.sin(angle)*140,cy=430-Math.sin(angle*2)*60;const pts=seq(100).map(i=>{const a=i/100*Math.PI*2;return [Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**(2/shape)*rx,Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**(2/shape)*ry]});
 const label=u<.2?'看见':u<.43?'案例':u<.67?'方法':u<.87?'一起':'看见';
 return <><Ground dark/>{seq(4).map(i=>{const a=i/4*Math.PI*2+angle;return <g key={i} transform={tr(cx+Math.cos(a)*370*spread,cy+Math.sin(a)*200*spread,-Math.sin(angle)*i*5,.38+.28*spread)} opacity={spread}><rect x="-140" y="-110" width="280" height="220" rx="24" fill={i%2?W:B}/><path d="M-85-50H70M-85 0H95M-85 50H30" stroke={i%2?B:W} strokeWidth="12" strokeLinecap="round"/></g>})}<g transform={tr(cx,cy)}><polygon points={poly(pts)} fill="url(#ks-blue)" filter="url(#ks-shadow)"/><T x={0} y={22} size={64} fill={W}>{label}</T></g><image href="assets/logo-white.svg" x="630" y="720" width="340" height="96"/><Header id={88} label="ONE OBJECT / SEAMLESS LOOP" dark/></>;
}
const scenes=[Peel,Layers,Voxels,Chain,Disc,PopUp,Cutaway,LoopObject];
export function KimiStudy({id,t}:{id:number;t:number}){const Scene=scenes[id-81]||Peel;return <><Defs/><Scene t={t}/></>}
export function KimiCombo({mode,t}:{mode:string;t:number}){
 if(mode==='k-loop')return <><Defs/><LoopObject t={t} duration={12}/></>;
 const ids=mode==='k-reveal'?[81,82,87]:[84,83,85];const span=4;return <><Ground dark/>{ids.map((id,i)=>{const start=i*span,local=t-start; if(local<-.7||local>span+.2)return null;const p=w(t,start-.7,start+.15),uid=`k-wipe-${id}`;return <g key={id}><defs><clipPath id={uid}>{i===0?<rect width="1600" height="900"/>:mode==='k-reveal'?<path d={`M0 0H${-500+p*2600}l-500 900H0Z`}/>:<circle cx="800" cy="450" r={1100*p}/>}</clipPath></defs><g clipPath={`url(#${uid})`}><KimiStudy id={id} t={c((local+.7)/4.7)*5.9}/></g></g>})}<rect width="1600" height="95" fill={K}/><rect y="790" width="1600" height="110" fill={K}/><T x={65} y={62} anchor="start" size={17} fill={W} letterSpacing="3" fontWeight="400">INTERFLOW / FROM REFERENCE TO EXPERIMENT</T><T x={65} y={851} anchor="start" size={26} fill={W} fontWeight="400">{mode==='k-reveal'?'把好做法，拆给你看。':'一个动作，带出下一步。'}</T><path d="M1120 845H1530" stroke={W} opacity=".2"/><path d={`M1120 845H${1120+410*c(t/12)}`} stroke={B} strokeWidth="4"/></>;
}
