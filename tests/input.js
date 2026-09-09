import { installInput } from '../js/input.js';
import { createWorld } from '../js/world/world.js';

// Minimal event surfaces exercise input without requiring a browser or dependencies.
class Surface {
  constructor() { this.listeners = {}; this.style = {}; this.hidden = true; }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  setPointerCapture() {}
  emit(type, values = {}) {
    const event = { target: this, preventDefault() {}, ...values };
    for (const listener of this.listeners[type] || []) listener(event);
  }
}
export function runInputTests() {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const test = (name, fn) => { try { fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${e.message}`); } };
  function setup() {
    const canvas = new Surface(), document = new Surface(), window = new Surface();
    const joystick = new Surface(), knob = new Surface(), world = createWorld();
    document.getElementById = id => id === 'joystick' ? joystick : knob;
    let playing = true, zoom = 1;
    const input = installInput(canvas, { project: (x,y) => ({x:x*10,y:y*10}), scale: n => { zoom *= n; } },
      () => world, () => playing, () => {}, { document, window });
    return { canvas, document, window, joystick, world, input, pause: () => { playing = false; }, zoom: () => zoom };
  }
  const touch = (pointerId, x, y) => ({ pointerId, clientX:x, clientY:y, pointerType:'touch', button:0 });
  test('Keyboard supports WASD/arrows and clears on release, blur and pause', () => {
    const t = setup(), p = t.world.player;
    t.document.emit('keydown',{code:'KeyW'});t.input.update();assert(p.moveInput.x<0&&p.moveInput.y<0,'W failed');
    t.document.emit('keyup',{code:'KeyW'});t.input.update();assert(p.moveInput.x===0&&p.moveInput.y===0,'Key release stuck');
    t.document.emit('keydown',{code:'ArrowRight'});t.input.update();assert(p.moveInput.x>0&&p.moveInput.y<0,'Arrow failed');
    t.window.emit('blur');assert(p.moveInput.x===0,'Blur stuck');
    t.document.emit('keydown',{code:'KeyS'});t.input.update();t.pause();t.input.update();assert(p.moveInput.y===0,'Pause stuck');
  });
  test('Touch drag creates a floating joystick; release/cancel stops it', () => {
    const t=setup(),p=t.world.player;
    t.canvas.emit('pointerdown',touch(1,100,200));t.canvas.emit('pointermove',touch(1,148,200));t.input.update();
    assert(!t.joystick.hidden&&t.joystick.style.left==='100px'&&p.moveInput.x>0&&p.moveInput.y<0,'Joystick failed');
    t.canvas.emit('pointerup',touch(1,148,200));assert(t.joystick.hidden&&p.moveInput.x===0,'Joystick release stuck');
    t.canvas.emit('pointerdown',touch(2,200,200));t.canvas.emit('pointermove',touch(2,200,152));t.input.update();
    t.canvas.emit('pointercancel',touch(2,200,152));assert(t.joystick.hidden&&p.moveInput.y===0,'Cancel stuck');
  });
  test('Click/tap targets without moving and second finger targets while steering', () => {
    const t=setup(),p=t.world.player,e=t.world.enemies[0];
    const mouse={pointerId:1,clientX:e.x*10,clientY:e.y*10,pointerType:'mouse',button:0};
    t.canvas.emit('pointerdown',mouse);t.canvas.emit('pointerup',mouse);
    assert(p.targetId===e.id&&!p.destination&&!p.path.length,'Click target caused movement');
    t.canvas.emit('pointerdown',touch(2,100,500));t.canvas.emit('pointermove',touch(2,148,500));t.input.update();
    t.canvas.emit('pointerdown',touch(3,e.x*10,e.y*10));t.canvas.emit('pointerup',touch(3,e.x*10,e.y*10));
    assert(p.targetId===e.id&&p.moveInput.x>0,'Second finger interrupted steering/target');
    t.canvas.emit('pointerup',touch(2,148,500));assert(p.moveInput.x===0,'Steering did not stop');
    t.canvas.emit('pointerdown',touch(4,0,0));t.canvas.emit('pointerup',touch(4,0,0));
    assert(!p.targetId&&!p.destination,'Ground tap moved player');
  });
  test('Pinch zoom does not steer or select; focus loss clears touch state', () => {
    const t=setup(),p=t.world.player;
    t.canvas.emit('pointerdown',touch(1,100,300));t.canvas.emit('pointerdown',touch(2,200,300));
    t.canvas.emit('pointermove',touch(2,250,300));t.input.update();
    assert(t.zoom()>1&&p.moveInput.x===0&&t.joystick.hidden,'Pinch triggered steering');
    t.canvas.emit('pointerup',touch(1,100,300));t.canvas.emit('pointerup',touch(2,250,300));assert(!p.targetId,'Pinch selected target');
    t.canvas.emit('pointerdown',touch(3,100,500));t.canvas.emit('pointermove',touch(3,148,500));t.input.update();
    t.document.hidden=true;t.document.emit('visibilitychange');assert(t.joystick.hidden&&p.moveInput.x===0,'Background touch stuck');
  });
  return results;
}
