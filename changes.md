Overview
- Compared root (current state) against `websim` (production snapshot).
- Generated: 2025-09-19 19:31:50Z (UTC)
- Summary: 7 added, 0 removed, 18 modified files.

Added
- .htaccess
- map/district-buildings/json/residential10.buildings.json
- map/district-buildings/json/residential7.buildings.json
- map/district-buildings/json/residential8.buildings.json
- map/district-buildings/json/residential9.buildings.json
- src/assets/textures/dirt_path_texture.png
- src/components/UI/inventory/inventoryUtils.js

Removed
- None

Modified
- map/defaults/parts/districts-custom.js
- map/defaults/parts/roads.js
- map/defaults/static-default.js
- map/index.html
- map/interactions.js
- map/render.js
- src/components/UI/ChangelogPanel.jsx
- src/components/UI/HUD.jsx
- src/components/UI/InventoryPanel.jsx
- src/components/UI/LoadingScreen.jsx
- src/components/UI/MainMenu.jsx
- src/components/UI/inventory/EquipmentSlot.jsx
- src/components/UI/inventory/InventoryStats.jsx
- src/components/UI/inventory/PotionSlot.jsx
- src/components/UI/inventory/StorageSlot.jsx
- src/components/game/objects/konoha_roads.js
- src/hooks/usePlayerControls.js
- styles/style.css
## Quest Log (Keyboard: L)

- Added a Quest Log panel that sits alongside Character (C) and Inventory (I).
- Toggle with `L` during gameplay. Close with `ESC`.
- Quests support rewards: Experience, Gold, Item grants, and Equipment upgrades.
- Initial seed quests:
  - D-Rank: Help at Ichiraku (Gold + XP)
  - C-Rank: Patrol the Gates (Gloves item + XP)
  - B-Rank: Arena Sparring Trial (Weapon upgrade + XP)
- Claiming rewards updates your stats/inventory:
  - XP uses existing leveling curve (auto-refills vitals on level-up).
  - Gold increments `playerStats.gold`.
  - Items are placed into the first free storage slot (or appended).
  - Upgrades improve currently equipped item in the specified slot; if empty, an upgraded item is added to storage.

Recent
- Player/NPC: Reduced character model scale by 30% (4 → 2.8) for a tighter world feel.
- FPV: Lowered first-person eye height to match the smaller player.
- Collision: Scaled player and NPC collider radii to stay consistent with visual size.
 - Docs: Overhauled README with setup, features, sub‑apps, and contributor workflow.
 - Versioning: Clarified `index.html` title `v…` token and changelog fallback behavior.
