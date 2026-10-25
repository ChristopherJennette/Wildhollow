// Browser standard mapping: Xbox-compatible pads on desktop and Android.
export const BUTTON = Object.freeze({ A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5,
  LT: 6, RT: 7, VIEW: 8, MENU: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 });
export function deadzone(x = 0, y = 0, threshold = 0.2) {
  const length = Math.hypot(x, y);
  if (!Number.isFinite(length) || length <= threshold) return { x: 0, y: 0 };
  const strength = Math.min(1, (length - threshold) / (1 - threshold));
  return { x: x / length * strength, y: y / length * strength };
}
export class GamepadReader {
  constructor(navigator = globalThis.navigator) {
    this.navigator = navigator;
    this.reset();
  }
  reset() { this.identity = null; this.previous = []; this.armed = false; }
  poll() {
    let pads = [];
    try { pads = Array.from(this.navigator?.getGamepads?.() || []); } catch { /* Policy may disable the API. */ }
    const supported = pads.filter(pad => pad?.connected && pad.mapping === 'standard');
    const pad = supported.find(p => `${p.index}:${p.id}` === this.identity) || supported[0];
    const empty = { connected: false, move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, down: [], pressed: [] };
    if (!pad) { this.reset(); return empty; }
    const identity = `${pad.index}:${pad.id}`;
    if (identity !== this.identity) { this.reset(); this.identity = identity; }
    const down = pad.buttons.map(button => button.pressed || button.value > 0.5);
    const move = deadzone(pad.axes[0], pad.axes[1]), aim = deadzone(pad.axes[2], pad.axes[3]);
    // Reconnection/focus recovery must not activate a held button or move the player.
    if (!this.armed) {
      this.armed = !down.some(Boolean) && !move.x && !move.y && !aim.x && !aim.y;
      this.previous = down;
      return { ...empty, connected: true };
    }
    const pressed = down.map((value, index) => value && !this.previous[index]);
    this.previous = down;
    return { connected: true, move, aim, down, pressed };
  }
}
