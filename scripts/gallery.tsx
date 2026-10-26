import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {FrameFilm} from '../assets/runtime/src/studies/Films';
const catalog=JSON.parse(readFileSync('references/catalog.json','utf8'));
mkdirSync('docs/gallery',{recursive:true});
const placeholder='data:image/svg+xml;base64,'+readFileSync('assets/runtime/site/assets/study-placeholder.svg').toString('base64');
for(const item of catalog.effects){
 if(item.id>88)continue;
 let svg=renderToStaticMarkup(<FrameFilm mode="study" id={item.id} frame={144} rhythm="flow"/>);
 svg=svg.replace(/(?:\/public\/|\/)?assets\/study-placeholder\.svg/g,placeholder);
 writeFileSync(`docs/gallery/${String(item.id).padStart(3,'0')}.svg`,svg);
}
console.log(`Generated 88 SVG study snapshots; camera PNGs use render-gallery.mjs`);
