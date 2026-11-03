import React from 'react';
import assert from 'node:assert/strict';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {polishProgress,PageHandoff,CardResponse,PhraseReveal} from '../assets/runtime/src/production/DirectedPolish';
import {SoftClaySurface} from '../assets/runtime/src/production/SoftClay';
assert.equal(polishProgress(-1,0,12),0);assert.equal(polishProgress(24,0,12),1);
assert.throws(()=>polishProgress(0,1,1));
assert.throws(()=>render(<PageHandoff frame={9} leave={[0,10]} enter={[8,20]} outgoing="old" incoming="new"/>));
for(const f of [0,9,12,19,30]){
 const html=render(<PageHandoff frame={f} leave={[5,10]} enter={[12,20]} outgoing="old" incoming="new"/>);
 assert.match(html,/page-handoff/);
 assert.ok((html.match(/visibility:visible/g)||[]).length<=1,'No two reading pages may overlap');
}
const settled=(f:number)=>render(<CardResponse frame={f} from={0} to={10} kind="receive">Result</CardResponse>);
assert.equal(settled(10),settled(80),'Receiving feedback must settle');
assert.match(render(<PhraseReveal frame={0} from={10} to={20}>Text</PhraseReveal>),/opacity:0/);
const node={id:'same-id',x:150,y:100,width:300,height:200,depth:18,rotation:0,tone:'paper' as const,children:null};
const material=render(<svg><SoftClaySurface node={node}/><SoftClaySurface node={node}/></svg>);
assert.ok(!material.includes('NaN'),'Default #fff theme must work');
const ids=[...material.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'Multiple clay surfaces need distinct gradient IDs');
console.log('Directed polish: page exclusivity, settle, frame guards and default material passed');
