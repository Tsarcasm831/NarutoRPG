import * as THREE from "three";
import { PointerLockControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js";
import { OBB } from "https://unpkg.com/three@0.160.0/examples/jsm/math/OBB.js";
// removed OrbitControls import (was unused)

import { buildWalls, buildDesk, buildProps, buildSkyline } from "./builders.js";
import { makeConcrete } from "./textures.js";
import { setupScene } from "./sceneSetup.js";
import { createPhysics } from "./physics.js";

const { useEffect, useRef, useState } = React;

function App(){
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    // moved scene/renderer creation and content building into setupScene()
    const {
      renderer, scene, camera, controls, colliders, cleanupScene, isMobile
    } = setupScene(container, setLocked);
    controlsRef.current = controls;
    const physics = createPhysics(camera, controls, colliders);

    // Keyboard controls
    const onKeyDown = (e) => physics.onKey(e, true);
    const onKeyUp = (e) => physics.onKey(e, false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize
    function onResize(){
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // Animation
    const clock = new THREE.Clock();
    let rafId = 0;
    function animate(){
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      physics.update(dt);
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cleanupScene();
    };
  }, []);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', { className:'ui' },
      React.createElement('h1', null, 'Hokage Office — Walkable Demo'),
      React.createElement('div', { className:'hint' },
        'Controls: ',
        React.createElement('span', { className:'kbd' }, 'W'), ' ',
        React.createElement('span', { className:'kbd' }, 'A'), ' ',
        React.createElement('span', { className:'kbd' }, 'S'), ' ',
        React.createElement('span', { className:'kbd' }, 'D'),
        ' to move, ',
        React.createElement('span', { className:'kbd' }, 'Shift'),
        ' to run, mouse to look. Stay inside the office—desk has collision.'
      )
    ),
    !locked && React.createElement('div', { className:'gate' },
      React.createElement('div', { className:'gate-illustration', 'aria-hidden': true },
        React.createElement('svg', { viewBox:'0 0 800 600', preserveAspectRatio:'xMidYMid slice' },
          React.createElement('defs', null,
            React.createElement('radialGradient', { id:'sunGrad', cx:'60%', cy:'25%', r:'22%' },
              React.createElement('stop', { offset:'0%', stopColor:'#ffe7b3', stopOpacity:'0.85' }),
              React.createElement('stop', { offset:'100%', stopColor:'#ffe7b3', stopOpacity:'0' })
            )
          ),
          React.createElement('rect', { x:0, y:0, width:800, height:600, fill:'none' }),
          React.createElement('circle', { cx:480, cy:140, r:120, fill:'url(#sunGrad)' }),
          React.createElement('g', { fill:'#0e1319' },
            React.createElement('path', { d:'M0,420 L120,360 L220,400 L320,340 L440,380 L560,330 L660,370 L800,320 L800,600 L0,600 Z', opacity:'0.55' }),
            React.createElement('path', { d:'M0,460 L140,420 L240,450 L340,410 L460,440 L600,400 L720,430 L800,410 L800,600 L0,600 Z', opacity:'0.7' })
          ),
          React.createElement('g', { fill:'#1a212b', opacity:'0.6' },
            React.createElement('rect', { x:80, y:300, width:26, height:90, rx:2 }),
            React.createElement('rect', { x:620, y:310, width:22, height:76, rx:2 }),
            React.createElement('rect', { x:530, y:320, width:18, height:60, rx:2 }),
            React.createElement('rect', { x:210, y:315, width:20, height:70, rx:2 })
          ),
          React.createElement('g', { stroke:'#e7c98a', strokeWidth:'2', fill:'none', opacity:'0.18' },
            React.createElement('circle', { cx:400, cy:300, r:180 }),
            React.createElement('circle', { cx:400, cy:300, r:260 }),
            React.createElement('circle', { cx:400, cy:300, r:340 })
          )
        )
      ),
      React.createElement('div', { className:'card' },
        React.createElement('h2', null, 'Enter the Hokage’s Office'),
        React.createElement('p', null, 'Click below to lock the cursor and start walking.'),
        React.createElement('button', {
          className:'btn',
          onClick: () => { if (controlsRef.current) controlsRef.current.lock(); }
        }, 'Enter Office')
      )
    ),
    locked && React.createElement('div', { className:'crosshair' }),
    React.createElement('div', { ref: mountRef, style:{ position:'absolute', inset:0 } }),
    React.createElement('div', { className:'credit' }, ' fan scene. Keyboard/mouse only. ')
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));