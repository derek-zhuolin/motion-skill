// The inherited local dependency set has no @types/react-dom. Only the two used
// React DOM client methods are declared here; no package installation is needed.
declare module 'react-dom/client' {
 import type {ReactNode} from 'react';
 export function createRoot(container:Element|DocumentFragment):{render(children:ReactNode):void;unmount():void};
}
