import { EFFECTS } from '../data/graphics.js';

export function emitEffect(world, type, position, options = {}) {
  const lifetime = options.lifetime ?? EFFECTS[type].lifetime;
  world.effects.push({ type, x: position.x, y: position.y, ...options, lifetime, life: lifetime, age: 0 });
}
export function updateEffects(world, dt) {
  let count = 0;
  for (const effect of world.effects) {
    effect.age += dt; effect.life -= dt;
    if (effect.life > 0) world.effects[count++] = effect;
  }
  world.effects.length = count;
}
