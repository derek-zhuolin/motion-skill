import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {resolve} from 'node:path';
import {resolveBrowser} from '../assets/runtime/scripts/browser.mjs';
const browserExecutable=resolveBrowser();
const serveUrl=await bundle({entryPoint:resolve('scripts/gallery-render.tsx'),publicDir:resolve('assets/runtime/site'),outDir:resolve('.cache/gallery-bundle')});
const composition=await selectComposition({serveUrl,id:'Study-Contact-Sheet',browserExecutable});
await renderStill({serveUrl,composition,frame:0,output:resolve('docs/study-contact-sheet.png'),browserExecutable});
console.log('Gallery contact sheet complete');

const single=await selectComposition({serveUrl,id:'Study-Snapshot',browserExecutable});
for(let id=89;id<=96;id++){await renderStill({serveUrl,composition:single,inputProps:{id},frame:0,output:resolve(`docs/gallery/${String(id).padStart(3,'0')}.png`),scale:.6,browserExecutable});}
console.log('Camera study snapshots complete');
