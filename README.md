# Wildhollow

A mobile-first isometric fantasy RPG and village simulation. Vanilla JavaScript ES modules, Canvas, no dependencies or build step.

## Play

Serve the repository with a static HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`. ES modules require HTTP; opening the file directly is unsupported.

For GitHub Pages, publish **main / (root)** in repository Settings → Pages. All paths are relative.

Move with **WASD / arrow keys** or **drag on the world for a floating touch joystick**. Directions follow the screen; release to stop. Tap/click enemies to target without chasing. Melee automatically attacks hostiles in range, prioritizing a selected enemy when reachable. Tap a villager/resource/loot bag, then move close to interact. Assign unlocked abilities to the five hotbar slots in **Abilities**. Press **1–5** (number row or numpad), or click/tap a slot, to use its ability. Offensive skills select the nearest living enemy if no target is selected. Spend ability points in **Abilities**. Sneak pauses normal attacks; Backstab requires approaching an unalerted enemy from behind. Scroll, pinch, or use +/− to zoom. Panels and the menu pause simulation.

## Implemented

- Seeded 80×72 village/forest generation with shuffled building plots, connected roads, fields, clearings, resources and enemy spawns. New Game creates a fresh seed; Continue keeps the saved world. Older saves retain their original village.
- Rats, wolves, goblins, automatic combat, ten unlockable abilities, resource recovery and respawn with temporary weariness.
- Twelve use-based skills, derived attributes, separate character XP and ability points.
- Gathering, nineteen items, merchant sales, ten recipes, alchemy, cooking, smithing and main-hand equipment. Use herbs for minor healing or craft remedies in Pack. Buy supplies from Mara; forge with Bram.
- Five persistent NPCs with homes, workplaces and day/night schedules. One game day takes eight minutes.
- Versioned local saves, autosave, Continue, New Game and confirmed Reset Progress. Saves belong to the browser and site origin.

## Code

`js/data/` holds definitions; `js/config.js` holds balance formulas. `js/world/` provides Cartesian world data. `js/systems/` handles simulation and saves. Rendering, camera, input and UI are independent modules. `js/graphics/` handles cached sprites, shared animation and cosmetic effects; `js/data/graphics.js` defines visuals. See [asset replacement](assets/README.md). Replace the map provider to introduce procedural worlds later.

Run browser checks by serving the repository and opening `tests/index.html`. No test dependencies. Placeholder art; no interiors, full economy, passive perks or settlement growth yet.
