import palette from './palette.json';
import React from 'react';
const B=palette.accent,K=palette.ink,W=palette.paper;
const sat=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{v=sat(v);return v*v*v*(v*(v*6-15)+10)};
const w=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const lerp=(a:number,b:number,u:number)=>a+(b-a)*u;
const seq=(n:number)=>Array.from({length:n},(_,i)=>i);
const tr=(x:number,y:number,r=0,s=1)=>`translate(${x} ${y}) rotate(${r}) scale(${s})`;
const T=({x=800,y=480,size=128,fill=W,children,anchor='middle',...p}:any)=><text x={x} y={y} fontSize={size} fontWeight="700" fill={fill} textAnchor={anchor} {...p}>{children}</text>;
const line=(pts:number[][])=>pts.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
export const experiments=[
 {id:65,name:'条纹玻璃 · 把焦点切出来',family:'光学与材质',desc:'文字与蓝色物体先被条纹错切；一个清晰窗口扫过，再把焦点还给完整画面。',source:'paper',mechanism:'条带位移 × 扫描窗口 × 光线交接'},
 {id:66,name:'流银缎带 · 形状变成镜头',family:'光学与材质',desc:'带有明暗反射的缎带绕过文字，收紧，再从中心打开。金属感由二维明暗层模拟。',source:'paper',mechanism:'路径形变 × 镜面层次 × 中心揭露'},
 {id:67,name:'柔性海报 · 风穿过版面',family:'光学与材质',desc:'画面按纵向切片起伏，纸面带着文字一起呼吸，再被拉成一张安静的海报。',source:'juan',mechanism:'切片起伏 × 阴影延迟 × 版面落定'},
 {id:68,name:'光栅双面 · 一个画面两种答案',family:'光学与材质',desc:'用窄条交错的两幅作品，模拟转动光栅印刷时的视角切换。',source:'atelier',mechanism:'光栅遮罩 × 视角切换 × 版式对位'},
 {id:69,name:'字形隧道 · 穿过一个关键词',family:'文字与编辑',desc:'反复的轮廓字形成纵深，镜头沿字的负空间前进，最后看到完整关键词。',source:'juan',mechanism:'排版纵深 × 连续推镜 × 字形落点'},
 {id:70,name:'弹性字浪 · 文字也有重心',family:'文字与编辑',desc:'每个字按不同时间压缩、舒展，像一股能量穿过一句话，最后恢复可读比例。',source:'atelier',mechanism:'字宽波浪 × 重心平移 × 可读停顿'},
 {id:71,name:'狭缝时间 · 让上一帧留下来',family:'文字与编辑',desc:'各条带读取同一动作的不同时间，形成有秩序的时间拖影，然后重新对齐。',source:'juan',mechanism:'时间切片 × 残像编排 × 轮廓对齐'},
 {id:72,name:'网点显影 · 颗粒聚成一个形状',family:'文字与编辑',desc:'规则网点按波前变大、变小，蓝色体积从印刷网点中浮现，留下简洁标题。',source:'paper',mechanism:'网点显影 × 体积明暗 × 视觉聚焦'},
 {id:73,name:'无限桌面 · 从全貌跳进细节',family:'空间与运镜',desc:'本地实现的作品铺成自由桌面，镜头弧线滑行、减速，精准进入其中一张海报。',source:'juan',mechanism:'自由画布 × 弧线运镜 × 焦点接管'},
 {id:74,name:'轨迹旋涡 · 收集一个好想法',family:'空间与运镜',desc:'小作品沿螺旋留下连续轨迹，逐渐收拢成一个清楚的焦点。',source:'hub',mechanism:'图像轨迹 × 螺旋聚拢 × 尺度变化'},
 {id:75,name:'弹性画带 · 沿着曲线看作品',family:'空间与运镜',desc:'作品在同一条有张力的曲线上行进，曲线逐渐拉直，带出一次有惯性的视觉交接。',source:'atelier',mechanism:'曲线路径 × 切线旋转 × 张力释放'},
 {id:76,name:'摩尔纹透镜 · 线条里的呼吸',family:'空间与运镜',desc:'两层细线发生缓慢相对运动，一枚透镜穿过它们，产生局部放大与干涉层次。',source:'paper',mechanism:'线场干涉 × 局部透镜 × 呼吸节奏'},
 {id:77,name:'撕开一角 · 从纸面进入现场',family:'玩心与触感',desc:'裂口从中间向两边打开，露出另一个画面；纸边保留受力和细小锯齿。',source:'folds',mechanism:'不规则遮罩 × 撕口扩张 × 纸边阴影'},
 {id:78,name:'软体磁场 · 分散到一起成形',family:'玩心与触感',desc:'几个柔软体块靠近、连成一体，再回到有呼吸感的轮廓。以SVG滤镜模拟黏合。',source:'paper',mechanism:'软体汇集 × 黏连轮廓 × 节奏回弹'},
 {id:79,name:'机械翻片 · 偶然变成一句话',family:'玩心与触感',desc:'像机场翻片牌一样，各列按错峰节奏翻动，散乱字母逐渐组成清楚的一句。',source:'oreo',mechanism:'翻片错峰 × 机械节拍 × 语义落定'},
 {id:80,name:'创意弹球 · 一次碰撞带出下一步',family:'玩心与触感',desc:'一个小球带着视线沿曲线穿过三个节点；接触、反馈、路径接力形成小叙事。',source:'oreo',mechanism:'弹球轨迹 × 接触反馈 × 路径接力'},
];
export const experimentSources:Record<string,{title:string;url:string;date:string}>= {
 paper:{title:'Paper Shaders · 光学与网点实验',url:'https://shaders.paper.design/',date:'2026-10-25 核验'},
 juan:{title:'Juan Mora Romero · 无限画布与柔性海报',url:'https://tympanus.net/codrops/2026/10/22/juan-mora-romero-portfolio/',date:'2026-10-22'},
 atelier:{title:'Atelier UI · 文字、图像与连续形变',url:'https://tympanus.net/codrops/2026/10/21/atelier-ui-webgl-dom/',date:'2026-10-21'},
 folds:{title:'Paperlab · 折叠、撕口与纸面触感',url:'https://tympanus.net/codrops/2026/10/18/real-folds-real-fire/',date:'2026-10-18'},
 oreo:{title:'Oreo UI · 有故事的等待与受控弹簧',url:'https://github.com/oreo-design/oreo-ui',date:'2026-10-25 核验'},
 hub:{title:'Codrops Creative Hub · 轨迹与曲线作品集',url:'https://tympanus.net/codrops/hub/',date:'2026-10-25 核验'},
};
export const experimentalCombos=[
 {id:'x-optical',name:'穿过光，看见想法',tag:'光学实验',note:'条纹折射 → 流银环 → 光栅揭露',ids:[65,66,68],desc:'玻璃的条带先把画面切开，收成一条缎带，再展开为双面海报。用同一方向的遮挡连接三个镜头。'},
 {id:'x-type',name:'让文字成为镜头',tag:'编辑实验',note:'字形隧道 → 弹性字浪 → 时间残像 → 网点',ids:[69,70,71,72],desc:'从字的负空间进入画面，节奏从连续推进转成短促形变，最后让网点逐渐落定。'},
 {id:'x-space',name:'灵感不走直线',tag:'空间实验',note:'无限桌面 → 旋涡 → 弹性画带 → 摩尔纹',ids:[73,74,75,76],desc:'作品不再只是依次弹出。镜头和路径接力，把平铺、旋转、曲线与线场组织成一次连续探索。'},
 {id:'x-play',name:'有点，不按常理',tag:'触感实验',note:'撕纸 → 软体汇集 → 翻片 → 弹球',ids:[77,78,79,80],desc:'先建立触感，再用一次意外转折改变节奏。每个小动作都承担把视线交给下一步的任务。'},
];
function LabDefs(){return <defs>
 <radialGradient id="lab-ball" cx=".3" cy=".2" r=".9"><stop stopColor="#86bdf1"/><stop offset=".35" stopColor={B}/><stop offset=".8" stopColor="#004e9c"/><stop offset="1" stopColor={K}/></radialGradient>
 <linearGradient id="lab-metal" x1="0" y1="0" x2=".6" y2="1"><stop stopColor={W}/><stop offset=".13" stopColor="#626a72"/><stop offset=".25" stopColor={W}/><stop offset=".38" stopColor={K}/><stop offset=".49" stopColor="#a8d2f8"/><stop offset=".56" stopColor={W}/><stop offset=".7" stopColor="#48505a"/><stop offset=".83" stopColor={W}/><stop offset="1" stopColor="#3b4148"/></linearGradient>
 <linearGradient id="lab-stripe"><stop stopColor={W} stopOpacity=".35"/><stop offset=".22" stopColor={W} stopOpacity="0"/><stop offset=".8" stopColor={K} stopOpacity=".3"/><stop offset="1" stopColor={W} stopOpacity=".35"/></linearGradient>
 <filter id="lab-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="20" stdDeviation="15" floodOpacity=".24"/></filter>
 <filter id="lab-goo" x="-40%" y="-50%" width="180%" height="200%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo"/><feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter>
 </defs>}
const Ground=({dark=false}:{dark?:boolean})=><rect width="1600" height="900" fill={dark?K:W}/>;
const Meta=({number,label,dark=false}:{number:number;label:string;dark?:boolean})=><g fill={dark?W:K} opacity=".7"><T x={66} y={68} size={18} fill={dark?W:K} anchor="start" fontWeight="400" letterSpacing="3">INTERFLOW / EXPERIMENT {number}</T><T x={1534} y={68} size={18} anchor="end" fill={dark?W:K} fontWeight="400">{label}</T><path d="M66 810H1534" stroke={dark?W:K} opacity=".2"/></g>;
const Bottom=({text,dark=false}:{text:string;dark?:boolean})=><T x={70} y={856} size={20} fill={dark?W:K} anchor="start" fontWeight="400">{text}</T>;
function Poster({variant=0,wid=460,hei=580}:{variant?:number;wid?:number;hei?:number}){return <g>
 <rect width={wid} height={hei} fill={variant%3===0?B:variant%3===1?W:K}/>
 <T x={26} y={45} size={16} anchor="start" fill={variant%3===1?K:W} fontWeight="400" letterSpacing="3">NEW PERSPECTIVES</T>
 {variant%4===0?<g transform={tr(wid*.51,hei*.45,-20)}>{seq(7).map(i=><ellipse key={i} cy={i*13-40} rx={wid*.32} ry={hei*.12} fill="none" stroke={W} strokeWidth="9"/>)}</g>:variant%4===1?<g transform={tr(wid*.5,hei*.43)}>{seq(9).map(i=><rect key={i} x={-wid*.3} y={-wid*.3} width={wid*.6} height={wid*.6} rx={wid*.12} fill="none" stroke={B} strokeWidth="4" transform={`rotate(${i*11})`}/>)}</g>:variant%4===2?<g transform={tr(wid*.5,hei*.46)}>{seq(13).map(i=><circle key={i} cx={Math.cos(i*.48)*wid*.15} cy={Math.sin(i*.48)*hei*.12} r={wid*.21-i*3} fill="none" stroke={i%2?W:B} strokeWidth="9"/>)}</g>:<g transform={tr(wid*.5,hei*.42,-18)}>{seq(6).map(i=><rect key={i} x={-wid*.32+i*wid*.12} y={-hei*.22+Math.sin(i)*20} width={wid*.09} height={hei*.44} rx={wid*.045} fill={variant%3===1?B:W}/>)}</g>}
 <T x={24} y={hei-88} size={wid*.105} anchor="start" fill={variant%3===1?K:W}>换个视角</T><T x={26} y={hei-42} size={18} anchor="start" fill={variant%3===1?K:W} fontWeight="400">创意 / 品牌 / 新玩法</T>
 </g>}
function Fluted({t}:{t:number}){
 const gap=lerp(25,185,w(t,1.5,3.1))*(1-w(t,4.3,5.7));const cx=lerp(280,1270,w(t,.3,5.2));
 return <><Ground dark/><defs><g id="fluted-art"><T y={480} size={245} letterSpacing="-15">看见不同</T><circle cx={800+Math.sin(t*.7)*110} cy={450} r={250-30*w(t,4,6)} fill="url(#lab-ball)"/><T y={480} size={70}>新的可能。</T></g><clipPath id="lens-clear"><rect x={cx-gap} y="100" width={gap*2} height="700" rx="5"/></clipPath></defs>
 {seq(40).map(i=><svg key={i} x={i*40} y="100" width="40.5" height="700" viewBox={`${i*40+Math.sin(i*.8+t)*24} 100 30 700`} preserveAspectRatio="none"><use href="#fluted-art"/></svg>)}
 <use href="#fluted-art" clipPath="url(#lens-clear)"/>
 {seq(40).map(i=><rect key={i} x={i*40} y="100" width="40" height="700" fill="url(#lab-stripe)" opacity={Math.abs(i*40-cx)<gap?.05:.65}/>)}
 <path d={`M${cx-gap} 130V770M${cx+gap} 130V770`} stroke={W} strokeWidth="2" opacity=".7"/><Meta number={65} label="STRIPED OPTICS" dark/><Bottom text="透过信息，看见不同。" dark/>
 </>;
}
function Silver({t}:{t:number}){
 const a=w(t,.3,2.3), settle=w(t,3.7,5.5);const path=(offset=0)=>{
 const pts=seq(150).map(i=>{const an=i/149*Math.PI*2;return [800+Math.cos(an)*(330+Math.sin(an*3+t*1.4)*70*(1-settle)),450+Math.sin(an)*(220+Math.cos(an*2+t)*50*(1-settle))+Math.sin(an*2)*offset]});return line(pts)+'Z';};
 return <><Ground dark/><g transform={tr(800,450,lerp(-35,15,a),lerp(.65,1.12,a))}><g transform="translate(-800 -450)"><path d={path()} fill="none" stroke={B} strokeWidth="95" opacity=".45" transform="translate(0 14)"/><path d={path(10)} fill="none" stroke="url(#lab-metal)" strokeWidth={lerp(90,48,settle)} strokeLinecap="round"/><path d={path(7)} fill="none" stroke={W} strokeWidth="1.7" opacity=".8"/></g></g><T y={465} size={72} opacity={w(t,2,3.2)}>让想法，有形。</T><Meta number={66} label="LIQUID RIBBON" dark/><Bottom text="克制的反射，连续的轮廓。" dark/></>;
}
function Cloth({t}:{t:number}){
 const calm=1-w(t,3.7,5.8);return <><Ground/><defs><g id="cloth-poster"><Poster variant={0} wid={650} hei={650}/></g></defs><g transform={tr(475,120,lerp(-8,0,w(t,3.5,5.7)))} filter="url(#lab-shadow)">
 {seq(52).map(i=>{const dy=Math.sin(i*.18-t*2.7)*30*calm*(.4+.6*Math.sin(i/51*Math.PI));return <g key={i} transform={`translate(0 ${dy})`}><svg x={i*12.5} width="13" height="650" viewBox={`${i*12.5} 0 12.5 650`} preserveAspectRatio="none"><use href="#cloth-poster"/></svg><rect x={i*12.5} width="13" height="650" fill={Math.cos(i*.18-t*2.7)>0?W:K} opacity={Math.abs(Math.cos(i*.18-t*2.7))*.2*calm}/></g>})}</g><Meta number={67} label="SOFT POSTER"/><Bottom text="让版面，也拥有呼吸。"/></>;
}
function Lenticular({t}:{t:number}){
 const u=(.5-.5*Math.cos(t*Math.PI/3));const step=28;return <><Ground dark/><defs><g id="lent-a"><rect width="1600" height="900" fill={B}/><T y={470} size={195}>有趣</T><T y={570} size={32} fontWeight="400">第一眼，让人停下来。</T></g><g id="lent-b"><rect width="1600" height="900" fill={W}/><T y={470} size={195} fill={K}>有用</T><T y={570} size={32} fill={K} fontWeight="400">第二眼，带走一个想法。</T></g></defs><use href="#lent-a"/>{seq(58).map(i=><g key={i}><svg x={i*step} width={step*u+.05} height="900" viewBox={`${i*step} 0 ${step*u+.05} 900`}><use href="#lent-b"/></svg><rect x={i*step} width={step} height="900" fill="url(#lab-stripe)" opacity={Math.sin(u*Math.PI)*.6}/></g>)}<Meta number={68} label="LENTICULAR / TWO SIDES" dark={u<.5}/></>;
}
function TypeTunnel({t}:{t:number}){
 const z=w(t,.15,4.2);return <><Ground dark/>{seq(11).reverse().map(i=>{const sc=.12+i*.16+z*1.7;const op=(1-i/14)*(1-w(t,3.3,4.7));return <g key={i} transform={tr(800,450,i*.3-t*1.5,sc)} opacity={op}><T x={0} y={45} size={155} fill="none" stroke={i%3===0?B:W} strokeWidth={2/sc} letterSpacing="-8">新视角</T></g>})}<g opacity={w(t,3.1,4.4)} transform={tr(800,450,0,lerp(.7,1,w(t,3.1,4.8)))}><T x={0} y={35} size={170}>新视角</T><T x={0} y={130} size={27} fontWeight="400" letterSpacing="10">从一个不同的角度进入</T></g><Meta number={69} label="TYPE AS CAMERA" dark/></>;
}
function ElasticType({t}:{t:number}){
 const words=['有','自','己','的','样','子'];const en=w(t,.1,1.2),end=w(t,4.4,5.8);let positions:number[]=[];const widths=words.map((_,i)=>lerp(110+110*(.5+.5*Math.sin(i*1.1-t*3)),170,end));const sum=widths.reduce((a,b)=>a+b,0);let x=800-sum/2;words.forEach((_,i)=>{positions.push(x);x+=widths[i]});return <><Ground/>{words.map((v,i)=><g key={i} transform={`translate(${positions[i]+widths[i]/2} ${460+Math.sin(t*3-i*.8)*25*(1-end)}) scale(${widths[i]/170} ${lerp(.25,1,en)})`}><T x={0} y={0} size={178} fill={i===1||i===4?B:K}>{v}</T></g>)}<path d={`M${800-sum/2} 535H${800+sum/2}`} stroke={B} strokeWidth="7"/><T y={627} size={29} fill={K} fontWeight="400">表达，有自己的重心。</T><Meta number={70} label="ELASTIC TYPE / RHYTHM"/></>;
}
function SlitTime({t}:{t:number}){
 const align=w(t,3.5,5.7);return <><Ground dark/>{seq(28).map(i=>{const tt=t-i*.055*(1-align);const dx=Math.sin(tt*1.5)*240*(1-align);return <svg key={i} x="110" y={135+i*22} width="1380" height="22.5" viewBox={`110 ${135+i*22} 1380 22.5`}><g transform={tr(dx,0)}><circle cx="800" cy="450" r="285" fill={B}/><T y={510} size={200} letterSpacing="-8">下一种可能</T></g></svg>})}<Meta number={71} label="SLIT–SCAN / TIME ECHO" dark/><Bottom text="让动作经过时间，而不只是经过位置。" dark/></>;
}
function Halftone({t}:{t:number}){
 const grow=w(t,.2,2.4),out=w(t,4.6,5.8);return <><Ground/>{seq(42).flatMap(row=>seq(66).map(col=>{const x=40+col*23.4,y=110+row*16.4;const nx=(x-800)/320,ny=(y-445)/320;const d=Math.hypot(nx,ny);const light=d<1?Math.sqrt(1-d*d):0;const wave=.65+.35*Math.sin(col*.24+row*.19-t*3);const r=(d<1?(3+8*light):1.1)*grow*(1-out*.35);return <circle key={`${row}-${col}`} cx={x} cy={y} r={r} fill={d<1?B:K} opacity={d<1?.5+.5*wave:.12}/>;}))}<T y={485} size={112} opacity={w(t,2.5,4)} fill={W}>浮现。</T><Meta number={72} label="HALFTONE / EMERGENCE"/><Bottom text="把零散的信号，聚成一个形状。"/></>;
}
function InfiniteDesk({t}:{t:number}){
 const p=w(t,.1,4.9);const zoom=lerp(.66,1.44,w(t,2.1,5.6)),x=lerp(70,-32,p),y=lerp(-110,20,p);return <><Ground dark/><g transform={`translate(800 450) scale(${zoom}) translate(${-800+x} ${-450+y})`}>
 {seq(4).flatMap(row=>seq(5).map(col=>{const index=row*5+col;const xx=800+(col-2)*455, yy=450+(row-1)*600;return <g key={index} transform={tr(xx,yy,Math.sin(index*4)*5*(1-p))}><g transform="translate(-200 -260)" filter="url(#lab-shadow)"><Poster variant={index} wid={400} hei={520}/></g></g>}))}
 </g><Meta number={73} label="INFINITE DESK / DIVE" dark/></>;
}
function Vortex({t}:{t:number}){
 const p=w(t,1.1,4.6);return <><Ground dark/>{seq(17).map(i=>{const u=i/16;const an=u*Math.PI*5-t*.7;const r=lerp(670-420*u,40,p);const s=lerp(.22+.32*u,.15,p);return <g key={i} transform={tr(800+Math.cos(an)*r,450+Math.sin(an)*r*.55,an*180/Math.PI+90,s)} opacity={1-p*.95}><g transform="translate(-220 -280)"><Poster variant={i} wid={440} hei={560}/></g></g>})}<g transform={tr(800,450,lerp(-20,0,p),lerp(.08,1,p))}><g transform="translate(-230 -300)" filter="url(#lab-shadow)"><Poster variant={1} wid={460} hei={600}/></g></g><Meta number={74} label="IMAGE VORTEX / FOCUS" dark/></>;
}
function Ribbon({t}:{t:number}){
 const calm=w(t,3.4,5.6),offset=lerp(-450,190,w(t,0,5.8));const y=(x:number)=>450+Math.sin((x+offset)*.004-t*.6)*130*(1-calm);const pts=seq(90).map(i=>[-200+i*23,y(-200+i*23)]);return <><Ground/><path d={line(pts)} stroke={B} strokeWidth="2" fill="none"/>{seq(9).map(i=>{const x=-300+i*320+offset;const angle=Math.cos((x+offset)*.004-t*.6)*26*(1-calm);return <g key={i} transform={tr(x,y(x),angle,.54)}><g transform="translate(-235 -290)" filter="url(#lab-shadow)"><Poster variant={i} wid={470} hei={580}/></g></g>})}<Meta number={75} label="ELASTIC GALLERY / PATH"/><Bottom text="不是一张接一张，是一条有张力的线。"/></>;
}
function Moire({t}:{t:number}){
 const cx=lerp(300,1250,w(t,.4,5.1)),cy=450+Math.sin(t)*70;return <><Ground dark/><defs><g id="moire-field">{seq(92).map(i=><path key={i} d={line(seq(38).map(j=>{const x=-100+j*50;return [x,80+i*8+Math.sin(x*.005+i*.045+t*.6)*40]}))} fill="none" stroke={W} strokeWidth="1.6" opacity=".5"/>)}</g><clipPath id="moire-lens"><circle cx={cx} cy={cy} r="235"/></clipPath></defs><use href="#moire-field"/><g opacity=".45" transform={`rotate(${3+Math.sin(t)*4} 800 450)`}><use href="#moire-field"/></g><circle cx={cx} cy={cy} r="235" fill={B}/><g clipPath="url(#moire-lens)"><g transform={`translate(${cx} ${cy}) scale(1.4) translate(${-cx} ${-cy})`}><use href="#moire-field"/></g></g><circle cx={cx} cy={cy} r="235" fill="none" stroke={W} strokeWidth="2"/><Meta number={76} label="MOIRÉ / LENS" dark/></>;
}
function Tear({t}:{t:number}){
 const gap=lerp(0,940,w(t,.6,4.9));const left=seq(41).map(i=>[800-gap+Math.sin(i*7.5)*12,i*23]);const right=seq(41).map(i=>[800+gap+Math.sin(i*6.5)*12,i*23]);const lp=`M0 0H${800-gap} `+left.map(([x,y])=>`L${x} ${y}`).join(' ')+`L0 900Z`;const rp=`M1600 0H${800+gap} `+right.map(([x,y])=>`L${x} ${y}`).join(' ')+`L1600 900Z`;return <><rect width="1600" height="900" fill={B}/><T y={440} size={150}>拆开惯性</T><T y={540} size={36} fontWeight="400">给想法，留一个新的入口。</T><g filter="url(#lab-shadow)"><path d={lp} fill={W}/><path d={rp} fill={W}/></g><defs><clipPath id="tear-l"><path d={lp}/></clipPath><clipPath id="tear-r"><path d={rp}/></clipPath></defs><g clipPath="url(#tear-l)" transform={`translate(${-gap*.2} 0)`}><T y={470} size={190} fill={K}>拆开惯性</T></g><g clipPath="url(#tear-r)" transform={`translate(${gap*.2} 0)`}><T y={470} size={190} fill={K}>拆开惯性</T></g><Meta number={77} label="PAPER / REVEAL" dark={gap>770}/></>;
}
function SoftField({t}:{t:number}){
 const p=w(t,.5,3.5), breath=1+Math.sin(t*2)*.025;return <><Ground/><g filter="url(#lab-goo)" fill={B}>{seq(7).map(i=>{const a=i/7*Math.PI*2;return <circle key={i} cx={800+Math.cos(a+t*.25)*lerp(415,120,p)} cy={450+Math.sin(a+t*.25)*lerp(230,80,p)} r={(85+Math.sin(t*2+i)*6)*breath}/>})}<rect x={800-190*p} y={450-100*p} width={380*p+.01} height={200*p+.01} rx="70"/></g><T y={470} size={64} fill={W} opacity={w(t,2.5,3.7)}>一起成形</T><Meta number={78} label="SOFT BODIES / MAGNETIC"/><Bottom text="让不同的能力，先靠近一点。"/></>;
}
function SplitFlap({t}:{t:number}){
 const target='CREATE';return <><Ground dark/>{target.split('').map((letter,i)=>{const start=.2+i*.14,end=2.3+i*.35;const busy=t>start&&t<end;const phase=busy?((t-start)*4)%1:0;const n=Math.floor(Math.max(0,t-start)*4);const cur=busy?String.fromCharCode(65+(n*7+i*3)%26):t<start?'·':letter;const flip=busy?Math.abs(Math.cos(phase*Math.PI)):1;return <g key={i} transform={tr(240+i*224,440)}><rect x="-102" y="-150" width="204" height="300" rx="14" fill="#252525"/><g transform={`scale(1 ${flip})`}><T x={0} y={53} size={180} fill={t>=end?W:B} style={{fontFamily:'Figtree,sans-serif'}}>{cur}</T></g><path d="M-102 0H102" stroke={K} strokeWidth="7"/><circle cx="-97" r="5" fill="#666"/><circle cx="97" r="5" fill="#666"/></g>})}<T y={690} size={35} opacity={w(t,4.1,5.2)} fontWeight="400">把偶然，变成一个好想法。</T><Meta number={79} label="SPLIT FLAP / CADENCE" dark/></>;
}
function Pinball({t}:{t:number}){
 const nodes=[[180+1240/6,260],[800,620],[180+1240*5/6,260]],p=w(t,.2,5.3);const x=180+p*1240;const y=440-180*Math.sin(p*Math.PI*3);const path=line(seq(141).map(i=>[180+i/140*1240,440-180*Math.sin(i/140*Math.PI*3)]));return <><Ground/><path d={path} fill="none" stroke="#dde1e5" strokeWidth="3"/><path d={path} fill="none" stroke={B} strokeWidth="5" pathLength="1" strokeDasharray={`${p} 1`}/>{nodes.map(([nx,ny],i)=>{const at=1/6+i/3;const hit=w(p,at-.02,at+.02);const pulse=Math.sin(sat((p-at)/.12)*Math.PI);return <g key={i} transform={tr(nx,ny,0,1+pulse*.1)}><circle r="100" fill={hit>.5?B:W} stroke={B} strokeWidth="2" filter="url(#lab-shadow)"/><T x={0} y={12} size={33} fill={hit>.5?W:K}>{['看见','碰撞','成形'][i]}</T><circle r={100+pulse*45} fill="none" stroke={B} opacity={pulse*.5}/></g>})}<g transform={tr(x,y)}><circle r="37" fill="url(#lab-ball)" filter="url(#lab-shadow)"/><circle cx="-10" cy="-13" r="8" fill={W} opacity=".65"/></g><Meta number={80} label="PLAYFUL / CREATIVE RELAY"/><Bottom text="给严肃的事，一点玩心。"/></>;
}
const renderers=[Fluted,Silver,Cloth,Lenticular,TypeTunnel,ElasticType,SlitTime,Halftone,InfiniteDesk,Vortex,Ribbon,Moire,Tear,SoftField,SplitFlap,Pinball];
export function ExperimentalStudy({id,t}:{id:number;t:number}){const Renderer=renderers[id-65]||Fluted;return <><LabDefs/><Renderer t={Math.max(0,Math.min(t,6))}/></>}
// A continuous, frame-driven edit. Incoming footage is already moving underneath a
// spatial matte. Its heading metadata is masked in combinations to reduce copy.
export function ExperimentalCombo({mode,t}:{mode:string;t:number}){
 const config=experimentalCombos.find(c=>c.id===mode)||experimentalCombos[0];const ids=config.ids;const span=12/ids.length;const overlap=.7;
 return <><defs><clipPath id="suite-crop"><rect y="96" width="1600" height="700"/></clipPath></defs><rect width="1600" height="900" fill={K}/>
 {ids.map((id,i)=>{const start=i*span;const local=t-start; if(local < -overlap||local>span+.1)return null;const incoming=w(t,start-overlap,start+.12);const tt=sat((local+overlap)/(span+overlap))*5.85;const uid=`suite-${id}`;
 // Slanted shutters, circular lens, broad diagonal tear, or orbiting aperture.
 let shape:React.ReactNode;
 if(mode==='x-optical')shape=<>{seq(16).map(k=><rect key={k} x={k*100} y="0" width={101} height={900*w(incoming, k*.012,.78+k*.012)}/>)}</>;
 else if(mode==='x-type')shape=<path d={`M${-1700+incoming*3400} 0l-400 900H-2000V0Z`}/>;
 else if(mode==='x-space')shape=<ellipse cx={800} cy={450} rx={incoming*1150} ry={incoming*650}/>;
 else shape=<path d={`M0 0H${-500+incoming*2450}l-380 900H0Z`}/>;
 return <g key={id}><defs><clipPath id={uid}>{i===0?<rect width="1600" height="900"/>:shape}</clipPath></defs><g clipPath={`url(#${uid})`}><ExperimentalStudy id={id} t={tt}/></g></g>;
 })}
 <rect width="1600" height="95" fill={K}/><rect y="800" width="1600" height="100" fill={K}/><T x={65} y={62} anchor="start" size={19} fontWeight="400" letterSpacing="3">INTERFLOW / COMPOSED EXPERIMENT</T><T x={1530} y={62} anchor="end" size={19} fontWeight="400">{config.tag}</T><T x={65} y={859} anchor="start" size={25} fontWeight="400">{config.name}</T>
 <path d="M1040 850H1534" stroke={W} strokeWidth="2" opacity=".25"/><path d={`M1040 850H${1040+494*sat(t/12)}`} stroke={B} strokeWidth="4"/>
 </>;
}
