import React from 'react';
import {Loop,Video,staticFile} from 'remotion';
export type MediaAsset={url:string;type:'image'|'video';name:string;width:number|null;height:number|null;duration?:number;past?:boolean};
export type CameraOptions={media?:MediaAsset[];focus?:{x:number;y:number};intensity?:number};
export const sampleMedia:MediaAsset[]=[{url:'assets/study-placeholder.svg',type:'image',name:'自制结构示意图 · 非真实案例',width:1600,height:900,past:false}];
export const cameraSources:Record<string,{name:string;url:string;use:string;scope:string}>= {
 controls:{name:'Camera Controls',url:'https://github.com/yomotsu/camera-controls',use:'位置、注视点与推拉距离之间的关系',scope:'只参考镜头控制思路；库依赖Three.js，本轮未安装或调用。'},
 theatre:{name:'Theatre.js',url:'https://github.com/theatre-js/theatre',use:'多个属性在同一条时间线上编排',scope:'只参考时间线思路，仍使用Remotion帧驱动。'},
 grid:{name:'Codrops · Scroll3DGrid',url:'https://github.com/codrops/Scroll3DGrid',use:'真实图片的空间排布与透视关系',scope:'此处为CSS透视近似实现，未复制上游图片或代码。'},
 rotate:{name:'Codrops · RotatingOnScrollAnimations',url:'https://github.com/codrops/RotatingOnScrollAnimations',use:'旋转、景别与图片平面之间的交接',scope:'把滚动交互改编为固定时长镜头；未接入滚动库。'},
 repeat:{name:'Codrops · RepeatingImageTransition',url:'https://github.com/codrops/RepeatingImageTransition',use:'同一张图以不同画框接力，延续视线',scope:'此处的构图与路径，未复制上游图片。'},
 burns:{name:'3D Ken Burns · 研究参考',url:'https://github.com/sniklaus/3d-ken-burns',use:'单图深度与视差的可能性',scope:'原项目含CUDA/CuPy且为非商业许可，本轮未使用其代码、模型或推理；这里只列为后续研究。'},
};
export const cameraStudies=[
 {id:89,name:'从全貌，走进一个细节',category:'取景与讲述',source:'controls',tag:'推镜 / 取景',desc:'让观众先理解现场，再沿手动选定的焦点走近。适合真实照片、人物和产品细节；单张图用取景缩放实现，不补画面外内容。',recipe:'全景建立 → 沿焦点推近 → 留出观察时间',limit:'平面取景移动，不是重建真实空间；焦点由你设置。'},
 {id:90,name:'前景掠过，视线继续向前',category:'运镜与遮挡',source:'theatre',tag:'横移 / 前景遮挡',desc:'画面缓慢横移，一道柔化的前景经过，给主体建立“从别处看进去”的感觉。前景是独立的编辑遮挡层。',recipe:'横向取景 → 前景经过 → 主体重新出现',limit:'遮挡层为编排图形，不冒充原片里存在的门框或人物。'},
 {id:91,name:'围着作品，换一个观看角度',category:'空间与视角',source:'grid',tag:'平面环视 / 画廊',desc:'把三张真实素材放进空间，用观看角度变化建立前后关系。适合案例、作品和同一场活动的不同照片。',recipe:'作品进入视野 → 平面角度变化 → 聚焦中央作品',limit:'环绕的是图片平面，不能显示照片人物背面。是旧环绕画廊的实素材升级。'},
 {id:92,name:'穿过画框，进入下一镜',category:'运镜与遮挡',source:'repeat',tag:'窗口穿越 / 接力',desc:'下一张素材先作为画中窗口出现，然后随画框扩大接管视野。适合从案例总览进入现场、作品或细节。',recipe:'画面中的窗口 → 窗口成为主视野 → 下一镜落定',limit:'编辑式窗口转场，不宣称两张照片来自物理连续机位。'},
 {id:93,name:'转动视角，把动作接过去',category:'运镜与遮挡',source:'rotate',tag:'滚转 / 方向匹配',desc:'两张素材沿同一方向滚转和横移，在快速段交接，再缓下来。适合节拍较快但仍需要看清素材的短片。',recipe:'短暂停留 → 滚转横移 → 下一镜同方向接入',limit:'模糊是过渡近似，不是真实快门运动模糊。'},
 {id:94,name:'镜头移动，解释跟着细节走',category:'取景与讲述',source:'controls',tag:'取景 / 锚定标注',desc:'镜头推进时，圆点和引线始终对应你手动指定的图像位置。适合解释作品细节、产品使用方式或一项观察。',recipe:'建立全貌 → 推近重点 → 标注与细节共同移动',limit:'手动位置锚定，未接AI检测或视频目标追踪。'},
 {id:95,name:'把清晰，交给正在讲的地方',category:'取景与讲述',source:'theatre',tag:'焦点接力 / 分区模拟',desc:'在同一张素材上移动清晰区域，再让全画幅恢复清晰。适合把视线从环境引向一个内容重点。',recipe:'局部清晰 → 焦点窗移动 → 全幅恢复清晰',limit:'分区清晰度模拟；没有估计人物深度或真实镜头焦平面。'},
 {id:96,name:'主体稳住，空间发生变化',category:'空间与视角',source:'controls',tag:'透视推拉 / 画廊',desc:'同步改变观看距离与透视，让中央图片大小基本稳定、前后图片的关系变化。适合有一点紧张感或惊喜的品牌揭露。',recipe:'中央作品稳定 → 距离与透视同时变化 → 留出呼吸',limit:'在图片平面画廊中演示推拉变焦的关系，不是对单图原场景做真实Dolly Zoom。'},
];
export const cameraCombos=[
 {id:'c-observe',name:'从现场，走进一个好问题',tag:'观察与解释',note:'全景 → 推近 → 锚定说明 → 焦点回到现场',ids:[89,94,95],desc:'同一张真实素材贯穿16秒。先建立环境，再推近手动焦点，让解释与画面共同移动，最后回到全貌。'},
 {id:'c-gallery',name:'让素材，拥有空间与节奏',tag:'作品与镜头',note:'空间画廊 → 窗口穿越 → 同向滚转 → 透视推拉',ids:[91,92,93,96],desc:'用多张素材试观看角度和景别变化。它是一组预设的16秒编辑编排，可以替换成本机图片或视频。'},
];
const K='#141414',B='#0070DB',W='#fff';
const sat=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{n=sat(n);return n*n*n*(n*(n*6-15)+10)};
const win=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function Media({asset,focus={x:.5,y:.62},style={}}:{asset:MediaAsset;focus?:{x:number;y:number};style?:React.CSSProperties}){
 const view={width:'100%',height:'100%',objectFit:'cover' as const,objectPosition:`${focus.x*100}% ${focus.y*100}%`,display:'block',...style};
 return asset.type==='video'?<Loop durationInFrames={Math.max(1,Math.round((asset.duration||8)*60))}><Video src={/^(https?:|data:|blob:)/.test(asset.url)?asset.url:staticFile(asset.url)} muted volume={0} playsInline pauseWhenBuffering style={view}/></Loop>:<img src={/^(https?:|data:|blob:)/.test(asset.url)?asset.url:staticFile(asset.url)} alt={asset.name} draggable={false} style={view}/>;
}
function Overlay({title,subtitle,asset,id}:{title:string;subtitle?:string;asset:MediaAsset;id:number}){return <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:40}}>
 <svg viewBox="0 0 1600 900" width="1600" height="900" style={{position:'absolute',inset:0}}><defs><linearGradient id="camera-vignette" x1="0" y1="0" x2="0" y2="1"><stop stopColor={K} stopOpacity=".35"/><stop offset=".23" stopColor={K} stopOpacity="0"/><stop offset=".6" stopColor={K} stopOpacity="0"/><stop offset="1" stopColor={K} stopOpacity=".72"/></linearGradient></defs><rect width="1600" height="900" fill="url(#camera-vignette)"/><text x="68" y="66" fontSize="19" fill={W} letterSpacing="3" fontFamily="Figtree">INTERFLOW / CAMERA {id}</text><text x="1530" y="66" textAnchor="end" fontSize="20" fill={W}>{asset.past?'往期现场 · 原色素材':'本机素材 · 当前会话'}</text><path d="M70 744H130" stroke={B} strokeWidth="7"/><text x="68" y="805" fontSize="48" fontWeight="700" fill={W}>{title}</text>{subtitle&&<text x="70" y="853" fontSize="23" fill={W} opacity=".8">{subtitle}</text>}</svg>
 </div>}
const Stage=({children,perspective=1400}:any)=><div style={{position:'absolute',inset:0,perspective,overflow:'hidden',background:K}}>{children}</div>;
function Plane({asset,x=0,y=0,z=0,rx=0,ry=0,rz=0,width=850,height=550,focus,style={}}:any){return <div style={{position:'absolute',left:'50%',top:'50%',width,height,transform:`translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) translate(-50%,-50%)`,transformStyle:'preserve-3d',backfaceVisibility:'hidden',border:'8px solid #fff',boxShadow:'0 22px 55px #0007',overflow:'hidden',...style}}><Media asset={asset} focus={focus}/></div>}
const Base=({asset,focus,scale=1,x=0,y=0,roll=0,blur=0}:any)=><div style={{position:'absolute',inset:0,transform:`translate3d(${x}px,${y}px,0) rotate(${roll}deg) scale(${scale})`,filter:blur?`blur(${blur}px)`:undefined,willChange:'transform'}}><Media asset={asset} focus={focus}/></div>;
const Annotation=({x,y,opacity=1,label='看这个细节',anchor='right'}:any)=>{const right=anchor==='right';const endX=Math.max(320,Math.min(1280,x+(right?260:-260))),endY=Math.max(140,y-145);return <svg viewBox="0 0 1600 900" style={{position:'absolute',inset:0,width:1600,height:900,pointerEvents:'none',opacity}}><circle cx={x} cy={y} r="13" fill={W}/><circle cx={x} cy={y} r="24" stroke={W} fill="none" strokeWidth="2"/><path d={`M${x} ${y}L${x+(right?55:-55)} ${endY}H${endX}`} fill="none" stroke={W} strokeWidth="3"/><rect x={endX+(right?0:-235)} y={endY-31} width="235" height="63" rx="8" fill={B}/><text x={endX+(right?20:-215)} y={endY+10} fontSize="28" fill={W}>{label}</text></svg>};
export function CameraFrame({id=89,mode='study',t,media=sampleMedia,focus={x:.56,y:.63},intensity=1,overlay=true}:{id?:number;mode?:string;t:number;overlay?:boolean}&CameraOptions){
 const assets=media.length?media:sampleMedia,a=assets[0],b=assets[1]||a,d=assets[2]||b;let scene:React.ReactNode;let title=cameraStudies.find(s=>s.id===id)?.name||'',sub='';const strength=intensity;
 if(mode==='c-observe'){
 const p=win(t,.5,6.3)*(1-win(t,12.4,15.8)),s=1.03+p*.62*strength,x=(.5-focus.x)*1600*p*.9,y=(.5-focus.y)*900*p*.7;
 const tx=800+(focus.x*1600-800)*s+x,ty=450+(focus.y*900-450)*s+y;
 const focusPhase=win(t,7.2,8)*(1-win(t,10.8,11.6));
 scene=<><Base asset={a} focus={focus} scale={s} x={x} y={y} blur={focusPhase*6}/>{focusPhase>0&&<div style={{position:'absolute',inset:0,opacity:focusPhase,clipPath:`inset(${Math.max(0,ty-170)/9}% ${Math.max(0,1600-tx-230)/16}% ${Math.max(0,900-ty-170)/9}% ${Math.max(0,tx-230)/16}% round 20px)`}}><Base asset={a} focus={focus} scale={s} x={x} y={y}/></div>}<Annotation x={tx} y={ty} opacity={win(t,5,6.7)*(1-win(t,11.5,12.7))}/></>;title=t<5?'先看见现场。':t<12?'再把一个问题，讲清楚。':'让观察，回到真实。';sub='同一张素材 · 手动焦点 · 16秒连续镜头';
 }else if(mode==='c-gallery'){
 const ids=[91,92,93,96];scene=<>{ids.map((sid,i)=>{const local=t-i*4;if(local<-.7||local>4.1)return null;const en=i===0?1:win(t,i*4-.7,i*4+.1);return <div key={sid} style={{position:'absolute',inset:0,clipPath:i===0?undefined:`inset(0 ${100-en*100}% 0 0)`}}><CameraFrame overlay={false} id={sid} t={sat((local+.7)/4.7)*7.9} media={assets} focus={focus} intensity={intensity}/></div>})}</>;title='从一个角度，到另一种理解。';sub='多素材预设编排 · 16秒';
 }else if(id===89){
 const p=win(t,.3,6.3),s=1.02+p*.65*strength;scene=<Base asset={a} focus={focus} scale={s} x={(.5-focus.x)*1600*p} y={(.5-focus.y)*900*p*.8}/>;sub='全貌 → 细节 · 手动取景';
 }else if(id===90){
 const p=win(t,0,7.8);scene=<><div style={{position:'absolute',inset:'-30px',transform:`perspective(1400px) rotateY(${mix(-3,3,p)*strength}deg) translateX(${mix(100,-100,p)*strength}px) scale(1.13)`}}><Media asset={a} focus={focus}/></div>{[0,1].map(i=><div key={i} style={{position:'absolute',top:-60,bottom:-60,left:-500+p*2300+i*140,width:i?35:130,background:K,filter:`blur(${i?6:16}px)`,opacity:i?.65:.96,transform:'rotate(-4deg)'}}/>)}</>;sub='平面取景横移 · 前景遮挡图层';
 }else if(id===91){
 const p=win(t,.2,7.6);scene=<Stage perspective={1450}><div style={{position:'absolute',inset:0,transformStyle:'preserve-3d',transform:`rotateX(-3deg) rotateY(${mix(-6,6,p)}deg)`}}>{[-2,-1,0,1,2].map((i)=>{const an=(i*37-mix(-24,24,p)*strength)*Math.PI/180;return <Plane key={i} asset={assets[(i+3)%assets.length]} x={Math.sin(an)*1050} y={i%2?15:-15} z={Math.cos(an)*1050-1050} ry={an*180/Math.PI} width={690} height={490} focus={focus}/>})}</div></Stage>;sub='围绕的是图片平面 · 原场景未做3D重建';
 }else if(id===92){
 const p=win(t,.6,6.6),q=win(t,2.5,6.8);scene=<><Base asset={a} focus={focus} scale={1.05+p*.35*strength} x={-p*40*strength}/><div style={{position:'absolute',inset:0,clipPath:`inset(${mix(36,0,q)}% ${mix(36,0,q)}% round ${mix(12,0,q)}px)`}}><Base asset={b} focus={focus} scale={mix(1.3,1.02,q)}/></div><div style={{position:'absolute',inset:`${mix(36,0,q)}%`,border:`${mix(12,0,q)}px solid #fff`,borderRadius:mix(12,0,q),boxShadow:q<.95?'0 12px 80px #0008':undefined,pointerEvents:'none'}}/></>;sub='画中窗口接管视野 · 编辑式空间转场';
 }else if(id===93){
 const p=win(t,2.55,3.65),settle=win(t,3.7,7.5),blur=Math.sin(p*Math.PI)*12;scene=<><div style={{position:'absolute',inset:-100,transform:`translateX(${-p*1850}px) rotate(${mix(3,-12,p)*strength}deg) scale(1.12)`,filter:`blur(${blur}px)`}}><Media asset={a} focus={focus}/></div><div style={{position:'absolute',inset:-100,transform:`translateX(${(1-p)*1850}px) rotate(${mix(12,0,p)*strength}deg) scale(${mix(1.18,1.03,settle)})`,filter:`blur(${blur}px)`}}><Media asset={b} focus={focus}/></div></>;sub='方向匹配 · 快速连接与可读停留';
 }else if(id===94){
 const p=win(t,.3,6.5),s=1.05+.45*p*strength,x=(.5-focus.x)*1600*p,y=(.5-focus.y)*900*p*.9;const tx=800+(focus.x*1600-800)*s+x,ty=450+(focus.y*900-450)*s+y;scene=<><Base asset={a} focus={focus} scale={s} x={x} y={y}/><Annotation x={tx} y={ty} opacity={win(t,1.8,3.3)}/></>;sub='图像坐标锚定 · 非AI检测或视频跟踪';
 }else if(id===95){
 const p=win(t,.5,5.4),all=win(t,5.8,7.8),cx=mix(.28,sat(.28+(focus.x-.28)*strength),p),cy=mix(.52,sat(.52+(focus.y-.52)*strength),p),ww=mix(.26,1.7,all),hh=mix(.4,1.7,all);const l=Math.max(0,cx-ww/2)*100,r=Math.max(0,1-cx-ww/2)*100,top=Math.max(0,cy-hh/2)*100,bt=Math.max(0,1-cy-hh/2)*100;
 scene=<><Base asset={a} focus={focus} scale={1.04} blur={8*(1-all)}/><div style={{position:'absolute',inset:0,clipPath:`inset(${top}% ${r}% ${bt}% ${l}% round 16px)`}}><Base asset={a} focus={focus} scale={1.04}/></div>{all<.98&&<div style={{position:'absolute',left:`${l}%`,right:`${r}%`,top:`${top}%`,bottom:`${bt}%`,border:'2px solid #fff9',borderRadius:16,opacity:1-all}}/>}</>;sub='清晰区域移动 · 分区模拟，非真实景深';
 }else{
 const p=win(t,.4,7.4),distance=mix(2200,Math.max(500,2200-1400*strength),p),focal=distance*.92;scene=<Stage perspective={focal}><div style={{position:'absolute',inset:0,transformStyle:'preserve-3d',transform:`translateZ(${focal-distance}px)`}}><Plane asset={b} x={-850} z={-850} ry={22} width={760} height={560} focus={focus}/><Plane asset={d} x={850} z={-850} ry={-22} width={760} height={560} focus={focus}/><Plane asset={a} width={820} height={550} focus={focus}/>{[-1,1].map(i=><div key={i} style={{position:'absolute',left:'50%',top:'50%',height:720,width:2,background:'#ffffff30',transform:`translate3d(${i*700}px,-360px,-1000px)`}}/>)}</div></Stage>;sub='同步改变距离与透视 · 平面画廊中的推拉实验';
 }
 const cameraId=mode==='c-observe'?89:mode==='c-gallery'?91:id;
 return <div className="camera-film" style={{position:'relative',width:1600,height:900,overflow:'hidden',background:K,fontFamily:'InterflowCN,sans-serif',color:W}}>{scene}{overlay&&<Overlay id={cameraId} title={title} subtitle={sub} asset={a}/>}</div>;
}
