import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player,PlayerRef} from '@remotion/player';
import plan from './compiled-plan.json';
import {DirectedFilm,sceneAt} from './DirectedFilm';
import './style.css';
function App(){
 const ref=useRef<PlayerRef>(null),[frame,setFrame]=useState(0),[playing,setPlaying]=useState(false),[sound,setSound]=useState(true),[fontsReady,setFontsReady]=useState(false);
 const scene=sceneAt(plan,frame/plan.fps),duration=Math.round(plan.duration*plan.fps),blocked=plan.audit.blocking.length>0;
 useEffect(()=>{Promise.all([document.fonts.load('700 64px InterflowCN'),document.fonts.load('400 24px InterflowCN'),document.fonts.load('700 32px Figtree')]).then(()=>setFontsReady(true))},[]);
 useEffect(()=>{const r=ref.current;if(!r)return;const f=(e:any)=>setFrame(e.detail.frame),play=()=>setPlaying(true),pause=()=>setPlaying(false);r.addEventListener('frameupdate',f);r.addEventListener('play',play);r.addEventListener('pause',pause);return()=>{r.removeEventListener('frameupdate',f);r.removeEventListener('play',play);r.removeEventListener('pause',pause)}},[fontsReady]);
 return <main><header><div><p className="eyebrow">MOTION SKILL / VOICE → VIDEO</p><h1>{plan.title}</h1><p>{plan.mode==='example'?'静音结构示例：先看重点、读懂关系，再铺垫下一步。':'48 秒原声 · 同步中文字幕 · 实拍画面'}</p></div><a href="studies.html">96项机制研究 ↗</a></header>
 {blocked&&<div className="blocked"><strong>编排未就绪</strong><pre>{JSON.stringify(plan.audit.blocking,null,2)}</pre></div>}
 <div id="screen">{fontsReady?<Player ref={ref} component={DirectedFilm} inputProps={{plan,sound}} compositionWidth={1600} compositionHeight={900} fps={plan.fps} durationInFrames={Math.max(1,duration)} autoPlay={false} loop={false} moveToBeginningWhenEnded={false} clickToPlay controls={false} style={{width:'100%',aspectRatio:'16/9'}}/>:<div style={{aspectRatio:'16/9',display:'grid',placeItems:'center',color:'#141414'}}>正在准备可读字体…</div>}</div>
 <div className="controls"><button aria-label={playing?'暂停':'播放'} onClick={()=>playing?ref.current?.pause():ref.current?.play()}>{playing?'暂停':'播放'}</button><input aria-label="播放位置" type="range" min="0" max={duration-1} value={frame} onChange={e=>{ref.current?.pause();ref.current?.seekTo(Number(e.target.value))}}/><output>{(frame/plan.fps).toFixed(1)} / {plan.duration}s</output><button aria-pressed={sound} disabled={!plan.source.voice_url} onClick={()=>{setSound(!sound);sound?ref.current?.mute():ref.current?.unmute()}}>{plan.source.voice_url?`原声${sound?'开':'关'}`:'无音源'}</button></div>
 {scene&&<section className="timing"><div><small>当前主结论</small><h2>{scene.headline}</h2></div><div><small>信息可读</small><strong>{scene.timing.content_ready_at.toFixed(1)}s</strong></div><div><small>阅读预算完成</small><strong>{scene.timing.read_complete_at.toFixed(1)}s</strong></div><div><small>下一步铺垫</small><strong>{scene.timing.preparation_at.toFixed(1)}s</strong></div><div><small>交接</small><strong>{scene.end.toFixed(1)}s</strong></div></section>}
 <section className="rows">{plan.scenes.map((s:any)=><button key={s.id} aria-pressed={scene?.id===s.id} onClick={()=>{ref.current?.pause();ref.current?.seekTo(Math.round(s.start*plan.fps))}}><b>{s.start}—{s.end}s</b><span>{s.headline}</span><small>{s.handoff?.reason||'稳定落定'}</small></button>)}</section>
 <footer>阅读预算是可调的编排假设，不能替代真实观众反馈。人物跟踪、ASR及音乐节拍识别未内置。旧视频保留，本地预览未发布。</footer></main>
}
createRoot(document.getElementById('root')!).render(<App/>);
