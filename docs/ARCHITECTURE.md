# Wildhollow module guide — v1.4.1

Wildhollow already uses ES modules. Keep vanilla JavaScript, Canvas, relative URLs and no production dependencies or build step. The world uses Cartesian coordinates; projection belongs to the camera/renderer. Do not duplicate an entire source tree for each update: preserve immutable release branches and use narrow commits.

## Where to edit

| Change | Start here | Related checks |
| --- | --- | --- |
| Browser controller mapping, deadzones, reconnection | `js/input/gamepad.js` | `tests/gamepad.js` |
| Controller gameplay bindings | `js/input/controller.js` | `tests/controller.js` |
| Controller menu focus, repeat, selectors | `js/ui/controller-navigation.js` | `tests/controller.js` |
| Nearby/directional controller targeting | `js/input/targets.js` | `tests/gamepad.js` |
| Keyboard, pointer, touch | `js/input.js` | `tests/input.js` |
| Panel markup and recipe/ability selectors | `js/ui/panels.js` | `tests/panels.js` |
| UI actions, focus, trading/crafting buttons, HUD | `js/ui.js`, `css/game.css` | `tests/expansion.js`, manual UI checks |
| Initialization, pause, loop, interaction dispatch | `js/game.js` | simulation and input checks |
| Content and balance | `js/data/definitions.js`, `js/config.js` | simulation and expansion checks |
| World generation and collision data | `js/world/` | `tests/worldGeneration.js` |
| Combat, abilities, inventory, progression | corresponding module in `js/systems/` | simulation and expansion checks |
| Save compatibility | `js/systems/save.js` | simulation and world-generation checks |
| Drawing, sprites, camera | `js/renderer.js`, `js/graphics/`, `js/camera.js` | `tests/graphics.js` |
| Displayed release version | `js/version.js`, fallback text in `index.html` | manual menu check |

## Input contract

`GamepadReader` returns normalized screen-space sticks, held buttons and rising edges. It never mutates gameplay. It accepts only browser-standard mappings, finds pads in sparse slots, preserves the active pad, and requires neutral controls after connection or reset.

`installController` routes actions into existing gameplay/UI functions and returns a movement vector. `installInput.update(vector)` combines devices with keyboard, then active touch, then controller precedence. It converts the selected vector to Cartesian movement exactly once using `screenDirection`. Opening a panel or menu clears movement before simulation runs.

Controller UI navigation uses the existing enabled buttons/selects. Gamepad A invokes the same click/change handlers as mouse/touch. Menus consume controller events before gameplay bindings run. No duplicate inventory, crafting, trading or ability-unlock implementations.

## Focused review and recommended next work

1. **Continue readability work narrowly.** Game loop, input and UI were expanded in v1.3.2/v1.3.3. World generation remains a useful future target. Avoid a broad behavior rewrite alongside formatting.
2. **Keep panel rendering separate from events.** `js/ui/panels.js` exposes `renderPanelContent(name, world, npcId)` returning `{ title, body }`. Named renderers cover character, skills, abilities, inventory and NPCs. They do not access the DOM or mutate gameplay. `ui.js` keeps event routing, focus and panel state. Preserve `data-*` hooks for pointer and controller parity. Split individual panel files only as they grow.
3. **Protect save access at the browser boundary.** `save.js` defaults parameters to `localStorage` before entering its try/catch. Browsers that throw on accessing that property can bypass the intended fallback. Resolve storage inside the guarded code; test denied storage, malformed saves and quota failures. Preserve rejected saves and require explicit confirmation before replacing them.
4. **Add an in-browser integration suite/CI.** The existing checks exercise simulation and mocked input surfaces well, but do not prove real DOM focus, layout or actual Gamepad API behavior. Add actual-menu tests for unlocking, selector reassignment, buying, selling, crafting and confirmation cancellation. Keep tooling optional for development; production should stay static.
5. **Consider event-driven HUD updates.** `UI.update()` rebuilds resource HTML ten times per second. Cache those elements and update values when necessary if profiling shows mobile frame pressure. Do not optimize the whole renderer without measurements.
6. **Revisit interaction obstruction checks.** `game.js` interaction handling checks distance but not line of sight. Pointer and controller therefore share the existing possibility of interacting across a thin obstruction. Apply any correction in the shared interaction handler.

## Preservation

- Original starting main: `e4eecc1`, preserved at `archive/pre-xbox-v1.2.0` (the repository's older `1.2` tag remains unchanged).
- `release/v1.3.0`: controller implementation checkpoint.
- `release/v1.3.1`: regression tests, review and release documentation.
- Save schema/key and world generator version are unchanged by this update.

## Maintenance checkpoints

- `maintenance/v1.3.2`: interrupted formatting checkpoint, preserved for history; not a recommended playable release. Its formatter damaged two nested template literals.
- `release/v1.3.3`: corrected templates, readable core input/game/UI code, pure panel renderers and optional dependency-free Node test runner.
- Validation: 53 automated checks pass; 36 panel-output comparisons match v1.3.1 exactly across legacy/seeded worlds and basic/fully stocked players.
- Run `node tests/run.mjs` with Node 22+, or serve `tests/index.html` for the browser harness. Live browser and physical controller verification remain outstanding.

## v1.4 UI redesign

- `css/game.css`: design tokens, HUD, journal, item cards, overlays and responsive layouts.
- `js/ui/character-panel.js`: character portrait, actual condition/attributes/equipment and direct inventory access.
- `js/ui/inventory-panel.js`: shared item cards, category filters and empty state; used by both Character and Inventory.
- `js/ui/guide-panel.js`: controls/field guide, usable before a world exists.
- `js/ui/panels.js`: section dispatch, skills, abilities, crafting and NPC services.
- `js/ui.js`: section state, delegated events, modal isolation, keyboard shortcuts and focus restoration.
- `release/v1.4.0`: complete redesigned interface checkpoint.
- `release/v1.4.1`: regression coverage, browser workflow verification and documentation.

Validation: 57 checks pass in Node and Chromium. Real-browser workflows cover equipment, item use, crafting, ability assignment, filters, new-game cancellation and returning to gameplay. Screens inspected at 1440×900, 390×844, 360×640 and 844×390 with no horizontal journal overflow. Physical Xbox testing remains outstanding; controller routing is exercised with simulated inputs.
