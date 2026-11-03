// Match the existing local React DOM shims when shared dependencies lack types.
// The vendored UI Act module uses only this root API; frame adapters do not run Act.
declare module 'react-dom' {
 export function flushSync<T>(callback:()=>T):T;
}
