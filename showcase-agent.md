# Showcase Agent Playbook

This document is a reminder for future automation tasks that generate showcase material for the Naruto RPG project. Follow the steps below each time a new showcase needs to be created.

## 1. Track the last showcase generation date
1. Ensure there is a `showcase_generated_date.json` file at the project root.
2. When generating a new showcase, update this file with the ISO timestamp (UTC) of the generation.
3. Use the timestamp to determine whether the changelog has entries newer than the previous showcase.

## 2. Review recent changes
1. Read `changes.md` to identify the most recent updates.
2. Compare the timestamp in `showcase_generated_date.json` against the commit history and changelog entries to pinpoint new or updated features that require fresh screenshots.

## 3. Run the project to capture updates
1. Launch the project by running `python serve.py` from the repository root.
2. Once the local server is running, open the game in a browser (http://localhost:5000 by default).
3. Navigate through the areas highlighted in the latest changelog entries.
4. Capture high-resolution screenshots focusing on the features, locations, or UI elements that changed.

## 4. Update showcase assets
1. Place new screenshots in an appropriate `showcase/` or `assets/` directory (maintain existing naming conventions if present).
2. Replace or supplement older images to reflect the new updates.
3. Record the new screenshot filenames and their contexts (e.g., "Updated Hokage's Office lighting") in your working notes for inclusion in the showcase modal.

## 5. Refresh the showcase modal
1. Edit the showcase modal configuration (wherever it resides—typically in UI components) to reference the newly captured screenshots.
2. Update accompanying captions to describe the recent changes highlighted by the images.
3. Verify that the modal displays the new assets correctly and that navigation works as expected.

## 6. Finalize the run
1. Update `showcase_generated_date.json` with the current timestamp.
2. Add a short summary of the showcase refresh to `changes.md`.
3. Commit all relevant changes together so the showcase artifacts and metadata stay synchronized.

Following this process keeps the showcase modal current with the latest development work and ensures that new features are accurately represented.
