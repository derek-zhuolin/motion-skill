import React,{useState,useEffect} from 'react';
import {staticFile,useDelayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {BaselineFilm} from './Baseline';
import config from './baseline.json';
const fonts=Promise.all(config.fonts.map((f:any)=>loadFont({family:f.family,url:staticFile(f.url),weight:f.weight})));
export function ReadyFilm(){const {delayRender,continueRender,cancelRender}=useDelayRender();const[h]=useState(()=>delayRender('Load baseline fonts'));const[ready,setReady]=useState(false);useEffect(()=>{let live=true;fonts.then(()=>{if(live){setReady(true);continueRender(h)}}).catch(cancelRender);return()=>{live=false;continueRender(h)}},[h]);return ready?<BaselineFilm {...config.props}/>:null;}
