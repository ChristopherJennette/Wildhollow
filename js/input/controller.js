import { BUTTON as B, GamepadReader } from './gamepad.js';
import { ControllerNavigation } from '../ui/controller-navigation.js';
import { aimTarget, cycleTarget, nearestInteraction } from './targets.js';
import { useSlot } from '../systems/hotbar.js';

export function installController({ getWorld, isPlaying, camera, ui, platform = globalThis }) {
  const { document, window } = platform;
  const reader = new GamepadReader(platform.navigator), navigation = new ControllerNavigation(document);
  let focused = true, connected = false, previousTime = 0;
  const zero = () => ({ x: 0, y: 0 });
  const stop = () => { const world = getWorld(); if (world) world.player.moveInput = zero(); reader.reset(); navigation.reset(); };
  window.addEventListener('blur', () => { focused = false; stop(); });
  window.addEventListener('focus', () => { focused = true; stop(); });
  document.addEventListener('visibilitychange', () => { stop(); });
  window.addEventListener('gamepaddisconnected', stop);
  function update(now = 0) {
    const dt = Math.min(0.1, Math.max(0, (now - previousTime) / 1000)); previousTime = now;
    if (!focused || document.hidden) return zero();
    const pad = reader.poll();
    if (connected !== pad.connected) {
      if (connected && isPlaying()) ui.actions.menu();
      connected = pad.connected;
      document.body.classList.toggle('controller-connected', connected);
      ui.notify(connected ? 'Xbox controller connected. Release controls to begin. Menu: controls and pause.' : 'Controller disconnected. Game paused.');
    }
    if (!pad.connected) return zero();
    const pressed = button => pad.pressed[button];
    const held = button => pad.down[button];
    const root = ui.controllerRoot();
    if (root) {
      navigation.step(root, held(B.DOWN) || pad.move.y > 0.5 ? 1 : held(B.UP) || pad.move.y < -0.5 ? -1 : 0, now);
      if (pressed(B.B) || pressed(B.MENU)) { ui.controllerBack(); return zero(); }
      if (pressed(B.A) || (pressed(B.RIGHT) && document.activeElement?.tagName === 'SELECT')) navigation.activate(root);
      else if (pressed(B.LEFT)) navigation.activate(root, -1);
      const card = root.querySelector('.card');
      if (card && pad.aim.y) card.scrollTop += pad.aim.y * dt * 450;
      return zero();
    }
    navigation.reset();
    if (!isPlaying()) return zero();
    const world = getWorld();
    if (pressed(B.MENU)) { ui.actions.menu(); return zero(); }
    const panels = [[B.VIEW, 'inventory'], [B.UP, 'character'], [B.LEFT, 'skills'], [B.RIGHT, 'abilities'], [B.DOWN, 'inventory']];
    for (const [button, panel] of panels) if (pressed(button)) { ui.openPanel(panel); return zero(); }
    if (pressed(B.B)) { world.player.targetId = null; world.interaction = null; }
    else if (!held(B.LT) && (pad.aim.x || pad.aim.y)) aimTarget(world, pad.aim);
    if (pressed(B.RS)) cycleTarget(world);
    if (pressed(B.LS)) document.getElementById('sneak').click();
    if (pressed(B.A)) {
      const candidate = nearestInteraction(world);
      if (candidate) world.interaction = { id: candidate.entity.id, type: candidate.type };
      else ui.notify('Move closer to a person, resource, or loot bag.');
    }
    [B.X, B.Y, B.LB, B.RB, B.RT].forEach((button, slot) => { if (pressed(button)) useSlot(world, slot, ui.notify); });
    // LT + right-stick vertical zooms; other right-stick motion selects a target.
    if (held(B.LT) && pad.aim.y) camera.scale(Math.exp(-pad.aim.y * dt));
    return pad.move;
  }
  return { update, stop };
}
