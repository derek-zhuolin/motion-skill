/** Shared content and semantic event timing for one create → reorder → share flow.
 * This adapter is intentionally bounded to three tasks, not a universal UI renderer.
 */
export interface ProductUIStory {
 title:string; tasks:readonly [string,string,string]; audience:string; result:string;
 heading?:string; label?:string; headline?:string; windowTitle?:string; hint?:string;
}
export type Range=readonly [number,number];
export type Pulse=readonly [number,number,number,number];
export interface ProductUITiming {
 readonly name:string; readonly duration:number;
 readonly enter:Range; readonly typing:Range; readonly createMove:Range;
 readonly createPress:Pulse; readonly created:number; readonly createLabel:Range;
 readonly expand:Range; readonly formOut:Range; readonly listIn:Range;
 readonly toList:Range; readonly dragApproach:Range; readonly openHandAt:number;
 readonly grab:number; readonly lift:Range; readonly drag:Range;
 readonly neighborSecond:Range; readonly neighborFirst:Range;
 readonly drop:number; readonly settle:Range; readonly afterDropMove:Range;
 readonly shareApproach:Range; readonly sharePress:Pulse; readonly shareOpen:Range;
 readonly toSend:Range; readonly sendPress:Pulse; readonly sending:number;
 readonly sent:number; readonly resultIn:Range; readonly leaveSend:Range;
 readonly cursorIn:Range; readonly cursorOut:Range;
}
/** Brisk is authored beat by beat: short anticipation, overlapping arrivals,
 * sufficient reading holds. It is not the calm profile at a faster playback rate. */
export const PRODUCT_UI_TIMINGS:{readonly brisk:ProductUITiming;readonly calm:ProductUITiming}={
 brisk:{name:'brisk',duration:9.6,enter:[0,.45],typing:[.35,1.2],createMove:[1.15,1.55],createPress:[1.6,1.7,1.8,1.92],created:1.9,createLabel:[1.9,2.1],expand:[2.15,2.8],formOut:[2.15,2.55],listIn:[2.3,2.85],toList:[1.95,2.75],dragApproach:[3.1,3.55],openHandAt:3.45,grab:3.65,lift:[3.65,3.85],drag:[3.85,4.5],neighborSecond:[4.02,4.21],neighborFirst:[4.25,4.46],drop:4.62,settle:[4.62,4.82],afterDropMove:[4.62,4.97],shareApproach:[5.32,5.75],sharePress:[5.8,5.88,5.98,6.08],shareOpen:[5.95,6.2],toSend:[6.24,6.65],sendPress:[6.75,6.85,6.97,7.07],sending:6.85,sent:7.55,resultIn:[7.55,7.85],leaveSend:[7.07,7.55],cursorIn:[1.1,1.3],cursorOut:[7.7,8.1]},
 calm:{name:'calm',duration:15,enter:[0,.65],typing:[.8,2.4],createMove:[2.35,2.72],createPress:[2.77,2.85,3.02,3.15],created:3.3,createLabel:[3.3,3.45],expand:[3.5,4.7],formOut:[3.45,4.05],listIn:[3.9,4.7],toList:[3.3,4.4],dragApproach:[5.4,6.1],openHandAt:5.9,grab:6.3,lift:[6.3,6.5],drag:[6.5,8.2],neighborSecond:[6.95,7.35],neighborFirst:[7.55,7.95],drop:8.4,settle:[8.4,8.6],afterDropMove:[8.4,8.85],shareApproach:[9.6,10.3],sharePress:[10.45,10.55,10.7,10.8],shareOpen:[10.65,11],toSend:[11.1,11.7],sendPress:[11.94,12.02,12.15,12.25],sending:12,sent:13.05,resultIn:[13.05,13.45],leaveSend:[12.4,13],cursorIn:[2.3,2.5],cursorOut:[13.1,13.8]},
};
export const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const smooth=(n:number)=>{const p=clamp(n);return p*p*p*(p*(p*6-15)+10)};
export const phase=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
export const progress=(t:number,r:Range)=>phase(t,r[0],r[1]);
export const pulse=(t:number,p:Pulse)=>phase(t,p[0],p[1])*(1-phase(t,p[2],p[3]));
export const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
function text(value:unknown,name:string,max:number){if(typeof value!=='string'||!value.trim())throw Error(`ProductUIFilm: ${name} must be non-empty`);if(Array.from(value).length>max)throw Error(`ProductUIFilm: ${name} exceeds ${max} Unicode code points; shorten content or author a different layout`)}
export function validateProductUIStory(story:ProductUIStory){
 if(!story||typeof story!=='object')throw Error('ProductUIFilm: explicit story is required');
 text(story.title,'title',18);text(story.audience,'audience',12);text(story.result,'result',12);
 if(!Array.isArray(story.tasks)||story.tasks.length!==3)throw Error('ProductUIFilm: tasks must contain exactly three task labels');
 story.tasks.forEach((x,i)=>text(x,`tasks[${i}]`,24));
 if(new Set(story.tasks.map(x=>x.trim())).size!==3)throw Error('ProductUIFilm: task labels must be distinct to retain object identity');
 if(story.heading!==undefined)text(story.heading,'heading',30);
 if(story.headline!==undefined)text(story.headline,'headline',30);
 if(story.windowTitle!==undefined)text(story.windowTitle,'windowTitle',16);
 if(story.hint!==undefined)text(story.hint,'hint',36);
 if(story.label!==undefined)text(story.label,'label',8);
}
export function validateProductUITiming(t:ProductUITiming){
 if(!t||!Number.isFinite(t.duration)||t.duration<=0)throw Error('ProductUIFilm: positive timing.duration is required');
 for(const[key,value]of Object.entries(t)){
  if(key==='name'||key==='duration')continue;
  const values=Array.isArray(value)?value:[value];
  if(values.some((x:unknown)=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>t.duration))throw Error(`ProductUIFilm: invalid timing.${key}`);
  if(values.some((x:number,i:number)=>i>0&&x<=values[i-1]))throw Error(`ProductUIFilm: timing.${key} must increase`);
 }
 if(t.typing[1]>t.created||t.created>t.formOut[1]||t.listIn[1]>t.grab||t.grab>t.drag[0]||t.drag[1]>t.drop||t.drop>t.shareOpen[0]||t.shareOpen[1]>t.sending||t.sending>=t.sent||t.sent>t.resultIn[0])throw Error('ProductUIFilm: event order is invalid');
 if(t.formOut[0]-t.typing[1]<.4||t.shareOpen[0]-t.drop<.55||t.duration-t.sent<1)throw Error('ProductUIFilm: preserve typing, reorder and result reading holds');
}
export function getProductUIState(frame:number,fps:number,timing:ProductUITiming=PRODUCT_UI_TIMINGS.brisk){
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw Error('ProductUIFilm: frame must be finite and fps must be positive');
 const t=clamp(frame/(fps*timing.duration))*timing.duration;
 return{t,input:progress(t,timing.typing),created:t>=timing.created,list:progress(t,timing.expand),drag:progress(t,timing.drag),dragging:t>=timing.grab&&t<timing.drop,share:progress(t,timing.shareOpen),sending:t>=timing.sending&&t<timing.sent,sent:t>=timing.sent,ending:progress(t,timing.resultIn)};
}

/** Backward-compatible local alias. */
export const productUIState=getProductUIState;
