import { initScene } from "./scene/initScene.js";

const { useEffect, useRef, useState } = React;

export default function App(){
  const mountRef = useRef(null);
  const sceneAPIRef = useRef(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const api = initScene(mountRef.current, (isLocked)=>setLocked(isLocked));
    sceneAPIRef.current = api;
    return () => api.dispose();
  }, []);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', { className:'ui' },
      React.createElement('h1', null, 'Hokage Office: Top-Floor, Outer Hall'),
      React.createElement('div', { className:'hint' },
        'Controls ',
        React.createElement('span',{className:'kbd'},'WASD'),
        ', mouse-look, ',
        React.createElement('span',{className:'kbd'},'Shift'),
        ' to run, ',
        React.createElement('span',{className:'kbd'},'F'),
        ' to interact. Corridor collision keeps you between the inner and outer walls.'
      )
    ),
    !locked && React.createElement('div', { className:'gate' },
      React.createElement('div', { className:'card' },
        React.createElement('h2', null, 'Enter the Hall'),
        React.createElement('p', null, 'Click below to lock the cursor and start walking.'),
        React.createElement('button', { className:'btn', onClick:()=>sceneAPIRef.current.lock() }, 'Enter Hall')
      )
    ),
    locked && React.createElement('div',{className:'crosshair'}),
    React.createElement('div', { ref: mountRef, style:{position:'absolute', inset:0} }),
    React.createElement('div', { className:'credit' }, 'Fan scene · ask to connect it to the office door / add NPCs.')
  );
}