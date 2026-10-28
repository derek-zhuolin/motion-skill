// Small public surface used by this demo; the repository does not require @types/react-dom.
declare module 'react-dom/client' {
 export function createRoot(container:Element|DocumentFragment):{render(children:import('react').ReactNode):void;unmount():void};
}
