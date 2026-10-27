export type Key = {t:number;v:number};
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export const phase=(t:number,a:number,b:number)=>{const p=clamp((t-a)/(b-a));return p*p*p*(10+p*(-15+6*p))};

// One monotone cubic track, including shared tangents at adjoining segments.
// Repeated values represent intentional reading holds; they are not jittered.
export function curve(t:number,keys:Key[]):number{
 if(keys.length<2)return keys[0]?.v??0;
 if(t<=keys[0].t)return keys[0].v;
 if(t>=keys[keys.length-1].t)return keys[keys.length-1].v;
 const d=keys.slice(1).map((k,i)=>(k.v-keys[i].v)/(k.t-keys[i].t));
 const m=keys.map((_,i)=>{
  if(i===0||i===keys.length-1)return 0;
  if(d[i-1]*d[i]<=0)return 0;
  const h0=keys[i].t-keys[i-1].t,h1=keys[i+1].t-keys[i].t;
  return (3*(h0+h1))/((2*h1+h0)/d[i-1]+(h1+2*h0)/d[i]);
 });
 const i=keys.findIndex((k,j)=>j<keys.length-1&&t>=k.t&&t<keys[j+1].t);
 const h=keys[i+1].t-keys[i].t,p=(t-keys[i].t)/h,p2=p*p,p3=p2*p;
 return (2*p3-3*p2+1)*keys[i].v+(p3-2*p2+p)*h*m[i]+(-2*p3+3*p2)*keys[i+1].v+(p3-p2)*h*m[i+1];
}
export const track=(...pairs:[number,number][])=>pairs.map(([t,v])=>({t,v}));
export type CameraPose={x:number;y:number;scale:number;rotation:number};
export const cameraTransform=(p:CameraPose)=>`translate(800 450) scale(${p.scale}) rotate(${p.rotation}) translate(${-p.x} ${-p.y})`;
export const contactPulse=(t:number,at:number)=>{const dt=t-at;return dt<0?0:Math.sin(dt*15)*Math.exp(-dt*6)};
