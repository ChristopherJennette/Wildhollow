# Wildhollow module guide — v1.3.1

Wildhollow already uses ES modules. Keep vanilla JavaScript, Canvas, relative URLs and no production dependencies or build step. The world uses Cartesian coordinates; projection belongs to the camera/renderer. Do not duplicate an entire source tree for each update: preserve immutable release branches and use narrow commits.

## Where to edit

| Change | Start here | Related checks |
| --- | --- | --- |
| Browser controller mapping, deadzones, reconnection | `js/input/gamepad.js` | `tests/gamepad.js` |
| Controller gameplay bindings | `js/input/controller.js` | `tests/controller.js` |
| Controller menu focus, repeat, selectors | `js/ui/controller-navigation.js` | `tests/controller.js` |
| Nearby/directional controller targeting | `js/input/targets.js` | `tests/gamepad.js` |
| Keyboard, pointer, touch | `js/input.js` | `tests/input.js` |
| Panels, trading/crafting buttons, HUD | `js/ui.js`, `css/game.css` | `tests/expansion.js`, manual UI checks |
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

1. **Make dense modules readable before splitting them further.** `ui.js`, world generation and the game loop pack multiple operations onto single lines. Formatting into readable statements will improve narrow edits. Avoid a broad behavior rewrite alongside formatting.
2. **Extract UI panel rendering when the next panel feature arrives.** Move character/skills/abilities, inventory/crafting and NPC/trading renderers into `js/ui/panels/`. Keep UI state, focus and event routing centralized. Current modules are small enough that arbitrary additional splitting would add navigation overhead.
3. **Protect save access at the browser boundary.** `save.js` defaults parameters to `localStorage` before entering its try/catch. Browsers that throw on accessing that property can bypass the intended fallback. Resolve storage inside the guarded code; test denied storage, malformed saves and quota failures. Preserve rejected saves and require explicit confirmation before replacing them.
4. **Add an in-browser integration suite/CI.** The existing checks exercise simulation and mocked input surfaces well, but do not prove real DOM focus, layout or actual Gamepad API behavior. Add actual-menu tests for unlocking, selector reassignment, buying, selling, crafting and confirmation cancellation. Keep tooling optional for development; production should stay static.
5. **Consider event-driven HUD updates.** `UI.update()` rebuilds resource HTML ten times per second. Cache those elements and update values when necessary if profiling shows mobile frame pressure. Do not optimize the whole renderer without measurements.
6. **Revisit interaction obstruction checks.** `game.js` interaction handling checks distance but not line of sight. Pointer and controller therefore share the existing possibility of interacting across a thin obstruction. Apply any correction in the shared interaction handler.

## Preservation

- Original starting main: `e4eecc1`, preserved at `archive/pre-xbox-v1.2.0` (the repository's older `1.2` tag remains unchanged).
- `release/v1.3.0`: controller implementation checkpoint.
- `release/v1.3.1`: regression tests, review and release documentation.
- Save schema/key and world generator version are unchanged by this update.
