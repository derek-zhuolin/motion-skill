import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {MotionFilm} from '../../../assets/runtime/src/studies/Films';
import {catalog} from '../../../assets/runtime/src/studies/catalog';
import './style.css';
function Studies(){const[id,setId]=useState(Math.max(1,Math.min(96,Number(new URLSearchParams(location.search).get('effect'))||1)));return <main><header><div><p className="eyebrow">MOTION SKILL / REFERENCE STUDIES</p><h1>96项机制，按意思选。</h1><p>自制结构示意图；单项研究不会自动成为有意义的影片。</p></div><a href="index.html">回到语义预览 ↗</a></header><div id="screen"><Player key={id} component={MotionFilm} inputProps={{mode:'study',id,rhythm:'flow'}} compositionWidth={1600} compositionHeight={900} durationInFrames={id>88?480:id>64?360:240} fps={60} controls autoPlay={false} loop style={{width:'100%',aspectRatio:'16/9'}}/></div><section className="catalog">{catalog.map(item=><button key={item.id} aria-pressed={id===item.id} onClick={()=>{setId(item.id);history.replaceState(null,'',`?effect=${item.id}`)}}><small>{item.id} / {item.category}</small><strong>{item.name}</strong></button>)}</section></main>}
createRoot(document.getElementById('root')!).render(<Studies/>);
