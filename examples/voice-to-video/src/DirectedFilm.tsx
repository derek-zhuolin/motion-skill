import React from 'react';
import {CaptionFrame} from './Captions';
import {AbsoluteFill,Html5Audio,OffthreadVideo,Sequence,staticFile,useCurrentFrame} from 'remotion';
import theme from './theme.json';
const B=theme.blue,I=theme.ink,P=theme.paper;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
export const phase=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export function sceneAt(plan:any,t:number){return plan.scenes.find((s:any)=>t>=s.start&&t<s.end)||plan.scenes[plan.scenes.length-1]}
const Txt=({x=0,y=0,size=40,fill=I,weight=700,anchor='start',children,...rest}:any)=><text x={x} y={y} fontFamily="InterflowCN,Figtree,sans-serif" fontSize={size} fontWeight={weight} textAnchor={anchor} fill={fill} {...rest}>{children}</text>;
const Group=({t,a,b,children}:any)=>{const p=(t<b?1:0)*phase(t,a,a+.55);return <g opacity={p} transform={`translate(0 ${20*(1-phase(t,a,a+.7))})`}>{children}</g>};
function Wave({x=0,y=0,w=160,h=50,t=0,white=true,flat=false}:any){return <g>{Array.from({length:29},(_,i)=>{const f=Number(flat);const a=mix(.18+.72*Math.pow(Math.abs(Math.sin(i*1.83+.2)),1.5),.25,f);const v=mix(.76+.24*Math.sin(t*5+i*.45),1,f);const height=Math.max(7,h*a*v);return <rect key={i} x={x-w/2+i*w/28-2} y={y-height/2} width={4} height={height} rx={2} fill={white?'#fff':B}/>})}</g>}
function Capsule({t}:any){
 const keys=[[0,1185,660,220,100],[9.9,1185,660,220,100],[11,1090,530,350,144],[16.9,1090,530,350,144],[18.0,1150,712,255,78],[21.9,1150,712,255,78],[24.18,475,487,255,106],[25.4,475,669,255,78],[30.72,475,669,255,78],[32,1120,650,255,78],[38.76,1120,650,255,78],[40.1,1165,709,255,78],[44.4,1165,709,255,78],[46.5,800,648,330,88],[48.064,800,648,330,88]];
 let k=keys[0],j=keys[keys.length-1];for(let n=0;n<keys.length-1;n++)if(t>=keys[n][0]&&t<keys[n+1][0]){k=keys[n];j=keys[n+1];break}
 const p=phase(t,k[0],j[0]),x=mix(k[1],j[1],p),y=mix(k[2],j[2],p),w=mix(k[3],j[3],p),h=mix(k[4],j[4],p);
 return <g data-object="voice-capsule" transform={`translate(${x} ${y})`}><rect x={-w/2} y={-h/2} width={w} height={h} rx={h/2} fill={B}/><Wave t={t} w={w*.71} h={h*.64} flat={phase(t,46.48,47.05)}/></g>
}
function Phone({t}:any){const q=phase(t,17.1,18.4);return <g transform={`translate(${mix(1090,1150,q)} ${mix(440,446,q)})`} opacity={q}>
 <rect x={-185} y={-270} width={370} height={540} rx={50} fill={I}/><rect x={-175} y={-260} width={350} height={520} rx={42} fill="#fff"/>
 <rect x={-49} y={-245} width={98} height={22} rx={11} fill={I}/><Txt y={-158} size={23} anchor="middle" fill="#85898D" weight={400}>录音</Txt>
 <Txt y={-91} size={58} anchor="middle">00:{Math.max(0,Math.min(48,Math.floor(t-18))).toString().padStart(2,'0')}</Txt>
 <circle cy={175} r={30} fill={B}/><rect x={-8} y={167} width={16} height={16} rx={4} fill="#fff"/>
 <path d="M-55 239H55" stroke={I} strokeWidth={5} strokeLinecap="round"/>
 </g>}
function Agent({t}:any){const p=phase(t,22.75,23.35);return <g opacity={p} transform={`translate(475 487) scale(${.92+.08*p})`}>
 <rect x={-208} y={-164} width={416} height={328} rx={38} fill={I}/>
 <Txt x={-165} y={-99} size={24} fill="#fff" weight={400}>Agent</Txt><circle cx={163} cy={-108} r={6} fill="#6BDFAD"/>
 <rect x={-148} y={-66} width={296} height={132} rx={66} stroke="#42474E" strokeWidth={2} fill="#24272B"/>
 <path d="M-156 116H156" stroke="#42474E" strokeWidth={2}/>
 </g>}
function FilmCard({x,y,w=700,h=400,t=0}:any){return <g transform={`translate(${x} ${y})`}>
 <rect width={w} height={h} rx={24} fill={I}/><path d={`M24 53H${w-24}`} stroke="#ffffff25"/>
 <circle cx={28} cy={27} r={4} fill="#fff"/><circle cx={44} cy={27} r={4} fill="#ffffff50"/><circle cx={60} cy={27} r={4} fill="#ffffff25"/>
 <Txt x={w*.08} y={h*.41} size={w*.075} fill="#fff">让想法，</Txt><Txt x={w*.08} y={h*.64} size={w*.1} fill="#fff">被看见。</Txt>
 <g transform={`translate(${w*.76} ${h*.48})`}><rect x={-w*.12} y={-h*.16} width={w*.24} height={h*.32} rx={h*.16} fill={B}/><Wave t={t} w={w*.16} h={h*.19}/></g>
 <Txt x={w*.08} y={h*.87} size={w*.024} fill="#B0B3BA" weight={400}>Motion Skill</Txt>
 </g>}
function Footer({t,dark}:any){return <g opacity={t<46.3?1:1-phase(t,46.3,46.8)}><path d="M82 828H1518" stroke={dark?'#ffffff24':'#14141422'} strokeWidth={1}/><Txt x={84} y={866} size={18} fill={dark?'#fff':I} weight={400}>MOTION SKILL</Txt><Txt x={1516} y={866} size={18} fill={dark?'#9FACC0':'#757A82'} weight={400} anchor="end">VOICE → VIDEO</Txt></g>}
export function DirectedFrame({plan,frame}:{plan:any;frame:number}){
 const t=frame/plan.fps,dark=t>=31.1&&t<39.1;
 const last=0,bg=dark?I:P;
 return <svg viewBox="0 0 1600 900" width="1600" height="900" style={{width:'100%',height:'100%',display:'block',background:bg}} data-frame={frame} data-scene={sceneAt(plan,t)?.id}>
 <defs><clipPath id="workspace-crop"><rect x={808} y={228} width={701} height={407} rx={21}/></clipPath><pattern id="dots" width={32} height={32} patternUnits="userSpaceOnUse"><circle cx={1} cy={1} r={1} fill={`${I}12`}/></pattern></defs>
 <rect width={1600} height={900} fill={bg}/>{!dark&&<rect width={1600} height={900} fill="url(#dots)"/>}
 <Group t={Math.max(t,.7)} a={0} b={9.9}>
 <Txt x={84} y={120} size={20} fill="#6D737B" weight={400}>01 / 表达的门槛</Txt>
 <Txt x={84} y={336} size={104}>不想露脸，</Txt><Txt x={84} y={475} size={104}>内容就卡住？</Txt>
 <path d="M87 533H710" stroke={B} strokeWidth={10}/>
 <g opacity={1-phase(t,3.9,4.4)} transform={`translate(1185 425) rotate(${-8*(1-phase(t,3.4,4.2))})`}>
 <rect x={-235} y={-185} width={470} height={370} rx={28} fill="#fff" stroke="#D2D5D9" strokeWidth={2}/>
 <Txt x={-189} y={-125} size={24} weight={400} fill="#737982">露脸</Txt><path d="M-82-51H46V35H-82Z M46-23L96-52V38L46 9" stroke={I} strokeWidth={10} fill="none" strokeLinejoin="round"/>
 <path d="M-107-88L119 91" stroke={B} strokeWidth={13} strokeLinecap="round"/>
 <g opacity={phase(t,3.6,4.2)}><rect x={-217} y={92} width={434} height={73} rx={12} fill="#EFEFEB"/><Txt x={-188} y={140} size={24} weight={400}>表达</Txt><path d="M-100 128H177" stroke="#C5C9CE" strokeWidth={7} strokeDasharray="5 12"/></g>
 </g>

 <g opacity={phase(t,3.9,4.6)}>
 <rect x={795} y={215} width={727} height={433} rx={30} fill="#fff" stroke="#D1D7DE" strokeWidth={2}/>
 <image href={staticFile('assets/stock/workspace-photo.jpg')} x={808} y={228} width={701} height={407} preserveAspectRatio="xMidYMid slice" clipPath="url(#workspace-crop)"/>
 <rect x={824} y={582} width={245} height={38} rx={19} fill={`${I}DF`}/>
 <Txt x={947} y={608} size={18} fill="#fff" anchor="middle" weight={400}>创作工作台</Txt>
 </g>
 </Group>
 <Group t={t} a={9.9} b={17.1}>
 <Txt x={84} y={120} size={20} fill="#6D737B" weight={400}>02 / 从声音开始</Txt>
 <Txt x={84} y={339} size={112}>先把想法</Txt><Txt x={84} y={490} size={132} fill={B}>说出来。</Txt>
 <g opacity={phase(t,10.4,11.1)}><circle cx={1090} cy={530} r={213} stroke={`${B}24`} strokeWidth={2} fill="none"/><circle cx={1090} cy={530} r={170} stroke={`${B}30`} strokeWidth={2} fill="none"/><path d="M1061 249V218M1328 530H1358M1090 788V760" stroke={B} strokeWidth={3}/></g>
 <Txt x={84} y={661} size={32} fill="#767B83" weight={400}>先表达</Txt>
 </Group>
 <Group t={t} a={17.1} b={24.45}>
 <Txt x={84} y={120} size={20} fill="#6D737B" weight={400}>03 / 一次交接</Txt>
 <g opacity={1-phase(t,22.1,22.7)}><Txt x={84} y={346} size={107}>录下灵感，</Txt><Txt x={84} y={480} size={107} fill={B}>交给 Agent。</Txt></g>
 <Agent t={t}/>
 <path d="M940 487H713" stroke={B} strokeWidth={3} strokeDasharray="7 10" opacity={phase(t,23.0,23.4)}/>
 <g opacity={phase(t,22.75,23.35)}><Txt x={974} y={331} size={72}>交给</Txt><Txt x={974} y={420} size={90} fill={B}>Agent。</Txt></g>
 </Group>
 <Group t={t} a={24.45} b={31.1}>
 <Txt x={84} y={120} size={20} fill="#6D737B" weight={400}>04 / 声音长成画面</Txt>
 <Txt x={84} y={255} size={84}>声音，长成画面。</Txt>
 <g opacity={phase(t,24.5,25.1)}><rect x={84} y={322} width={1432} height={418} rx={27} fill="#fff" stroke="#D2D5D9" strokeWidth={2}/>
 {[0,1,2].map((n)=><g key={n} transform={`translate(0 ${n*110})`}><Txt x={122} y={387} size={24} fill="#757A82" weight={400}>{['画面','动效','剪辑'][n]}</Txt><path d="M223 378H1468" stroke="#E0E3E7" strokeWidth={1}/></g>)}
 {[0,1,2,3].map((n)=><g key={n} opacity={phase(t,25.3+n*.24,25.9+n*.24)} transform={`translate(${255+n*298} 345)`}><rect width={274} height={70} rx={13} fill={n===2?I:'#EAF2FA'}/><path d="M25 45L64 20L103 42L141 22L177 45H245" fill="none" stroke={n===2?'#fff':B} strokeWidth={3}/></g>)}
 {[0,1,2].map((n)=><g key={n} opacity={phase(t,26.1+n*.18,26.6+n*.18)}><rect x={255+n*397} y={454} width={372} height={70} rx={13} fill={n===1?B:'#EBEDF1'}/><circle cx={285+n*397} cy={489} r={8} fill={n===1?'#fff':B}/><path d={`M${315+n*397} 489H${590+n*397}`} stroke={n===1?'#fff':'#B1BBC9'} strokeWidth={3}/></g>)}
 <g opacity={phase(t,26.9,27.4)}><rect x={255} y={564} width={1159} height={68} rx={13} fill={I}/><Wave x={835} y={598} w={1090} h={44} t={t}/></g>
 <path d={`M${mix(255,1414,phase(t,25.7,30.5))} 334V733`} stroke={B} strokeWidth={2}/>
 </g>
 </Group>
 <Group t={t} a={31.1} b={39.1}>
 <Txt x={84} y={120} size={20} fill="#9AABC0" weight={400}>05 / 把创作留给你</Txt>
 <Txt x={84} y={315} size={100} fill="#fff">你负责</Txt><Txt x={84} y={487} size={160} fill="#fff">观点。</Txt>
 <g opacity={phase(t,31.4,32.2)}>{['灵感','判断','表达'].map((s,n)=><g key={s} transform={`translate(${920+n*195} ${310+n*90})`}><circle r={9} fill={B}/><Txt x={-5} y={72} size={52} fill="#fff">{s}</Txt></g>)}</g>
 <path d="M930 314L1115 400L1310 492" stroke="#8292A433" strokeWidth={2} fill="none"/>
 <g opacity={phase(t,37.5,38.3)}><Txt x={84} y={692} size={47} fill="#72B8F8">Motion Skill</Txt></g>
 </Group>
 <g opacity={phase(t,39.1,39.7)}>
 <g opacity={1-phase(t,44.4,44.9)}>
 <Txt x={84} y={120} size={20} fill="#6D737B" weight={400}>06 / 从声音，到作品</Txt>

 <g transform="translate(890 280)"><rect width={540} height={372} rx={28} fill="#fff" stroke="#CFD5DC" strokeWidth={2}/><path d="M0 51H540" stroke="#DDE2E8"/><circle cx={24} cy={25} r={5} fill={B}/><Txt x={42} y={33} size={16} fill="#6D737B" weight={400}>Motion Skill</Txt><g transform="translate(23 74)"><FilmCard x={0} y={0} w={494} h={278} t={t}/></g></g>
 </g>
 <Txt x={mix(84,336,last)} y={mix(345,492,phase(last,.78,1))} size={mix(115,116,last)}>让想法，</Txt>
 <Txt x={mix(84,800,last)} y={mix(490,492,last)} size={mix(142,116,last)} fill={B}>被看见。</Txt>
 <g opacity={last}>
 <path d={`M${mix(890,80,last)} ${mix(280,175,last)}H${mix(1430,1520,last)}`} stroke="#14141422" strokeWidth={1}/>
 <Txt x={800} y={330} size={32} fill="#717A85" anchor="middle" weight={400}>Motion Skill</Txt>

 <path d="M80 777H1520" stroke="#14141422" strokeWidth={1}/>
 </g>
 </g>
 <g opacity={1-phase(t,44.35,44.7)}><Capsule t={t}/><Footer t={t} dark={dark}/></g>
 {t>=44.35&&<g data-object="motion-endcard">
 <rect width={1600} height={900} fill={I} opacity={phase(t,44.35,44.7)}/>
 <g opacity={phase(t,44.35,44.95)}>
 <Txt x={800} y={245} size={21} anchor="middle" fill="#A7B1C1" weight={400} letterSpacing="5">VOICE → VIDEO</Txt>
 <g transform={`translate(800 ${mix(485,465,phase(t,44.35,44.95))}) scale(${mix(.89,1,phase(t,44.35,44.95))})`}>
 <Txt x={0} y={0} size={190} anchor="middle" fill="#fff" fontFamily="Figtree,InterflowCN,sans-serif" letterSpacing="-5">Motion Skill</Txt></g>
 <path d="M292 520H1308" stroke={B} strokeWidth={5}/>
 <Txt x={800} y={613} size={44} anchor="middle" fill="#E2E8F0" weight={400}>让想法，被看见。</Txt>
 <g transform="translate(800 723)"><rect x={-115} y={-34} width={230} height={68} rx={34} fill={B}/><Wave t={t} w={162} h={42} flat={phase(t,46.48,47.05)}/></g>
 </g></g>}
 <CaptionFrame frame={frame} fps={plan.fps}/>
 </svg>
}
export function DirectedFilm({plan,sound=false}:{plan:any;sound?:boolean}){
 const frame=useCurrentFrame(),t=frame/plan.fps;
 const visibility=phase(t,17.1,17.65)*(1-phase(t,22.0,22.5));
 return <AbsoluteFill style={{background:P}}>
 {sound&&plan.source.voice_url&&<Html5Audio src={staticFile(plan.source.voice_url)}/>}
 <DirectedFrame plan={plan} frame={frame}/>
 <Sequence from={Math.round(17.1*plan.fps)} durationInFrames={Math.round(5.4*plan.fps)} layout="none">
 <div data-real-footage="phone-hands" style={{position:'absolute',left:805,top:220,width:710,height:400,borderRadius:28,overflow:'hidden',opacity:visibility,transform:`translateY(${20*(1-phase(t,17.1,17.65))}px)`,border:'2px solid #D2D8DF'}}>
 <OffthreadVideo src={staticFile('assets/stock/phone-hands-clip.mp4')} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>
 </div></Sequence>
 </AbsoluteFill>
}
