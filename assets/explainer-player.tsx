import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, PlayerRef} from '@remotion/player';
import {ExplanationFilm} from './production/ExplanationFilm';
import {ExplanationPlan} from './production/explanation-types';
import data from './plan.json';

// JSON is produced by the validating CLI; JSON inference widens enum/tuple fields.
const plan=data as unknown as ExplanationPlan;
function Preview(){
 const ref=useRef<PlayerRef>(null),[frame,setFrame]=useState(0);
 useEffect(()=>{
  const player=ref.current;if(!player)return;
  const listener=({detail}:{detail:{frame:number}})=>setFrame(detail.frame);
  player.addEventListener('frameupdate',listener);
  return ()=>player.removeEventListener('frameupdate',listener);
 },[]);
 const event=[...plan.events].reverse().find(e=>e.start_frame<=frame)||plan.events[0];
 return <div style={{width:'100%',fontFamily:'"PingFang SC",sans-serif'}}>
  <Player ref={ref} component={ExplanationFilm} inputProps={{plan}} durationInFrames={plan.duration_in_frames} compositionWidth={1600} compositionHeight={900} fps={plan.fps} controls loop style={{width:'100%',borderRadius:16,overflow:'hidden'}}/>
  <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:8,padding:'14px 4px',color:'#63799A',fontSize:13}}>
   <span style={{marginRight:6}}>检查关键状态</span>
   <button onClick={()=>{ref.current?.pause();ref.current?.seekTo(0)}}>起点</button>
   {plan.events.map(e=><button key={e.id} onClick={()=>{ref.current?.pause();ref.current?.seekTo(Math.round(e.readable_window[0]*plan.fps))}}>{e.meaning}</button>)}
   <span style={{marginLeft:'auto',fontVariantNumeric:'tabular-nums'}}>{(frame/plan.fps).toFixed(2)} s · {event.component}</span>
  </div>
 </div>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
