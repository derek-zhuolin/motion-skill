import {strict as assert} from 'node:assert';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compileScore,cueProgress,MotionScore} from './production/score';
import example from './production/score.example.json';
import {KineticWords} from './production/Mechanisms';
let checks=0;
function test(run:()=>void){run();checks++}
test(()=>{
 const shifted=JSON.parse(JSON.stringify(example)) as MotionScore;shifted.beats.handoff=2.4;
 const a=compileScore(example),b=compileScore(shifted);
 for(const id of ['identityStart','contentReady','carrierReady','keywordAt'])assert(Math.abs(b.beats[id]-a.beats[id]-.4)<1e-9);
 assert.equal(b.beats.meaningEnd,a.beats.meaningEnd);
});
test(()=>assert.throws(()=>compileScore({duration:4,beats:{a:{after:'b'},b:{after:'a'}},cues:{}}),/Cyclic/));
test(()=>assert.throws(()=>compileScore({duration:4,beats:{a:{after:'missing'}},cues:{}}),/Unknown/));
test(()=>assert.throws(()=>compileScore({duration:4,beats:{a:3,b:{after:'a',offset:2}},cues:{}}),/outside/));
test(()=>assert.throws(()=>compileScore({duration:4,beats:{a:1},cues:{bad:{from:'a',to:'a'}}}),/positive/));
test(()=>assert.throws(()=>compileScore({duration:4,beats:{a:NaN},cues:{}}),/outside/));
test(()=>{
 const score=compileScore(example),{start,end}=score.cues.content;
 assert.equal(cueProgress(score,'content',start-1),0);assert.equal(cueProgress(score,'content',end+1),1);
 assert(Math.abs(cueProgress(score,'content',(start+end)/2,'linear')-.5)<1e-12);
 assert.throws(()=>cueProgress(score,'missing',2),/Unknown cue/);
 assert.throws(()=>cueProgress(score,'content',Infinity),/finite/);
});
test(()=>{
 const props={words:['one','two'],t:.6,start:0,x:0,y:0,size:20};
 const original=renderToStaticMarkup(<KineticWords {...props}/>);
 assert.equal(original,renderToStaticMarkup(<KineticWords {...props} duration={.46} stagger={.11} rise={28}/>));
 const altered=renderToStaticMarkup(<KineticWords {...props} duration={1} stagger={.3} rise={12}/>);
 assert.notEqual(original,altered);assert.throws(()=>renderToStaticMarkup(<KineticWords {...props} duration={0}/>),/Invalid/);
});
console.log(`${checks} score/timing compatibility checks passed; visual/audio acceptance remains separate.`);
