# Xbox controls — v1.3.1

Use a browser that exposes the standard Gamepad API mapping. Pair/connect the Xbox controller, open the game over HTTPS (or localhost during development), press a controller button to make it visible to the browser, then release both sticks and all buttons. The same bindings are intended for desktop and Android browsers that expose that mapping. Unknown mappings are ignored rather than guessed.

| Control | Gameplay |
| --- | --- |
| Left stick | Analog movement in screen directions |
| Right stick | Select nearby enemies in that screen direction |
| A | Interact with nearest ready NPC, resource or loot within 1.6 world units |
| B | Clear selected enemy and pending interaction |
| X / Y / LB / RB / RT | Hotbar slots 1 / 2 / 3 / 4 / 5 |
| Left stick click | Toggle sneak |
| Right stick click | Cycle living enemies within 12 world units |
| D-pad up / left / right / down | Character / Skills / Abilities / Pack |
| View | Pack |
| Menu | Pause menu |
| LT + right stick up/down | Zoom in/out |

Normal melee remains automatic in range. Sneaking pauses automatic attacks. Select a target with the right stick or right-stick click before casting when needed. Buttons trigger once per press; holding an ability button does not repeatedly spend resources.

| Control | Menus, panels and confirmation dialogs |
| --- | --- |
| D-pad up/down or left stick up/down | Move focus among enabled controls; hold to repeat |
| A | Activate focused button; advance focused ability-slot selector |
| D-pad left/right | Change focused ability-slot selector |
| Right stick up/down | Scroll long panels |
| B or Menu | Close panel, cancel confirmation, or resume an active game |

New Game and Reset use in-game confirmation dialogs. Cancel is the initial selection. Unlocking, hotbar assignment, consumables, equipping, crafting, trading and resting all use the same controls and action handlers as mouse/touch.

Keyboard and touch continue to work. Keyboard movement takes precedence over touch, then controller. Sticks use a 20% radial deadzone with rescaled analog strength. Disconnecting during gameplay opens the pause menu. Reconnecting or returning from focus loss requires neutral controls before input resumes.

## Verification

49 automated checks pass: 38 existing checks and 11 gamepad/controller checks. Controller navigation uses mock DOM surfaces in these automated checks. Live browser rendering and physical Xbox/Bluetooth behavior have not been verified in this environment; the attempted Chromium download failed.

Before marking hardware support verified, test on desktop Chrome and Android Chrome with an Xbox controller:

- Fresh start, Continue, New Game cancellation and Reset cancellation.
- Analog speed, screen directions, diagonals, keyboard/touch switching, unplug/reconnect and tab switching.
- Target selection/cycling, automatic melee, sneak, all five abilities, resource gathering and loot.
- Unlock and reassign an ability, use/equip items, craft, buy/sell, rest and scroll long panels.
- Save/Continue and existing-save compatibility; verify no action repeats when a button is held.
