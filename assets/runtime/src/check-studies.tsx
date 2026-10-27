import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FrameFilm} from './studies/Films';
let studies=0;
function valid(html:string,label:string){if(/NaN|Infinity|undefinedpx/.test(html))throw Error(label)}
for(let id=1;id<=96;id++)for(const t of [0,.5,1.7,3.5]){
 const props={mode:'study',id,frame:Math.round(t*60),rhythm:'flow'};
 const a=renderToStaticMarkup(<FrameFilm {...props}/>),b=renderToStaticMarkup(<FrameFilm {...props}/>);
 valid(a,`study ${id}/${t}`);if(a!==b)throw Error('Nondeterministic frame: '+id);studies++;
}
console.log({studies,scope:'research only'});
