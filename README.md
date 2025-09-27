# NarutoRPG

An in‑browser Naruto‑inspired open‑world prototype built with React and Three.js. No build step required — serve the repo and play. Includes a Konoha map editor, mini‑games, and learning modules.

## Quick Start

- Serve the repo root with a static server, then open `index.html`.
  - Python 3: `python3 -m http.server 8000` → open `http://127.0.0.1:8000/index.html`
  - Windows: run `run_me.bat` (installs Python if needed, starts a local server, opens browser)
  - Any static server works (nginx, `npx http-server`, etc.). Keep the repo root as the web root.
- Online CDNs are used for ESM React/Three/Tailwind; assets are cached locally after first load.

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
- Pause: Backquote (`) to open/close Pause Menu; Close panels: Esc

## Features

- Open‑world 3D scene with grid/terrain textures, instanced objects, tooltips, and context prompts
- Camera: third‑person and first‑person (pointer lock), auto‑align to travel direction
- Character system: stats, leveling, experience curve, per‑level growth, XP rewards from quests
- Inventory and equipment with storage grid, potions, weight/value/condition stats
- World Map overlay with pins; Minimap with grid/info toggles and size/opacity controls
- Settings: shadows, AA, render scale (max pixel ratio), object density, FPS limit
- Mobile support: virtual joystick, pinch‑to‑zoom, rotate‑to‑landscape helper overlay
- Asset prefetch and cache (images, GLBs, music), plus location‑based prefetch pipeline
- Audio: in‑game music player with preload; pauses on certain modals and resumes appropriately
- Overlays and modals:
  - Pause Menu (Backquote) releases pointer lock and suppresses gameplay input
  - NPC Interaction dialog (non‑pausing, restores control and pointer lock appropriately)
  - Hokage Office scene modal; Kitbash Building modal; Jutsu modal
  - World Events overlay with acknowledge/dismiss handling
- Accessibility/perf: respects `prefers-reduced-motion` in loading UI; focus handling in menus and modals

## Project Structure

- `index.html`: main game entry (loads React app `src/OpenWorldGame.jsx`)
- `styles/`: global CSS for splash/root
- `src/`: React + Three.js game
  - `OpenWorldGame.jsx`: top‑level UI, loading and scene lifecycle
  - `components/UI/`: HUD, panels, menus, modals, music player, changelog
  - `game/`: player model, movement, experience, inventory, objects, quests, world events
  - `hooks/`: scene setup, controls, minimap, timing
  - `scene/`: animation loop, terrain, grid labels, tooltips
  - `utils/`: asset loader, music manager, district layout loader
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
- Version label is derived from the page title token (e.g., `v0.011.000`) or the top changelog entry.
- Recent changes are visible in the in‑game Changelog panel.

### Changelog & Versioning (for contributors)

- Running log: append concise bullets to `changes.md` describing user‑visible changes as you work.
- Release entries: update `src/components/UI/ChangelogPanel.jsx` at the TOP of `changelogData` with `{ version, date, changes }` (store version without the leading `v`).
- Version source of truth: keep an explicit `v…` token in the HTML title in `index.html` so the Main Menu displays the version correctly.
- Fallback: if the title token is missing, the game falls back to the newest entry in `changelogData` (see `src/OpenWorldGame.jsx`).

## Known Issues / Tips

- `package.json` scripts reference `server.mjs`, which is not present. Use a static server instead (see Quick Start).
- When self‑hosting, keep the repo root as the server root so relative paths to `src/`, `map/`, and assets resolve.
- If your server serves uncommon extensions with odd MIME types, prefer the Windows `run_me.bat` or a standard static server.
- If you omit the `v…` token in the page title, the UI falls back to the top changelog entry; keep both in sync during releases.

## Credits

- Content and UI credit as shown in the in‑game Credits and Changelog panels (e.g., "by Lord Tsarcasm").
