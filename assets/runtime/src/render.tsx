import React,{useEffect,useState} from 'react';
import {Composition,registerRoot,delayRender,continueRender,cancelRender,staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DirectedFilm} from './DirectedFilm';
import plan from './compiled-plan.json';
const ready=Promise.all([loadFont({family:'InterflowCN',url:staticFile('assets/fonts/source-han-regular.otf'),weight:'400'}),loadFont({family:'InterflowCN',url:staticFile('assets/fonts/source-han-bold.otf'),weight:'700'}),loadFont({family:'Figtree',url:staticFile('assets/fonts/figtree-bold.ttf'),weight:'700'})]);
function Film(){const[h]=useState(()=>delayRender('Motion fonts'));useEffect(()=>{ready.then(()=>continueRender(h)).catch(cancelRender)},[h]);return <DirectedFilm plan={plan} sound/>}
registerRoot(()=> <Composition id="Motion-Video" component={Film} width={1600} height={900} fps={plan.fps} durationInFrames={Math.round(plan.duration*plan.fps)}/>);
