import React from 'react';import{Composition,registerRoot}from'remotion';import{ReadyFilm}from'./ReadyFilm';import config from './baseline.json';
registerRoot(()=> <Composition id="ReferenceFilm" component={ReadyFilm} width={config.width} height={config.height} fps={config.fps} durationInFrames={config.frames}/>);
