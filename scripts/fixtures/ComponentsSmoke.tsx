// Synthetic component fixture. No project metrics, screenshots or private media.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Composition, registerRoot, staticFile, useDelayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {NumberReel, ValueReveal, NumericComparison, LineReveal, MediaFocus, DrawAnnotation, FocusHandoff} from '../../assets/runtime/src/production/DetailMechanisms';
const Cell=({label,children}:{label:string;children:React.ReactNode})=><div style={{border:'1px solid #CCD9E6',borderRadius:24,padding:28,position:'relative',overflow:'hidden',height:305}}><div style={{fontSize:23,color:'#526071',marginBottom:25}}>{label}</div>{children}</div>;
function Fixture(){
 const {delayRender,continueRender,cancelRender}=useDelayRender();
 const [handle]=useState(()=>delayRender('fixture fonts'));
 useEffect(()=>{Promise.all([loadFont({family:'InterflowCN',url:staticFile('assets/fonts/source-han-bold.otf'),weight:'700'}),loadFont({family:'Figtree',url:staticFile('assets/fonts/figtree-bold.ttf'),weight:'700'})]).then(()=>continueRender(handle)).catch(cancelRender)},[handle]);
 return <AbsoluteFill style={{background:'#fff',color:'#141414',fontFamily:'InterflowCN,Figtree,sans-serif',padding:42}}>
  <div style={{fontSize:34,marginBottom:24}}>组件测试 · 合成数据 · 非项目成果</div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
   <Cell label="#35 数字快照"><NumberReel value="50" size={145}/></Cell>
   <Cell label="#31 固定揭露"><ValueReveal value="80" size={145}/></Cell>
   <Cell label="#43 数值对照"><NumericComparison left={{label:'测试 A',value:'0'}} right={{label:'测试 B',value:'2'}} size={85}/></Cell>
   <Cell label="#31 逐行揭露"><LineReveal height={95}><span style={{fontSize:48}}>先说结论</span></LineReveal></Cell>
   <Cell label="#27 素材内部取景"><div style={{height:200}}><MediaFocus to={{x:-35,y:-15,scale:1.2}}><div style={{height:'100%',background:'#DDEAF7',padding:30}}><div style={{fontSize:30,color:'#0070DB'}}>合成示意画面</div><div style={{marginTop:20,width:140,height:45,background:'#0070DB',borderRadius:14}}/></div></MediaFocus></div></Cell>
   <Cell label="#36 圈注 + #38 焦点交接"><svg viewBox="0 0 400 205" style={{width:'100%'}}><text x="18" y="65" fontSize="26" fill="#141414">起点</text><text x="220" y="145" fontSize="26" fill="#141414">下一处证据</text><DrawAnnotation d="M18 78H105"/><FocusHandoff from={{x:10,y:25,width:100,height:70}} to={{x:210,y:105,width:175,height:70}} at={.65} objectId="same-attention"/></svg></Cell>
  </div>
 </AbsoluteFill>;
}
registerRoot(()=> <Composition id="Components-Smoke" component={Fixture} width={1600} height={900} fps={30} durationInFrames={90}/>);
