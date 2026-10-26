import palette from './palette.json';
import React from 'react';
import {CameraFrame,cameraStudies,cameraCombos,CameraOptions} from './CameraStudies';
import {KimiStudy,KimiCombo,kimiStudies,kimiCombos} from './KimiStudies';
import {ExperimentalStudy,ExperimentalCombo,experimentalCombos,experiments} from './ExperimentalFilms';
import {ExtendedStudy,ExtraCombo} from './MoreFilms';
import {useCurrentFrame} from 'remotion';

const B=palette.accent,K=palette.ink,W=palette.paper;
export const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const win=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const fade=(t:number,a:number,b:number,c=99,d=100)=>win(t,a,b)*(1-win(t,c,d));
const tx=(x:number,y:number,r=0,s=1)=>`translate(${x} ${y}) rotate(${r}) scale(${s})`;
const items=['看见新的玩法','创意，先走一步','把想法做出来','品牌的另一种表达','让方法进入工作','从参考到自己的方向','有意思，也有用','小预算，大创意'];

export const names=['错速瀑布流','焦点抽卡','横向内容传送带','卡片扇形发牌','多层视差巡览','环绕画廊','层叠纸面卡','共享对象连续变形','路径绘制与组件接力','文字作为窗口','关键词节奏排版','磨砂玻璃焦点卡','内容行嵌入','侧向甩镜','翻书与折页','圆形接力揭露','SVG轮廓变形','追光寻找重点','粘土组件接合','卡片展开为品牌收尾',"网格错峰显现","网格自动重排","散卡聚拢成一叠","内容队列追加与推挤","镜头推近与拉远","从全景进入可读细节","取景框裁切聚焦","选中框追踪主体","视线随指针移动","筛掉无关项并合拢","逐行裁切揭露","关键词接替变形","大字局部巡览","字距收拢与释放","数字滚轮落定","手绘划线与圈注","前景经过遮挡换景","形状与位置匹配剪辑","穿过局部进入下一镜","分区幕帘接力揭露","节点分支与汇合","拖放归位与排序","前后对比拉幕","图表沿数据路径生长","素材汇集打包成资产","按压与受控回弹","轻微挤压与回正","黏连拉伸后分离","卡片倾转与惯性落定","抬升与接触影变化","纸面边缘翘起回落","边缘高光掠过","点击涟漪","短指针轨迹","按钮磁吸跟随","状态点轻脉冲","三点错峰跳动","环形进度推进","勾选路径绘制","连线信号脉冲","标签选中底板滑移","头像群靠拢展开","胶囊工具栏展开","提示条展开并切换状态"];
names.push(...experiments.map(x=>x.name),...kimiStudies.map(x=>x.name),...cameraStudies.map(x=>x.name));
export const combos=[
 ...cameraCombos,
 ...kimiCombos,
 ...experimentalCombos,
 {id:'discover',name:'从发现，到被记住',tag:'内容社区',note:'关键词 → 错速瀑布流 → 焦点抽卡 → 品牌展开',ids:[11,1,2,20],desc:'内容持续经过，一张卡成为主角，再展开为品牌画面。不是四张幻灯片，是同一个对象的四种状态。'},
 {id:'gallery',name:'让作品成为主角',tag:'品牌作品',note:'文字窗口 → 环绕画廊 → 追光 → 品牌展开',ids:[10,6,18,20],desc:'从字里看见作品，镜头拉开形成画廊，光线带出焦点，最后回到品牌。这里的作品为程序绘制的几何视觉小样。'},
 {id:'process',name:'让想法找到搭档',tag:'方法与合作',note:'关键词 → 内容行嵌入 → 路径接力 → 粘土接合',ids:[11,13,9,19],desc:'词变成一行，行整理成需求，再沿路径找到互补能力。表现协作意图，不表示平台已自动匹配。'},
 {id:'contrast',name:'小预算，大创意',tag:'创意对比',note:'短词连击 → 留白 → 前后对比 → 品牌落点',ids:[11,43,36,20],desc:'用前后变化讲清一个创意，把节奏留给判断。演示不代表真实品牌改造结果。'},
 {id:'insight',name:'让洞察浮出水面',tag:'数据洞察',note:'图表生长 → 选框追踪 → 数字落定 → 一句判断',ids:[44,28,35,36],desc:'先看趋势，再聚焦一个信号。所有数字均为动效演示数据。'},
 {id:'connect',name:'把不同能力连起来',tag:'全球连接',note:'头像展开 → 路径分支 → 连线脉冲 → 汇合',ids:[62,41,60,20],desc:'圆点代表抽象参与者，路径表达连接意图，不代表真实用户或自动匹配已经发生。'},
 {id:'assets',name:'让灵感成为资产',tag:'工作流程',note:'标签选择 → 拖放归位 → 素材聚拢 → 打包',ids:[61,42,23,45],desc:'从选择到整理，再到一份可带走的成果。用组件变化表达工作流程。'},
 {id:'quiet',name:'安静，也有力量',tag:'克制品牌',note:'局部作品 → 慢推镜头 → 高光 → 遮挡 → 品牌',ids:[26,49,52,37],desc:'前段放慢建立期待，转场快速交接，最后留出稳定的品牌画面。'},
];

const Defs=()=> <defs>
 <linearGradient id="clay" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#2789e7"/><stop offset=".5" stopColor={B}/><stop offset="1" stopColor="#0052a7"/></linearGradient>
 <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stopColor={W}/><stop offset="1" stopColor="#e1e5eb"/></linearGradient>
 <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".76"/><stop offset="1" stopColor="#fff" stopOpacity=".16"/></linearGradient>
 <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".75"/><stop offset=".5" stopColor="#fff" stopOpacity=".05"/><stop offset="1" stopColor="#fff" stopOpacity=".4"/></linearGradient>
 <filter id="shadow" x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="0" dy="24" stdDeviation="22" floodColor="#091322" floodOpacity=".2"/></filter>
 <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
 <radialGradient id="spot"><stop stopColor="#fff" stopOpacity=".4"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
 <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#fff" opacity=".14"/></pattern>
 </defs>;
const Text=({x=0,y=0,size=52,children,fill=K,weight=700,anchor='start',...rest}:any)=><text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} textAnchor={anchor} {...rest}>{children}</text>;
const Arrow=({x=0,y=0,color=B,s=1}:any)=><g transform={tx(x,y,0,s)} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"><path d="M-44 28L38-28M-5-28H38V15"/></g>;
const Globe=({color=W}:any)=><g fill="none" stroke={color} strokeWidth="8"><circle r="76"/><ellipse rx="32" ry="76"/><path d="M-72-25H72M-72 25H72M-76 0H76"/></g>;
const Tile=({x=0,y=0,size=240,rotate=0,label='',white=false}:any)=><g transform={tx(x,y,rotate,size/240)}>
 <rect x="-120" y="-120" width="240" height="240" rx="64" fill={white?'url(#paper)':'url(#clay)'} filter="url(#shadow)"/>
 <rect x="-115" y="-115" width="230" height="230" rx="60" fill="none" stroke="url(#edge)" strokeWidth="2"/>
 {label?<Text anchor="middle" y="20" size={label.length>3?42:62} fill={white?K:W}>{label}</Text>:<Globe color={white?B:W}/>}
 </g>;
const Art=({kind=0,x=0,y=0,w=320,h=320}:any)=> <g transform={`translate(${x} ${y})`}>
 <rect width={w} height={h} rx="18" fill={kind%2?K:B}/>
 {kind%3===0?<><circle cx={w*.5} cy={h*.48} r={w*.29} fill={W}/><circle cx={w*.63} cy={h*.38} r={w*.24} fill={B}/><path d={`M${w*.2} ${h*.79}H${w*.8}`} stroke={W} strokeWidth="5"/></>:kind%3===1?<g transform={`translate(${w/2} ${h/2}) rotate(-24)`}>{[0,1,2,3,4].map(i=><rect key={i} x={-w*.32+i*w*.12} y={-h*.31} width={w*.08} height={h*.62} rx={w*.04} fill={i%2?B:W}/>)}</g>:<g transform={`translate(${w/2} ${h/2})`}>{[0,1,2,3].map(i=><rect key={i} x={-w*.26} y={-w*.26} width={w*.52} height={w*.52} rx="22" fill="none" stroke={i%2?W:B} strokeWidth="12" transform={`rotate(${i*22.5})`}/>)}</g>}
 <Text x={22} y={h-24} size={18} fill={W} weight={400}>INTERFLOW / VISUAL STUDY {String(kind+1).padStart(2,'0')}</Text>
 </g>;
const Card=({x=0,y=0,w=300,h=350,rotate=0,index=0,blue=false,art=true}:any)=><g transform={tx(x,y,rotate)}>
 <rect x={-w/2} y={-h/2} width={w} height={h} rx="26" fill={blue?B:W} filter="url(#shadow)"/>
 {art&&<Art x={-w/2+15} y={-h/2+15} w={w-30} h={h*.59} kind={index}/>}
 <Text x={-w/2+25} y={art?h*.26:-h*.1} size={w*.065} fill={blue?W:'#666'} weight={400}>灵感研究 / {String(index+1).padStart(2,'0')}</Text>
 <Text x={-w/2+25} y={art?h*.38:h*.1} size={w*.083} fill={blue?W:K}>{items[index%items.length]}</Text>
 </g>;
const Waterfall=({t=0,opacity=1}:any)=><g opacity={opacity}>
 {[0,1,2,3,4].map(col=>[0,1,2,3].map(row=>{const speed=col%2?100:145;const y=((row*355-t*speed+col*109+2000)%1420)-260;return <Card key={`${col}-${row}`} x={120+col*350} y={y} w={300} h={306} rotate={col%2?4:-4} index={col*4+row}/>;}))}
 </g>;
const Caption=({children,color=K}:any)=><Text x="84" y="118" size="32" fill={color}>{children}</Text>;
const Finish=({p=1}:any)=><g opacity={p}>
 <image href="assets/logo-white.svg" x="565" y="290" width="470" height="136" preserveAspectRatio="xMidYMid meet"/>
 <Text x="800" y="550" size="58" fill={W} anchor="middle">让好的品牌被全球看见。</Text>
 <Text x="800" y="637" size="23" fill={W} weight="400" anchor="middle">看案例 · 找方法 · 一起做事</Text>
 </g>;

// Continuous scene functions: every visual is a deterministic function of frame.
function Discover({t}:{t:number}){
 const introOut=1-win(t,1.6,2.5), streamIn=win(t,1.4,2.4), focus=win(t,5.05,6.6), takeover=win(t,8.6,10.65);
 const cx=mix(1160,800,win(t,1.2,2.7)), cy=mix(450,445,win(t,1.2,2.7));
 const cardW=mix(236,630,focus), cardH=mix(236,360,focus), cover=takeover;
 return <>
 <rect width="1600" height="900" fill={K}/>
 <g opacity={introOut}><Text x={100} y={285} size={42} fill={W} weight={400}>AI时代</Text><Text x={100-mix(80,0,win(t,0,.6))} y={420} size={100} fill={W}>全球品牌</Text><Text x={100} y={555} size={100} fill={W}>新玩法</Text><path d={`M100 596H${100+540*win(t,.35,1)}`} stroke={B} strokeWidth="14"/></g>
 <g opacity={streamIn*(1-win(t,6.1,7.2))} transform={`translate(0 ${-50*focus}) scale(${1+.08*focus})`}><Waterfall t={t-1.5}/><rect width="1600" height="900" fill={K} opacity={.18+.5*focus}/></g>
 <g opacity={fade(t,5.9,6.7,8,8.8)}><Text x="800" y="180" size="31" anchor="middle" fill={W}>从很多参考里，找到自己的方向。</Text></g>
 <g transform={tx(cx,cy,(-8*(1-focus))*(1-win(t,.7,1.8)))}>
 <rect x={-mix(cardW,1750,cover)/2} y={-mix(cardH,1100,cover)/2} width={mix(cardW,1750,cover)} height={mix(cardH,1100,cover)} rx={mix(mix(64,32,focus),0,cover)} fill={focus>.01?B:'url(#clay)'} filter={cover<.5?'url(#shadow)':undefined}/>
 <g opacity={(1-win(t,5,5.7))*(1-cover)} transform={`scale(${1-.15*streamIn})`}><Globe/></g>
 <g opacity={win(t,5.9,6.65)*(1-cover)}><Text x="-265" y="-95" size="22" fill={W} weight={400}>精选方法 / 视觉表达</Text><Text x="-265" y="-10" size="51" fill={W}>把灵感，变成行动。</Text><Text x="-265" y="84" size="25" fill={W} weight={400}>内容 · 创意 · 全球品牌</Text><Arrow x={240} y={95} color={W} s={.55}/></g>
 </g>
 <Finish p={win(t,10.3,11.15)}/>
 </>;
}
function Gallery({t}:{t:number}){
 const open=win(t,1.3,3), select=win(t,5.2,7.1), end=win(t,8.8,10.55);
 return <>
 <rect width="1600" height="900" fill={W}/>
 <defs><clipPath id="word-window"><text x="800" y="565" textAnchor="middle" fontSize="300" fontWeight="700" letterSpacing="-16">看见不同</text></clipPath></defs>
 <g opacity={1-open}><Text x="800" y="195" size="30" anchor="middle" weight={400}>品牌的表达，可以更有意思。</Text><g clipPath="url(#word-window)"><rect width="1600" height="900" fill={K}/>{[0,1,2,3,4].map(i=><Art key={i} x={-200+i*450-t*80} y={230} w={450} h={450} kind={i}/>)}</g></g>
 <g opacity={open*(1-end)}>
 {[0,1,2,3,4].map(i=>{const a=(i-2)*.7+(t-3)*.19;const depth=Math.cos(a);const dim=(1-depth)*.5;const chosen=i===2;const x=chosen?mix(800+Math.sin(a)*650,800,select):800+Math.sin(a)*650;const y=chosen?mix(460+Math.sin(a)*85,430,select):460+Math.sin(a)*85;const scale=(.73+depth*.25)*(chosen?1+select*.4:1-select*.17);return <g key={i} opacity={chosen?1:1-select*.83} transform={tx(x,y,chosen?mix(-5,0,select):Math.sin(a)*8,scale)}><rect x="-186" y="-225" width="372" height="450" rx="27" fill={W} filter="url(#shadow)"/><Art x={-172} y={-211} w={344} h={344} kind={i}/><Text x="-157" y="180" size="27">{['创意','差异','表达','视角','好玩'][i]}，有自己的样子。</Text><rect x="-186" y="-225" width="372" height="450" rx="27" fill={K} opacity={chosen?0:dim*.25}/></g>;})}
 <ellipse cx={500+win(t,5,7.5)*650} cy="390" rx="320" ry="410" fill="url(#spot)" opacity={select}/>
 </g>
 <circle cx="800" cy="430" r={end*1100} fill={B}/>
 <Finish p={win(t,10,10.9)}/>
 </>;
}
function Process({t}:{t:number}){
 const rows=win(t,1.1,2.6), route=win(t,4.1,5.7), join=win(t,7,8.5),end=win(t,9.7,11.05);
 const along=win(t,4.7,7.1),u=along<.5?along*2:(along-.5)*2;
 const cp=along<.5?[[330,485],[500,485],[470,300],[700,300]]:[[700,300],[930,300],[1000,585],[1235,440]];
 const bez=(axis:number)=>cp[0][axis]*(1-u)**3+3*cp[1][axis]*(1-u)**2*u+3*cp[2][axis]*(1-u)*u*u+cp[3][axis]*u**3;
 const toRoute=win(t,4.05,4.7),toJoin=win(t,7.1,9.2);
 const x=mix(mix(1130,bez(0),toRoute),950,toJoin), y=mix(mix(440,bez(1),toRoute),450,toJoin),size=mix(mix(220,44,rows),285,toJoin);
 return <>
 <rect width="1600" height="900" fill={W}/>
 <g opacity={1-rows}><Text x="100" y="330" size="94">一个好问题。</Text><Text x="100" y="455" size="94" fill={B}>找到对的人。</Text><Text x="105" y="548" size="30" weight={400}>懂品牌 × 懂AI</Text></g>
 <g opacity={rows*(1-route)}>
 {['产品是什么','想去哪里','先验证什么'].map((label,i)=>{const p=win(t,1.5+i*.2,2.6+i*.2);return <g key={i} transform={tx(800+mix(520,0,p),330+i*120)} opacity={p}><rect x="-410" y="-45" width="820" height="92" rx="25" fill={i===1?B:'#f0f2f5'}/><Text x="-367" y="12" size="31" fill={i===1?W:K}>{label}</Text><Arrow x="350" y="0" color={i===1?W:B} s=".4"/></g>;})}
 <Text x="800" y="188" size="33" anchor="middle">先把需求，说清楚。</Text>
 </g>
 <g opacity={route*(1-join)}>
 <path d="M330 485C500 485 470 300 700 300S1000 585 1235 440" fill="none" stroke="#e0e4eb" strokeWidth="9"/>
 <path d="M330 485C500 485 470 300 700 300S1000 585 1235 440" fill="none" stroke={B} strokeWidth="9" pathLength="1" strokeDasharray="1" strokeDashoffset={1-win(t,4.7,7.1)} strokeLinecap="round"/>
 {[[330,485,'洞察'],[775,331,'方法'],[1235,440,'行动']].map(([xx,yy,label],i)=><g key={i} transform={tx(Number(xx),Number(yy))}><circle r="23" fill={B}/><circle r="9" fill={W}/><Text y="84" anchor="middle" size="30">{label}</Text></g>)}
 </g>
 <g opacity={join*(1-end)}><Tile x={mix(450,650,win(t,7.1,9.2))} y={450+Math.sin(t*2)*3} size={285} rotate={mix(-12,0,join)} label="品牌" white/><Text x="800" y="195" size="36" anchor="middle">让能力，在同一个问题上相遇。</Text></g>
 <g opacity={1-end}><Tile x={x} y={y} size={size} rotate={mix(-7,0,rows)} label="AI"/></g>
 <circle cx="950" cy="450" r={end*1800} fill={B}/>
 <Finish p={win(t,10.6,11.4)}/>
 </>;
}

function Study({id,t}:{id:number;t:number}){
 if(id>80)return <KimiStudy id={id} t={t}/>;
 if(id>64)return <ExperimentalStudy id={id} t={t}/>;
 if(id>20)return <ExtendedStudy id={id} t={t}/>;
 const p=win(t,0,1), q=win(t,.6,2.9);let scene:React.ReactNode;
 const heading=(s:string,dark=false)=><Caption color={dark?W:K}>{s}</Caption>;
 switch(id){
 case 1: scene=<><rect width="1600" height="900" fill={K}/><Waterfall t={t}/><rect x="0" y="0" width="1600" height="180" fill={K} opacity=".8"/>{heading('持续发现，而不是一屏工具墙。',true)}</>;break;
 case 2: scene=<><rect width="1600" height="900" fill={K}/><g opacity={1-q*.8}><Waterfall t={t*.4}/></g><Card x={800} y={480} w={mix(270,580,q)} h={mix(320,420,q)} index={2} rotate={mix(-8,0,q)}/>{heading('从很多参考里，选出一个重点。',true)}</>;break;
 case 3: scene=<><rect width="1600" height="900" fill={K}/>{[-1,0,1,2,3,4,5].map(i=><Card key={i} x={i*370+220-t*190} y={440+Math.sin(i)*45} w="320" h="370" index={i+3} rotate={i%2?5:-5}/>)}{heading('灵感，保持流动。',true)}</>;break;
 case 4: scene=<>{[0,1,2,3,4].map(i=><g key={i} transform={tx(800,680,(i-2)*17*q)}><Card x={0} y={-180*p} w="280" h="350" index={i}/></g>)}{heading('一次展开，几个不同方向。')}</>;break;
 case 5: scene=<><rect width="1600" height="900" fill={K}/>{[0,1,2].map(i=><g key={i} opacity={.45+i*.25} transform={tx(800+(i-1)*450+(i-1)*q*130,450+(1-i)*q*120,0,.65+i*.16)}><Art x={-210} y={-210} w={420} h={420} kind={i}/></g>)}{heading('前景经过，后景慢慢显露。',true)}</>;break;
 case 6:scene=<Gallery t={2.7+t*.8}/>;break;
 case 7:scene=<>{[0,1,2].map(i=><g key={i} transform={tx(800+(i-1)*q*40,470+(i-1)*q*35,(i-1)*q*8)}><Card w="520" h="330" index={i} art={false}/></g>)}{heading('几层纸面，带出层次。')}</>;break;
 case 8:{const a=win(t,.5,2.9),ww=mix(245,720,a),hh=mix(245,330,a);scene=<><g transform={tx(800,450,mix(-10,0,a))}><rect x={-ww/2} y={-hh/2} width={ww} height={hh} rx={mix(65,28,a)} fill="url(#clay)" filter="url(#shadow)"/><g opacity={1-a}><Globe/></g><Text x="0" y="18" anchor="middle" fill={W} size="52" opacity={a}>同一个对象，新的角色。</Text></g>{heading('形状变了，注意力没有断。')}</>;break;}
 case 9:scene=<Process t={4.4+t*.73}/>;break;
 case 10:scene=<Gallery t={t*.47}/>;break;
 case 11:scene=<><rect width="1600" height="900" fill={K}/>{['有趣。','有用。','有自己的样子。'].map((s,i)=>{const en=win(t,i*.52,i*.52+.48);return <g key={i} opacity={en} transform={`translate(${mix(80,0,en)} 0)`}><Text x="105" y={250+i*180} size={i===2?90:135} fill={i===1?B:W}>{s}</Text></g>})}</>;break;
 case 12:scene=<><rect width="1600" height="900" fill={K}/><g filter="url(#soft)" transform={tx(Math.sin(t)*170,Math.cos(t)*40)}><Art x={300} y={170} w={540} h={540}/><Art x={800} y={330} w={420} h={420} kind={1}/></g><g transform={tx(800,450+mix(70,0,p),mix(-6,0,p))}><rect x="-340" y="-185" width="680" height="370" rx="40" fill="url(#glass)" stroke="url(#edge)" strokeWidth="2" filter="url(#shadow)"/><Text x="-275" y="-70" size="25" fill={W}>透过信息，找到重点。</Text><Text x="-275" y="30" size="66" fill={W}>只聚焦这一件事。</Text><Arrow x="265" y="105" color={W} s=".6"/></g></>;break;
 case 13:scene=<Process t={1.6+t*.63}/>;break;
 case 14:{const a=win(t,1,1.5);scene=<><g transform={`translate(${-a*1750} 0)`}><rect width="1600" height="900" fill={K}/><Text x="800" y="480" anchor="middle" size="150" fill={W}>一个视角。</Text></g><g transform={`translate(${(1-a)*1750} 0)`}><rect width="1600" height="900" fill={B}/><Text x="800" y="480" anchor="middle" size="150" fill={W}>另一个可能。</Text></g>{a>0&&a<1&&[0,1,2].map(i=><rect key={i} x={1500-a*1900+i*60} width="40" height="900" fill={W} opacity=".12"/>)}</>;break;}
 case 15:{const a=win(t,.6,2.7);scene=<><rect width="1600" height="900" fill={B}/><Text x="800" y="490" anchor="middle" size="104" fill={W}>翻到新的可能。</Text><g transform={`translate(170 120) skewY(${a*8}) scale(${Math.max(.001,1-a)} 1)`}><rect width="1260" height="660" rx="12" fill={W} filter="url(#shadow)"/><Text x="100" y="330" size="104">上一页，灵感。</Text><path d="M1220 0V660" stroke="#ddd" strokeWidth="4"/></g></>;break;}
 case 16:scene=<><rect width="1600" height="900" fill={K}/><Text x="800" y="470" size="110" anchor="middle" fill={W}>看见</Text><circle cx="800" cy="450" r={q*1050} fill={B}/><Text x="800" y="480" size="110" anchor="middle" fill={W} opacity={win(t,1.4,2.2)}>新世界。</Text></>;break;
 case 17:{const a=q,points=Array.from({length:96},(_,i)=>{const an=i/96*Math.PI*2;const n=2+5*a;const xx=Math.sign(Math.cos(an))*Math.pow(Math.abs(Math.cos(an)),2/n)*190;const yy=Math.sign(Math.sin(an))*Math.pow(Math.abs(Math.sin(an)),2/n)*190;return `${i?'L':'M'}${800+xx} ${450+yy}`}).join(' ')+'Z';scene=<><path d={points} fill="url(#clay)" filter="url(#shadow)"/><Arrow x="800" y="450" color={W} s={1.4}/>{heading('轮廓变化，主体始终清楚。')}</>;break;}
 case 18:scene=<><rect width="1600" height="900" fill={K}/>{[0,1,2].map(i=><g key={i} opacity={.2+.8*Math.max(0,1-Math.abs(i-q*2))}><Art x={140+i*460} y={270} w={400} h={400} kind={i}/></g>)}<ellipse cx={300+q*1000} cy="470" rx="390" ry="470" fill="url(#spot)"/>{heading('光线，也可以带路。',true)}</>;break;
 case 19:scene=<><Tile x={mix(370,650,q)} y={450} size={290} rotate={mix(-13,0,q)} label="品牌" white/><Tile x={mix(1230,950,q)} y={450} size={290} rotate={mix(13,0,q)} label="AI"/>{heading('互补的能力，在这里相遇。')}</>;break;
 default:scene=<><Tile x={800} y={450} size={240} label="AI"/><rect x={800-mix(120,900,q)} y={450-mix(120,550,q)} width={mix(240,1800,q)} height={mix(240,1100,q)} rx={mix(64,0,q)} fill={B}/><Finish p={win(t,2.2,3)}/></>;
 }
 return <>{scene}</>;
}

function retime(u:number,kind:string){
 if(kind==='flow')return u;
 const points=kind==='punch'?[[0,0],[.12,.08],[.28,.36],[.36,.40],[.52,.43],[.68,.74],[.82,.84],[1,1]]:[[0,0],[.25,.12],[.5,.42],[.75,.85],[1,1]];
 let i=0;while(i<points.length-2&&u>points[i+1][0])i++;
 const slope=(j:number)=>(points[j+1][1]-points[j][1])/(points[j+1][0]-points[j][0]);
 const tangent=(j:number)=>j===0||j===points.length-1?0:2*slope(j-1)*slope(j)/(slope(j-1)+slope(j));
 const h=points[i+1][0]-points[i][0],v=clamp((u-points[i][0])/h),a=points[i][1],b=points[i+1][1];
 return (2*v**3-3*v*v+1)*a+(v**3-2*v*v+v)*h*tangent(i)+(-2*v**3+3*v*v)*b+(v**3-v*v)*h*tangent(i+1);
}
export const FrameFilm=({mode,id,frame,rhythm='flow',media,focus,intensity}:{mode:string;id:number;frame:number;rhythm?:string}&CameraOptions)=>{
 const length=mode.startsWith('c-')?16:mode==='study'?(id>88?8:id>64?6:4):12;
 const t=retime(frame/60/length,rhythm)*length;
 if(mode.startsWith('c-')||mode==='study'&&id>88)return <CameraFrame mode={mode} id={id} t={t} media={media} focus={focus} intensity={intensity}/>;
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" style={{fontFamily:'InterflowCN, sans-serif',display:'block',background:W}}>
 <Defs/>
 {mode.startsWith('k-')?<KimiCombo mode={mode} t={t}/>:mode.startsWith('x-')?<ExperimentalCombo mode={mode} t={t}/>:mode==='study'?<Study id={id} t={t}/>:mode==='gallery'?<Gallery t={t}/>:mode==='process'?<Process t={t}/>:mode==='discover'?<Discover t={t}/>:<ExtraCombo mode={mode} t={t}/>}
 {!(mode.startsWith('x-')||mode.startsWith('k-')||mode==='study'&&id>64)&&<Text x="1518" y="855" size="17" anchor="end" fill={mode==='gallery'||mode==='process'?K:'#8a8f96'} weight={400}>MOTION STUDY / INTERFLOW</Text>}
 </svg>;
};
export const MotionFilm=(props:{mode:string;id:number;rhythm?:string}&CameraOptions)=><FrameFilm {...props} frame={useCurrentFrame()}/>;
