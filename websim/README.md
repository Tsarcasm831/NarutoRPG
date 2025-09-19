# NarutoRPG

An in‑browser Naruto‑inspired open‑world prototype built with React and Three.js. No build step required — open via a static server and play. Includes a map editor, mini‑games, and learning modules.

## Quick Start

- Serve the repo root with any static server, then open `index.html`.
  - Python 3: `python3 -m http.server 8000` and open `http://127.0.0.1:8000/index.html`
  - Windows: run `run_me.bat` (auto‑installs Python if needed, starts a local server, opens browser)
- Requires internet for CDN modules (React, Three.js, Tailwind, etc.). Assets are then cached locally.

## Controls

- Movement: WASD or Arrow Keys
- Run: Shift
- Jump: Space (double‑tap toggles Dev Flight)
- Dodge: Left Ctrl (grounded)
- Attack: Left Mouse (on canvas)
- Interact: F
- First‑Person: V (Pointer Lock)
- Camera: Right‑click drag (yaw/pitch), Mouse Wheel zoom, `=` zoom in, `-` zoom out
- Panels: C Character, I Inventory, M World Map, P Settings, B Animations, J Jutsu, Y Kakashi
- Mobile: Z toggle on‑screen joystick; rotate device to landscape
- Pause: Backquote (`)`); Close panels: Esc

## Features

- Open‑world 3D scene with grid, terrain textures, instanced objects, tooltips, interaction prompt
- Third‑person and first‑person camera with pointer lock; auto‑align camera to travel direction
- Character system: stats, leveling, experience curve, per‑level stat growth
- Inventory and equipment, potions and storage grid
- World map overlay with object pins; minimap settings
- Settings: shadows, AA, render scale (max pixel ratio), object density, FPS limit
- Mobile support: virtual joystick, pinch‑to‑zoom
- Asset prefetch and cache (images, GLBs, music), plus location‑based prefetch pipeline
- In‑game music player and pause menu

## Project Structure

- `index.html`: main game entry (loads React app `src/OpenWorldGame.jsx`)
- `styles/`: global CSS for splash/root
- `src/`: React + Three.js game
  - `OpenWorldGame.jsx`: top‑level UI, loading and scene lifecycle
  - `components/UI/`: HUD, panels, menus, modals, music player, changelog
  - `game/`: player model, movement, experience, inventory, objects
  - `hooks/`: scene setup, controls, throttling
  - `scene/`: animation loop, terrain, grid labels, tooltips
  - `utils/`: asset loader, music manager
  - `assets/`: GLB models and images used by the world
- `map/`: interactive Konoha map editor (`map/index.html`, export JSON/SVG/defaults)
- `hokage/`: separate scenes (e.g., office interior/top floor) used by modals
- `Konoha_Academy/`: learning modules and a Combat Training mini‑game
  - `Main/`: lesson hub (static modules, router‑less SPA)
  - `Combat_Training/`: standalone HTML/JS mini‑game with simple tests (`tests/index.html`)
- `scripts/`: asset prefetch, tooling (`prefetchLocationAssets.js`, `split_anime.mjs`)
- `run_me.bat`: Windows helper to launch a local server

## Sub‑Apps

- Game: `index.html` (React + Three.js open world)
- Map Editor: `map/index.html` (draw districts/roads/walls/rivers/forest/mountains; export/import JSON)
- Konoha Academy: `Konoha_Academy/Main/index.html` (educational modules)
- Combat Training: `Konoha_Academy/Combat_Training/index.html` (arcade mini‑game)

## Development Notes

- No bundler required. The app uses ESM via CDN (`esm.sh`) and `@babel/standalone` for JSX during development.
- A real static server is recommended so fetches and the Cache API work. Python’s `http.server` is sufficient.
- Some assets are cross‑origin; the loader uses `no-cors` where needed and warms the HTTP cache.
- Versioning and recent changes are visible in the in‑game Changelog panel.

## Known Issues / Tips

- `package.json` scripts reference `server.mjs`, which is not present. Use a static server instead (see Quick Start).
- When self‑hosting, keep the repo root as the server root so relative paths to `src/`, `map/`, and assets resolve.
- If your server serves uncommon extensions with odd MIME types, prefer the Windows `run_me.bat` or a standard static server.

## Credits

- Content and UI credit as shown in the in‑game Credits and Changelog panels (e.g., "by Lord Tsarcasm").
