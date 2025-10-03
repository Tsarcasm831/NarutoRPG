Recent
- NPC Patrols: Naruto and Shikamaru now stroll their roads, wander off-route for moments, and return within half a minute.
- Tests: Added useWorldEvents hook coverage for countdown overlays, buffs, overrides, and dismiss flows.
- Tests: Added time utility formatting and useGameTime hook coverage with fake timers and pause handling.
- FPV/NPC Dialog: Keep first-person active during conversations by suspending controls and restoring pointer lock on close.
- NPC Dialog: Opening conversations now exits pointer lock and suspends gameplay input so FPV players stay grounded mid-talk.
- Loading UI: decouple progress updates into a shared store, smooth the bar, and tie minimum progress to completed stages for accurate feedback.
- Assets: Precache local UI, map, and mugshot images during the loading phase to avoid refetches in later panels.
- Loading: Track scene initialization as its own step and smooth progress updates through squad deployment.
- Audio: Start the background score when the world finishes booting instead of during the loading screen.
- Changelog: Published v0.012 entry with synced multiplayer updates and trimmed trailing .000 from version labels.
- Main Menu: Added a read-only Planned Improvements modal sourced from a 50-item roadmap checklist.
- Multiplayer: Wired the main world into Websim presence so other players spawn with synced movement, rotation, and character identity; index.html now loads the WebsimSocket client script.
- Main Menu: Added a Showcase gallery modal that surfaces src/assets/images/showcase/ images (auto-detected, no manifest needed) and opens them full size.
- Neji: Force his model materials to write depth so the ground no longer shows through.
- NPC Dialog: Use local mugshots for Neji and Orochimaru during interactions instead of remote URLs.
- Main Menu: clicking the devs.png now shows a download link to the GitHub repo instead of dev hints.
- FPV: Interacting with NPCs no longer exits first-person or unlocks pointer; dialog is keyboard-friendly.
- NPCs: Wander now includes longer, natural pauses (2–7s) for more casual pacing.
- Naruto: When bumping into another NPC, he stops to talk (right-hand chat), then listens; the other NPC plays a double listening gesture.
- Movement: Reduced strafe distance and aligned facing to actual displacement to eliminate “ice skating” lateral slide.
- FPV: Cut per-frame allocations in camera update for smoother look.
- Interactions: Throttled nearest-object scan and tightened FPV radius to reduce frame spikes.
- Hokage Office: release pointer lock when entering from the hall to enable UI interaction.
- Player/NPC: Reduced character model scale by 30% (4 → 2.8) for a tighter world feel.
- FPV: Lowered first-person eye height to match the smaller player.
- Collision: Scaled player and NPC collider radii to stay consistent with visual size.
- Music: Added "Akatsuki Theme" to the in-game playlist for background music rotation.
- Docs: Overhauled README with setup, features, sub‑apps, and contributor workflow.
- Versioning: Clarified `index.html` title `v…` token and changelog fallback behavior.
- Credits: Added LP - H under Assets and Animations.
- NPCs: Added Orochimaru and Neji to the spawn party with dialog, wander behaviors, and asset manifests.
- Loading: Hold the boot screen until all squadmates spawn together and surface each scene prep stage in the progress overlay.
- Main Menu: Start Game now opens a shinobi picker and loads in as Kakashi, Naruto, Sasuke, Sakura, or Shikamaru before the world boots.
- Loading: Shrunk the progress overlay typography so the staged notes stay compact over the background art.
- NPC Dialog: Squad conversations now reference the chosen player name and mugshot instead of always assuming Kakashi.
- Player: Fixed the character catalog import so starter stats load without a missing file error.
- UI: Rebuilt the character select modal without JSX so the browser can load it without a bundle step.
- Player Loader: Pointed manifest fallbacks at the local temp bundles so non-Kakashi picks use available GLBs instead of 404s.
- World: Skip spawning the chosen hero as an NPC and expose squad roster info so loading progress stays accurate when the roster changes.

- Tests: Added coverage for experience leveling, quest rewards, and edge cases.

- Tooling: Added Vitest setup with testing dependencies and scripts for component testing.

- Tests: Added character catalog coverage to ensure identity, stats, and inventory builders clone data and honor overrides.

- Tests: Added district layout utility coverage for normalization, cloning, caching, and reload paths.
- Tests: Hardened music playback and pause safety with mocked audio, cache fallbacks, and pointer lock coverage.
- World: Kitbashed building windows now glow at night with randomized late-night lights-out behavior tied to the day/night cycle.

- Devtools: Added console helpers to jump the world clock to dawn, midday, dusk, or night presets.

- NPCs: Naruto now patrols Konoha roads from MO382 and Shikamaru roams the Nara District after spawning at RJ416.
- NPCs: Naruto alternates full road loops with ramen-side loitering, swapping between walk and run patrols after each wander.
- NPCs: Shikamaru now follows the Nara district road grid with fallbacks to free roaming so he explores instead of pacing.
- World: Added a gradient skysphere plus sun and moon sprites that follow the dynamic day-night cycle.

- NPCs: Colliding characters now pause for 15s and play stand-and-chat style idles before resuming their routes.
