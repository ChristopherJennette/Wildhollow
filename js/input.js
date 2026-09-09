import { useSlot } from './systems/hotbar.js';
import { distance } from './config.js';
import { screenDirection } from './camera.js';

const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
const JOYSTICK_RADIUS = 48;

export function installInput(canvas, camera, getWorld, isPlaying, notify, platform = globalThis) {
  const { document, window } = platform;
  const keys = new Set(), pointers = new Map();
  const joystick = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  let stickId = null, stick = { x: 0, y: 0 }, pinching = false, pinchDistance = 0;

  function clear() {
    keys.clear(); pointers.clear(); stickId = null; pinching = false;
    stick = { x: 0, y: 0 }; joystick.hidden = true;
    const world = getWorld();
    if (world) world.player.moveInput = { x: 0, y: 0 };
  }
  function update() {
    if (!isPlaying()) { clear(); return; }
    const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const y = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
    getWorld().player.moveInput = screenDirection(x || y ? x : stick.x, x || y ? y : stick.y);
  }
  document.addEventListener('keydown', event => {
    if (!isPlaying() || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const slot=/^(?:Digit|Numpad)([1-5])$/.exec(event.code);
    if(slot){event.preventDefault();if(!event.repeat)useSlot(getWorld(),Number(slot[1])-1,notify);return;}
    if(MOVEMENT_KEYS.has(event.code)){event.preventDefault();keys.add(event.code);}
  });
  document.addEventListener('keyup', event => { keys.delete(event.code); });
  window.addEventListener('blur', clear);
  window.addEventListener('resize', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });

  const pinch = () => {
    const points = [...pointers.values()];
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };
  canvas.addEventListener('pointerdown', event => {
    if (!isPlaying() || event.button > 0) return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY,
      touch: event.pointerType === 'touch', dragged: false });
    // Two fingers placed before dragging zoom. A second finger during steering can target.
    if (pointers.size === 2 && stickId === null && [...pointers.values()].every(p => p.touch)) {
      pinching = true; pinchDistance = pinch();
      for (const point of pointers.values()) point.dragged = true;
    }
  });
  canvas.addEventListener('pointermove', event => {
    const point = pointers.get(event.pointerId);
    if (!point) return;
    if (!isPlaying()) { clear(); return; }
    point.x = event.clientX; point.y = event.clientY;
    if (pinching) {
      if (pointers.size === 2) {
        const current = pinch();
        if (pinchDistance > 0) camera.scale(current / pinchDistance);
        pinchDistance = current;
      }
      return;
    }
    const dx = point.x - point.startX, dy = point.y - point.startY;
    const length = Math.hypot(dx, dy);
    if (length > 10) point.dragged = true;
    if (!point.touch || !point.dragged || (stickId !== null && stickId !== event.pointerId)) return;
    stickId = event.pointerId;
    joystick.hidden = false;
    joystick.style.left = `${point.startX}px`; joystick.style.top = `${point.startY}px`;
    const fraction = Math.min(1, length / JOYSTICK_RADIUS);
    stick = length > 8 ? { x: dx / length * fraction, y: dy / length * fraction } : { x: 0, y: 0 };
    knob.style.transform = `translate(${stick.x * JOYSTICK_RADIUS}px, ${stick.y * JOYSTICK_RADIUS}px)`;
  });
  function release(event, cancelled = false) {
    const point = pointers.get(event.pointerId);
    if (!cancelled && point && !point.dragged && !pinching && isPlaying()) select(event.clientX, event.clientY);
    pointers.delete(event.pointerId);
    if (event.pointerId === stickId) { stickId = null; stick = { x: 0, y: 0 }; joystick.hidden = true; }
    if (!pointers.size) pinching = false;
    update();
  }
  canvas.addEventListener('pointerup', event => release(event));
  canvas.addEventListener('pointercancel', event => release(event, true));
  canvas.addEventListener('lostpointercapture', event => release(event, true));
  canvas.addEventListener('wheel', event => {
    event.preventDefault(); if (isPlaying()) camera.scale(Math.exp(-event.deltaY * 0.001));
  }, { passive: false });

  function select(x, y) {
    const world = getWorld(), player = world.player;
    const candidates = [...world.enemies.filter(e => e.health > 0).map(e => ({ e, type: 'enemy' })),
      ...world.npcs.map(e => ({ e, type: 'npc' })),
      ...world.map.resources.filter(e => e.readyAt <= world.elapsed).map(e => ({ e, type: 'resource' })),
      ...world.drops.map(e => ({ e, type: 'drop' }))];
    let chosen = null, best = 26;
    for (const candidate of candidates) {
      const screen = camera.project(candidate.e.x, candidate.e.y, candidate.type === 'npc' ? 18 : 8);
      const d = Math.hypot(screen.x - x, screen.y - y);
      if (d < best) { chosen = candidate; best = d; }
    }
    world.interaction = null; player.targetId = null;
    if (chosen?.type === 'enemy') {
      player.targetId = chosen.e.id;
      notify(`Target: ${chosen.e.kind}. ${player.sneaking ? 'Sneak behind it for Backstab.' : 'Melee attacks automatically in range.'}`);
    } else if (chosen) {
      world.interaction = { id: chosen.e.id, type: chosen.type };
      if (distance(player, chosen.e) > 1.6) notify('Move closer to interact.');
    }
  }
  return { update, clear };
}
