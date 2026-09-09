import { DIRECTIONS } from '../data/graphics.js';
import { worldToIso } from '../camera.js';

const states = new WeakMap();
export function animationFor(entity) {
  let animation = states.get(entity);
  if (!animation) {
    animation = { state: 'idle', time: 0, action: null, remaining: 0, movingFor: 0, x: entity.x, y: entity.y };
    states.set(entity, animation);
  }
  return animation;
}
// Visual cues never gate damage, movement, cooldowns or saves.
export function cueAnimation(entity, state, duration = 0.35) {
  const animation = animationFor(entity);
  animation.action = state; animation.remaining = duration;
  animation.state = state; animation.time = 0;
}
export function updateAnimation(entity, dt) {
  const animation = animationFor(entity);
  const moved = Math.hypot(entity.x - animation.x, entity.y - animation.y);
  animation.x = entity.x; animation.y = entity.y;
  animation.movingFor = moved > 0.001 ? 0.3 : Math.max(0, animation.movingFor - dt);
  animation.remaining = Math.max(0, animation.remaining - dt);
  const state = entity.health <= 0 ? 'death' : animation.remaining > 0 ? animation.action : animation.movingFor > 0 ? 'walk' : 'idle';
  if (state !== animation.state) { animation.state = state; animation.time = 0; }
  else animation.time += dt;
  return animation;
}
export function updateAnimations(world, dt) {
  updateAnimation(world.player, dt);
  for (const npc of world.npcs) updateAnimation(npc, dt);
  for (const enemy of world.enemies) updateAnimation(enemy, dt);
}
export function facingDirection(facing, directions = DIRECTIONS) {
  if (!facing || !Math.hypot(facing.x, facing.y)) return directions.includes('south') ? 'south' : directions[0];
  const screen = worldToIso(facing.x, facing.y);
  const angle = Math.atan2(screen.x, -screen.y);
  const compass = directions.length === 8
    ? ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] : DIRECTIONS;
  const index = Math.round(angle / (Math.PI * 2 / compass.length));
  const direction = compass[(index + compass.length) % compass.length];
  return directions.includes(direction) ? direction : directions[0];
}
export function spriteFrame(definition, animation = { state: 'idle', time: 0 }, facing) {
  const animations = definition.animations || { idle: { row: 0, count: 1, fps: 1 } };
  const clip = animations[animation.state] || animations.idle || Object.values(animations)[0];
  const directions = definition.directions || ['south'];
  const direction = facingDirection(facing, directions);
  const directional = clip.directions?.[direction] ?? Object.values(clip.directions || {})[0];
  const row = typeof directional === 'number' ? directional : (clip.row || 0) + (definition.directions ? directions.indexOf(direction) : 0);
  const count = Math.max(1, clip.frames?.length || clip.count || 1);
  const elapsed = Math.floor(Math.max(0, animation.time) * (clip.fps || 1));
  const index = clip.loop === false ? Math.min(count - 1, elapsed) : elapsed % count;
  const frame = clip.frames?.[index];
  // Explicit {column,row} frames support irregular atlases as well as simple strips.
  const column = typeof frame === 'number' ? frame : frame?.column ?? (clip.start || 0) + index;
  return { x: column * definition.frameWidth, y: (frame?.row ?? row) * definition.frameHeight };
}
