import { distance } from '../config.js';
import { worldToIso } from '../camera.js';

export function nearbyEnemies(world, radius = 12) {
  return world.enemies.filter(enemy => enemy.health > 0 && distance(world.player, enemy) <= radius)
    .sort((a, b) => distance(world.player, a) - distance(world.player, b) || String(a.id).localeCompare(String(b.id)));
}
export function cycleTarget(world) {
  const enemies = nearbyEnemies(world);
  const index = enemies.findIndex(enemy => enemy.id === world.player.targetId);
  world.player.targetId = enemies.length ? enemies[(index + 1) % enemies.length].id : null;
}
export function aimTarget(world, direction) {
  let best = null, bestScore = -Infinity;
  for (const enemy of nearbyEnemies(world)) {
    const point = worldToIso(enemy.x - world.player.x, enemy.y - world.player.y);
    const length = Math.hypot(point.x, point.y) || 1;
    const dot = (point.x * direction.x + point.y * direction.y) / length / Math.hypot(direction.x, direction.y);
    const score = dot - distance(world.player, enemy) * 0.01;
    if (dot > 0.65 && score > bestScore) { best = enemy; bestScore = score; }
  }
  if (best) world.player.targetId = best.id;
}
export function nearbyTrees(world) {
  const x=Math.floor(world.player.x),y=Math.floor(world.player.y), trees=[];
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++) {
    const tree=world.treeByTile?.get(`${x+dx},${y+dy}`);
    if(tree && !tree.chopped) trees.push(tree);
  }
  return trees;
}
export function nearestInteraction(world) {
  return [...nearbyTrees(world).map(entity=>({entity,type:'tree'})),
    ...world.npcs.map(entity => ({ entity, type: 'npc' })),
    ...world.drops.map(entity => ({ entity, type: 'drop' })),
    ...world.map.resources.filter(entity => entity.readyAt <= world.elapsed).map(entity => ({ entity, type: 'resource' }))]
    .filter(candidate => distance(world.player, candidate.entity) <= 1.6)
    .sort((a, b) => distance(world.player, a.entity) - distance(world.player, b.entity))[0];
}
