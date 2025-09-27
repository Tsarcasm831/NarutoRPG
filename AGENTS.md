# AGENTS.md

Scope: Entire repository

- Core reminder: After making any change, add a short, human‑readable note to `changes.md` at the repo root. This running log is the single source of truth for review and for later promotion into the in‑game changelog shown on the Main Menu.

## Changelog Workflow

- During development (every PR/commit)
  - Append concise bullets to `changes.md` describing what changed and why if useful.
  - Prefer action‑oriented phrasing and keep items scannable. Examples: “Inventory: prevent invalid drops from equipping,” “Camera: preserve facing when exiting FPV.”
  - If you used tooling to generate file diffs (see `compare.py` below), keep or augment that summary, but still add human‑readable bullets about user‑visible changes.

- When preparing a release or updating the in‑game changelog
  - Open `src/components/UI/ChangelogPanel.jsx` and add a new entry object at the TOP of `changelogData` (newest first).
  - Use this shape:
    - `version`: string WITHOUT the leading `v` (UI adds it), e.g. `"0.012.000"`.
    - `date`: `YYYY-MM-DD`, e.g. `"2025-09-27"`.
    - `changes`: array of strings with the summarized bullets from `changes.md`.
  - Keep newest entry first. Other systems derive the current version from the first entry.
  - Optional: You may include planned items using `date: "Upcoming"`, but do not place an `Upcoming` entry first.

- Keep version labels consistent
  - `index.html` title should contain a token like `v0.012.000` so the Main Menu displays the version correctly.
  - `OpenWorldGame.jsx` falls back to `changelogData[0].version` if it cannot derive from the page title. Ensure the topmost changelog entry matches the release.

## Files Involved

- Changelog source (UI): `src/components/UI/ChangelogPanel.jsx`
  - Data lives in the exported `changelogData` array.
  - Newest entry must be first.
  - `version` is stored without the `v` prefix; the UI renders `v${version}`.

- Running log for review: `changes.md`
  - Lives at repo root and should be updated continuously.
  - You may add topical sections or plain bullets; keep it readable for non‑devs.

- Version derivation (display): `src/OpenWorldGame.jsx`
  - Tries to parse `v…` from the HTML title; otherwise uses the first `changelogData` entry.

## Optional: Generate a file‑level diff summary

- The helper script `compare.py` can produce a diff‑style overview in `changes.md` comparing the repo to a production snapshot directory (default: `websim/`). Example:
  - `python3 compare.py -b websim -o changes.md`
  - You can append additional human‑readable notes after running it.

## Quick Checklist (before merging)

- Added/changed code? Append a bullet to `changes.md`.
- Shipping a release? Add a topmost entry in `src/components/UI/ChangelogPanel.jsx` with `version`, `date`, and `changes` taken from `changes.md`.
- Updated version string in `index.html` title to include `v…` and keep it in sync with the new entry.

