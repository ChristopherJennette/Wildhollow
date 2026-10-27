# Wildhollow — v1.6.1

A mobile-first isometric fantasy RPG and village simulation. Vanilla JavaScript ES modules, Canvas, no dependencies or build step.

## Play

Serve the repository with a static HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`. ES modules require HTTP; opening the file directly is unsupported.

For GitHub Pages, publish **main / (root)** in repository Settings → Pages. All paths are relative.

Move with **WASD / arrow keys** or **drag on the world for a floating touch joystick**. Directions follow the screen; release to stop. Tap/click enemies to target without chasing. Melee automatically attacks hostiles in range, prioritizing a selected enemy when reachable. Tap a villager/resource/loot bag, then move close to interact. Assign unlocked abilities to the five hotbar slots in **Abilities**. Press **1–5** (number row or numpad), or click/tap a slot, to use its ability. Offensive skills select the nearest living enemy if no target is selected. Spend ability points in **Abilities**. Sneak pauses normal attacks; Backstab requires approaching an unalerted enemy from behind. Scroll, pinch, or use +/− to zoom. Panels and the menu pause simulation.

## Character journal and interface

Open **Character** from the portrait or bottom bar, press **C**, or use Xbox D-pad Up. The journal shows your condition, attributes, equipped weapon and usable inventory together. Equip weapons or use supplies directly from this screen.

- **Inventory**: full item cards with All / Weapons / Supplies / Materials filters. Open with **I**, Xbox View or D-pad Down.
- **Crafting**: recipes and ingredient counts; smithing still requires visiting Bram.
- **Skills**: skill progress and attribute growth.
- **Abilities**: unlock and assign abilities; **K** opens this section directly.
- **Map**: open with **M** or the bottom Map button; charted roads, trails, destinations and your position. Track any landmark or town for a HUD bearing and distance.
- **LB / RB** switches journal sections. **B / Escape** closes it. Menus pause the world.

The main menu includes a Controls & Field Guide. Layouts adapt to portrait and landscape phones and desktop. Five hotbar slots stay visible in gameplay. Existing saves remain compatible.

## Xbox controller

Full gameplay and menu bindings are implemented. Connect an Xbox-compatible standard-mapped controller, press a button, then release controls. Left stick moves; right stick targets; A interacts; X/Y/LB/RB/RT use slots 1–5; Menu pauses. D-pad opens panels. Menus use up/down to select, A to activate, B to return, and left/right to change ability-slot assignments. See [complete controls and hardware test checklist](docs/CONTROLLER.md). Physical controller testing remains outstanding.

## Implemented

- Seeded 512×512 regions with a central village, connected roads and trails, forest, coastal beaches, two rivers, bridges, impassable mountain belts, and 16 reachable landmarks. New Game creates a fresh seed; Continue keeps the saved world. Older saves retain their original village.
- Rats, wolves, goblins, automatic combat, ten unlockable abilities, resource recovery and respawn with temporary weariness.
- Twelve use-based skills, derived attributes, separate character XP and ability points.
- Gathering, nineteen items, merchant sales, ten recipes, alchemy, cooking, smithing and main-hand equipment. Use herbs for minor healing or craft remedies in Pack. Buy supplies from Mara; forge with Bram.
- Five persistent NPCs with homes, workplaces and day/night schedules. One game day takes eight minutes.
- Versioned local saves, autosave, Continue, New Game and confirmed Reset Progress. Saves belong to the browser and site origin.

## Code

`js/data/` holds definitions; `js/config.js` holds balance formulas. `js/world/` provides Cartesian world data. `js/systems/` handles simulation and saves. Rendering, camera, input and UI are independent modules. `js/graphics/` handles cached sprites, shared animation and cosmetic effects; `js/data/graphics.js` defines visuals. See [asset replacement](assets/README.md). Procedural generation is already implemented in `js/world/generator.js`.

Run all 61 checks with `node tests/run.mjs` (Node 22+), or run browser checks by serving the repository and opening `tests/index.html`. No test dependencies. Placeholder art; no interiors, full economy, passive perks or settlement growth yet.

See the [module guide and code review](docs/ARCHITECTURE.md) for focused editing paths and recommended next work. Previous versions are preserved on archive/release branches.

## Optional browser checks

`tests/browser.cjs` tests the real menu, journal, item use/equipment, crafting, ability assignments and responsive layouts. Install Playwright in a development environment, serve this repository, then run `node tests/browser.cjs`. Set `WILDHOLLOW_TEST_URL` for a non-default URL, `WILDHOLLOW_BROWSER` for a custom Chromium binary, and `WILDHOLLOW_SCREENSHOTS` to save screenshots. No production dependencies or build step are added.

## Regional worlds — v1.5

New journeys generate a deterministic 512 × 512 world (262,144 tiles, roughly 45 times the former map area). This is deliberately finite, bounded by seas and mountains; it is not infinite chunk streaming. The village sits in the center, with six major road destinations and ten smaller landmarks reached by forest trails. Roads route around mountain terrain and cross rivers on bridges. Coastal landings follow the generated shoreline. Ruins, shrines and camps have distinct scenery, resources and nearby encounters; they are outdoor landmarks, not enterable dungeon interiors.

The Map tab shows north-up geography and numbered destinations. The HUD tracking arrow is screen-relative to match the isometric view. Discover a landmark by approaching within nine tiles; each awards 60 character XP and Survival experience once. Tracking, discoveries and explored areas survive saves. Roads/trails are traversable, but travel is not guaranteed enemy-free.

**Existing saves keep their exact original geography and progress.** Continue will not regenerate an old village. To explore the expanded regions, choose New Journey and confirm replacement of the active save. Generator 1 and the original fixed village remain supported. Old code releases are preserved separately on release branches.

Generation, routing, discovery, atlas rendering and scenery indexing are separate modules. Static geography is reconstructed from its seed rather than stored in localStorage. The renderer indexes scenery in 16-tile cells, drawing only candidates near the camera.

Optional `node tests/browser-regions.cjs` uses the same Playwright/environment settings as `tests/browser.cjs`, checks the atlas and tracking UI, renders coast/ruins/bridge scenes, and reports a local draw-time sample. It does not measure phone performance or a physical controller.

## Gathering and crafting

Stand near a tree and use the context button or Xbox A to chop it. A woodcutter axe is required; an iron woodaxe yields extra timber. Mining ore requires a mining pick, and an iron pick yields extra ore. Basic tools are provided to new and existing characters; tools are carried automatically. Trees remain felled after saving and loading. Resource nodes regenerate as before. Gathering trains Woodcutting, Mining or Survival.

Resource nodes and defeated enemies roll multiple independent drops, including uncommon crafting materials and occasional equipment. Drops from enemies remain on the ground to pick up. Craft basic tools and supplies in the journal; Bram offers iron tools, steel and upgraded weapons. Materials such as planks, cured leather, resin and crystals provide a foundation for further crafting.

A single tap on empty world space also activates the nearby action; tapping an enemy or object still selects it, while dragging moves. The nearby action button offers a relevant action for the closest person, loot, node or tree. Xbox A uses the same interaction selection.
